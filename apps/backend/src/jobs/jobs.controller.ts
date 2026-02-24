import { Body, Controller, Post } from '@nestjs/common';
import { JobsService } from './jobs.service';

interface EnqueueBootstrapJobRequest {
  requestedBy?: string;
}

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('bootstrap-database')
  async enqueueBootstrapDatabaseJob(@Body() body: EnqueueBootstrapJobRequest) {
    return this.jobsService.enqueueBootstrapDatabaseJob(
      body.requestedBy ?? 'manual-trigger',
    );
  }
}
