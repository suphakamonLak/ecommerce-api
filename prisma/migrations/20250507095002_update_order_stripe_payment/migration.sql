-- AlterTable
ALTER TABLE `order` ADD COLUMN `amount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'thb',
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    ADD COLUMN `stripePaymentId` VARCHAR(191) NOT NULL DEFAULT '';
