-- ====================================
-- SCRIPT PARA CORREGIR ACENTOS
-- ====================================
-- Este script actualiza los registros que tienen problemas de codificación

-- Actualizar géneros
UPDATE contenido.tgenero SET nombre = 'Acción' WHERE nombre LIKE '%cci_n%' OR nombre LIKE '%AcciÃ³n%';
UPDATE contenido.tgenero SET nombre = 'Ciencia Ficción' WHERE nombre LIKE '%FicciÃ³n%';
UPDATE contenido.tgenero SET nombre = 'Fantasía' WHERE nombre LIKE '%FantasÃ­a%';
UPDATE contenido.tgenero SET nombre = 'Animación' WHERE nombre LIKE '%AnimaciÃ³n%';
UPDATE contenido.tgenero SET nombre = 'Biografía' WHERE nombre LIKE '%BiografÃ­a%';

-- Actualizar tipos
UPDATE contenido.seriepeli SET nombre = 'Película' WHERE nombre LIKE '%PelÃ­cula%';

-- Actualizar planes
UPDATE usuarios.tplan SET nombre = 'Básico' WHERE nombre LIKE '%BÃ¡sico%';

-- Verificar resultados
SELECT 'Géneros actualizados:' AS mensaje;
SELECT id_genero, nombre FROM contenido.tgenero ORDER BY id_genero;

SELECT 'Tipos actualizados:' AS mensaje;
SELECT id_tipo, nombre FROM contenido.seriepeli ORDER BY id_tipo;

SELECT 'Planes actualizados:' AS mensaje;
SELECT id_plan, nombre FROM usuarios.tplan ORDER BY id_plan;
