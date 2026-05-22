-- AlterTable
ALTER TABLE "SubPedido" ADD COLUMN     "motivoCancelamento" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissoes" JSONB NOT NULL DEFAULT '{}';
