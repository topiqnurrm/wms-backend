/*
  Warnings:

  - Added the required column `quantity` to the `asset_movements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "asset_movements" ADD COLUMN     "quantity" INTEGER NOT NULL;
