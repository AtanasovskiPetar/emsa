CREATE TABLE "registration_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"url" varchar(2048) NOT NULL,
	"filename" varchar(500) NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registration_certificates_registration_id_unique" UNIQUE("registration_id")
);
--> statement-breakpoint
ALTER TABLE "registration_certificates" ADD CONSTRAINT "registration_certificates_registration_id_project_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."project_registrations"("id") ON DELETE cascade ON UPDATE no action;