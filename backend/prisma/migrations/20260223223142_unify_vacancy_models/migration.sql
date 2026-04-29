/*
  Warnings:

  - You are about to drop the column `departamento` on the `job_vacancies` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `job_vacancies` table. All the data in the column will be lost.
  - You are about to drop the `job_vacancies_rh` table. If the table is not empty, all the data it contains will be lost.

*/
-- Step 1: Agregar columnas nuevas con valores por defecto
ALTER TABLE "job_vacancies" 
ADD COLUMN IF NOT EXISTS "departamento_id" TEXT,
ADD COLUMN IF NOT EXISTS "estatus" "VacancyStatus" NOT NULL DEFAULT 'Solicitada',
ADD COLUMN IF NOT EXISTS "requerimientos_tecnicos" JSONB,
ADD COLUMN IF NOT EXISTS "titulo" TEXT NOT NULL DEFAULT 'Vacante sin título';

-- Step 2: Actualizar titulo con nombrePuesto para registros existentes
UPDATE "job_vacancies" 
SET "titulo" = "nombrePuesto" 
WHERE "titulo" = 'Vacante sin título';

-- Step 3: Migrar datos de job_vacancies_rh a job_vacancies
-- Primero, actualizar los registros existentes en job_vacancies con datos de job_vacancies_rh si es necesario
-- (Este paso depende de cómo estén relacionados los datos, por ahora solo agregamos las columnas)

-- Step 4: Eliminar la restricción DEFAULT del campo titulo
ALTER TABLE "job_vacancies" 
ALTER COLUMN "titulo" DROP DEFAULT;

-- Step 5: Eliminar columnas antiguas
ALTER TABLE "job_vacancies" 
DROP COLUMN "departamento",
DROP COLUMN "status";

-- Step 6: Eliminar foreign keys de la tabla job_vacancies_rh
ALTER TABLE "candidates_rh" DROP CONSTRAINT IF EXISTS "candidates_rh_vacancy_id_fkey";
ALTER TABLE "job_vacancies_rh" DROP CONSTRAINT IF EXISTS "job_vacancies_rh_departamento_id_fkey";
ALTER TABLE "job_vacancies_rh" DROP CONSTRAINT IF EXISTS "job_vacancies_rh_solicitante_id_fkey";
ALTER TABLE "vacancy_comments" DROP CONSTRAINT IF EXISTS "vacancy_comments_vacancy_id_fkey";

-- Step 7: Migrar datos de job_vacancies_rh a job_vacancies
-- Insertar datos de job_vacancies_rh en job_vacancies
INSERT INTO "job_vacancies" (
  "id", "titulo", "fechaSolicitud", "solicitanteId", "nombrePuesto", 
  "departamento_id", "reportaA", "numeroVacantes", "motivoSolicitud", 
  "personaAReemplazar", "requiereLaptop", "requierePC", "requiereMovil", 
  "requiereExtension", "ubicacionFisica", "otrosRequerimientos", 
  "tipoContratacion", "candidatoPromocion", "cargoPromocion", "observaciones", 
  "entrevistadorTecnico", "entrevistadorRespaldo", "conocimientosExtra", 
  "requerimientos_tecnicos", "estatus", "fechaAutorizacion", "autorizadoPorId", 
  "voBoPorId", "createdAt", "updatedAt", "closedAt"
)
SELECT 
  jvr.id, 
  jvr.titulo, 
  jvr."createdAt" as "fechaSolicitud",
  jvr.solicitante_id as "solicitanteId",
  jvr.titulo as "nombrePuesto", -- Usar titulo como nombrePuesto temporalmente
  jvr.departamento_id,
  '' as "reportaA", -- Valor por defecto
  1 as "numeroVacantes", -- Valor por defecto
  'NUEVA_CREACION' as "motivoSolicitud", -- Valor por defecto
  NULL as "personaAReemplazar",
  false as "requiereLaptop",
  false as "requierePC",
  false as "requiereMovil",
  false as "requiereExtension",
  NULL as "ubicacionFisica",
  NULL as "otrosRequerimientos",
  'ADMINISTRATIVO' as "tipoContratacion", -- Valor por defecto
  NULL as "candidatoPromocion",
  NULL as "cargoPromocion",
  NULL as "observaciones",
  '' as "entrevistadorTecnico", -- Valor por defecto
  NULL as "entrevistadorRespaldo",
  NULL as "conocimientosExtra",
  jvr.requerimientos_tecnicos,
  jvr.estatus,
  NULL as "fechaAutorizacion",
  NULL as "autorizadoPorId",
  NULL as "voBoPorId",
  jvr."createdAt",
  jvr."updatedAt",
  NULL as "closedAt"
FROM "job_vacancies_rh" jvr
ON CONFLICT (id) DO NOTHING;

-- Step 8: Actualizar foreign keys de vacancy_comments para apuntar a job_vacancies
UPDATE "vacancy_comments" vc
SET "vacancy_id" = jvr.id
FROM "job_vacancies_rh" jvr
WHERE vc.vacancy_id = jvr.id;

-- Step 9: Actualizar foreign keys de candidates_rh para apuntar a job_vacancies
UPDATE "candidates_rh" cr
SET "vacancy_id" = jvr.id
FROM "job_vacancies_rh" jvr
WHERE cr.vacancy_id = jvr.id;

-- Step 10: Eliminar la tabla job_vacancies_rh
DROP TABLE "job_vacancies_rh";

-- Step 11: Eliminar el enum JobVacancyStatus que ya no se usa
DROP TYPE IF EXISTS "JobVacancyStatus";

-- Step 12: Agregar foreign keys
ALTER TABLE "job_vacancies" 
ADD CONSTRAINT "job_vacancies_departamento_id_fkey" 
FOREIGN KEY ("departamento_id") 
REFERENCES "departments"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;

ALTER TABLE "vacancy_comments" 
ADD CONSTRAINT "vacancy_comments_vacancy_id_fkey" 
FOREIGN KEY ("vacancy_id") 
REFERENCES "job_vacancies"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

ALTER TABLE "candidates_rh" 
ADD CONSTRAINT "candidates_rh_vacancy_id_fkey" 
FOREIGN KEY ("vacancy_id") 
REFERENCES "job_vacancies"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;
