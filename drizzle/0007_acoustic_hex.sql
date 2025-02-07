CREATE TABLE "resource_to_milestone" (
	"resource_id" varchar(25) NOT NULL,
	"milestone_id" varchar(25) NOT NULL,
	CONSTRAINT "resource_milestone_key" PRIMARY KEY("resource_id","milestone_id")
);
--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "user_id" varchar(25);--> statement-breakpoint
ALTER TABLE "roadmaps" ADD COLUMN "prerequisite" varchar(25);--> statement-breakpoint
ALTER TABLE "resource_to_milestone" ADD CONSTRAINT "resource_to_milestone_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_to_milestone" ADD CONSTRAINT "resource_to_milestone_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmap_prerequisite_fk" FOREIGN KEY ("prerequisite") REFERENCES "public"."roadmaps"("id") ON DELETE set null ON UPDATE no action;