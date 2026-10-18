CREATE TABLE `customerTicketEvidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`ticketId` int NOT NULL,
	`type` enum('foto','video') NOT NULL,
	`fileName` varchar(180) NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerTicketEvidence_id` PRIMARY KEY(`id`)
);
