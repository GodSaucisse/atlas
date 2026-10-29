CREATE TABLE `admins` (
	`slot` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "admin_slot" CHECK("admins"."slot" IN ('owner', 'editor'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_email_unique` ON `admins` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `admins_user_id_unique` ON `admins` (`user_id`);--> statement-breakpoint
CREATE TABLE `albums` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`at` text NOT NULL,
	`actor_id` text NOT NULL,
	`actor_name` text NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`before_json` text,
	`after_json` text,
	`revision` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_revision` ON `audit` (`revision`);--> statement-breakpoint
CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cards_code_unique` ON `cards` (`code`);--> statement-breakpoint
CREATE TABLE `catalog_meta` (
	`id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`last_mutation` text NOT NULL
);
