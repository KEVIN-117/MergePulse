import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AiQueueService } from './ai-queue.service';
import { CreateAiQueueDto } from './dto/create-ai-queue.dto';

@Controller('ai-queue')
export class AiQueueModuleController {
  constructor(private readonly aiQueueService: AiQueueService) { }

  @Post('prs/:pullRequestId/review')
  queueReview(@Query() pullRequestId: string, @Body() createAiQueueModuleDto: CreateAiQueueDto,) {
    return this.aiQueueService.queueReview(
      pullRequestId,
      createAiQueueModuleDto.userId,
      createAiQueueModuleDto.repositoryId,
      createAiQueueModuleDto.githubInstallationId,
    );
  }

  @Get('review-status/:id')
  async getReviewStatus(@Param('id') id: string) {
    return await this.aiQueueService.sendAiReviewStatus(id);
  }

}
