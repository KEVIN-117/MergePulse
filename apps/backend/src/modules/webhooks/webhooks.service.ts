import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { PrStatus, User, UserRole, Visibility } from '@prisma/client';
import { GithubAuthUser } from '../auth/types/github-auth-user.interface';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';

interface PullRequestPayload {
  action: string;
  assignee: {
    avatar_url: string;
    email: string;
    id: number;
    login: string;
    name: string;
    node_id: string;
    type: string;
    url: string;
  }
  number: number;
  organization: {
    id: number;
    login: string;
    avatar_url: string;
    node_id: string;
    type: string;
    url: string;
  }
  pull_request: {
    _links: {
      comments: {
        href: string;
      },
      commits: {
        href: string;
      },
      html: {
        href: string;
      },
      reviews: {
        href: string;
      },
      statuses: {
        href: string;
      },
      self: {
        href: string;
      },
    },
    additions: number;
    deletions: number;
    assignee: {
      avatar_url: string;
      email: string;
      id: number;
      login: string;
      name: string;
      node_id: string;
      type: string;
      url: string;
    },
    changed_files: number;
    comments: number;
    commits: number;
    created_at: string;
    diff_url: string;
    draft: boolean;
    head: {
      ref: string;
      sha: string;
      user: {
        avatar_url: string;
        email: string;
        id: number;
        login: string;
        name: string;
        node_id: string;
        type: string;
        url: string;
      }
    }
    html_url: string;
    id: number;
    issue_url: string;
    labels: Array<{
      color: string;
      default: boolean;
      description: string;
      id: number;
      name: string;
      node_id: string;
      url: string;
    }>
    locked: boolean;
    merged: boolean;
    merged_at: string;
    number: number;
    review_comments: number;
    review_comments_url: string;
    state: string;
    title: string;
    updated_at: string;
    url: string;
    user: {
      avatar_url: string;
      email: string;
      id: number;
      login: string;
      name: string;
      node_id: string;
      type: string;
      url: string;
    },
    closed_at: string;
  },
  installation: {
    id: number;
    node_id: string;
  },
  repository: {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    git_url: string;
    ssh_url: string;
    clone_url: string;
    homepage: string;
    size: number;
    stargazers_count: number;
    watchers_count: number;
    language: string;
    forks_count: number;
    open_issues_count: number;
    topics: Array<string>;
    license: {
      key: string;
      name: string;
      spdx_id: string;
      url: string;
      node_id: string;
    }
    owner: {
      avatar_url: string;
      email: string;
      id: number;
      login: string;
      name: string;
      node_id: string;
      type: string;
      url: string;
    }
  },
  sender: {
    avatar_url: string;
    email: string;
    id: number;
    login: string;
    name: string;
    node_id: string;
    type: string;
    url: string;
  }
}

interface InstallationRepositoriesPayload {
  action: string;
  installation: {
    id: number;
    node_id: string;
  }
  repositories_added: Array<{
    full_name: string;
    id: number;
    name: string;
    node_id: string;
    private: boolean;
  }>,
  repositories_removed: Array<{
    full_name: string;
    id: number;
    name: string;
    node_id: string;
    private: boolean;
  }>,
  repository_selection: 'all' | 'selected'
}

@Injectable()
export class WebhooksService {

  constructor(private readonly prisma: PrismaService, private readonly userService: UserService) { }

  async handlePullRequest(payload: PullRequestPayload) {
    const { action, pull_request: pr, repository: repo, installation } = payload;
    if (!installation.id) {
      throw new UnauthorizedException("Installation not found");
      return;
    }

    const organization = await this.prisma.organization.findUnique({
      where: {
        githubInstallationId: `${installation.id}`
      }
    })

    if (!organization) {
      throw new UnauthorizedException("Organization not found");
      return;
    }

    const repository = await this.prisma.repository.findUnique({
      where: { githubRepoId: String(repo.id) },
    });

    if (!repository) {
      return { message: 'Ignored: Repository not registered in MergePulse' };
    }

    const user = await this.upsertUser({
      githubId: String(pr.user.id),
      githubUsername: pr.user.login,
      displayName: pr.user.name,
      email: pr.user.email,
      avatarUrl: pr.user.avatar_url,
      lastLoginAt: new Date(),
      organizationId: organization.id,
      role: UserRole.DEVELOPER,
    }, organization.id);

    const status = this.determinePrStatus(pr.state, pr.merged);

    const pullRequest = await this.prisma.pullRequest.upsert({
      where: { githubPrId: String(pr.id) },
      create: {
        githubPrId: String(pr.id),
        number: pr.number,
        title: pr.title,
        status: status,
        repositoryId: repository.id,
        organizationId: organization.id,
        authorId: user.id,
        createdAt: new Date(pr.created_at),
        closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
        mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
      },
      update: {
        title: pr.title,
        status: status,
        closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
        mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
      },
    });

    if (action === 'opened' || action === 'synchronize') {
      // AQUÍ: En el siguiente ticket conectaremos BullMQ para encolar el trabajo
      // await this.aiQueueService.addReviewJob(pullRequest.id);
    }

    return {
      message: 'Pull request processed successfully',
    };
  }

  async handleInstallationRepositoriesEvent(payload: InstallationRepositoriesPayload) {
    const { action, installation, repositories_added, repositories_removed, repository_selection } = payload;

    if (!installation.id) {
      throw new UnauthorizedException("Installation not found");
      return;
    }

    const organization = await this.prisma.organization.findUnique({
      where: {
        githubInstallationId: `${installation.id}`
      }
    })

    if (!organization) {
      throw new UnauthorizedException("Organization not found");
      return;
    }

    if (action === 'added') {
      for (const repo of repositories_added) {
        await this.prisma.repository.upsert({
          where: { githubRepoId: String(repo.id) },
          create: {
            githubRepoId: String(repo.id),
            name: repo.name,
            organizationId: organization.id,
            visibility: repo.private ? Visibility.PRIVATE : Visibility.PUBLIC,
          },
          update: {
            name: repo.name,
            organizationId: organization.id,
            visibility: repo.private ? Visibility.PRIVATE : Visibility.PUBLIC,
          },
        });
      }
    }

    if (action === 'removed') {
      for (const repo of repositories_removed) {
        await this.prisma.repository.delete({
          where: { githubRepoId: String(repo.id) },
        });
      }
    }

    return {
      message: 'Installation repositories event processed successfully',
    };
  }

  private determinePrStatus(state: string, merged: boolean): PrStatus {
    if (merged) return PrStatus.MERGED;
    if (state === 'closed') return PrStatus.CLOSED;
    return PrStatus.OPEN;
  }

  handlePullRequestReview(payload: any) {
    console.log("payload", payload);
  }

  handlePullRequestReviewComment(payload: any) {
    console.log("payload", payload);
  }

  private async verifiyUser(githubId: string, organizationId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        githubId,
        organizationId,
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
  private async upsertUser(
    githubUser: CreateUserDto,
    organizationId: string,
  ): Promise<User> {
    if (!this.verifiyUser(githubUser.githubId, organizationId)) {
      return this.userService.create(githubUser)
    }
    return this.userService.update(githubUser.githubId, githubUser)
  }
}
