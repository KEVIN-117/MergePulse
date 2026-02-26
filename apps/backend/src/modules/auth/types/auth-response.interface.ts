import { UserRole } from "@prisma/client";

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
