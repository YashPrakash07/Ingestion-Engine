import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { MeterTelemetry } from '../database/entities/meter-telemetry.entity';
import { VehicleTelemetry } from '../database/entities/vehicle-telemetry.entity';
import { VehicleMeterMapping } from '../database/entities/vehicle-meter-mapping.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MeterTelemetry,
      VehicleTelemetry,
      VehicleMeterMapping,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
