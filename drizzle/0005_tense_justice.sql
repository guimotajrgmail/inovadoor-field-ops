CREATE TABLE `customFormDefinitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` text,
	`fieldsJson` text NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customFormDefinitions_id` PRIMARY KEY(`id`)
);
