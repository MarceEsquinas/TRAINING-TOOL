BEGIN;

-- 1) Aseguramos que el usuario tenga email para identidad/autenticación.
ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS email VARCHAR(150);

-- 2) Rellenamos email para usuarios existentes cuando haya dato útil en entrenador.
UPDATE public.usuario u
SET email = e.correo
FROM public.entrenadores e
WHERE e.usuario_id = u.id
  AND u.email IS NULL
  AND e.correo IS NOT NULL;

-- 3) Garantizamos unicidad de email en usuario para evitar duplicados de identidad.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'usuario'
      AND indexname = 'idx_usuario_email'
  ) THEN
    CREATE UNIQUE INDEX idx_usuario_email ON public.usuario(email);
  END IF;
END $$;

-- 4) Migración segura: si la tabla entrenador todavía tiene password_hash o correo, los dejamos intactos temporalmente.
-- En una base ya migrada, no los usamos para autenticación; los datos funcionales deben venir de usuario.

-- 5) Si algún entrenador todavía no tiene usuario asociado, dejamos la relación como opcional (NULLABLE).
-- La clave de negocio es que un entrenador siempre debe pertenecer a un usuario si existe, pero no forzamos un backfill automático a nivel de BD.

-- 6) Aseguramos que los entrenadores con usuario_id no tengan duplicados.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_entrenadores_usuario_id'
      AND conrelid = 'public.entrenadores'::regclass
  ) THEN
    ALTER TABLE public.entrenadores
      ADD CONSTRAINT uq_entrenadores_usuario_id UNIQUE (usuario_id);
  END IF;
END $$;

-- 7) Añadimos la FK a usuario si no existía.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_entrenadores_usuario'
      AND conrelid = 'public.entrenadores'::regclass
  ) THEN
    ALTER TABLE public.entrenadores
      ADD CONSTRAINT fk_entrenadores_usuario
      FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;

