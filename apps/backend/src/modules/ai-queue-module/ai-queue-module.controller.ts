import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AiQueueModuleService } from './ai-queue-module.service';
import { CreateAiQueueModuleDto } from './dto/create-ai-queue-module.dto';
import { UpdateAiQueueModuleDto } from './dto/update-ai-queue-module.dto';

@Controller('ai-queue-module')
export class AiQueueModuleController {
  constructor(private readonly aiQueueModuleService: AiQueueModuleService) {}

  @Post()
  create(@Body() createAiQueueModuleDto: CreateAiQueueModuleDto) {
    return this.aiQueueModuleService.create(createAiQueueModuleDto);
  }

  @Get()
  findAll() {
    return this.aiQueueModuleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiQueueModuleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAiQueueModuleDto: UpdateAiQueueModuleDto) {
    return this.aiQueueModuleService.update(+id, updateAiQueueModuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aiQueueModuleService.remove(+id);
  }
}
