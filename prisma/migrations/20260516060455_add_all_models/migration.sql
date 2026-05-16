/*
  Warnings:

  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userNumber]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userNumber` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('SMALL_ASSET', 'MEDIUM_ASSET', 'LARGE_ASSET');

-- CreateEnum
CREATE TYPE "SupplierCategory" AS ENUM ('LOCAL', 'IMPORT');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "name",
ADD COLUMN     "telp" TEXT,
ADD COLUMN     "userName" TEXT NOT NULL,
ADD COLUMN     "userNumber" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "whNumber" TEXT NOT NULL,
    "whName" TEXT NOT NULL,
    "whLocation" TEXT,
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_bins" (
    "id" TEXT NOT NULL,
    "binAddress" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "remarks" TEXT,
    "warehouseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_bins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "supNumber" TEXT NOT NULL,
    "supName" TEXT NOT NULL,
    "supCategory" "SupplierCategory" NOT NULL DEFAULT 'LOCAL',
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "assetNumber" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "supplierId" TEXT,
    "storageBinId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_whNumber_key" ON "warehouses"("whNumber");

-- CreateIndex
CREATE UNIQUE INDEX "storage_bins_binAddress_key" ON "storage_bins"("binAddress");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_supNumber_key" ON "suppliers"("supNumber");

-- CreateIndex
CREATE UNIQUE INDEX "assets_assetNumber_key" ON "assets"("assetNumber");

-- CreateIndex
CREATE UNIQUE INDEX "assets_storageBinId_key" ON "assets"("storageBinId");

-- CreateIndex
CREATE UNIQUE INDEX "users_userNumber_key" ON "users"("userNumber");

-- AddForeignKey
ALTER TABLE "storage_bins" ADD CONSTRAINT "storage_bins_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_storageBinId_fkey" FOREIGN KEY ("storageBinId") REFERENCES "storage_bins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
