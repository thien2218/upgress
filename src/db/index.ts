import {
	boolean,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
	id: varchar("id", { length: 25 }).primaryKey(),
	email: text("email").unique().notNull(),
	encryptedPwd: varchar("encrypted_pwd", { length: 60 }),
	emailVerified: boolean("email_verified").notNull(),
	onboarded: boolean("onboarded").notNull(),
});

export const profilesTable = pgTable("profiles", {
	userId: varchar("user_id", { length: 25 })
		.primaryKey()
		.references(() => usersTable.id, { onDelete: "cascade" }),
	firstName: varchar("first_name", { length: 50 }).notNull(),
	lastName: varchar("last_name", { length: 50 }).notNull(),
	profileImage: text("profile_image"),
	bio: text("bio"),
});

export const sessionsTable = pgTable("sessions", {
	id: varchar("id", { length: 64 }).primaryKey(),
	userId: varchar("user_id", { length: 25 }).references(() => usersTable.id, {
		onDelete: "set null",
	}),
	expiresAt: timestamp("expires_at", {
		withTimezone: true,
		mode: "date",
	}).notNull(),
});
