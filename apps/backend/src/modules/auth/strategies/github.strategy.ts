import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { GithubAuthUser } from '../types/github-auth-user.interface';

interface GithubProfile {
  id?: string;
  username?: string;
  displayName?: string;
  emails?: Array<{ value?: string }>;
  photos?: Array<{ value?: string }>;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GITHUB_CALLBACK_URL'),
      scope: ['read:user', 'user:email'],
    });
  }

  validate(
    accessToken: string,
    _refreshToken: string,
    profile: GithubProfile,
  ): GithubAuthUser {
    const username = profile.username?.trim();
    if (!username || !profile.id) {
      throw new UnauthorizedException('GitHub profile payload is missing required fields.');
    }

    return {
      githubId: profile.id,
      username,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value ?? null,
      avatar: profile.photos?.[0]?.value ?? null,
      accessToken,
    };
  }
}
