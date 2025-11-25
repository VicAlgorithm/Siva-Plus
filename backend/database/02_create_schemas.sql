-- ====================================
-- SCRIPT 02: CREACIÓN DE ESQUEMAS
-- ====================================

-- Conectarse a la base de datos sivaplus antes de ejecutar este script
-- \c sivaplus

-- ====================================
-- ESQUEMA: usuarios
-- ====================================
-- Esquema para gestionar usuarios, planes, favoritos y notificaciones

CREATE SCHEMA IF NOT EXISTS usuarios AUTHORIZATION postgres;

COMMENT ON SCHEMA usuarios IS 'Esquema para gestionar usuarios, autenticación, planes y favoritos';

-- ====================================
-- ESQUEMA: contenido
-- ====================================
-- Esquema para gestionar películas, series, géneros y tipos

CREATE SCHEMA IF NOT EXISTS contenido AUTHORIZATION postgres;

COMMENT ON SCHEMA contenido IS 'Esquema para gestionar el contenido de películas y series';
