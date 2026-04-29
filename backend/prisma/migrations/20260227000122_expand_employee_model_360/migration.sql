/*
  Warnings:

  - You are about to drop the column `nombre` on the `employees` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clave]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "employees" DROP COLUMN "nombre",
ADD COLUMN     "apellidoMaterno" TEXT,
ADD COLUMN     "apellidoPaterno" TEXT,
ADD COLUMN     "area" TEXT,
ADD COLUMN     "banco" TEXT,
ADD COLUMN     "beneficiario1" TEXT,
ADD COLUMN     "beneficiario2" TEXT,
ADD COLUMN     "clabe" TEXT,
ADD COLUMN     "clave" TEXT,
ADD COLUMN     "contrato" TEXT,
ADD COLUMN     "correoElectronico" TEXT,
ADD COLUMN     "correoEmpresa" TEXT,
ADD COLUMN     "cpFiscal" TEXT,
ADD COLUMN     "direccionCompleta" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "estadoCivil" TEXT,
ADD COLUMN     "fechaBaja" TIMESTAMP(3),
ADD COLUMN     "fechaNacBeneficiario1" TIMESTAMP(3),
ADD COLUMN     "fechaNacBeneficiario2" TIMESTAMP(3),
ADD COLUMN     "fechaNacimiento" TIMESTAMP(3),
ADD COLUMN     "horario" TEXT,
ADD COLUMN     "lugarNacimiento" TEXT,
ADD COLUMN     "nacionalidad" TEXT,
ADD COLUMN     "nivelAcademico" TEXT,
ADD COLUMN     "nombreConyuge" TEXT,
ADD COLUMN     "nombres" TEXT,
ADD COLUMN     "numeroCuenta" TEXT,
ADD COLUMN     "porcentaje1" DOUBLE PRECISION,
ADD COLUMN     "porcentaje2" DOUBLE PRECISION,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "sexo" TEXT,
ADD COLUMN     "sucursal" TEXT,
ADD COLUMN     "tallaCamisa" TEXT,
ADD COLUMN     "tallaPantalon" TEXT,
ADD COLUMN     "tallaPlayera" TEXT,
ADD COLUMN     "tallaZapatos" TEXT,
ADD COLUMN     "telefonoCasa" TEXT,
ADD COLUMN     "telefonoMovil" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "employees_clave_key" ON "employees"("clave");
