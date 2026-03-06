import { Injectable } from '@nestjs/common';
import { CreateAiQueueModuleDto } from './dto/create-ai-queue-module.dto';
import { UpdateAiQueueModuleDto } from './dto/update-ai-queue-module.dto';

@Injectable()
export class AiQueueModuleService {
  create(createAiQueueModuleDto: CreateAiQueueModuleDto) {
    return 'This action adds a new aiQueueModule';
  }

  findAll() {
    return `This action returns all aiQueueModule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} aiQueueModule`;
  }

  update(id: number, updateAiQueueModuleDto: UpdateAiQueueModuleDto) {
    return `This action updates a #${id} aiQueueModule`;
  }

  remove(id: number) {
    return `This action removes a #${id} aiQueueModule`;
  }
}
