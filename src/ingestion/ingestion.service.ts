import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MeterTelemetry } from '../database/entities/meter-telemetry.entity';
import { MeterLatest } from '../database/entities/meter-latest.entity';
import { VehicleTelemetry } from '../database/entities/vehicle-telemetry.entity';
import { VehicleLatest } from '../database/entities/vehicle-latest.entity';
import { VehicleMeterMapping } from '../database/entities/vehicle-meter-mapping.entity';
import { IngestMeterDto } from './dto/ingest-meter.dto';
import { IngestVehicleDto } from './dto/ingest-vehicle.dto';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private dataSource: DataSource,
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
    const start = Date.now();
    const timestamp = new Date(data.timestamp);

    try {
      await this.dataSource.transaction(async (manager) => {
        const meterTelemetryRepo = manager.getRepository(MeterTelemetry);
        const meterLatestRepo = manager.getRepository(MeterLatest);

        // 1. History Path: Always Save
        const history = meterTelemetryRepo.create({ ...data, timestamp });
        await meterTelemetryRepo.save(history);

        // 2. Live Path: Only update if newer than current latest
        const currentLatest = await meterLatestRepo.findOne({
          where: { meterId: data.meterId },
        });

        if (!currentLatest || timestamp > new Date(currentLatest.timestamp)) {
          await meterLatestRepo.upsert(
            {
              meterId: data.meterId,
              kwhConsumedAc: data.kwhConsumedAc,
              voltage: data.voltage,
              timestamp,
            },
            ['meterId'],
          );
        }
      });

      this.logger.debug(
        `Ingested meter ${data.meterId} in ${Date.now() - start}ms`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to ingest meter ${data.meterId}: ${message}`);
      throw error;
    }
  }

  async ingestVehicleData(data: IngestVehicleDto) {
    const start = Date.now();
    const timestamp = new Date(data.timestamp);

    try {
      await this.dataSource.transaction(async (manager) => {
        const vehicleTelemetryRepo = manager.getRepository(VehicleTelemetry);
        const vehicleLatestRepo = manager.getRepository(VehicleLatest);

        // 1. History Path
        const history = vehicleTelemetryRepo.create({ ...data, timestamp });
        await vehicleTelemetryRepo.save(history);

        // 2. Live Path: Only update if newer
        const currentLatest = await vehicleLatestRepo.findOne({
          where: { vehicleId: data.vehicleId },
        });

        if (!currentLatest || timestamp > new Date(currentLatest.timestamp)) {
          await vehicleLatestRepo.upsert(
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
      });

      this.logger.debug(
        `Ingested vehicle ${data.vehicleId} in ${Date.now() - start}ms`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to ingest vehicle ${data.vehicleId}: ${message}`,
      );
      throw error;
    }
  }

  async createMapping(vehicleId: string, meterId: string) {
    try {
      await this.vehicleMeterMappingRepo.upsert({ vehicleId, meterId }, [
        'vehicleId',
      ]);
      this.logger.log(`Mapped vehicle ${vehicleId} to meter ${meterId}`);
    } catch (error) {
      this.logger.error(`Failed to map ${vehicleId} to ${meterId}`);
      throw error;
    }
  }
}
