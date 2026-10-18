ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordSalt` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `active` int DEFAULT 1 NOT NULL;