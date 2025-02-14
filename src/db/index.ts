import { sql } from "drizzle-orm";
import {
	boolean,
	date,
	foreignKey,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	real,
	serial,
	smallint,
	text,
	timestamp,
	unique,
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
	joinedSince: date("joined_since", { mode: "date" })
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

export const roadmapsTable = pgTable(
	"roadmaps",
	{
		id: varchar("id", { length: 25 }).primaryKey(),
		userId: varchar("user_id", { length: 25 }).references(
			() => usersTable.id,
			{ onDelete: "set null" }
		),
		name: varchar("name", { length: 100 }).notNull(),
		budget: real("budget").default(0).notNull(),
		commitment: smallint("commitment").notNull(),
		goals: jsonb("goals").$type<string[]>().notNull(),
		prerequisite: varchar("prerequisite", { length: 25 }),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
			.default(sql`now()`)
			.notNull(),
	},
	(table) => [
		foreignKey({
			name: "roadmap_prerequisite_fk",
			columns: [table.prerequisite],
			foreignColumns: [table.id],
		}).onDelete("set null"),
	]
);

export const milestonesTable = pgTable("milestones", {
	id: varchar("id", { length: 25 }).primaryKey(),
	userId: varchar("user_id", { length: 25 }).references(() => usersTable.id, {
		onDelete: "set null",
	}),
	target: varchar("target", { length: 100 }).notNull(),
	deadline: date("deadline", { mode: "date" }).notNull(),
	description: text("description"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
		.default(sql`now()`)
		.notNull(),
});

export const roadmapToMilestone = pgTable(
	"roadmap_to_milestone",
	{
		id: serial("id").primaryKey(),
		roadmapId: varchar("roadmap_id", { length: 25 })
			.notNull()
			.references(() => roadmapsTable.id, { onDelete: "cascade" }),
		milestoneId: varchar("milestone_id", { length: 25 })
			.notNull()
			.references(() => milestonesTable.id, { onDelete: "cascade" }),
	},
	(table) => [
		unique("unique_roadmap_milestone").on(table.roadmapId, table.milestoneId),
	]
);

export const statusEnum = pgEnum("status_enum", [
	"pending",
	"in-progress",
	"completed",
]);

export const tasksTable = pgTable("tasks", {
	id: varchar("id", { length: 25 }).primaryKey(),
	userId: varchar("user_id", { length: 25 }).references(() => usersTable.id, {
		onDelete: "set null",
	}),
	milestoneId: varchar("milestone_id", { length: 25 })
		.notNull()
		.references(() => milestonesTable.id, { onDelete: "cascade" }),
	description: text("description").notNull(),
	priority: smallint("priority").notNull(),
	status: statusEnum().default("pending").notNull(),
	timeSpent: integer("time_spent").default(0).notNull(),
	dueDate: date("due_date", { mode: "date" }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
		.default(sql`now()`)
		.notNull(),
});

export const resourcesTable = pgTable("resources", {
	id: varchar("id", { length: 25 }).primaryKey(),
	userId: varchar("user_id", { length: 25 }).references(() => usersTable.id, {
		onDelete: "set null",
	}),
	name: varchar("name", { length: 100 }).notNull(),
	type: varchar("type", { length: 20 }).notNull(),
	link: text("link").notNull(),
	cost: real("cost").default(0).notNull(),
	description: text("description"),
});

export const resourceToMilestone = pgTable(
	"resource_to_milestone",
	{
		id: serial("id").primaryKey(),
		resourceId: varchar("resource_id", { length: 25 })
			.notNull()
			.references(() => resourcesTable.id, { onDelete: "cascade" }),
		milestoneId: varchar("milestone_id", { length: 25 })
			.notNull()
			.references(() => milestonesTable.id, { onDelete: "cascade" }),
		addedAt: timestamp("added_at", { withTimezone: true, mode: "date" })
			.default(sql`now()`)
			.notNull(),
	},
	(table) => [
		unique("unique_milestone_resource").on(
			table.resourceId,
			table.milestoneId
		),
	]
);
