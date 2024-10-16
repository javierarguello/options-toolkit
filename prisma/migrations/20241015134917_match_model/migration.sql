/*
  Warnings:

  - You are about to drop the column `quantity` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Trade` table. All the data in the column will be lost.
  - Added the required column `strike` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "quantity",
DROP COLUMN "status",
ADD COLUMN     "contracts" INTEGER,
ADD COLUMN     "exitPrice" DOUBLE PRECISION,
ADD COLUMN     "expirationDate" TIMESTAMP(3),
ADD COLUMN     "stockPrice" DOUBLE PRECISION,
ADD COLUMN     "strike" DOUBLE PRECISION NOT NULL;
