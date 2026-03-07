import { PartialType } from '@nestjs/mapped-types';
import { CreateAiQueueDto } from './create-ai-queue.dto';

export class UpdateAiQueueDto extends PartialType(CreateAiQueueDto) { }
