-- ====================================
-- SCRIPT MAESTRO: CREACIÓN COMPLETA DE LA BASE DE DATOS SIVA+
-- ====================================
-- Este script ejecuta todos los scripts de creación en el orden correcto
--
-- IMPORTANTE:
-- 1. El script 01 debe ejecutarse como superusuario de PostgreSQL
-- 2. Los demás scripts deben ejecutarse conectado a la base de datos 'sivaplus'
--
-- ORDEN DE EJECUCIÓN:
-- 1. Crear la base de datos (script 01)
-- 2. Conectarse a la base de datos: \c sivaplus
-- 3. Crear los esquemas (script 02)
-- 4. Crear las tablas de contenido (script 04) - PRIMERO porque usuarios depende de contenido
-- 5. Crear las tablas de usuarios (script 03)
-- 6. Insertar datos iniciales (script 05)
-- 7. Crear triggers de notificaciones (script 06)
--
-- ====================================

-- PASO 1: Ejecutar desde psql o pgAdmin como superusuario
\echo '====================================';
\echo 'PASO 1: Creando base de datos...';
\echo '====================================';
\i 01_create_database.sql

-- PASO 2: Conectarse a la base de datos
\echo '';
\echo '====================================';
\echo 'PASO 2: Conectando a sivaplus...';
\echo '====================================';
\c sivaplus

-- PASO 3: Crear esquemas
\echo '';
\echo '====================================';
\echo 'PASO 3: Creando esquemas...';
\echo '====================================';
\i 02_create_schemas.sql

-- PASO 4: Crear tablas de contenido (PRIMERO)
\echo '';
\echo '====================================';
\echo 'PASO 4: Creando tablas de contenido...';
\echo '====================================';
\i 04_create_tables_contenido.sql

-- PASO 5: Crear tablas de usuarios (DESPUÉS porque depende de contenido.tpeliculas)
\echo '';
\echo '====================================';
\echo 'PASO 5: Creando tablas de usuarios...';
\echo '====================================';
\i 03_create_tables_usuarios.sql

-- PASO 6: Insertar datos iniciales
\echo '';
\echo '====================================';
\echo 'PASO 6: Insertando datos iniciales...';
\echo '====================================';
\i 05_insert_data_inicial.sql

-- PASO 7: Crear triggers de notificaciones
\echo '';
\echo '====================================';
\echo 'PASO 7: Creando triggers de notificaciones...';
\echo '====================================';
\i 06_create_triggers_notificaciones.sql

-- VERIFICACIÓN FINAL
\echo '';
\echo '====================================';
\echo 'VERIFICACIÓN FINAL';
\echo '====================================';

-- Listar todos los esquemas
\dn

-- Listar todas las tablas por esquema
\echo '';
\echo 'Tablas en esquema contenido:';
\dt contenido.*;

\echo '';
\echo 'Tablas en esquema usuarios:';
\dt usuarios.*;

-- Contar registros en tablas de datos iniciales
\echo '';
\echo 'Datos iniciales insertados:';
SELECT 'Géneros' AS tabla, COUNT(*) AS registros FROM contenido.tgenero
UNION ALL
SELECT 'Tipos contenido' AS tabla, COUNT(*) AS registros FROM contenido.seriepeli
UNION ALL
SELECT 'Planes' AS tabla, COUNT(*) AS registros FROM usuarios.tplan;

\echo '';
\echo '====================================';
\echo 'BASE DE DATOS CREADA EXITOSAMENTE';
\echo '====================================';
