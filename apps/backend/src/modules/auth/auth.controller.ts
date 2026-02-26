import { Controller, Get, NotFoundException, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthResponse } from './types/auth-response.interface';
import { GithubAuthUser } from './types/github-auth-user.interface';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('github/login')
  @UseGuards(AuthGuard('github'))
  githubLogin(): void {
    return;
  }

  @UseGuards(AuthGuard('github'))
  @Get('/github/callback')
  githubCallback(@Req() req: Request & { user: GithubAuthUser }): Promise<AuthResponse> {
    return this.authService.handleGithubCallback(req.user);
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
