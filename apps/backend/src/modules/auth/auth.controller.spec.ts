import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GithubAuthUser } from './types/github-auth-user.interface';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    handleGithubCallback: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate callback user to auth service', async () => {
    const githubUser: GithubAuthUser = {
      githubId: '123',
      username: 'octocat',
      accessToken: 'gho_token',
      email: 'octocat@github.com',
      avatar: null,
    };
    const expected = {
      accessToken: 'jwt-token',
      tokenType: 'Bearer' as const,
      user: {
        id: 'user-id',
        githubUsername: 'octocat',
        organizationId: 'org-id',
        role: 'ADMIN',
      },
    };
    authServiceMock.handleGithubCallback.mockResolvedValue(expected);

    const response = await controller.githubCallback({ user: githubUser } as any);

    expect(authServiceMock.handleGithubCallback).toHaveBeenCalledWith(githubUser);
    expect(response).toEqual(expected);
  });
});
