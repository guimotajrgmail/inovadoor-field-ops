CREATE TABLE `installationPlanVisibility` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`planId` int NOT NULL,
	`teamMemberId` int NOT NULL,
	`state` enum('visivel','aceita','recusada') NOT NULL DEFAULT 'visivel',
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `installationPlanVisibility_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `installationPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`boardId` varchar(80) NOT NULL,
	`mondayItemId` varchar(80) NOT NULL,
	`title` varchar(240) NOT NULL,
	`mondayStatus` varchar(80),
	`status` enum('disponivel','aceita','em_execucao','concluida','cancelada') NOT NULL DEFAULT 'disponivel',
	`customerName` varchar(180),
	`location` varchar(240),
	`scheduledAt` timestamp,
	`acceptedByMemberId` int,
	`acceptedAt` timestamp,
	`workOrderId` int,
	`metadataJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `installationPlans_id` PRIMARY KEY(`id`),
	CONSTRAINT `installationPlans_mondayItemId_unique` UNIQUE(`mondayItemId`)
);
--> statement-breakpoint
CREATE TABLE `technicalRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`boardId` varchar(80) NOT NULL,
	`mondayItemId` varchar(80) NOT NULL,
	`title` varchar(240) NOT NULL,
	`status` enum('novo','triagem','agendado','em_execucao','concluido','cancelado') NOT NULL DEFAULT 'novo',
	`priority` enum('baixa','media','alta','critica') NOT NULL DEFAULT 'media',
	`customerName` varchar(180),
	`location` varchar(240),
	`equipment` varchar(180),
	`assignedMemberId` int,
	`assignedThirdPartyId` int,
	`workOrderId` int,
	`notes` text,
	`metadataJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `technicalRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `technicalRequests_mondayItemId_unique` UNIQUE(`mondayItemId`)
);
