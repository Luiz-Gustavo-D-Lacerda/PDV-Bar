-- CreateTable
CREATE TABLE "Configuracoes" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "dados" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracoes_pkey" PRIMARY KEY ("id")
);
