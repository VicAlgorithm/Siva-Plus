-- ====================================
-- SCRIPT 04: CREACIÓN DE TABLAS - ESQUEMA CONTENIDO
-- ====================================

-- ====================================
-- TABLA: contenido.tgenero
-- ====================================
-- Tabla de géneros de películas y series

CREATE TABLE IF NOT EXISTS contenido.tgenero (
    id_genero SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

COMMENT ON TABLE contenido.tgenero IS 'Géneros de películas y series';
COMMENT ON COLUMN contenido.tgenero.nombre IS 'Nombre del género (Acción, Drama, Comedia, etc.)';

-- ====================================
-- TABLA: contenido.seriepeli
-- ====================================
-- Tabla para clasificar contenido como película o serie

CREATE TABLE IF NOT EXISTS contenido.seriepeli (
    id_tipo SERIAL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE
);

COMMENT ON TABLE contenido.seriepeli IS 'Tipos de contenido (Película o Serie)';
COMMENT ON COLUMN contenido.seriepeli.nombre IS 'Tipo: Película o Serie';

-- ====================================
-- TABLA: contenido.tpeliculas
-- ====================================
-- Tabla principal de películas y series

CREATE TABLE IF NOT EXISTS contenido.tpeliculas (
    id_pelicula SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    director VARCHAR(255) NOT NULL,
    sinopsis TEXT NOT NULL,
    imagen_url TEXT NOT NULL,
    anio INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_seriepeli INTEGER,
    id_genero INTEGER,
    es_favorito BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_genero) REFERENCES contenido.tgenero(id_genero),
    FOREIGN KEY (id_seriepeli) REFERENCES contenido.seriepeli(id_tipo)
);

COMMENT ON TABLE contenido.tpeliculas IS 'Catálogo de películas y series disponibles';
COMMENT ON COLUMN contenido.tpeliculas.titulo IS 'Título de la película o serie';
COMMENT ON COLUMN contenido.tpeliculas.director IS 'Director de la película o serie';
COMMENT ON COLUMN contenido.tpeliculas.sinopsis IS 'Sinopsis o descripción del contenido';
COMMENT ON COLUMN contenido.tpeliculas.imagen_url IS 'URL de la imagen de portada';
COMMENT ON COLUMN contenido.tpeliculas.anio IS 'Año de lanzamiento';
COMMENT ON COLUMN contenido.tpeliculas.id_seriepeli IS '1 = Película, 2 = Serie';
COMMENT ON COLUMN contenido.tpeliculas.id_genero IS 'ID del género';
COMMENT ON COLUMN contenido.tpeliculas.es_favorito IS 'Campo auxiliar para indicar si es favorito (se calcula dinámicamente)';

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_peliculas_titulo ON contenido.tpeliculas(titulo);
CREATE INDEX IF NOT EXISTS idx_peliculas_genero ON contenido.tpeliculas(id_genero);
CREATE INDEX IF NOT EXISTS idx_peliculas_tipo ON contenido.tpeliculas(id_seriepeli);
CREATE INDEX IF NOT EXISTS idx_peliculas_anio ON contenido.tpeliculas(anio DESC);
