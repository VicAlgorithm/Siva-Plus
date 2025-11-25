-- ====================================
-- SCRIPT 06: TRIGGERS Y FUNCIONES PARA NOTIFICACIONES
-- ====================================

-- ====================================
-- FUNCIÓN TRIGGER: Cuando se AGREGA una película a favoritos
-- ====================================
CREATE OR REPLACE FUNCTION usuarios.notificar_favorito_agregado()
RETURNS TRIGGER AS $$
DECLARE
    v_titulo_pelicula VARCHAR(255);
BEGIN
    -- Obtener el título de la película
    SELECT titulo INTO v_titulo_pelicula
    FROM contenido.tpeliculas
    WHERE id_pelicula = NEW.id_pelicula;

    -- Insertar notificación
    INSERT INTO usuarios.tnotificaciones (id_usuario, tipo, mensaje, titulo_pelicula, id_pelicula)
    VALUES (
        NEW.id_usuario,
        'favorito_agregado',
        'Has agregado "' || v_titulo_pelicula || '" a tu lista',
        v_titulo_pelicula,
        NEW.id_pelicula
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION usuarios.notificar_favorito_agregado() IS 'Función que crea una notificación cuando un usuario agrega una película a favoritos';

-- ====================================
-- FUNCIÓN TRIGGER: Cuando se ELIMINA una película de favoritos
-- ====================================
CREATE OR REPLACE FUNCTION usuarios.notificar_favorito_eliminado()
RETURNS TRIGGER AS $$
DECLARE
    v_titulo_pelicula VARCHAR(255);
BEGIN
    -- Obtener el título de la película
    SELECT titulo INTO v_titulo_pelicula
    FROM contenido.tpeliculas
    WHERE id_pelicula = OLD.id_pelicula;

    -- Insertar notificación
    INSERT INTO usuarios.tnotificaciones (id_usuario, tipo, mensaje, titulo_pelicula, id_pelicula)
    VALUES (
        OLD.id_usuario,
        'favorito_eliminado',
        'Has quitado "' || v_titulo_pelicula || '" de tu lista',
        v_titulo_pelicula,
        OLD.id_pelicula
    );

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION usuarios.notificar_favorito_eliminado() IS 'Función que crea una notificación cuando un usuario elimina una película de favoritos';

-- ====================================
-- TRIGGERS
-- ====================================

-- Trigger: Después de INSERTAR en favoritos
DROP TRIGGER IF EXISTS trigger_favorito_agregado ON usuarios.tfavoritos;
CREATE TRIGGER trigger_favorito_agregado
AFTER INSERT ON usuarios.tfavoritos
FOR EACH ROW
EXECUTE FUNCTION usuarios.notificar_favorito_agregado();

COMMENT ON TRIGGER trigger_favorito_agregado ON usuarios.tfavoritos IS 'Trigger que se ejecuta después de agregar un favorito';

-- Trigger: Después de ELIMINAR de favoritos
DROP TRIGGER IF EXISTS trigger_favorito_eliminado ON usuarios.tfavoritos;
CREATE TRIGGER trigger_favorito_eliminado
AFTER DELETE ON usuarios.tfavoritos
FOR EACH ROW
EXECUTE FUNCTION usuarios.notificar_favorito_eliminado();

COMMENT ON TRIGGER trigger_favorito_eliminado ON usuarios.tfavoritos IS 'Trigger que se ejecuta después de eliminar un favorito';

-- ====================================
-- CONSULTAS ÚTILES (comentadas para referencia)
-- ====================================

-- Ver todas las notificaciones de un usuario
-- SELECT * FROM usuarios.tnotificaciones WHERE id_usuario = 1 ORDER BY created_at DESC;

-- Ver notificaciones no leídas de un usuario
-- SELECT * FROM usuarios.tnotificaciones WHERE id_usuario = 1 AND leida = FALSE ORDER BY created_at DESC;

-- Contar notificaciones no leídas
-- SELECT COUNT(*) FROM usuarios.tnotificaciones WHERE id_usuario = 1 AND leida = FALSE;

-- Marcar notificación como leída
-- UPDATE usuarios.tnotificaciones SET leida = TRUE WHERE id_notificacion = 1;

-- Marcar todas las notificaciones como leídas
-- UPDATE usuarios.tnotificaciones SET leida = TRUE WHERE id_usuario = 1;

-- Eliminar notificaciones antiguas (más de 30 días)
-- DELETE FROM usuarios.tnotificaciones WHERE created_at < NOW() - INTERVAL '30 days';
