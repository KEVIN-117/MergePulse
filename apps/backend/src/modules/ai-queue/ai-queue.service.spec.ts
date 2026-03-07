import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import { AiQueueService } from './ai-queue.service';
import { PrismaService } from '../../prisma/prisma.service';

/* ─────────────────────────────────────────────
   Constants & fixtures
───────────────────────────────────────────── */

const QUEUE_NAME = 'ai-reviews';

const PULL_REQUEST_ID = 'pr-1';
const USER_ID = 'user-1';
const REPOSITORY_ID = 'repo-1';
const INSTALLATION_ID = '42';

const mockAiReview = { id: 'review-1' };
const mockAiReviewWithPR = {
  id: 'review-1',
  pullRequest: {
    number: 7,
    title: 'feat: new feature',
    status: 'open',
  },
};

/* ─────────────────────────────────────────────
   Test suite
───────────────────────────────────────────── */

describe('AiQueueService', () => {
  let service: AiQueueService;
  let prisma: jest.Mocked<PrismaService>;
  let queue: { add: jest.Mock };

  beforeEach(async () => {
    prisma = {
      aiReview: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    queue = { add: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiQueueService,
        { provide: PrismaService, useValue: prisma },
        { provide: getQueueToken(QUEUE_NAME), useValue: queue },
      ],
    }).compile();

    service = module.get<AiQueueService>(AiQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /* ------------------------------------------------------------------ */
  /* queueReview                                                          */
  /* ------------------------------------------------------------------ */

  describe('queueReview', () => {
    const callQueueReview = () =>
      service.queueReview(PULL_REQUEST_ID, USER_ID, REPOSITORY_ID, INSTALLATION_ID);

    describe('happy path', () => {
      it('should create an aiReview record with PENDING status and enqueue a BullMQ job', async () => {
        (prisma.aiReview.create as jest.Mock).mockResolvedValue(mockAiReview);
        queue.add.mockResolvedValue({});

        await callQueueReview();

        expect(prisma.aiReview.create).toHaveBeenCalledWith({
          data: {
            pullRequestId: PULL_REQUEST_ID,
            status: ReviewStatus.PENDING,
          },
        });

        expect(queue.add).toHaveBeenCalledWith(
          `review-pr-${PULL_REQUEST_ID}`,
          {
            aiReviewId: mockAiReview.id,
            repositoryId: REPOSITORY_ID,
            pullRequestId: PULL_REQUEST_ID,
            userId: USER_ID,
            installationId: INSTALLATION_ID,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
      });

      it('should not return a value (void)', async () => {
        (prisma.aiReview.create as jest.Mock).mockResolvedValue(mockAiReview);
        queue.add.mockResolvedValue({});

        const result = await callQueueReview();

        expect(result).toBeUndefined();
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /* sendAiReviewStatus                                                  */
  /* ------------------------------------------------------------------ */

  describe('sendAiReviewStatus', () => {
    it('should return the review with pull request details when found', async () => {
      (prisma.aiReview.findUnique as jest.Mock).mockResolvedValue(mockAiReviewWithPR);

      const result = await service.sendAiReviewStatus(mockAiReview.id);

      expect(prisma.aiReview.findUnique).toHaveBeenCalledWith({
        where: { id: mockAiReview.id },
        include: {
          pullRequest: {
            select: {
              number: true,
              title: true,
              status: true,
            },
          },
        },
      });
      expect(result).toEqual(mockAiReviewWithPR);
    });

    it('should throw NotFoundException when review is not found', async () => {
      (prisma.aiReview.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.sendAiReviewStatus('nonexistent-id')).rejects.toThrow(
        new NotFoundException('The review with id nonexistent-id not found'),
      );
    });
  });
});
