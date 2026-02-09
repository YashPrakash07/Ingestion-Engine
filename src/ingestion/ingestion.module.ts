import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { MeterTelemetry } from '../database/entities/meter-telemetry.entity';
import { MeterLatest } from '../database/entities/meter-latest.entity';
import { VehicleTelemetry } from '../database/entities/vehicle-telemetry.entity';
import { VehicleLatest } from '../database/entities/vehicle-latest.entity';
import { VehicleMeterMapping } from '../database/entities/vehicle-meter-mapping.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MeterTelemetry,
      MeterLatest,
      VehicleTelemetry,
      VehicleLatest,
      VehicleMeterMapping,
    ]),
  ],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}
