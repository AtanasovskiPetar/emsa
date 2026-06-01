CREATE TABLE "project_capacity_pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"max_participants" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"capacity_pool_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"max_participants" integer,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_registrations" ADD COLUMN "package_id" uuid;--> statement-breakpoint
ALTER TABLE "project_capacity_pools" ADD CONSTRAINT "project_capacity_pools_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_packages" ADD CONSTRAINT "project_packages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_packages" ADD CONSTRAINT "project_packages_capacity_pool_id_project_capacity_pools_id_fk" FOREIGN KEY ("capacity_pool_id") REFERENCES "public"."project_capacity_pools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_registrations" ADD CONSTRAINT "project_registrations_package_id_project_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."project_packages"("id") ON DELETE set null ON UPDATE no action;