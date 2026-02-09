import { IsString } from 'class-validator';

export class CreateMappingDto {
  @IsString()
  vehicleId: string;

  @IsString()
  meterId: string;
}
