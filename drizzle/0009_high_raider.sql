CREATE TABLE `customerContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`customerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`phone` varchar(40),
	`email` varchar(320),
	`isPrimary` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customerSegments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerSegments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `equipmentCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `equipmentCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `equipmentManufacturers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `equipmentManufacturers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `installationEnvironments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `installationEnvironments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `thirdPartyContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`thirdPartyId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`phone` varchar(40),
	`email` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `thirdPartyContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `contractNumber` varchar(60);--> statement-breakpoint
ALTER TABLE `customers` ADD `segmentId` int;--> statement-breakpoint
ALTER TABLE `equipment` ADD `environmentId` int;--> statement-breakpoint
ALTER TABLE `equipmentCatalogs` ADD `categoryId` int;--> statement-breakpoint
ALTER TABLE `equipmentCatalogs` ADD `manufacturerId` int;--> statement-breakpoint
ALTER TABLE `thirdParties` ADD `baseAddress` text;--> statement-breakpoint
ALTER TABLE `thirdParties` ADD `serviceRadiusKm` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `thirdParties` ADD `teamCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_contractNumber_unique` UNIQUE(`contractNumber`);