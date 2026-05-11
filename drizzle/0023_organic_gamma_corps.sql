ALTER TABLE "projects" ADD COLUMN "ending_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "active_members_only" boolean DEFAULT false NOT NULL;