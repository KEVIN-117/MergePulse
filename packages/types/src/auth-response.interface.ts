export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: {
    id: string;
    githubUsername: string;
    organizationId: string;
    role: UserRole;
  };
}
