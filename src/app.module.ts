import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeterTelemetry } from './database/entities/meter-telemetry.entity';
import { MeterLatest } from './database/entities/meter-latest.entity';
import { VehicleTelemetry } from './database/entities/vehicle-telemetry.entity';
import { VehicleLatest } from './database/entities/vehicle-latest.entity';
import { VehicleMeterMapping } from './database/entities/vehicle-meter-mapping.entity';
import { IngestionModule } from './ingestion/ingestion.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [
          MeterTelemetry,
          MeterLatest,
          VehicleTelemetry,
          VehicleLatest,
          VehicleMeterMapping,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production', // In production, use migrations
      }),
      inject: [ConfigService],
    }),
    IngestionModule,
    AnalyticsModule,
    HealthModule,
  ],
})
export class AppModule {}
