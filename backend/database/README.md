# Scripts de Base de Datos - SIVA+

Este directorio contiene todos los scripts SQL necesarios para crear y configurar la base de datos de la plataforma SIVA+.

## Estructura de Archivos

Los scripts están numerados para ejecutarse en el orden correcto:

```
00_ejecutar_todo.sql          - Script maestro que ejecuta todos los demás
01_create_database.sql        - Crea la base de datos 'sivaplus'
02_create_schemas.sql         - Crea los esquemas 'contenido' y 'usuarios'
03_create_tables_usuarios.sql - Crea tablas del esquema usuarios
04_create_tables_contenido.sql - Crea tablas del esquema contenido
05_insert_data_inicial.sql    - Inserta datos iniciales (géneros, tipos, planes)
06_create_triggers_notificaciones.sql - Crea triggers para notificaciones
notificaciones.sql            - Archivo original (mantener como referencia)
```

## Orden de Ejecución

### Opción 1: Script Maestro (Recomendado)

Ejecutar desde la línea de comandos de PostgreSQL:

```bash
psql -U postgres -f 00_ejecutar_todo.sql
```

### Opción 2: Ejecución Manual

1. **Crear la base de datos** (como superusuario):
   ```bash
   psql -U postgres -f 01_create_database.sql
   ```

2. **Conectarse a la base de datos**:
   ```bash
   psql -U postgres -d sivaplus
   ```

3. **Ejecutar scripts en orden** (dentro de psql):
   ```sql
   \i 02_create_schemas.sql
   \i 04_create_tables_contenido.sql
   \i 03_create_tables_usuarios.sql
   \i 05_insert_data_inicial.sql
   \i 06_create_triggers_notificaciones.sql
   ```

### Opción 3: Usando pgAdmin

1. Abrir pgAdmin
2. Conectarse al servidor PostgreSQL
3. Clic derecho en "Databases" → "Create" → "Database"
4. Nombre: `sivaplus`
5. Abrir Query Tool
6. Abrir cada archivo `.sql` y ejecutarlo en orden

## Esquemas de la Base de Datos

### Esquema: `contenido`

Gestiona el catálogo de películas y series:

- **tgenero**: Géneros disponibles (Acción, Drama, etc.)
- **seriepeli**: Tipos de contenido (Película o Serie)
- **tpeliculas**: Catálogo principal de películas y series

### Esquema: `usuarios`

Gestiona usuarios y su información:

- **tplan**: Planes de suscripción (Básico, Estándar, Premium)
- **tusuario**: Usuarios registrados
- **tfavoritos**: Películas favoritas de cada usuario
- **tnotificaciones**: Notificaciones del sistema

## Datos Iniciales

El script `05_insert_data_inicial.sql` inserta:

- **20 géneros** de películas/series
- **2 tipos** de contenido (Película, Serie)
- **3 planes** de suscripción (Básico, Estándar, Premium)

## Triggers Automáticos

Los triggers creados en `06_create_triggers_notificaciones.sql`:

- **trigger_favorito_agregado**: Crea notificación al agregar favorito
- **trigger_favorito_eliminado**: Crea notificación al eliminar favorito

## Verificación

Para verificar que todo se creó correctamente:

```sql
-- Listar esquemas
\dn

-- Listar tablas por esquema
\dt contenido.*;
\dt usuarios.*;

-- Verificar datos iniciales
SELECT 'Géneros' AS tabla, COUNT(*) FROM contenido.tgenero
UNION ALL
SELECT 'Tipos' AS tabla, COUNT(*) FROM contenido.seriepeli
UNION ALL
SELECT 'Planes' AS tabla, COUNT(*) FROM usuarios.tplan;
```

## Notas Importantes

1. **Orden de creación**: Las tablas de `contenido` se crean ANTES que las de `usuarios` porque `tfavoritos` y `tnotificaciones` tienen referencias a `tpeliculas`.

2. **Contraseñas**: Las contraseñas actualmente se almacenan en texto plano. En producción, se debe implementar hashing (bcrypt, argon2, etc.).

3. **Permisos**: Asegúrate de tener permisos de superusuario para crear la base de datos.

4. **Backup**: Antes de ejecutar estos scripts en una base de datos existente, crea un backup:
   ```bash
   pg_dump -U postgres sivaplus > backup_sivaplus.sql
   ```

## Restauración desde Backup

Si necesitas restaurar:

```bash
psql -U postgres -d sivaplus -f backup_sivaplus.sql
```

## Conexión desde Node.js

La configuración de conexión en [config/db.js](../config/db.js):

```javascript
{
  host: 'localhost',
  port: 5432,
  database: 'sivaplus',
  user: 'postgres',
  password: 'tu_contraseña'
}
```

## Mantenimiento

### Limpiar notificaciones antiguas

```sql
-- Eliminar notificaciones de más de 30 días
DELETE FROM usuarios.tnotificaciones
WHERE created_at < NOW() - INTERVAL '30 days';
```

### Ver estadísticas

```sql
-- Total de usuarios por plan
SELECT p.nombre, COUNT(*) as total_usuarios
FROM usuarios.tusuario u
JOIN usuarios.tplan p ON u.id_plan = p.id_plan
GROUP BY p.nombre;

-- Películas más guardadas en favoritos
SELECT p.titulo, COUNT(*) as total_favoritos
FROM contenido.tpeliculas p
JOIN usuarios.tfavoritos f ON p.id_pelicula = f.id_pelicula
GROUP BY p.titulo
ORDER BY total_favoritos DESC
LIMIT 10;
```

## Soporte

Para dudas o problemas, revisa la documentación de PostgreSQL o contacta al equipo de desarrollo.
