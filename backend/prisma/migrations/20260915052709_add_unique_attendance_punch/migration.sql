-- Deduplicar registros de asistencia existentes antes de agregar la restricción de
-- unicidad: sin ella, "skipDuplicates" en createMany() no tenía nada que respaldarlo,
-- así que volver a subir el mismo CSV insertaba cada checada de nuevo. Esto conserva
-- un solo registro por (numeroEmpleado, fechaHora, tipo) -- el insertado primero --
-- y borra el resto antes de que la restricción pueda fallar por datos ya duplicados.
DELETE FROM "attendance_records" a
USING (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY "numeroEmpleado", "fechaHora", "tipo"
    ORDER BY "createdAt" ASC, id ASC
  ) AS rn
  FROM "attendance_records"
) dedup
WHERE a.id = dedup.id AND dedup.rn > 1;

-- AlterTable
CREATE UNIQUE INDEX "attendance_records_numeroEmpleado_fechaHora_tipo_key" ON "attendance_records"("numeroEmpleado", "fechaHora", "tipo");
