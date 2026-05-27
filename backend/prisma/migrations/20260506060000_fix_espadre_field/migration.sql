-- AlterTable: Replace nombresPadres with esPadre (idempotente)
-- NOTA: esPadre ya fue creado en migration 20260506054308_add_employee_family_and_photo
-- Usamos IF NOT EXISTS/IF EXISTS para ser idempotentes

-- Eliminar nombresPadres si existe (puede no existir si ya se eliminó)
ALTER TABLE "employees" DROP COLUMN IF EXISTS "nombresPadres";

-- Agregar esPadre solo si NO existe (ya fue creado en migration anterior)
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "esPadre" BOOLEAN NOT NULL DEFAULT false;
