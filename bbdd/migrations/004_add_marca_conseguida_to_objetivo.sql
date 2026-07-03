BEGIN;

-- Registra la marca final conseguida por el atleta al cerrar el objetivo.
ALTER TABLE public.objetivo
ADD COLUMN IF NOT EXISTS marca_conseguida VARCHAR(120);

COMMIT;