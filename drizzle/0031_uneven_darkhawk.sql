CREATE TABLE "workshop_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"attended" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workshops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"starting_at" timestamp with time zone NOT NULL,
	"ending_at" timestamp with time zone,
	"registration_opens_at" timestamp with time zone,
	"registration_closes_at" timestamp with time zone,
	"max_participants" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workshop_registrations" ADD CONSTRAINT "workshop_registrations_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_registrations" ADD CONSTRAINT "workshop_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workshop_registrations_workshop_user_unique" ON "workshop_registrations" USING btree ("workshop_id","user_id");--> statement-breakpoint
CREATE INDEX "workshop_registrations_workshop_id_idx" ON "workshop_registrations" USING btree ("workshop_id");