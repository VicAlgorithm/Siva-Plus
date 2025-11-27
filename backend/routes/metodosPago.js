const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ====================================
// OBTENER MÉTODOS DE PAGO DEL USUARIO
// ====================================

router.get('/usuario/:id_usuario', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                id_metodo_pago,
                tipo,
                nombre_titular,
                ultimos_digitos,
                fecha_expiracion,
                es_principal,
                activo
            FROM usuarios.metodos_pago
            WHERE id_usuario = $1 AND activo = TRUE
            ORDER BY es_principal DESC, created_at DESC
        `, [req.params.id_usuario]);

        res.json({
            success: true,
            metodos_pago: result.rows
        });
    } catch (error) {
        console.error('Error al obtener métodos de pago:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener métodos de pago',
            error: error.message
        });
    }
});

// ====================================
// AGREGAR MÉTODO DE PAGO
// ====================================

router.post('/', async (req, res) => {
    const {
        id_usuario,
        tipo,
        nombre_titular,
        ultimos_digitos,
        fecha_expiracion,
        es_principal
    } = req.body;

    if (!id_usuario || !tipo || !nombre_titular) {
        return res.status(400).json({
            success: false,
            mensaje: 'Faltan datos requeridos'
        });
    }

    try {
        // Si es principal, desmarcar otros métodos como principales
        if (es_principal) {
            await db.query(
                'UPDATE usuarios.metodos_pago SET es_principal = FALSE WHERE id_usuario = $1',
                [id_usuario]
            );
        }

        const result = await db.query(`
            INSERT INTO usuarios.metodos_pago
            (id_usuario, tipo, nombre_titular, ultimos_digitos, fecha_expiracion, es_principal)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_metodo_pago
        `, [id_usuario, tipo, nombre_titular, ultimos_digitos, fecha_expiracion, es_principal || false]);

        res.json({
            success: true,
            mensaje: 'Método de pago agregado exitosamente',
            id_metodo_pago: result.rows[0].id_metodo_pago
        });
    } catch (error) {
        console.error('Error al agregar método de pago:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al agregar método de pago',
            error: error.message
        });
    }
});

// ====================================
// ESTABLECER MÉTODO DE PAGO COMO PRINCIPAL
// ====================================

router.put('/:id_metodo_pago/principal', async (req, res) => {
    const { id_usuario } = req.body;

    if (!id_usuario) {
        return res.status(400).json({
            success: false,
            mensaje: 'ID de usuario requerido'
        });
    }

    try {
        // Desmarcar todos como principales
        await db.query(
            'UPDATE usuarios.metodos_pago SET es_principal = FALSE WHERE id_usuario = $1',
            [id_usuario]
        );

        // Marcar el seleccionado como principal
        await db.query(
            'UPDATE usuarios.metodos_pago SET es_principal = TRUE WHERE id_metodo_pago = $1 AND id_usuario = $2',
            [req.params.id_metodo_pago, id_usuario]
        );

        res.json({
            success: true,
            mensaje: 'Método de pago establecido como principal'
        });
    } catch (error) {
        console.error('Error al actualizar método de pago:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar método de pago',
            error: error.message
        });
    }
});

// ====================================
// ELIMINAR MÉTODO DE PAGO
// ====================================

router.delete('/:id_metodo_pago', async (req, res) => {
    const { id_usuario } = req.body;

    if (!id_usuario) {
        return res.status(400).json({
            success: false,
            mensaje: 'ID de usuario requerido'
        });
    }

    try {
        // Marcar como inactivo en lugar de eliminar
        await db.query(
            'UPDATE usuarios.metodos_pago SET activo = FALSE WHERE id_metodo_pago = $1 AND id_usuario = $2',
            [req.params.id_metodo_pago, id_usuario]
        );

        res.json({
            success: true,
            mensaje: 'Método de pago eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar método de pago:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar método de pago',
            error: error.message
        });
    }
});

module.exports = router;
