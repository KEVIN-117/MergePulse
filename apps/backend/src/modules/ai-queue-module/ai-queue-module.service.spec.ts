import { Test, TestingModule } from '@nestjs/testing';
import { AiQueueModuleService } from './ai-queue-module.service';

describe('AiQueueModuleService', () => {
  let service: AiQueueModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiQueueModuleService],
    }).compile();

    service = module.get<AiQueueModuleService>(AiQueueModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
