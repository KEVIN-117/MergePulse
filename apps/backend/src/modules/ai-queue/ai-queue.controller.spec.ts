import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AiQueueModuleController } from './ai-queue.controller';
import { AiQueueService } from './ai-queue.service';
import { CreateAiQueueDto } from './dto/create-ai-queue.dto';

/* ─────────────────────────────────────────────
   Constants & fixtures
───────────────────────────────────────────── */

const PULL_REQUEST_ID = 'pr-1';
const REVIEW_ID = 'review-1';

const createDto: CreateAiQueueDto = {
  userId: 'user-1',
  repositoryId: 'repo-1',
  githubInstallationId: '42',
};

const mockReviewStatus = {
  id: REVIEW_ID,
  pullRequest: {
    number: 7,
    title: 'feat: new feature',
    status: 'open',
  },
};

/* ─────────────────────────────────────────────
   Test suite
───────────────────────────────────────────── */

describe('AiQueueModuleController', () => {
  let controller: AiQueueModuleController;
  let service: jest.Mocked<AiQueueService>;

  beforeEach(async () => {
    service = {
      queueReview: jest.fn(),
      sendAiReviewStatus: jest.fn(),
    } as unknown as jest.Mocked<AiQueueService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiQueueModuleController],
      providers: [{ provide: AiQueueService, useValue: service }],
    }).compile();

    controller = module.get<AiQueueModuleController>(AiQueueModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /* ------------------------------------------------------------------ */
  /* POST prs/:pullRequestId/review                                      */
  /* ------------------------------------------------------------------ */

  describe('queueReview', () => {
    it('should delegate to AiQueueService.queueReview with correct parameters', async () => {
      service.queueReview.mockResolvedValue(undefined);

      await controller.queueReview(PULL_REQUEST_ID, createDto);

      expect(service.queueReview).toHaveBeenCalledWith(
        PULL_REQUEST_ID,
        createDto.userId,
        createDto.repositoryId,
        createDto.githubInstallationId,
      );
    });

    it('should propagate errors thrown by the service', async () => {
      service.queueReview.mockRejectedValue(new Error('Queue unavailable'));

      await expect(controller.queueReview(PULL_REQUEST_ID, createDto)).rejects.toThrow('Queue unavailable');
    });
  });

  /* ------------------------------------------------------------------ */
  /* GET review-status/:id                                               */
  /* ------------------------------------------------------------------ */

  describe('getReviewStatus', () => {
    it('should return review status from AiQueueService', async () => {
      service.sendAiReviewStatus.mockResolvedValue(mockReviewStatus as any);

      const result = await controller.getReviewStatus(REVIEW_ID);

      expect(service.sendAiReviewStatus).toHaveBeenCalledWith(REVIEW_ID);
      expect(result).toEqual(mockReviewStatus);
    });

    it('should propagate NotFoundException from the service', async () => {
      service.sendAiReviewStatus.mockRejectedValue(
        new NotFoundException(`The review with id ${REVIEW_ID} not found`),
      );

      await expect(controller.getReviewStatus(REVIEW_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
