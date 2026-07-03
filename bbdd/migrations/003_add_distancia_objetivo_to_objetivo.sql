BEGIN;

-- Añade la distancia normalizada del objetivo sin forzar backfill sobre objetivos ya existentes.
ALTER TABLE public.objetivo
ADD COLUMN IF NOT EXISTS distancia_objetivo VARCHAR(80);

-- Índice simple para futuros filtros y agregaciones por distancia.
CREATE INDEX IF NOT EXISTS idx_objetivo_distancia_objetivo
ON public.objetivo(distancia_objetivo);

COMMIT;