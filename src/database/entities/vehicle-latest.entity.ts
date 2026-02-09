import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('vehicles_latest')
export class VehicleLatest {
  @PrimaryColumn()
  vehicleId: string;

  @Column('float')
  soc: number;

  @Column('float')
  kwhDeliveredDc: number;

  @Column('float')
  batteryTemp: number;

  @Column('timestamp', { precision: 3 })
  timestamp: Date;
}
