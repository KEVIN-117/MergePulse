import {
  BadGatewayException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Organization, Plan, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthResponse } from './types/auth-response.interface';
import { GithubAuthUser } from './types/github-auth-user.interface';
import { GithubInstallation, GithubInstallationsResponse } from './types/github-installation.interface';
import { SessionJwtPayload } from './types/session-jwt-payload.interface';

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
    console.log("githubUser", JSON.stringify(githubUser, null, 2));
    const installations = await this.fetchUserInstallations(githubUser.accessToken);

    let organizationId: string | null = null;
    let userRole: UserRole = UserRole.DEVELOPER;

    if (installations.length > 0) {
      let targetInstallation = installations.find(
        (currInstallation) => currInstallation.account?.login?.toLowerCase() === githubUser.username.toLowerCase()
      )

      if (!targetInstallation) {
        targetInstallation = installations[0];
      }

      const organization = await this.upsertOrganizationFromInstallation(targetInstallation);
      organizationId = organization.id;

      if (targetInstallation.account?.login?.toLowerCase() === githubUser.username.toLowerCase()) {
        userRole = UserRole.ADMIN;
      }
    }



    const user = await this.upsertUser(githubUser, organizationId);
    const { accessToken, refreshToken, user: userResponse } = await this.issueTokens(user);

    return {
      accessToken,
      refreshToken,
      user: userResponse
    };
  }

  async redirectUrl(accessToken: string, refreshToken: string, user: {
    id: string;
    githubUsername: string;
    organizationId?: string;
    role: UserRole;
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: { id: user.id },
    });
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const destination = existingUser?.organizationId ? `${frontendUrl}/dashboard?access_token=${accessToken}` : `${frontendUrl}/onboarding`;
    return destination;
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

  async getInstallationInfo(installationId: string) {
    const appJwt = this.generateAppJwt();
    const response = await fetch(
      `${this.githubApiUrl}/app/installations/${installationId}`,
      { headers: { Authorization: `Bearer ${appJwt}`, Accept: 'application/vnd.github+json' } },
    );
    return response.json();
  }

  async handleAppInstallation(dto: {
    installationId: string;
    action: string;
    userId: string;
  }) {
    // 1. Info de la instalación desde GitHub
    const installation = await this.getInstallationInfo(dto.installationId);
    const accountLogin: string = installation.account.login;

    // 2. Crear o actualizar la Organization
    const org = await this.prisma.organization.upsert({
      where: { githubInstallationId: dto.installationId },
      update: { name: accountLogin, updatedAt: new Date() },
      create: {
        name: accountLogin,
        slug: accountLogin.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        githubInstallationId: dto.installationId,
        plan: Plan.FREE,
      },
    });

    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { organizationId: org.id, role: UserRole.ADMIN },
    });
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
      },
    });
  }

  private async upsertUser(
    githubUser: GithubAuthUser,
    organizationId: string | null,
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
        role: organizationId ? UserRole.ADMIN : UserRole.DEVELOPER,
      },
      update: {
        githubUsername: githubUser.username,
        displayName: githubUser.displayName,
        avatarUrl: githubUser.avatar,
        email: githubUser.email,
        lastLoginAt: new Date(),
        ...(organizationId && { organizationId, role: UserRole.ADMIN }),
      },
    });
  }

  private signSessionJwt(payload: SessionJwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: '1d',
      secret: this.configService.get<string>('JWT_SECRET') as string,
    });
  }

  private refreshToken(payload: SessionJwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET') as string,
    });
  }

  private async issueTokens(user: User): Promise<AuthResponse> {
    const payload: SessionJwtPayload = {
      userId: user.id,
      githubUsername: user.githubUsername,
      orgId: user.organizationId || "",
      role: user.role,
    };

    const accessToken = await this.signSessionJwt(payload);
    const refreshToken = await this.refreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        githubUsername: user.githubUsername,
        organizationId: user.organizationId || "",
        role: user.role,
      },
    };
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

  private generateAppJwt(): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60,
      exp: now + 600,
      iss: this.configService.getOrThrow('GITHUB_APP_ID')
    };
    const privateKey = this.getGithubAppPrivateKey().replace(/\\n/g, '\n');
    return this.jwtService.sign(payload, { algorithm: 'RS256', privateKey });
  }
}
