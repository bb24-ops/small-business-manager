-- AlterTable
ALTER TABLE `Reservation` ADD COLUMN `quantity` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `Resource` ADD COLUMN `quantity` INTEGER NOT NULL DEFAULT 1;
