import { Module } from '@nestjs/common';
import { AiQueueService } from './ai-queue.service';
import { AiQueueModuleController } from './ai-queue.controller';
import { BullModule } from '@nestjs/bullmq';
import { AiReviewProcessor } from './ai-review.processor';

@Module({
  imports: [BullModule.registerQueue({
    name: 'ai-reviews',
  })],
  controllers: [AiQueueModuleController],
  providers: [AiQueueService, AiReviewProcessor],
  exports: [AiQueueService, AiReviewProcessor],
})
export class AiQueueModule { }
