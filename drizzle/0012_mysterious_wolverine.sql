ALTER TABLE "milestones" ADD COLUMN "est_time" smallint NOT NULL;--> statement-breakpoint
ALTER TABLE "roadmap_to_milestone" ADD COLUMN "order" smallint NOT NULL;--> statement-breakpoint
ALTER TABLE "roadmaps" ADD COLUMN "started_on" date;--> statement-breakpoint
ALTER TABLE "milestones" DROP COLUMN "deadline";