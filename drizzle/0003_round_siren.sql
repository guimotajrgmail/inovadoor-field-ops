CREATE TABLE `workOrderEvidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`workOrderId` int NOT NULL,
	`type` enum('foto','assinatura','documento') NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`latitude` varchar(32),
	`longitude` varchar(32),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workOrderEvidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `accessProfile` enum('gestao','terceiros','pessoas','campo','cliente') NOT NULL DEFAULT 'gestao';--> statement-breakpoint
ALTER TABLE `users` ADD `customerId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `thirdPartyId` int;