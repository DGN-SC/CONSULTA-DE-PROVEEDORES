// Configuración para entorno local
const BASE_URL = "http://localhost:4000";

const API_CONFIG = {
    BASE_URL: BASE_URL,
    PROVEEDORES_URL: `${BASE_URL}/api/proveedores/consulta`,
    PROVEEDORES_NOMBRE_URL: `${BASE_URL}/api/proveedores/consulta-nombre`
};

console.log("CONSULTA.JS: Conectado a API local en puerto 4000");

/**
 * CONSULTA 1: Ejercicio Fiscal + Nombre (Opcional)
 */
async function consultarProveedores(parametros) {
    try {
        const cuerpo = {
            ejercicio: Number(parametros.ejercicio),
            nombre: String(parametros.nombre || "").trim()
        };

        const respuesta = await axios.post(
            API_CONFIG.PROVEEDORES_URL,
            cuerpo,
            {
                headers: { "Content-Type": "application/json" },
                timeout: 30000
            }
        );

        return respuesta.data;
    } catch (error) {
        console.error("CONSULTA.JS: Error en consulta combinada:", error);
        if (error.response) {
            throw new Error(error.response.data?.message || "El backend devolvió un error.");
        }
        if (error.request) {
            throw new Error("No se pudo conectar con el servidor backend en http://localhost:4000.");
        }
        throw new Error("Error inesperado en la consulta.");
    }
}

/**
 * CONSULTA 2: Solo Nombre de Proveedor/Contratista
 */
async function consultarPorNombre(nombre) {
    try {
        const respuesta = await axios.post(
            API_CONFIG.PROVEEDORES_NOMBRE_URL,
            { nombre: String(nombre || "").trim() },
            {
                headers: { "Content-Type": "application/json" },
                timeout: 30000
            }
        );

        return respuesta.data;
    } catch (error) {
        console.error("CONSULTA.JS: Error en consulta por nombre:", error);
        if (error.response) {
            throw new Error(error.response.data?.message || "El backend devolvió un error.");
        }
        if (error.request) {
            throw new Error("No se pudo conectar con el servidor backend en http://localhost:4000.");
        }
        throw new Error("Error inesperado en la consulta.");
    }
}

// Exponer ambas funciones globalmente
window.API = {
    consultarProveedores,
    consultarPorNombre
};