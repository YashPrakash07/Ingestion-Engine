import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('meter_telemetry')
@Index(['meterId', 'timestamp'])
export class MeterTelemetry {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column()
  meterId: string;

  @Column('float')
  kwhConsumedAc: number;

  @Column('float')
  voltage: number;

  @Column('timestamp', { precision: 3 })
  timestamp: Date;
}
