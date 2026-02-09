import { IsString, IsNumber, IsISO8601 } from 'class-validator';

export class IngestVehicleDto {
  @IsString()
  vehicleId: string;

  @IsNumber()
  soc: number;

  @IsNumber()
  kwhDeliveredDc: number;

  @IsNumber()
  batteryTemp: number;

  @IsISO8601()
  timestamp: string;
}
