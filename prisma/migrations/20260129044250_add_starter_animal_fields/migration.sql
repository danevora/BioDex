-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "isStarterAnimal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSystemUser" BOOLEAN NOT NULL DEFAULT false;
