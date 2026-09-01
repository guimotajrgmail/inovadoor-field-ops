CREATE TABLE `mondaySimulatedItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`boardId` varchar(80) NOT NULL,
	`mondayItemId` varchar(80) NOT NULL,
	`name` varchar(180) NOT NULL,
	`status` varchar(80) NOT NULL,
	`columnsJson` text NOT NULL,
	`workOrderIdsJson` text NOT NULL,
	`lastSyncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mondaySimulatedItems_id` PRIMARY KEY(`id`)
);
