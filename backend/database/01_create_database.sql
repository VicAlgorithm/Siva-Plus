-- ====================================
-- SCRIPT 01: CREACIÓN DE LA BASE DE DATOS
-- ====================================

-- Crear la base de datos SIVA+
-- NOTA: Este comando debe ejecutarse fuera de una transacción
-- y con permisos de superusuario

-- Eliminar la base de datos si existe (CUIDADO: esto borra todos los datos)
-- DROP DATABASE IF EXISTS sivaplus;

-- Crear la base de datos
CREATE DATABASE sivaplus
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Spanish_Mexico.1252'
    LC_CTYPE = 'Spanish_Mexico.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE sivaplus IS 'Base de datos para la plataforma de streaming SIVA+';
