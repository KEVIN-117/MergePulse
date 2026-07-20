import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GithubApiService } from './github-api.service';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubApiService) { }
}
