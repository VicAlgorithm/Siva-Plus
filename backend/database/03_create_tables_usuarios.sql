-- ====================================
-- SCRIPT 03: CREACIÓN DE TABLAS - ESQUEMA USUARIOS
-- ====================================

-- ====================================
-- TABLA: usuarios.tplan
-- ====================================
-- Tabla de planes de suscripción

CREATE TABLE IF NOT EXISTS usuarios.tplan (
    id_plan SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE usuarios.tplan IS 'Planes de suscripción disponibles';
COMMENT ON COLUMN usuarios.tplan.nombre IS 'Nombre del plan (Básico, Estándar, Premium)';

-- ====================================
-- TABLA: usuarios.tusuario
-- ====================================
-- Tabla de usuarios registrados

CREATE TABLE IF NOT EXISTS usuarios.tusuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    id_plan INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_plan) REFERENCES usuarios.tplan(id_plan) ON DELETE SET NULL
);

COMMENT ON TABLE usuarios.tusuario IS 'Usuarios registrados en la plataforma';
COMMENT ON COLUMN usuarios.tusuario.nombre IS 'Nombre personalizado del usuario';
COMMENT ON COLUMN usuarios.tusuario.correo IS 'Correo electrónico único';
COMMENT ON COLUMN usuarios.tusuario.telefono IS 'Número telefónico único para login';
COMMENT ON COLUMN usuarios.tusuario.contrasena IS 'Contraseña del usuario (debe encriptarse en producción)';
COMMENT ON COLUMN usuarios.tusuario.id_plan IS 'Plan de suscripción activo';

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_usuario_correo ON usuarios.tusuario(correo);
CREATE INDEX IF NOT EXISTS idx_usuario_telefono ON usuarios.tusuario(telefono);
CREATE INDEX IF NOT EXISTS idx_usuario_plan ON usuarios.tusuario(id_plan);

-- ====================================
-- TABLA: usuarios.tfavoritos
-- ====================================
-- Tabla para gestionar películas favoritas de usuarios

CREATE TABLE IF NOT EXISTS usuarios.tfavoritos (
    id_favorito SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    id_pelicula INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios.tusuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_pelicula) REFERENCES contenido.tpeliculas(id_pelicula) ON DELETE CASCADE,
    UNIQUE(id_usuario, id_pelicula)
);

COMMENT ON TABLE usuarios.tfavoritos IS 'Películas y series favoritas de cada usuario';
COMMENT ON COLUMN usuarios.tfavoritos.id_usuario IS 'ID del usuario';
COMMENT ON COLUMN usuarios.tfavoritos.id_pelicula IS 'ID de la película o serie';

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON usuarios.tfavoritos(id_usuario);
CREATE INDEX IF NOT EXISTS idx_favoritos_pelicula ON usuarios.tfavoritos(id_pelicula);
CREATE INDEX IF NOT EXISTS idx_favoritos_created ON usuarios.tfavoritos(created_at DESC);

-- ====================================
-- TABLA: usuarios.tnotificaciones
-- ====================================
-- Tabla para gestionar notificaciones de usuarios

CREATE TABLE IF NOT EXISTS usuarios.tnotificaciones (
    id_notificacion SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    mensaje TEXT NOT NULL,
    titulo_pelicula VARCHAR(255),
    id_pelicula INTEGER,
    leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios.tusuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_pelicula) REFERENCES contenido.tpeliculas(id_pelicula) ON DELETE SET NULL
);

COMMENT ON TABLE usuarios.tnotificaciones IS 'Notificaciones para usuarios';
COMMENT ON COLUMN usuarios.tnotificaciones.tipo IS 'Tipo de notificación (favorito_agregado, favorito_eliminado, etc.)';
COMMENT ON COLUMN usuarios.tnotificaciones.mensaje IS 'Mensaje de la notificación';
COMMENT ON COLUMN usuarios.tnotificaciones.leida IS 'Estado de lectura de la notificación';

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON usuarios.tnotificaciones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON usuarios.tnotificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at ON usuarios.tnotificaciones(created_at DESC);
