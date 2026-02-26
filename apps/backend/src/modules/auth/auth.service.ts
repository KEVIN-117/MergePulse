import {
  BadGatewayException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Organization, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthResponse, UserRole } from '@repo/types/auth-response.interface';
import {
  GithubInstallation,
  GithubInstallationsResponse,
} from '@repo/types/github-installation.interface';
import { GithubAuthUser } from '@repo/types/github-auth-user.interface';
import { SessionJwtPayload } from '@repo/types/session-jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly githubApiUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.getGithubAppPrivateKey();
    this.githubApiUrl = this.configService.get<string>('GITHUB_API_URL') as string;
  }

  async handleGithubCallback(githubUser: GithubAuthUser): Promise<AuthResponse> {
    const installations = await this.fetchUserInstallations(githubUser.accessToken);
    if (installations.length === 0) {
      throw new ForbiddenException(
        'No GitHub App installation found for this user. Install the app and try again.',
      );
    }
    const installation = installations[0];
    const organization = await this.upsertOrganizationFromInstallation(installation);
    const user = await this.upsertUser(githubUser, organization.id);
    const accessToken = await this.signSessionJwt({
      userId: user.id,
      orgId: user.organizationId,
      role: user.role as UserRole,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        githubUsername: user.githubUsername,
        organizationId: user.organizationId,
        role: user.role as UserRole,
      },
    };
  }

  async getUser(userId: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: { id: userId },
    });
  }

  private async fetchUserInstallations(
    accessToken: string,
  ): Promise<GithubInstallation[]> {
    let response: Response;
    try {
      response = await fetch(`${this.githubApiUrl}/user/installations`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'MergePulse-Backend',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
    } catch {
      throw new BadGatewayException('Unable to reach GitHub API.');
    }

    if (!response.ok) {
      throw new UnauthorizedException(
        `GitHub OAuth token could not fetch installations (status ${response.status}).`,
      );
    }

    const data = (await response.json()) as GithubInstallationsResponse;
    return data.installations ?? [];
  }

  private async upsertOrganizationFromInstallation(
    installation: GithubInstallation,
  ): Promise<Organization> {
    const installationId = String(installation.id);
    const accountLogin = installation.account?.login?.trim() || `org-${installationId}`;
    const normalizedSlug = `${this.toSlug(accountLogin)}-${installationId}`.toLowerCase();

    return this.prisma.organization.upsert({
      where: { githubInstallationId: installationId },
      create: {
        name: accountLogin,
        slug: normalizedSlug,
        githubInstallationId: installationId,
      },
      update: {
        name: accountLogin,
        slug: normalizedSlug,
      },
    });
  }

  private async upsertUser(
    githubUser: GithubAuthUser,
    organizationId: string,
  ): Promise<User> {
    return this.prisma.user.upsert({
      where: { githubUsername: githubUser.username },
      create: {
        githubId: githubUser.githubId,
        githubUsername: githubUser.username,
        displayName: githubUser.displayName,
        email: githubUser.email,
        avatarUrl: githubUser.avatar,
        lastLoginAt: new Date(),
        organizationId,
        role: 'ADMIN',
      },
      update: {
        githubUsername: githubUser.username,
        displayName: githubUser.displayName,
        avatarUrl: githubUser.avatar,
        email: githubUser.email,
        lastLoginAt: new Date(),
        organizationId,
        role: 'ADMIN',
      },
    });
  }

  private signSessionJwt(payload: SessionJwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  private toSlug(value: string): string {
    return (
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'org'
    );
  }

  private getGithubAppPrivateKey(): string {
    const privateKey =
      this.configService.get<string>('GITHUB_APP_PRIVATE_KEY') ||
      this.configService.get<string>('GITHUB_PRIVATE_KEY');

    if (!privateKey) {
      throw new UnauthorizedException(
        'Missing GITHUB_APP_PRIVATE_KEY (or GITHUB_PRIVATE_KEY) environment variable.',
      );
    }

    return privateKey;
  }
}
