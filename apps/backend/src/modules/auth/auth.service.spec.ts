import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  const prismaMock = {
    organization: {
      upsert: jest.fn(),
    },
    user: {
      upsert: jest.fn(),
    },
  };
  const jwtServiceMock = {
    signAsync: jest.fn(),
  };
  const configServiceMock = {
    get: jest.fn((key: string) => {
      if (key === 'GITHUB_APP_PRIVATE_KEY') return 'private-key';
      return undefined;
    }),
  };

  beforeEach(async () => {
    (global as any).fetch = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should sync organization/user and return a JWT', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        installations: [{ id: 99, account: { login: 'MergePulse' } }],
      }),
    });
    prismaMock.organization.upsert.mockResolvedValue({
      id: 'org-id',
      name: 'MergePulse',
      slug: 'mergepulse-99',
      githubInstallationId: '99',
    });
    prismaMock.user.upsert.mockResolvedValue({
      id: 'user-id',
      githubUsername: 'octocat',
      organizationId: 'org-id',
      role: 'ADMIN',
    });
    jwtServiceMock.signAsync.mockResolvedValue('jwt-token');

    const result = await service.handleGithubCallback({
      githubId: '1',
      username: 'octocat',
      accessToken: 'gho_abc',
      email: null,
      avatar: null,
    });

    expect(prismaMock.organization.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { githubInstallationId: '99' },
      }),
    );
    expect(prismaMock.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { githubUsername: 'octocat' },
      }),
    );
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
      userId: 'user-id',
      orgId: 'org-id',
      role: 'ADMIN',
    });
    expect(result).toEqual({
      accessToken: 'jwt-token',
      tokenType: 'Bearer',
      user: {
        id: 'user-id',
        githubUsername: 'octocat',
        organizationId: 'org-id',
        role: 'ADMIN',
      },
    });
  });

  it('should reject login when there are no installations', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ installations: [] }),
    });

    await expect(
      service.handleGithubCallback({
        githubId: '1',
        username: 'octocat',
        accessToken: 'gho_abc',
        email: null,
        avatar: null,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should throw UnauthorizedException when GitHub returns non-ok', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(
      service.handleGithubCallback({
        githubId: '1',
        username: 'octocat',
        accessToken: 'gho_abc',
        email: null,
        avatar: null,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
