import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { WorkerRuntimeService } from './worker-runtime.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, WorkerRuntimeService],
  exports: [JobsService, WorkerRuntimeService],
})
export class JobsModule {}
