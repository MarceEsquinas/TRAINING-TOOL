BEGIN;

-- 1) Añadir el campo leido en feedback_semanal de forma segura.
ALTER TABLE public.feedback_semanal
ADD COLUMN IF NOT EXISTS leido BOOLEAN NOT NULL DEFAULT FALSE;

-- 2) Si la tabla legacy existe, copiar el ultimo estado de lectura por semana.
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.tables
		WHERE table_schema = 'public'
			AND table_name = 'notificacion_feedback'
	) THEN
		WITH ultimo_estado AS (
			SELECT DISTINCT ON (nf.semana_id)
						 nf.semana_id,
						 COALESCE(nf.leido, false) AS leido
			FROM public.notificacion_feedback nf
			WHERE nf.semana_id IS NOT NULL
			ORDER BY nf.semana_id, nf.fecha_envio DESC, nf.id DESC
		)
		UPDATE public.feedback_semanal f
		SET leido = ue.leido
		FROM ultimo_estado ue
		WHERE ue.semana_id = f.semana_id;
	END IF;
END $$;

-- 3) Quitar automatismos legacy que intentan insertar en notificacion_feedback.
DROP TRIGGER IF EXISTS trg_notify_feedback_insert ON public.feedback_semanal;
DROP FUNCTION IF EXISTS public.fn_notify_feedback_insert();

-- 4) Índice para consultas de campana por no leidos.
CREATE INDEX IF NOT EXISTS idx_feedback_leido
ON public.feedback_semanal(leido);

-- 5) Retirar la tabla legacy.
DROP TABLE IF EXISTS public.notificacion_feedback;

COMMIT;