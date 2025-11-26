const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

// Importar la conexión a la base de datos
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ 
        mensaje: '🎬 Servidor de SIVA+ funcionando correctamente',
        version: '1.0.0',
        estado: 'Nodemon funciona perfectamente! 🚀'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Presiona Ctrl+C para detener el servidor`);
});

// Ruta para obtener géneros
app.get('/api/generos', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM contenido.tgenero ORDER BY nombre');
        res.json({
            success: true,
            generos: resultado.rows
        });
    } catch (error) {
        console.error('Error al obtener géneros:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener géneros' });
    }
});

// Ruta para obtener tipos (película/serie)
app.get('/api/tipos', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM contenido.seriepeli ORDER BY id_tipo');
        res.json({
            success: true,
            tipos: resultado.rows
        });
    } catch (error) {
        console.error('Error al obtener tipos:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener tipos' });
    }
});

// Ruta para obtener todas las películas
app.get('/api/peliculas', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT p.*, g.nombre as genero, t.nombre as tipo
            FROM contenido.tpeliculas p
            LEFT JOIN contenido.tgenero g ON p.id_genero = g.id_genero
            LEFT JOIN contenido.seriepeli t ON p.id_seriepeli = t.id_tipo
            ORDER BY p.created_at DESC
        `);
        res.json({
            success: true,
            total: resultado.rows.length,
            peliculas: resultado.rows
        });
    } catch (error) {
        console.error('Error al obtener películas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener las películas'
        });
    }
});

