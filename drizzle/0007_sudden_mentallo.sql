CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int,
	`title` varchar(180) NOT NULL,
	`detail` text NOT NULL,
	`tone` enum('orange','blue','green') NOT NULL DEFAULT 'blue',
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
