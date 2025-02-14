CREATE TABLE "resource_to_milestone" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_id" varchar(25) NOT NULL,
	"milestone_id" varchar(25) NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_milestone_resource" UNIQUE("resource_id","milestone_id")
);
--> statement-breakpoint
CREATE TABLE "roadmap_to_milestone" (
	"id" serial PRIMARY KEY NOT NULL,
	"roadmap_id" varchar(25) NOT NULL,
	"milestone_id" varchar(25) NOT NULL,
	CONSTRAINT "unique_roadmap_milestone" UNIQUE("roadmap_id","milestone_id")
);
--> statement-breakpoint
ALTER TABLE "resource_to_milestone" ADD CONSTRAINT "resource_to_milestone_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_to_milestone" ADD CONSTRAINT "resource_to_milestone_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_to_milestone" ADD CONSTRAINT "roadmap_to_milestone_roadmap_id_roadmaps_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmaps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_to_milestone" ADD CONSTRAINT "roadmap_to_milestone_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE cascade ON UPDATE no action;