import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { MeterTelemetry } from '../database/entities/meter-telemetry.entity';
import { VehicleTelemetry } from '../database/entities/vehicle-telemetry.entity';
import { VehicleMeterMapping } from '../database/entities/vehicle-meter-mapping.entity';
import { NotFoundException } from '@nestjs/common';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockMeterRepo = {
    findOne: jest.fn(),
  };
  const mockVehicleRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ avgTemp: '32.5' }),
    })),
  };
  const mockMappingRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(MeterTelemetry),
          useValue: mockMeterRepo,
        },
        {
          provide: getRepositoryToken(VehicleTelemetry),
          useValue: mockVehicleRepo,
        },
        {
          provide: getRepositoryToken(VehicleMeterMapping),
          useValue: mockMappingRepo,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should throw NotFoundException if mapping does not exist', async () => {
    mockMappingRepo.findOne.mockResolvedValue(null);
    await expect(service.getPerformanceSummary('V1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return insufficient data if telemetry is missing', async () => {
    mockMappingRepo.findOne.mockResolvedValue({
      vehicleId: 'V1',
      meterId: 'M1',
    });
    mockVehicleRepo.findOne.mockResolvedValue(null); // No start record

    const result = await service.getPerformanceSummary('V1');
    expect(result.message).toBe('Insufficient data for 24h summary');
  });

  it('should calculate efficiency correctly when data is present', async () => {
    mockMappingRepo.findOne.mockResolvedValue({
      vehicleId: 'V1',
      meterId: 'M1',
    });

    // Start of 24h
    mockVehicleRepo.findOne.mockResolvedValueOnce({
      kwhDeliveredDc: 100,
      timestamp: new Date(),
    });
    // End of 24h
    mockVehicleRepo.findOne.mockResolvedValueOnce({
      kwhDeliveredDc: 110,
      timestamp: new Date(),
      soc: 80,
      batteryTemp: 35,
    });

    // Start of 24h
    mockMeterRepo.findOne.mockResolvedValueOnce({
      kwhConsumedAc: 200,
      timestamp: new Date(),
    });
    // End of 24h
    mockMeterRepo.findOne.mockResolvedValueOnce({
      kwhConsumedAc: 212.5,
      timestamp: new Date(),
      voltage: 230,
    });

    const result = await service.getPerformanceSummary('V1');

    if ('metrics' in result && result.metrics && result.latestSnapshot) {
      expect(result.metrics.totalEnergyConsumedAc).toBe(12.5);
      expect(result.metrics.totalEnergyDeliveredDc).toBe(10);
      expect(result.metrics.efficiencyRatio).toBe(0.8); // 10 / 12.5
      expect(result.latestSnapshot.currentSoC).toBe(80);
    } else {
      fail('Expected result to have metrics and latestSnapshot');
    }
  });
});
