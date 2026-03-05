import { Controller, Get, Post, Body, Patch, Param, Delete, Req, HttpStatus, HttpCode, UseGuards, Headers } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { GithubWebhookGuard } from 'src/common/guards/github-webhook.guard';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) { }

  @Post("github/watch")
  @HttpCode(HttpStatus.OK)
  @UseGuards(GithubWebhookGuard)
  async handleWebhook(@Headers('x-github-event') event: string, @Body() payload: any) {
    if (event === 'ping') {
      return {
        message: 'Webhook received: pong'
      }
    }

    if (event === 'pull_request') {
      return this.webhooksService.handlePullRequest(payload);
    }

    if (event === 'pull_request_review') {
      return this.webhooksService.handlePullRequestReview(payload);
    }

    if (event === 'pull_request_review_comment') {
      return this.webhooksService.handlePullRequestReviewComment(payload);
    }

    if (event === 'pull_request_review_comment') {
      return this.webhooksService.handlePullRequestReviewComment(payload);
    }

    if (event === 'installation_repositories') {
      console.log("installation_repositories", JSON.stringify(payload, null, 2));
      const response = await this.webhooksService.handleInstallationRepositoriesEvent(payload);
      return response;
    }

    return { message: `Event ${event} ignored` };
  }
}
