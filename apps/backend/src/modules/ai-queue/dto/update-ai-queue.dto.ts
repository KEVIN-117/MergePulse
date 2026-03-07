import { PartialType } from '@nestjs/mapped-types';
import { CreateAiQueueModuleDto } from './create-ai-queue.dto';

export class UpdateAiQueueModuleDto extends PartialType(CreateAiQueueModuleDto) { }
