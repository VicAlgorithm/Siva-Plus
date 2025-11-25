const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',           // ← Directamente
    host: 'localhost',          // ← Directamente
    database: 'siva_plus',      // ← Directamente
    password: 'admin',          // ← Directamente (tu contraseña real)
    port: 5432,                 // ← Directamente
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Error al conectar a PostgreSQL:', err.stack);
    }
    console.log('✅ Conectado a PostgreSQL exitosamente');
    release();
});

module.exports = pool;