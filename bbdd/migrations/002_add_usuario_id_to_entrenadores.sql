BEGIN;

-- Añade la relación opcional entrenador -> usuario sin forzar backfill inmediato.
ALTER TABLE public.entrenadores
ADD COLUMN IF NOT EXISTS usuario_id INTEGER;

-- Relación 0..1: un entrenador puede no estar vinculado todavía; si lo está, un usuario no puede repetirse.
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
    WHERE conname = 'fk_entrenadores_usuario'
      AND conrelid = 'public.entrenadores'::regclass
  ) THEN
    ALTER TABLE public.entrenadores
    ADD CONSTRAINT fk_entrenadores_usuario
      FOREIGN KEY (usuario_id)
      REFERENCES public.usuario(id)
      ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;