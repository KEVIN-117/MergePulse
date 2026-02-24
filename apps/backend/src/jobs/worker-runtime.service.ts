import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Job, QueueEvents, Worker } from 'bullmq';
import IORedis, { Redis } from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import {
  BOOTSTRAP_DATABASE_JOB,
  BOOTSTRAP_DATABASE_QUEUE,
} from './jobs.constants';

type BootstrapJobData = {
  auditId: string;
  requestedBy: string;
};

@Injectable()
export class WorkerRuntimeService implements OnModuleDestroy {
  private readonly logger = new Logger(WorkerRuntimeService.name);
  private redis?: Redis;
  private worker?: Worker<BootstrapJobData>;
  private queueEvents?: QueueEvents;

  constructor(private readonly prisma: PrismaService) {}

  async start(): Promise<void> {
    if (this.worker) {
      return;
    }

    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });

    this.worker = new Worker<BootstrapJobData>(
      BOOTSTRAP_DATABASE_QUEUE,
      async (job) => this.processBootstrapJob(job),
      { connection: this.redis, concurrency: 2 },
    );

    this.queueEvents = new QueueEvents(BOOTSTRAP_DATABASE_QUEUE, {
      connection: this.redis,
    });
    await this.queueEvents.waitUntilReady();

    this.worker.on('ready', () => {
      this.logger.log('Bootstrap database worker is ready');
    });

    this.worker.on('error', (error) => {
      this.logger.error(`Worker error: ${error.message}`, error.stack);
    });

    this.worker.on('failed', async (job, error) => {
      if (!job?.data?.auditId) {
        return;
      }

      await this.prisma.jobAudit.update({
        where: { id: job.data.auditId },
        data: {
          status: 'FAILED',
          failedReason: error.message,
          completedAt: new Date(),
        },
      });
    });

    this.logger.log('Worker started');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queueEvents) {
      await this.queueEvents.close();
    }

    if (this.worker) {
      await this.worker.close();
    }

    if (this.redis) {
      this.redis.disconnect();
    }
  }

  private async processBootstrapJob(job: Job<BootstrapJobData>) {
    if (job.name !== BOOTSTRAP_DATABASE_JOB) {
      this.logger.warn(`Skipping unknown job: ${job.name}`);
      return;
    }

    await this.prisma.jobAudit.update({
      where: { id: job.data.auditId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    const nowIso = new Date().toISOString();

    await this.prisma.appSetting.upsert({
      where: { key: 'bootstrap_completed_at' },
      update: { value: nowIso },
      create: { key: 'bootstrap_completed_at', value: nowIso },
    });

    await this.prisma.jobAudit.update({
      where: { id: job.data.auditId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return { completedAt: nowIso, requestedBy: job.data.requestedBy };
  }
}
