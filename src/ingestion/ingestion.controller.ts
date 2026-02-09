import { Controller, Post, Body } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestMeterDto } from './dto/ingest-meter.dto';
import { IngestVehicleDto } from './dto/ingest-vehicle.dto';
import { CreateMappingDto } from './dto/create-mapping.dto';

@Controller('v1/ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('meter')
  async ingestMeter(@Body() data: IngestMeterDto) {
    await this.ingestionService.ingestMeterData(data);
    return { status: 'success' };
  }

  @Post('vehicle')
  async ingestVehicle(@Body() data: IngestVehicleDto) {
    await this.ingestionService.ingestVehicleData(data);
    return { status: 'success' };
  }

  @Post('mapping')
  async createMapping(@Body() data: CreateMappingDto) {
    await this.ingestionService.createMapping(data.vehicleId, data.meterId);
    return { status: 'success' };
  }
}
