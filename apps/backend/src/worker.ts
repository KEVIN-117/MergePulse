import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WorkerRuntimeService } from './jobs/worker-runtime.service';

async function bootstrapWorker() {
  const logger = new Logger('WorkerBootstrap');
  const app = await NestFactory.createApplicationContext(AppModule);
  const runtime = app.get(WorkerRuntimeService);

  await runtime.start();
  logger.log('Worker process started');

  const close = async () => {
    logger.log('Shutting down worker process');
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}

bootstrapWorker().catch((error) => {
  Logger.error(error, undefined, 'WorkerBootstrap');
  process.exit(1);
});
