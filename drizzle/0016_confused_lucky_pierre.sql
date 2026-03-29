CREATE TABLE "project_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"attended" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "registration_opens_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "registration_closes_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "max_participants" integer;--> statement-breakpoint
ALTER TABLE "project_registrations" ADD CONSTRAINT "project_registrations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_registrations" ADD CONSTRAINT "project_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;