-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "garcomId" TEXT;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_garcomId_fkey" FOREIGN KEY ("garcomId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
