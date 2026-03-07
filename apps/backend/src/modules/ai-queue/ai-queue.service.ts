import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReviewStatus } from '@prisma/client';

@Injectable()
export class AiQueueService {

  constructor(@InjectQueue("ai-reviews") private readonly aiQueueModule: Queue, private readonly prisma: PrismaService) { }

  async queueReview(pullRequestId: string, userId: string, repositoryId: string, githubInstallationId: string) {

    const aiReview = await this.prisma.aiReview.create({
      data: {
        pullRequestId,
        status: ReviewStatus.PENDING,
      }
    })

    await this.aiQueueModule.add(`review-pr-${pullRequestId}`, {
      aiReviewId: aiReview.id,
      repositoryId,
      pullRequestId,
      userId,
      installationId: githubInstallationId,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: true,
      removeOnFail: false,
    })
  }

  async sendAiReviewStatus(id: string) {
    const review = await this.prisma.aiReview.findUnique({
      where: { id },
      include: {
        pullRequest: {
          select: {
            number: true,
            title: true,
            status: true
          }
        }
      }
    })

    if (!review) {
      throw new NotFoundException(`The review with id ${id} not found`)
    }

    return review
  }
}
