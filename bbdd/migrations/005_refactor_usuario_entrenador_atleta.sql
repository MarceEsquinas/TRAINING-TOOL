BEGIN;

-- 1) Asegurar email en usuario como dato central del acceso.
ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS email VARCHAR(150);

UPDATE public.usuario
SET email = lower(trim(email))
WHERE email IS NOT NULL;

UPDATE public.usuario
SET email = 'usuario_' || id || '@local'
WHERE email IS NULL OR trim(email) = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_usuario_email'
      AND conrelid = 'public.usuario'::regclass
  ) THEN
    ALTER TABLE public.usuario
    ADD CONSTRAINT uq_usuario_email UNIQUE (email);
  END IF;
END $$;

ALTER TABLE public.usuario
ALTER COLUMN email SET NOT NULL;

-- 2) Backfill de entrenadores que todavía no tienen usuario asociado.
DO $$
DECLARE
    rec RECORD;
    new_user_id INTEGER;
BEGIN
    FOR rec IN
        SELECT e.id, e.correo, e.password_hash
        FROM public.entrenadores e
        WHERE e.usuario_id IS NULL
    LOOP
        INSERT INTO public.usuario (username, email, password_hash, rol)
        VALUES (
            'entrenador_' || rec.id,
            COALESCE(lower(trim(rec.correo)), 'entrenador_' || rec.id || '@local'),
            COALESCE(rec.password_hash, 'migration_placeholder'),
            'ENTRENADOR'
        )
        RETURNING id INTO new_user_id;

        UPDATE public.entrenadores
        SET usuario_id = new_user_id
        WHERE id = rec.id;
    END LOOP;
END $$;

-- 3) Backfill de atletas que todavía no tienen usuario asociado.
DO $$
DECLARE
    rec RECORD;
    new_user_id INTEGER;
BEGIN
    FOR rec IN
        SELECT a.id, a.nombre
        FROM public.atleta a
        WHERE a.usuario_id IS NULL
    LOOP
        INSERT INTO public.usuario (username, email, password_hash, rol)
        VALUES (
            'atleta_' || rec.id,
            'atleta_' || rec.id || '@local',
            'migration_placeholder',
            'ATLETA'
        )
        RETURNING id INTO new_user_id;

        UPDATE public.atleta
        SET usuario_id = new_user_id
        WHERE id = rec.id;
    END LOOP;
END $$;

-- 4) Asegurar que el rol del usuario respete el perfil asociado.
UPDATE public.usuario u
SET rol = 'ENTRENADOR'
FROM public.entrenadores e
WHERE e.usuario_id = u.id
  AND u.rol <> 'ENTRENADOR';

UPDATE public.usuario u
SET rol = 'ATLETA'
FROM public.atleta a
WHERE a.usuario_id = u.id
  AND u.rol <> 'ATLETA';

-- 5) Forzar la relación 1:0..1 y evitar duplicación de usuario_id.
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_atleta_usuario_id'
      AND conrelid = 'public.atleta'::regclass
  ) THEN
    ALTER TABLE public.atleta
    ADD CONSTRAINT uq_atleta_usuario_id UNIQUE (usuario_id);
  END IF;
END $$;

ALTER TABLE public.entrenadores
ALTER COLUMN usuario_id SET NOT NULL;

ALTER TABLE public.atleta
ALTER COLUMN usuario_id SET NOT NULL;

-- 6) Eliminar datos legacy duplicados que pertenecen a usuario.
ALTER TABLE public.entrenadores DROP COLUMN IF EXISTS correo;
ALTER TABLE public.entrenadores DROP COLUMN IF EXISTS password_hash;

-- 7) Asegurar que la FK a usuario sea la única relación de identidad.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_entrenador_usuario'
      AND conrelid = 'public.entrenadores'::regclass
  ) THEN
    ALTER TABLE public.entrenadores
    ADD CONSTRAINT fk_entrenador_usuario
      FOREIGN KEY (usuario_id)
      REFERENCES public.usuario(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_atleta_usuario'
      AND conrelid = 'public.atleta'::regclass
  ) THEN
    ALTER TABLE public.atleta
    ADD CONSTRAINT fk_atleta_usuario
      FOREIGN KEY (usuario_id)
      REFERENCES public.usuario(id)
      ON DELETE CASCADE;
  END IF;
END $$;

COMMIT;
