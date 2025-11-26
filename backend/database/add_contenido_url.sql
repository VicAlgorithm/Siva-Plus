-- Agregar columna contenido_url a la tabla tpeliculas
ALTER TABLE contenido.tpeliculas
ADD COLUMN IF NOT EXISTS contenido_url TEXT;

-- Verificar que se agregó correctamente
\d contenido.tpeliculas;
