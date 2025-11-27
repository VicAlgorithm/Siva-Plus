const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ====================================
// OBTENER TODOS LOS PLANES DISPONIBLES
// ====================================

router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM usuarios.planes WHERE activo = TRUE ORDER BY precio ASC'
        );

        const planes = result.rows;

        // Las características ya vienen como JSONB en PostgreSQL, no necesitan parse

        res.json({
            success: true,
            planes
        });
    } catch (error) {
        console.error('Error al obtener planes:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener planes',
            error: error.message
        });
    }
});

// ====================================
// OBTENER PLAN POR ID
// ====================================

router.get('/:id', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM usuarios.planes WHERE id_plan = $1 AND activo = TRUE',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Plan no encontrado'
            });
        }

        const plan = result.rows[0];
        // Las características ya vienen como JSONB en PostgreSQL

        res.json({
            success: true,
            plan
        });
    } catch (error) {
        console.error('Error al obtener plan:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener plan',
            error: error.message
        });
    }
});

// ====================================
// ACTUALIZAR PLAN POR ID
// ====================================

router.put('/:id', async (req, res) => {
    const { nombre, descripcion, precio, caracteristicas } = req.body;

    try {
        const result = await db.query(
            'UPDATE usuarios.planes SET nombre = $1, descripcion = $2, precio = $3, caracteristicas = $4, updated_at = CURRENT_TIMESTAMP WHERE id_plan = $5 RETURNING *',
            [nombre, descripcion, precio, JSON.stringify(caracteristicas), req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Plan no encontrado'
            });
        }

        res.json({
            success: true,
            mensaje: 'Plan actualizado exitosamente',
            plan: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar plan:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar plan',
            error: error.message
        });
    }
});

module.exports = router;
