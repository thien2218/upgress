import { sql } from "drizzle-orm";
import {
	boolean,
	date,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	real,
	smallint,
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
	joinedSince: date("joined_since")
		.default(sql`CURRENT_DATE`)
		.notNull(),
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

export const roadmapsTable = pgTable("roadmaps", {
	id: varchar("id", { length: 25 }).primaryKey(),
	userId: varchar("user_id", { length: 25 }).references(() => usersTable.id, {
		onDelete: "set null",
	}),
	name: varchar("name", { length: 100 }).notNull(),
	budget: real("budget").default(0).notNull(),
	commitment: text("commitment").notNull(),
	goal: text("goal"),
});

export const roadmapToMilestone = pgTable(
	"roadmap_to_milestone",
	{
		roadmapId: varchar("roadmap_id", { length: 25 })
			.notNull()
			.references(() => roadmapsTable.id, { onDelete: "cascade" }),
		milestoneId: varchar("milestone_id", { length: 25 })
			.notNull()
			.references(() => milestonesTable.id, { onDelete: "cascade" }),
		order: integer("order").notNull(),
	},
	(table) => [
		primaryKey({
			name: "roadmap_milestone_key",
			columns: [table.roadmapId, table.milestoneId, table.order],
		}),
	]
);

export const milestonesTable = pgTable("milestones", {
	id: varchar("id", { length: 25 }).primaryKey(),
	target: varchar("target", { length: 100 }).notNull(),
	deadline: date("deadline").notNull(),
	description: text("description"),
});

export const tasksTable = pgTable("tasks", {
	id: varchar("id", { length: 25 }).primaryKey(),
	milestoneId: varchar("milestone_id", { length: 25 })
		.notNull()
		.references(() => milestonesTable.id, { onDelete: "cascade" }),
	description: text("description").notNull(),
	priority: smallint("priority").notNull(),
	status: pgEnum("status", ["pending", "in-progress", "completed"])()
		.default("pending")
		.notNull(),
	difficulty: smallint("difficulty").notNull(),
	dueDate: date("due_date"),
});

export const resourcesTable = pgTable("resources", {
	id: varchar("id", { length: 25 }).primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	type: varchar("type", { length: 20 }).notNull(),
	link: text("link").notNull(),
	cost: real("cost").default(0).notNull(),
	description: text("description"),
});
