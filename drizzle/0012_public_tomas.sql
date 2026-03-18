ALTER TABLE "users" ADD COLUMN "active_until" timestamp;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "active_member";