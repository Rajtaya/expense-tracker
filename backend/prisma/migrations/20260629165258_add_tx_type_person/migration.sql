-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('EXPENSE', 'GIVEN', 'RECEIVED');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "person" TEXT,
ADD COLUMN     "type" "TxType" NOT NULL DEFAULT 'EXPENSE';

-- CreateIndex
CREATE INDEX "Expense_type_idx" ON "Expense"("type");
