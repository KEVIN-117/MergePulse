import { Module } from '@nestjs/common';
import { AiQueueModuleService } from './ai-queue-module.service';
import { AiQueueModuleController } from './ai-queue-module.controller';

@Module({
  controllers: [AiQueueModuleController],
  providers: [AiQueueModuleService],
})
export class AiQueueModuleModule {}
