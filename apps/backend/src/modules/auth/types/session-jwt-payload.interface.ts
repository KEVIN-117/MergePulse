import { UserRole } from "@prisma/client";

export interface SessionJwtPayload {
  userId: string;
  orgId: string;
  role: UserRole;
}
