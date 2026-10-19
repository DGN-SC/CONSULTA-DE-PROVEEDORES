require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();

// Configuración de CORS dinámica
app.use(cors({
    origin: '*', // En producción puedes cambiar '*' por la URL de tu frontend (ej. 'https://tu-usuario.github.io')
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configuración del Pool de MySQL (maneja múltiples conexiones de forma eficiente en hosts)
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tu_base_de_datos',
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false // Requerido por hosts como PlanetScale, Aiven o Supabase
};

const pool = mysql.createPool(dbConfig);

// Endpoint principal
app.post('/api/proveedores/consulta', async (req, res) => {
    try {
        const { ejercicio, nombre } = req.body;

        if (!ejercicio) {
            return res.status(400).json({ 
                ok: false, 
                message: 'El ejercicio fiscal es un campo obligatorio.' 
            });
        }

        // Consulta preparada
        const query = `
            SELECT 
                secretaria_opds_municipio, 
                oficio_autorizacion,
                ejercicio_fiscal, 
                monto_contrato, 
                nombre_obra, 
                fecha_firma_contrato,
                numero_contrato, 
                nombre_proveedor_contratista, 
                nombre_sec_muni_opd
            FROM formulario 
            WHERE nombre_proveedor_contratista LIKE ? 
              AND ejercicio_fiscal = ?
        `;

        const busquedaNombre = nombre ? `%${nombre}%` : '%';
        const [rows] = await pool.execute(query, [busquedaNombre, ejercicio]);

        return res.json({
            ok: true,
            total: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("Error en la Base de Datos:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al realizar la consulta en la base de datos."
        });
    }
});

// Endpoint para consulta solo por Nombre de Proveedor/Contratista
app.post('/api/proveedores/consulta-nombre', async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ 
                ok: false, 
                message: 'Debe ingresar el nombre del proveedor o contratista.' 
            });
        }

        const query = `
            SELECT 
                secretaria_opds_municipio, 
                oficio_autorizacion,
                ejercicio_fiscal, 
                monto_contrato, 
                nombre_obra, 
                fecha_firma_contrato,
                numero_contrato, 
                nombre_proveedor_contratista, 
                nombre_sec_muni_opd
            FROM formulario 
            WHERE nombre_proveedor_contratista LIKE ?
        `;

        const busquedaNombre = `%${nombre.trim()}%`;
        const [rows] = await pool.execute(query, [busquedaNombre]);

        return res.json({
            ok: true,
            total: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("Error en MySQL (Consulta Solo Nombre):", error);
        return res.status(500).json({
            ok: false,
            message: "Error al consultar la base de datos."
        });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
});