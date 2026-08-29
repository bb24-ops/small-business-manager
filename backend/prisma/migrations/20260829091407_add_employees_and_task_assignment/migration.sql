-- AlterTable
ALTER TABLE `Task` ADD COLUMN `employeeId` CHAR(36) NULL;

-- CreateTable
CREATE TABLE `Employee` (
    `id` CHAR(36) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `position` VARCHAR(120) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Employee_email_key`(`email`),
    INDEX `Employee_status_idx`(`status`),
    INDEX `Employee_lastName_firstName_idx`(`lastName`, `firstName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Task_employeeId_idx` ON `Task`(`employeeId`);

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
