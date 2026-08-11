-- Añade ENTRENADOR al enum rol_enum sin tocar los datos existentes.
-- IF NOT EXISTS evita error si ya se ejecutó antes.
ALTER TYPE rol_enum ADD VALUE IF NOT EXISTS 'ENTRENADOR';
