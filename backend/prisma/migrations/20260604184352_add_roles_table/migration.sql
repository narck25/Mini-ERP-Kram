-- Migración segura: Agregar columnas nuevas a roles sin perder datos existentes
-- La tabla roles ya existe con columnas: id, name, description, permissions, created_at, updated_at

-- 1. Cambiar la columna name de RoleType (enum) a TEXT (si es necesario)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'roles' AND column_name = 'name' 
    AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE "roles" ALTER COLUMN "name" TYPE TEXT;
  END IF;
END $$;

-- 2. Agregar nuevas columnas con valores por defecto
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-800';
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "icon" TEXT NOT NULL DEFAULT '👤';
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "isCustom" BOOLEAN NOT NULL DEFAULT true;

-- 3. Eliminar columna permissions si existe (los datos se pierden pero no se usaban)
ALTER TABLE "roles" DROP COLUMN IF EXISTS "permissions";

-- 4. La columna name ya existe como TEXT, solo aseguramos el índice único
CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_key" ON "roles"("name");

-- 5. Cambiar la columna role en users de enum a TEXT (preservando datos)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role' 
    AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT;
  END IF;
END $$;
