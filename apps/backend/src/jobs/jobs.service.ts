import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis, { Redis } from 'ioredis';
import {
  BOOTSTRAP_DATABASE_JOB,
  BOOTSTRAP_DATABASE_QUEUE,
} from './jobs.constants';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly queue: Queue;

  constructor(private readonly prisma: PrismaService) {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });
    this.queue = new Queue(BOOTSTRAP_DATABASE_QUEUE, {
      connection: this.redis,
    });
  }

  async enqueueBootstrapDatabaseJob(requestedBy: string) {
    const audit = await this.prisma.jobAudit.create({
      data: {
        queue: BOOTSTRAP_DATABASE_QUEUE,
        name: BOOTSTRAP_DATABASE_JOB,
        payload: { requestedBy },
      },
    });

    const job = await this.queue.add(
      BOOTSTRAP_DATABASE_JOB,
      { auditId: audit.id, requestedBy },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
        jobId: audit.id,
      },
    );

    return {
      auditId: audit.id,
      jobId: job.id,
      queue: BOOTSTRAP_DATABASE_QUEUE,
      name: BOOTSTRAP_DATABASE_JOB,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    this.redis.disconnect();
  }
}
