DROP TABLE "resource_to_milestone" CASCADE;--> statement-breakpoint
DROP TABLE "roadmap_to_milestone" CASCADE;--> statement-breakpoint
ALTER TABLE "roadmaps" ADD COLUMN "goals" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "time_spent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "roadmaps" DROP COLUMN "goal";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "difficulty";