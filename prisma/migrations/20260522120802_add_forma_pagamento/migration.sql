-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('PIX', 'CARTAO', 'DINHEIRO');

-- AlterTable
ALTER TABLE "Comanda" ADD COLUMN     "formaPagamento" "FormaPagamento",
ADD COLUMN     "pago" BOOLEAN NOT NULL DEFAULT false;
