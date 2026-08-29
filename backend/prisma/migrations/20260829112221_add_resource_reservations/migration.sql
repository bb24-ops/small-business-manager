-- CreateTable
CREATE TABLE `Reservation` (
    `id` CHAR(36) NOT NULL,
    `taskId` CHAR(36) NOT NULL,
    `resourceId` CHAR(36) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Reservation_resourceId_startsAt_endsAt_idx`(`resourceId`, `startsAt`, `endsAt`),
    INDEX `Reservation_taskId_idx`(`taskId`),
    INDEX `Reservation_startsAt_idx`(`startsAt`),
    UNIQUE INDEX `Reservation_taskId_resourceId_key`(`taskId`, `resourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
