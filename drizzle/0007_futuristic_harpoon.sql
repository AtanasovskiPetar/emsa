CREATE TABLE "organization" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"logo_url" varchar(2048),
	"background_image_url" varchar(2048),
	"about_us" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
