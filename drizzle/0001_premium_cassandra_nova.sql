CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`document` varchar(30),
	`city` varchar(100),
	`state` varchar(2),
	`address` text,
	`contactName` varchar(160),
	`contactEmail` varchar(320),
	`contactPhone` varchar(40),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `equipment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`customerId` int,
	`code` varchar(80) NOT NULL,
	`name` varchar(180) NOT NULL,
	`model` varchar(120),
	`serialNumber` varchar(120),
	`state` enum('operacional','manutencao','atencao','baixado') NOT NULL DEFAULT 'operacional',
	`installedAt` timestamp,
	`lastMaintenanceAt` timestamp,
	`nextMaintenanceAt` timestamp,
	`qrCode` varchar(160),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `integrationConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`provider` enum('monday','maps','email') NOT NULL,
	`status` enum('pendente','conectado','erro') NOT NULL DEFAULT 'pendente',
	`workspaceId` varchar(120),
	`settingsJson` text,
	`lastSyncAt` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrationConnections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`segment` varchar(120) NOT NULL DEFAULT 'Portas industriais',
	`plan` varchar(60) NOT NULL DEFAULT 'enterprise',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `teamMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(40),
	`profile` enum('gestao','coordenacao','campo','terceiro') NOT NULL DEFAULT 'campo',
	`area` varchar(120) NOT NULL DEFAULT 'Operações de campo',
	`status` enum('ativo','pendente','inativo') NOT NULL DEFAULT 'ativo',
	`lastAccessAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teamMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `thirdParties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`document` varchar(30),
	`region` varchar(100),
	`contactName` varchar(160),
	`contactEmail` varchar(320),
	`status` enum('homologado','em_revisao','bloqueado') NOT NULL DEFAULT 'em_revisao',
	`slaPercent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `thirdParties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workOrderEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workOrderId` int NOT NULL,
	`actorUserId` int,
	`type` varchar(80) NOT NULL,
	`payloadJson` text,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workOrderEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`customerId` int,
	`equipmentId` int,
	`assignedMemberId` int,
	`assignedThirdPartyId` int,
	`externalId` varchar(80) NOT NULL,
	`title` varchar(180) NOT NULL,
	`serviceType` varchar(120) NOT NULL,
	`priority` enum('baixa','media','alta') NOT NULL DEFAULT 'media',
	`status` enum('rascunho','agendada','em_campo','aguardando_peca','em_aprovacao','concluida','cancelada') NOT NULL DEFAULT 'rascunho',
	`scheduledAt` timestamp,
	`checkInAt` timestamp,
	`checkOutAt` timestamp,
	`latitude` varchar(32),
	`longitude` varchar(32),
	`address` text,
	`checklistJson` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `workOrders_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `accessProfile` enum('gestao','terceiros','pessoas','campo') DEFAULT 'gestao' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `organizationId` int;