ALTER TABLE "roadmap_to_milestone" ALTER COLUMN "order" SET DATA TYPE smallint;--> statement-breakpoint
ALTER TABLE "roadmaps" ALTER COLUMN "goal" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN "user_id" varchar(25);--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "resource_to_milestone" ADD COLUMN "added_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "roadmaps" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "user_id" varchar(25);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;