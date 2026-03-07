import { Test, TestingModule } from '@nestjs/testing';
import { ReviewStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { AiReviewProcessor } from './ai-review.processor';
import { PrismaService } from 'src/prisma/prisma.service';

/* ─────────────────────────────────────────────
   Helpers & constants
───────────────────────────────────────────── */

/** Minimal Job stub — only the fields the processor uses. */
function makeJob(data: Record<string, unknown>, id = 'job-1'): Job {
    return { id, data } as unknown as Job;
}

const AI_REVIEW_ID = 'review-1';
const PULL_REQUEST_ID = 'pr-1';
const INSTALLATION_ID = '42';

const mockAiReview = { id: AI_REVIEW_ID };
const mockPullRequest = {
    id: PULL_REQUEST_ID,
    number: 7,
    repository: { name: 'org/repo' },
};

/* ─────────────────────────────────────────────
   Test suite
───────────────────────────────────────────── */

describe('AiReviewProcessor', () => {
    let processor: AiReviewProcessor;
    let prisma: {
        aiReview: { findUnique: jest.Mock; update: jest.Mock };
        pullRequest: { findUnique: jest.Mock };
    };

    beforeEach(async () => {
        prisma = {
            aiReview: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
            pullRequest: {
                findUnique: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AiReviewProcessor,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        processor = module.get<AiReviewProcessor>(AiReviewProcessor);
    });

    it('should be defined', () => {
        expect(processor).toBeDefined();
    });

    /* -------------------------------------------------------------------- */
    /* process()                                                             */
    /* -------------------------------------------------------------------- */

    describe('process', () => {
        const makeReviewJob = () =>
            makeJob({ aiReviewId: AI_REVIEW_ID, pullRequestId: PULL_REQUEST_ID, installationId: INSTALLATION_ID });

        it('should throw when aiReview is not found', async () => {
            prisma.aiReview.findUnique.mockResolvedValue(null);

            await expect(processor.process(makeReviewJob())).rejects.toThrow(
                `AI Review ${AI_REVIEW_ID} no encontrado`,
            );

            expect(prisma.aiReview.update).not.toHaveBeenCalled();
            expect(prisma.pullRequest.findUnique).not.toHaveBeenCalled();
        });

        it('should throw when pullRequest or repository is not found', async () => {
            prisma.aiReview.findUnique.mockResolvedValue(mockAiReview);
            prisma.aiReview.update.mockResolvedValue({});
            prisma.pullRequest.findUnique.mockResolvedValue(null);

            await expect(processor.process(makeReviewJob())).rejects.toThrow(
                `PR o Repositorio no encontrado en la BD para el ID: ${PULL_REQUEST_ID}`,
            );

            // Status was updated to PROCESSING before the PR lookup
            expect(prisma.aiReview.update).toHaveBeenCalledWith({
                where: { id: AI_REVIEW_ID },
                data: { status: ReviewStatus.PROCESSING },
            });
        });

        it('should throw when pullRequest has no repository', async () => {
            prisma.aiReview.findUnique.mockResolvedValue(mockAiReview);
            prisma.aiReview.update.mockResolvedValue({});
            prisma.pullRequest.findUnique.mockResolvedValue({ id: PULL_REQUEST_ID, number: 7, repository: null });

            await expect(processor.process(makeReviewJob())).rejects.toThrow(
                `PR o Repositorio no encontrado en la BD para el ID: ${PULL_REQUEST_ID}`,
            );
        });

        it('should set status to PROCESSING and return success on happy path', async () => {
            prisma.aiReview.findUnique.mockResolvedValue(mockAiReview);
            prisma.aiReview.update.mockResolvedValue({});
            prisma.pullRequest.findUnique.mockResolvedValue(mockPullRequest);

            jest.useFakeTimers();
            const processPromise = processor.process(makeReviewJob());
            await jest.runAllTimersAsync();
            const result = await processPromise;
            jest.useRealTimers();

            expect(prisma.aiReview.findUnique).toHaveBeenCalledWith({
                where: { id: AI_REVIEW_ID },
            });
            expect(prisma.aiReview.update).toHaveBeenCalledWith({
                where: { id: AI_REVIEW_ID },
                data: { status: ReviewStatus.PROCESSING },
            });
            expect(prisma.pullRequest.findUnique).toHaveBeenCalledWith({
                where: { id: PULL_REQUEST_ID },
                include: { repository: true },
            });
            expect(result).toEqual({ status: 'success', message: 'Código revisado correctamente' });
        });
    });

    /* -------------------------------------------------------------------- */
    /* onCompleted()                                                         */
    /* -------------------------------------------------------------------- */

    describe('onCompleted', () => {
        it('should update aiReview status to COMPLETED', async () => {
            prisma.aiReview.update.mockResolvedValue({});
            const job = makeJob({ aiReviewId: AI_REVIEW_ID });

            await processor.onCompleted(job, '');

            expect(prisma.aiReview.update).toHaveBeenCalledWith({
                where: { id: AI_REVIEW_ID },
                data: { status: ReviewStatus.COMPLETED },
            });
        });
    });

    /* -------------------------------------------------------------------- */
    /* onFailed()                                                            */
    /* -------------------------------------------------------------------- */

    describe('onFailed', () => {
        it('should update aiReview status to FAILED', async () => {
            prisma.aiReview.update.mockResolvedValue({});
            const job = makeJob({ aiReviewId: AI_REVIEW_ID });
            const error = new Error('something went wrong');

            await processor.onFailed(job, error);

            expect(prisma.aiReview.update).toHaveBeenCalledWith({
                where: { id: AI_REVIEW_ID },
                data: { status: ReviewStatus.FAILED },
            });
        });

        it('should handle undefined job gracefully', async () => {
            prisma.aiReview.update.mockResolvedValue({});
            const error = new Error('catastrophic failure');

            // Should not throw even when job is undefined
            await expect(processor.onFailed(undefined, error)).resolves.not.toThrow();
        });
    });
});
