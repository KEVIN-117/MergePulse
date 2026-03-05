import { UserRole } from "@prisma/client";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    githubUsername: string;
    organizationId?: string;
    role: UserRole;
  };
}
