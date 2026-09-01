CREATE TABLE `equipmentCatalogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`code` varchar(80) NOT NULL,
	`name` varchar(180) NOT NULL,
	`category` varchar(120) NOT NULL DEFAULT 'Porta industrial',
	`manufacturer` varchar(120),
	`model` varchar(120),
	`description` text,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipmentCatalogs_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipmentCatalogs_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `equipment` ADD `catalogId` int;--> statement-breakpoint
ALTER TABLE `equipment` ADD `installationLocation` varchar(180);