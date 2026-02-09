import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MeterTelemetry } from '../database/entities/meter-telemetry.entity';
import { VehicleTelemetry } from '../database/entities/vehicle-telemetry.entity';
import { VehicleMeterMapping } from '../database/entities/vehicle-meter-mapping.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(MeterTelemetry)
    private meterTelemetryRepo: Repository<MeterTelemetry>,
    @InjectRepository(VehicleTelemetry)
    private vehicleTelemetryRepo: Repository<VehicleTelemetry>,
    @InjectRepository(VehicleMeterMapping)
    private mappingRepo: Repository<VehicleMeterMapping>,
  ) {}

  async getPerformanceSummary(vehicleId: string) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

    // 1. Get Mapping
    const mapping = await this.mappingRepo.findOne({ where: { vehicleId } });
    if (!mapping) {
      throw new NotFoundException(`Vehicle ${vehicleId} mapping not found`);
    }

    // 2. Query Vehicle Telemetry
    // Efficiently get first and last records in 24h range using index
    const vehicleStart = await this.vehicleTelemetryRepo.findOne({
      where: {
        vehicleId,
        timestamp: Between(startTime, endTime),
      },
      order: { timestamp: 'ASC' },
    });

    const vehicleEnd = await this.vehicleTelemetryRepo.findOne({
      where: {
        vehicleId,
        timestamp: Between(startTime, endTime),
      },
      order: { timestamp: 'DESC' },
    });

    const avgStats = await this.vehicleTelemetryRepo
      .createQueryBuilder('telemetry')
      .select('AVG(telemetry.batteryTemp)', 'avgTemp')
      .where('telemetry.vehicleId = :vehicleId', { vehicleId })
      .andWhere('telemetry.timestamp BETWEEN :startTime AND :endTime', {
        startTime,
        endTime,
      })
      .getRawOne<{ avgTemp: string }>();

    // 3. Query Meter Telemetry
    const meterStart = await this.meterTelemetryRepo.findOne({
      where: {
        meterId: mapping.meterId,
        timestamp: Between(startTime, endTime),
      },
      order: { timestamp: 'ASC' },
    });

    const meterEnd = await this.meterTelemetryRepo.findOne({
      where: {
        meterId: mapping.meterId,
        timestamp: Between(startTime, endTime),
      },
      order: { timestamp: 'DESC' },
    });

    if (!vehicleStart || !vehicleEnd || !meterStart || !meterEnd) {
      return {
        message: 'Insufficient data for 24h summary',
        data: null,
      };
    }

    const energyDeliveredDc =
      vehicleEnd.kwhDeliveredDc - vehicleStart.kwhDeliveredDc;
    const energyConsumedAc = meterEnd.kwhConsumedAc - meterStart.kwhConsumedAc;
    const efficiencyRatio =
      energyConsumedAc > 0 ? energyDeliveredDc / energyConsumedAc : 0;

    return {
      vehicleId,
      meterId: mapping.meterId,
      timeRange: '24h',
      metrics: {
        totalEnergyConsumedAc: Number(energyConsumedAc.toFixed(2)),
        totalEnergyDeliveredDc: Number(energyDeliveredDc.toFixed(2)),
        efficiencyRatio: Number(efficiencyRatio.toFixed(4)),
        avgBatteryTemp: Number(parseFloat(avgStats?.avgTemp || '0').toFixed(2)),
      },
    };
  }
}