// Ruta para obtener contenido filtrado por tipo (1 = películas, 2 = series)
app.get('/api/peliculas/tipo/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await pool.query(`
            SELECT p.*, g.nombre as genero, t.nombre as tipo
            FROM contenido.tpeliculas p
            LEFT JOIN contenido.tgenero g ON p.id_genero = g.id_genero
            LEFT JOIN contenido.seriepeli t ON p.id_seriepeli = t.id_tipo
            WHERE p.id_seriepeli = $1
            ORDER BY p.created_at DESC
        `, [id]);
        res.json({
            success: true,
            total: resultado.rows.length,
            peliculas: resultado.rows
        });
    } catch (error) {
        console.error('Error al obtener contenido por tipo:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener el contenido'
        });
    }
});

// Ruta para AGREGAR una película nueva
app.post('/api/peliculas', async (req, res) => {
    try {
        const { titulo, director, sinopsis, imagen_url, contenido_url, anio, id_genero, id_seriepeli } = req.body;

        // Validar que vengan los datos obligatorios
        if (!titulo || !director || !sinopsis) {
            return res.status(400).json({
                success: false,
                mensaje: 'Título, director y sinopsis son obligatorios'
            });
        }

        // Insertar en la base de datos
        const resultado = await pool.query(
            'INSERT INTO contenido.tpeliculas (titulo, director, sinopsis, imagen_url, contenido_url, anio, id_genero, id_seriepeli) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [titulo, director, sinopsis, imagen_url, contenido_url, anio, id_genero, id_seriepeli]
        );
        
        res.json({
            success: true,
            mensaje: 'Película agregada exitosamente',
            pelicula: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al agregar película:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al agregar la película'
        });
    }
});

// Ruta para EDITAR una película existente
app.put('/api/peliculas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, director, sinopsis, imagen_url, contenido_url, anio, id_genero, id_seriepeli } = req.body;

        // Actualizar en la base de datos
        const resultado = await pool.query(
            'UPDATE contenido.tpeliculas SET titulo = $1, director = $2, sinopsis = $3, imagen_url = $4, contenido_url = $5, anio = $6, id_genero = $7, id_seriepeli = $8 WHERE id_pelicula = $9 RETURNING *',
            [titulo, director, sinopsis, imagen_url, contenido_url, anio, id_genero, id_seriepeli, id]
        );
        
        if (resultado.rows.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Película no encontrada'
            });
        }
        
        res.json({
            success: true,
            mensaje: 'Película actualizada exitosamente',
            pelicula: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al editar película:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al editar la película'
        });
    }
});

// Ruta para ELIMINAR una película
app.delete('/api/peliculas/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Eliminar de la base de datos
        const resultado = await pool.query(
            'DELETE FROM contenido.tpeliculas WHERE id_pelicula = $1 RETURNING *',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Película no encontrada'
            });
        }

        res.json({
            success: true,
            mensaje: 'Película eliminada exitosamente',
            pelicula: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al eliminar película:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar la película'
        });
    }
});

// ====================================
// RUTAS DE AUTENTICACIÓN
// ====================================

// Ruta para REGISTRAR un nuevo usuario
app.post('/api/auth/registro', async (req, res) => {
    try {
        const { nombre, correo, telefono, password } = req.body;

        // Validar que vengan los datos obligatorios
        if (!nombre || !correo || !telefono || !password) {
            return res.status(400).json({
                success: false,
                mensaje: 'Todos los campos son obligatorios'
            });
        }

        // Verificar si el correo ya existe
        const usuarioExistente = await pool.query(
            'SELECT * FROM usuarios.tusuario WHERE correo = $1',
            [correo]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'El correo ya está registrado'
            });
        }

        // Insertar el nuevo usuario (con plan básico por defecto: id_plan = 1)
        const resultado = await pool.query(
            'INSERT INTO usuarios.tusuario (nombre, correo, telefono, contrasena, id_plan) VALUES ($1, $2, $3, $4, 1) RETURNING id_usuario, nombre, correo, telefono, id_plan, created_at',
            [nombre, correo, telefono, password]
        );

        res.json({
            success: true,
            mensaje: 'Usuario registrado exitosamente',
            usuario: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al registrar el usuario'
        });
    }
});

// Ruta para hacer LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { telefono, password } = req.body;

        // Validar que vengan los datos obligatorios
        if (!telefono || !password) {
            return res.status(400).json({
                success: false,
                mensaje: 'Teléfono y contraseña son obligatorios'
            });
        }

        // Buscar el usuario por teléfono
        const resultado = await pool.query(
            'SELECT u.id_usuario, u.nombre, u.correo, u.telefono, u.contrasena, u.id_plan, u.created_at, p.nombre as plan_nombre FROM usuarios.tusuario u LEFT JOIN usuarios.tplan p ON u.id_plan = p.id_plan WHERE u.telefono = $1',
            [telefono]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        const usuario = resultado.rows[0];

        // Verificar la contraseña (sin encriptar por ahora)
        if (usuario.contrasena !== password) {
            return res.status(401).json({
                success: false,
                mensaje: 'Contraseña incorrecta'
            });
        }

        // Login exitoso - devolver datos del usuario (sin la contraseña)
        const { contrasena, ...usuarioSinPassword } = usuario;

        res.json({
            success: true,
            mensaje: 'Login exitoso',
            usuario: usuarioSinPassword
        });
    } catch (error) {
        console.error('Error al hacer login:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al hacer login'
        });
    }
});

// Ruta para obtener TODOS los usuarios (para el panel de control)
app.get('/api/usuarios', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT u.id_usuario, u.nombre, u.correo, u.telefono, u.id_plan, u.created_at, p.nombre as plan_nombre,
                   COUNT(f.id_pelicula) as total_favoritos
            FROM usuarios.tusuario u
            LEFT JOIN usuarios.tplan p ON u.id_plan = p.id_plan
            LEFT JOIN usuarios.tfavoritos f ON u.id_usuario = f.id_usuario
            GROUP BY u.id_usuario, u.nombre, u.correo, u.telefono, u.id_plan, u.created_at, p.nombre
            ORDER BY u.created_at DESC
        `);

        res.json({
            success: true,
            total: resultado.rows.length,
            usuarios: resultado.rows
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener los usuarios'
        });
    }
});

// ====================================
// RUTAS DE FAVORITOS
// ====================================

// Ruta para AGREGAR película a favoritos
app.post('/api/favoritos', async (req, res) => {
    try {
        const { id_usuario, id_pelicula } = req.body;

        if (!id_usuario || !id_pelicula) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de usuario e ID de película son obligatorios'
            });
        }

        // Insertar en favoritos
        const resultado = await pool.query(
            'INSERT INTO usuarios.tfavoritos (id_usuario, id_pelicula) VALUES ($1, $2) RETURNING *',
            [id_usuario, id_pelicula]
        );

        res.json({
            success: true,
            mensaje: 'Película agregada a favoritos',
            favorito: resultado.rows[0]
        });
    } catch (error) {
        // Si ya existe (violación de UNIQUE), devolver mensaje específico
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                mensaje: 'Esta película ya está en tus favoritos'
            });
        }
        console.error('Error al agregar favorito:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al agregar a favoritos'
        });
    }
});

// Ruta para QUITAR película de favoritos
app.delete('/api/favoritos/:id_usuario/:id_pelicula', async (req, res) => {
    try {
        const { id_usuario, id_pelicula } = req.params;

        const resultado = await pool.query(
            'DELETE FROM usuarios.tfavoritos WHERE id_usuario = $1 AND id_pelicula = $2 RETURNING *',
            [id_usuario, id_pelicula]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Favorito no encontrado'
            });
        }

        res.json({
            success: true,
            mensaje: 'Película quitada de favoritos'
        });
    } catch (error) {
        console.error('Error al quitar favorito:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al quitar de favoritos'
        });
    }
});

// Ruta para obtener TODOS los favoritos de un usuario
app.get('/api/favoritos/:id_usuario', async (req, res) => {
    try {
        const { id_usuario } = req.params;

        const resultado = await pool.query(`
            SELECT p.*, g.nombre as genero, t.nombre as tipo, f.created_at as fecha_favorito
            FROM usuarios.tfavoritos f
            INNER JOIN contenido.tpeliculas p ON f.id_pelicula = p.id_pelicula
            LEFT JOIN contenido.tgenero g ON p.id_genero = g.id_genero
            LEFT JOIN contenido.seriepeli t ON p.id_seriepeli = t.id_tipo
            WHERE f.id_usuario = $1
            ORDER BY f.created_at DESC
        `, [id_usuario]);

        res.json({
            success: true,
            total: resultado.rows.length,
            favoritos: resultado.rows
        });
    } catch (error) {
        console.error('Error al obtener favoritos:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener favoritos'
        });
    }
});

// Ruta para VERIFICAR si una película es favorita
app.get('/api/favoritos/check/:id_usuario/:id_pelicula', async (req, res) => {
    try {
        const { id_usuario, id_pelicula } = req.params;

        const resultado = await pool.query(
            'SELECT * FROM usuarios.tfavoritos WHERE id_usuario = $1 AND id_pelicula = $2',
            [id_usuario, id_pelicula]
        );

        res.json({
            success: true,
            esFavorito: resultado.rows.length > 0
        });
    } catch (error) {
        console.error('Error al verificar favorito:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al verificar favorito'
        });
    }
});

// ====================================
// RUTAS DE NOTIFICACIONES
// ====================================

// Ruta para obtener TODAS las notificaciones de un usuario
app.get('/api/notificaciones/:id_usuario', async (req, res) => {
    try {
        const { id_usuario } = req.params;

        const resultado = await pool.query(`
            SELECT * FROM usuarios.tnotificaciones
            WHERE id_usuario = $1
            ORDER BY created_at DESC
            LIMIT 50
        `, [id_usuario]);

        res.json({
            success: true,
            total: resultado.rows.length,
            notificaciones: resultado.rows
        });
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener notificaciones'
        });
    }
});

// Ruta para obtener notificaciones NO LEÍDAS de un usuario
app.get('/api/notificaciones/:id_usuario/no-leidas', async (req, res) => {
    try {
        const { id_usuario } = req.params;

        const resultado = await pool.query(`
            SELECT * FROM usuarios.tnotificaciones
            WHERE id_usuario = $1 AND leida = FALSE
            ORDER BY created_at DESC
        `, [id_usuario]);

        res.json({
            success: true,
            total: resultado.rows.length,
            notificaciones: resultado.rows
        });
    } catch (error) {
        console.error('Error al obtener notificaciones no leídas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener notificaciones no leídas'
        });
    }
});

// Ruta para MARCAR una notificación como leída
app.put('/api/notificaciones/:id_notificacion/leer', async (req, res) => {
    try {
        const { id_notificacion } = req.params;

        const resultado = await pool.query(
            'UPDATE usuarios.tnotificaciones SET leida = TRUE WHERE id_notificacion = $1 RETURNING *',
            [id_notificacion]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Notificación no encontrada'
            });
        }

        res.json({
            success: true,
            mensaje: 'Notificación marcada como leída',
            notificacion: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al marcar notificación como leída'
        });
    }
});

// Ruta para MARCAR TODAS las notificaciones como leídas
app.put('/api/notificaciones/:id_usuario/leer-todas', async (req, res) => {
    try {
        const { id_usuario } = req.params;

        const resultado = await pool.query(
            'UPDATE usuarios.tnotificaciones SET leida = TRUE WHERE id_usuario = $1 AND leida = FALSE RETURNING *',
            [id_usuario]
        );

        res.json({
            success: true,
            mensaje: `${resultado.rows.length} notificaciones marcadas como leídas`,
            total: resultado.rows.length
        });
    } catch (error) {
        console.error('Error al marcar todas las notificaciones como leídas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al marcar notificaciones como leídas'
        });
    }
});