import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('meters_latest')
export class MeterLatest {
  @PrimaryColumn()
  meterId: string;

  @Column('float')
  kwhConsumedAc: number;

  @Column('float')
  voltage: number;

  @Column('timestamp', { precision: 3 })
  timestamp: Date;
}
