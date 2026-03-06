import { Test, TestingModule } from '@nestjs/testing';
import { AiQueueModuleController } from './ai-queue-module.controller';
import { AiQueueModuleService } from './ai-queue-module.service';

describe('AiQueueModuleController', () => {
  let controller: AiQueueModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiQueueModuleController],
      providers: [AiQueueModuleService],
    }).compile();

    controller = module.get<AiQueueModuleController>(AiQueueModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
