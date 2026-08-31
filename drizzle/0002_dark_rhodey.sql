CREATE TABLE `customerTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`customerId` int NOT NULL,
	`equipmentId` int,
	`externalId` varchar(80) NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text,
	`priority` enum('baixa','media','alta') NOT NULL DEFAULT 'media',
	`status` enum('novo','em_triagem','convertido_em_os','cancelado') NOT NULL DEFAULT 'novo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerTickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `customerTickets_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `serviceFormTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`category` enum('atendimento','instalacao') NOT NULL,
	`description` text,
	`fieldsJson` text NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `serviceFormTemplates_id` PRIMARY KEY(`id`)
);
