-- ====================================
-- SCRIPT 05: DATOS INICIALES
-- ====================================

-- ====================================
-- DATOS: contenido.seriepeli
-- ====================================
-- Tipos de contenido: Película o Serie

INSERT INTO contenido.seriepeli (id_tipo, nombre) VALUES
(1, 'Película'),
(2, 'Serie')
ON CONFLICT (nombre) DO NOTHING;

-- ====================================
-- DATOS: contenido.tgenero
-- ====================================
-- Géneros de películas y series

INSERT INTO contenido.tgenero (nombre) VALUES
('Acción'),
('Aventura'),
('Ciencia Ficción'),
('Comedia'),
('Drama'),
('Fantasía'),
('Terror'),
('Suspenso'),
('Romance'),
('Animación'),
('Documental'),
('Musical'),
('Crimen'),
('Misterio'),
('Guerra'),
('Western'),
('Biografía'),
('Historia'),
('Deportes'),
('Familiar')
ON CONFLICT (nombre) DO NOTHING;

-- ====================================
-- DATOS: usuarios.tplan
-- ====================================
-- Planes de suscripción disponibles

INSERT INTO usuarios.tplan (id_plan, nombre) VALUES
(1, 'Básico'),
(2, 'Premium')
ON CONFLICT (nombre) DO NOTHING;

-- ====================================
-- RESTABLECER SECUENCIAS
-- ====================================
-- Asegurar que las secuencias empiecen en el número correcto

SELECT setval('contenido.seriepeli_id_tipo_seq', (SELECT MAX(id_tipo) FROM contenido.seriepeli));
SELECT setval('contenido.tgenero_id_genero_seq', (SELECT MAX(id_genero) FROM contenido.tgenero));
SELECT setval('usuarios.tplan_id_plan_seq', (SELECT MAX(id_plan) FROM usuarios.tplan));

-- ====================================
-- VERIFICACIÓN
-- ====================================

SELECT 'Tipos de contenido insertados:' AS mensaje, COUNT(*) AS total FROM contenido.seriepeli
UNION ALL
SELECT 'Géneros insertados:' AS mensaje, COUNT(*) AS total FROM contenido.tgenero
UNION ALL
SELECT 'Planes insertados:' AS mensaje, COUNT(*) AS total FROM usuarios.tplan;
