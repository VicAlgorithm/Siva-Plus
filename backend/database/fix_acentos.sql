-- Eliminar todos los géneros y tipos existentes
DELETE FROM contenido.tgenero;
DELETE FROM contenido.seriepeli;
DELETE FROM usuarios.tplan;

-- Reinsertar con codificación correcta
INSERT INTO contenido.seriepeli (id_tipo, nombre) VALUES
(1, 'Pelicula'),
(2, 'Serie');

INSERT INTO contenido.tgenero (nombre) VALUES
('Accion'),
('Aventura'),
('Ciencia Ficcion'),
('Comedia'),
('Drama'),
('Fantasia'),
('Terror'),
('Suspenso'),
('Romance'),
('Animacion'),
('Documental'),
('Musical'),
('Crimen'),
('Misterio'),
('Guerra'),
('Western'),
('Biografia'),
('Historia'),
('Deportes'),
('Familiar');

INSERT INTO usuarios.tplan (id_plan, nombre) VALUES
(1, 'Basico'),
(2, 'Premium');

-- Verificar
SELECT * FROM contenido.tgenero ORDER BY nombre;
SELECT * FROM contenido.seriepeli ORDER BY id_tipo;
