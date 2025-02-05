import {
	mysqlTable,
	varchar,
	datetime,
	text,
	boolean,
} from "drizzle-orm/mysql-core";

export const usersTable = mysqlTable("users", {
	id: varchar("id", { length: 25 }).primaryKey(),
	email: text("email").unique().notNull(),
	username: text("username").unique().notNull(),
	encryptedPwd: varchar("encrypted_pwd", { length: 30 }),
	emailVerified: boolean("email_verified").notNull(),
});

export const sessionsTable = mysqlTable("sessions", {
	id: varchar("id", { length: 255 }).primaryKey(),
	userId: varchar("id", { length: 25 }).references(() => usersTable.id),
	expiresAt: datetime("expires_at").notNull(),
});
