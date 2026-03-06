import { PartialType } from '@nestjs/mapped-types';
import { CreateAiQueueModuleDto } from './create-ai-queue-module.dto';

export class UpdateAiQueueModuleDto extends PartialType(CreateAiQueueModuleDto) {}
