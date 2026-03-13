CREATE TABLE "pillars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"director_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pillars" ADD CONSTRAINT "pillars_director_id_users_id_fk" FOREIGN KEY ("director_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;