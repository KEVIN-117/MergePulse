import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrStatus, User, UserRole, Visibility } from '@prisma/client';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { AiQueueService } from '../ai-queue/ai-queue.service';

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

interface Collaborator {
  login: string;
  id: number;
  avatar_url: string;
  url: string;
  role_name: string;
}

interface GitHubUserDetails {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: boolean;
  name: string;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  hireable: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class WebhooksService {

  constructor(private readonly prisma: PrismaService, private readonly userService: UserService, private readonly authService: AuthService, private readonly configService: ConfigService, private readonly aiQueueService: AiQueueService) { }

  async handlePullRequest(payload: PullRequestPayload) {
    const { action, pull_request: pr, repository: repo, installation } = payload;
    if (!installation.id) {
      throw new UnauthorizedException("Installation not found");
    }

    const organization = await this.prisma.organization.findUnique({
      where: {
        githubInstallationId: `${installation.id}`
      }
    })

    if (!organization) {
      throw new UnauthorizedException("Organization not found");
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

      await this.aiQueueService.queueReview(pullRequest.id, user.id, repository.id, organization.githubInstallationId);
    }

    return {
      message: 'Pull request processed successfully',
    };
  }

  async handleInstallationRepositoriesEvent(payload: InstallationRepositoriesPayload) {
    const { action, installation, repositories_added, repositories_removed, repository_selection } = payload;

    if (!installation.id) {
      throw new UnauthorizedException("Installation not found");
    }

    const organization = await this.prisma.organization.findUnique({
      where: {
        githubInstallationId: `${installation.id}`
      }
    })

    if (!organization) {
      throw new UnauthorizedException("Organization not found");
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
        const repoOwner = repo.full_name.split('/')[0];

        await this.syncRepositoryCollaborators(organization.githubInstallationId, repoOwner, repo.name, organization.id);
      }
    }

    if (action === 'removed') {
      if (repositories_removed.length === 0) {
        return { message: 'Ignored: No repositories removed' };
      }

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

  async getInstallationAccessToken(installationId: string): Promise<string> {
    try {
      // 1. Generamos el JWT usando el método que ya habías construido
      const appJwt = this.authService.generateAppJwt();

      const githubApiUrl = this.configService.get<string>('GITHUB_API_URL') as string;

      // 2. Hacemos un POST a GitHub pidiendo las llaves para esta instalación
      const response = await fetch(`${githubApiUrl}/app/installations/${installationId}/access_tokens`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${appJwt}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error('No se pudo generar el token de instalación de GitHub');
      }

      const data = await response.json();

      return data.token;

    } catch (error) {
      throw new InternalServerErrorException('Error de comunicación con GitHub');
    }
  }

  private async syncRepositoryCollaborators(installationId: string, owner: string, repoName: string, organizationId: string) {
    const githubAccessToken = await this.getInstallationAccessToken(installationId);
    const githubApiUrl = this.configService.get<string>('GITHUB_API_URL') as string;
    try {
      const response = await fetch(`${githubApiUrl}/repos/${owner}/${repoName}/collaborators`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${githubAccessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error('No se pudo obtener la lista de colaboradores del repositorio');
      }

      const collaborators = await response.json() as Collaborator[];

      for (const collaborator of collaborators) {
        const res = await fetch(`${githubApiUrl}/users/${collaborator.login}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${githubAccessToken}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        });

        const githubUserDetails = await res.json() as GitHubUserDetails;

        await this.prisma.user.upsert({
          where: { githubId: String(collaborator.id) },
          create: {
            githubId: String(collaborator.id),
            githubUsername: collaborator.login,
            displayName: githubUserDetails.name,
            email: githubUserDetails.email,
            avatarUrl: githubUserDetails.avatar_url,
            lastLoginAt: new Date(),
            organizationId: organizationId,
            role: UserRole.DEVELOPER,
          },
          update: {
            githubUsername: collaborator.login,
            displayName: githubUserDetails.name,
            email: githubUserDetails.email,
            avatarUrl: githubUserDetails.avatar_url,
          },
        });
      }
    } catch (error) {
      throw new InternalServerErrorException('Error de comunicación con GitHub');
    }

  }

  private determinePrStatus(state: string, merged: boolean): PrStatus {
    if (merged) return PrStatus.MERGED;
    if (state === 'closed') return PrStatus.CLOSED;
    return PrStatus.OPEN;
  }

  handlePullRequestReview(payload: any) {
    console.log("Handling pull request review");
  }

  handlePullRequestReviewComment(payload: any) {
    console.log("Handling pull request review comment");
  }

  private async verifiyUser(githubId: string, organizationId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        githubId,
        organizationId,
      },
    });

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
