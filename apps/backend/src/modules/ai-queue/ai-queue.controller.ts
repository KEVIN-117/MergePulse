import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AiQueueService } from './ai-queue.service';
import { CreateAiQueueDto } from './dto/create-ai-queue.dto';

@Controller('ai-queue')
export class AiQueueModuleController {
  constructor(private readonly aiQueueService: AiQueueService) { }

  @Post('prs/:pullRequestId/review')
  queueReview(@Param('pullRequestId') pullRequestId: string, @Body() createAiQueueDto: CreateAiQueueDto,) {
    return this.aiQueueService.queueReview(
      pullRequestId,
      createAiQueueDto.userId,
      createAiQueueDto.repositoryId,
      createAiQueueDto.githubInstallationId,
    );
  }

  @Get('review-status/:id')
  async getReviewStatus(@Param('id') id: string) {
    return await this.aiQueueService.sendAiReviewStatus(id);
  }

}
