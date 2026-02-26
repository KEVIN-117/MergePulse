import { UserRole } from './auth-response.interface';

export interface SessionJwtPayload {
  userId: string;
  orgId: string;
  role: UserRole;
}
