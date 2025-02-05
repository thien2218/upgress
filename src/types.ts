import { InferSelectModel } from "drizzle-orm";
import { sessionsTable, usersTable } from "./db";

export type User = Omit<InferSelectModel<typeof usersTable>, "encryptedPwd">;
export type Session = Omit<InferSelectModel<typeof sessionsTable>, "userId">;
export type Auth = { user: User; session: Session };
export type Unauth = { user: null; session: null };
export type SessionValidation = Auth | Unauth;
