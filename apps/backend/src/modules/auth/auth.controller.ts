import { Controller, Get, NotFoundException, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthResponse } from './types/auth-response.interface';
import { GithubAuthUser } from './types/github-auth-user.interface';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) { }

  @Get('github/login')
  @UseGuards(AuthGuard('github'))
  githubLogin(): void {
    return;
  }

  @UseGuards(AuthGuard('github'))
  @Get('/github/callback')
  async githubCallback(@Req() req: Request & { user: GithubAuthUser }, @Res() res: Response): Promise<void> {
    const githubUser = req.user;
    const { accessToken, refreshToken, user: userResponse } = await this.authService.handleGithubCallback(githubUser);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const redirectUrl = await this.authService.redirectUrl(accessToken, refreshToken, userResponse);
    res.redirect(redirectUrl);
  }

  @Get('github/install')
  @UseGuards(JwtAuthGuard)
  installApp(@Res() res: Response) {
    const githubAppSlug = this.configService.get<string>('GITHUB_APP_SLUG');
    const url = `https://github.com/apps/${githubAppSlug}/installations/new`;
    res.redirect(url);
  }


  @Get('github/app-callback')
  @UseGuards(JwtAuthGuard)
  async appInstallCallback(
    @Query('installation_id') installationId: string,
    @Query('setup_action') action: string,
    @Res() res: Response,
    @Req() req: Request & { user: User },
  ) {
    const user = req.user;

    await this.authService.handleAppInstallation({ installationId, action, userId: user.id });
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?onboarding=complete`);
  }

  @Get('github/logout')
  githubLogout(): void {
    return;
  }

  @Get('github/refresh')
  githubRefresh(): void {
    return;
  }

  @Get("/user")
  @UseGuards(AuthGuard('jwt'))
  async getUser(@Req() req: Request & { user: User }): Promise<User> {
    try {
      const user = await this.authService.getUser(req.user.id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }
}
