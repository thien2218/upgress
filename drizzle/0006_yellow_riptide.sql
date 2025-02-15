CREATE TYPE "public"."status_enum" AS ENUM('pending', 'in-progress', 'completed');--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"target" varchar(100) NOT NULL,
	"deadline" date NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"link" text NOT NULL,
	"cost" real DEFAULT 0 NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "roadmap_to_milestone" (
	"roadmap_id" varchar(25) NOT NULL,
	"milestone_id" varchar(25) NOT NULL,
	"order" integer NOT NULL,
	CONSTRAINT "roadmap_milestone_key" PRIMARY KEY("roadmap_id","milestone_id","order")
);
--> statement-breakpoint
CREATE TABLE "roadmaps" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"user_id" varchar(25),
	"name" varchar(100) NOT NULL,
	"budget" real DEFAULT 0 NOT NULL,
	"commitment" text NOT NULL,
	"goal" text
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"milestone_id" varchar(25) NOT NULL,
	"description" text NOT NULL,
	"priority" smallint NOT NULL,
	"status" "status_enum" DEFAULT 'pending' NOT NULL,
	"difficulty" smallint NOT NULL,
	"due_date" date
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "joined_since" date DEFAULT CURRENT_DATE NOT NULL;--> statement-breakpoint
ALTER TABLE "roadmap_to_milestone" ADD CONSTRAINT "roadmap_to_milestone_roadmap_id_roadmaps_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmaps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_to_milestone" ADD CONSTRAINT "roadmap_to_milestone_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE cascade ON UPDATE no action;