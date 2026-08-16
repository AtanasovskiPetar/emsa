CREATE TYPE "public"."member_field_type" AS ENUM('TEXT', 'NUMBER');--> statement-breakpoint
CREATE TABLE "member_field_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(64) NOT NULL,
	"label" varchar(255) NOT NULL,
	"type" "member_field_type" DEFAULT 'TEXT' NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"suggestions" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_field_definitions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL;