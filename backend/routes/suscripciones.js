const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ====================================
// OBTENER SUSCRIPCIÓN ACTIVA DEL USUARIO
// ====================================

router.get('/usuario/:id_usuario', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                s.id_suscripcion,
                s.fecha_inicio,
                s.fecha_fin,
                s.estado,
                s.auto_renovacion,
                p.id_plan,
                p.nombre AS nombre_plan,
                p.descripcion,
                p.precio,
                p.caracteristicas,
                (s.fecha_fin - CURRENT_DATE) AS dias_restantes
            FROM usuarios.suscripciones s
            JOIN usuarios.planes p ON s.id_plan = p.id_plan
            WHERE s.id_usuario = $1
            AND s.estado = 'activa'
            AND s.fecha_fin >= CURRENT_DATE
            ORDER BY s.fecha_fin DESC
            LIMIT 1
        `, [req.params.id_usuario]);

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                tiene_suscripcion: false,
                suscripcion: null
            });
        }

        const suscripcion = result.rows[0];
        // Las características ya vienen como JSONB

        res.json({
            success: true,
            tiene_suscripcion: true,
            suscripcion
        });
    } catch (error) {
        console.error('Error al obtener suscripción:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener suscripción',
            error: error.message
        });
    }
});

// ====================================
// CREAR NUEVA SUSCRIPCIÓN
// ====================================

router.post('/', async (req, res) => {
    const { id_usuario, id_plan, id_metodo_pago } = req.body;

    if (!id_usuario || !id_plan) {
        return res.status(400).json({
            success: false,
            mensaje: 'Faltan datos requeridos'
        });
    }

    try {
        // Llamar a la función almacenada
        const result = await db.query(
            'SELECT * FROM usuarios.sp_crear_suscripcion($1, $2, $3)',
            [id_usuario, id_plan, id_metodo_pago || null]
        );

        const output = result.rows[0];

        if (output.p_id_suscripcion) {
            res.json({
                success: true,
                mensaje: output.p_mensaje,
                id_suscripcion: output.p_id_suscripcion
            });
        } else {
            res.status(400).json({
                success: false,
                mensaje: output.p_mensaje
            });
        }
    } catch (error) {
        console.error('Error al crear suscripción:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear suscripción',
            error: error.message
        });
    }
});

// ====================================
// CANCELAR SUSCRIPCIÓN
// ====================================

router.put('/:id_suscripcion/cancelar', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM usuarios.sp_cancelar_suscripcion($1)',
            [req.params.id_suscripcion]
        );

        const output = result.rows[0];

        res.json({
            success: true,
            mensaje: output.p_mensaje
        });
    } catch (error) {
        console.error('Error al cancelar suscripción:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al cancelar suscripción',
            error: error.message
        });
    }
});

// ====================================
// ACTIVAR/DESACTIVAR AUTO-RENOVACIÓN
// ====================================

router.put('/:id_suscripcion/auto-renovacion', async (req, res) => {
    const { auto_renovacion } = req.body;

    try {
        await db.query(
            'UPDATE usuarios.suscripciones SET auto_renovacion = $1 WHERE id_suscripcion = $2',
            [auto_renovacion, req.params.id_suscripcion]
        );

        res.json({
            success: true,
            mensaje: auto_renovacion
                ? 'Auto-renovación activada'
                : 'Auto-renovación desactivada'
        });
    } catch (error) {
        console.error('Error al actualizar auto-renovación:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar auto-renovación',
            error: error.message
        });
    }
});

// ====================================
// OBTENER HISTORIAL DE SUSCRIPCIONES
// ====================================

router.get('/usuario/:id_usuario/historial', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                s.id_suscripcion,
                s.fecha_inicio,
                s.fecha_fin,
                s.estado,
                p.nombre AS nombre_plan,
                p.precio
            FROM usuarios.suscripciones s
            JOIN usuarios.planes p ON s.id_plan = p.id_plan
            WHERE s.id_usuario = $1
            ORDER BY s.fecha_inicio DESC
        `, [req.params.id_usuario]);

        res.json({
            success: true,
            historial: result.rows
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener historial',
            error: error.message
        });
    }
});

// ====================================
// OBTENER TODAS LAS SUSCRIPCIONES ACTIVAS
// ====================================

router.get('/activas', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                s.id_suscripcion,
                s.id_usuario,
                u.nombre AS nombre_usuario,
                u.correo AS email,
                s.fecha_inicio,
                s.fecha_fin AS fecha_vencimiento,
                s.estado,
                s.auto_renovacion,
                p.nombre AS nombre_plan,
                p.precio
            FROM usuarios.suscripciones s
            JOIN usuarios.tusuario u ON s.id_usuario = u.id_usuario
            JOIN usuarios.planes p ON s.id_plan = p.id_plan
            WHERE s.estado = 'activa'
            AND s.fecha_fin >= CURRENT_DATE
            AND s.id_plan = 2
            ORDER BY s.fecha_inicio DESC
        `);

        res.json({
            success: true,
            suscripciones: result.rows
        });
    } catch (error) {
        console.error('Error al obtener suscripciones activas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener suscripciones activas',
            error: error.message
        });
    }
});

module.exports = router;
