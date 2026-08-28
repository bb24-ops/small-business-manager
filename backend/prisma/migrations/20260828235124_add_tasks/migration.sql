-- CreateTable
CREATE TABLE `Task` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `dueAt` DATETIME(3) NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('TODO', 'IN_PROGRESS', 'DONE') NOT NULL DEFAULT 'TODO',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Task_status_idx`(`status`),
    INDEX `Task_priority_idx`(`priority`),
    INDEX `Task_dueAt_idx`(`dueAt`),
    INDEX `Task_title_idx`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
