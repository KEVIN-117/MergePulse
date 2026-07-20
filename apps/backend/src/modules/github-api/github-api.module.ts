import { Module } from '@nestjs/common';
import { GithubApiService } from './github-api.service';
import { GithubController } from './github-api.controller';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [GithubController],
  providers: [GithubApiService, AuthService],
})
export class GithubApiModule { }
