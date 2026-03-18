ALTER TABLE "users" ADD COLUMN "student_index" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "year_of_studies" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_completed" boolean DEFAULT false NOT NULL;