import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeterTelemetry } from '../database/entities/meter-telemetry.entity';
import { MeterLatest } from '../database/entities/meter-latest.entity';
import { VehicleTelemetry } from '../database/entities/vehicle-telemetry.entity';
import { VehicleLatest } from '../database/entities/vehicle-latest.entity';
import { VehicleMeterMapping } from '../database/entities/vehicle-meter-mapping.entity';
import { IngestMeterDto } from './dto/ingest-meter.dto';
import { IngestVehicleDto } from './dto/ingest-vehicle.dto';

@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(MeterTelemetry)
    private meterTelemetryRepo: Repository<MeterTelemetry>,
    @InjectRepository(MeterLatest)
    private meterLatestRepo: Repository<MeterLatest>,
    @InjectRepository(VehicleTelemetry)
    private vehicleTelemetryRepo: Repository<VehicleTelemetry>,
    @InjectRepository(VehicleLatest)
    private vehicleLatestRepo: Repository<VehicleLatest>,
    @InjectRepository(VehicleMeterMapping)
    private vehicleMeterMappingRepo: Repository<VehicleMeterMapping>,
  ) {}

  async ingestMeterData(data: IngestMeterDto) {
    const timestamp = new Date(data.timestamp);

    // 1. History Path: Append-only INSERT
    const history = this.meterTelemetryRepo.create({
      ...data,
      timestamp,
    });
    await this.meterTelemetryRepo.save(history);

    // 2. Live Path: UPSERT (Atomic Update)
    await this.meterLatestRepo.upsert(
      {
        meterId: data.meterId,
        kwhConsumedAc: data.kwhConsumedAc,
        voltage: data.voltage,
        timestamp,
      },
      ['meterId'],
    );
  }

  async ingestVehicleData(data: IngestVehicleDto) {
    const timestamp = new Date(data.timestamp);

    // 1. History Path: Append-only INSERT
    const history = this.vehicleTelemetryRepo.create({
      ...data,
      timestamp,
    });
    await this.vehicleTelemetryRepo.save(history);

    // 2. Live Path: UPSERT (Atomic Update)
    await this.vehicleLatestRepo.upsert(
      {
        vehicleId: data.vehicleId,
        soc: data.soc,
        kwhDeliveredDc: data.kwhDeliveredDc,
        batteryTemp: data.batteryTemp,
        timestamp,
      },
      ['vehicleId'],
    );
  }

  async createMapping(vehicleId: string, meterId: string) {
    await this.vehicleMeterMappingRepo.upsert({ vehicleId, meterId }, [
      'vehicleId',
    ]);
  }
}
