// ============================================================
// SISTEMA DE CONSULTA DE PROVEEDORES Y CONTRATISTAS - DGN
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("========================================");
    console.log("SIPC.JS: DOM cargado correctamente");
    console.log("========================================");

    inicializarAplicacion();
});

// Variables globales de almacenamiento
let ultimosResultados = [];

// ============================================================
// INICIALIZAR APLICACIÓN
// ============================================================
function inicializarAplicacion() {
    const paginaActual = window.location.pathname.split("/").pop();
    console.log("Página actual:", paginaActual);

    if (paginaActual === "prove.html" || paginaActual === "consulta.html" || paginaActual === "") {
        inicializarConsulta();
    }
}

// ============================================================
// INICIALIZAR CONSULTA
// ============================================================
function inicializarConsulta() {
    console.log("SIPC.JS: Inicializando módulo de consulta de proveedores...");

    // Formulario 1: Ejercicio + Nombre
    const frmConsulta = document.getElementById("frmConsulta");
    const btnLimpiar = document.getElementById("btnLimpiar");

    // Formulario 2: Solo Nombre
    const frmConsultaSoloNombre = document.getElementById("frmConsultaSoloNombre");
    const btnLimpiarNombre = document.getElementById("btnLimpiarNombre");

    // Otros elementos de interfaz
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    const btnExcel = document.getElementById("btnExcel");
    const btnPDF = document.getElementById("btnPDF");
    const btnPrint = document.getElementById("btnPrint");

    // Eventos Formulario 1
    if (frmConsulta) {
        frmConsulta.addEventListener("submit", ejecutarConsulta);
    }
    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", limpiarFormulario);
    }

    // Eventos Formulario 2 (Solo Nombre)
    if (frmConsultaSoloNombre) {
        frmConsultaSoloNombre.addEventListener("submit", ejecutarConsultaSoloNombre);
    }
    if (btnLimpiarNombre) {
        btnLimpiarNombre.addEventListener("click", limpiarFormulario);
    }

    // Eventos globales
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", cerrarSesion);
    }

    if (btnExcel) {
        btnExcel.addEventListener("click", exportarExcel);
    }

    if (btnPDF || btnPrint) {
        if (btnPDF) btnPDF.addEventListener("click", () => window.print());
        if (btnPrint) btnPrint.addEventListener("click", () => window.print());
    }

    console.log("SIPC.JS: Inicialización terminada");
}

// ============================================================
// CONSULTA 1: EJERCICIO FISCAL + NOMBRE (OPCIONAL)
// ============================================================
async function ejecutarConsulta(event) {
    event.preventDefault();

    const txtEjercicio = document.getElementById("txtEjercicio")?.value;
    const txtNombre = document.getElementById("txtNombre")?.value;

    if (!txtEjercicio) {
        mostrarToast("Debe ingresar o seleccionar un ejercicio fiscal.", "warning");
        return;
    }

    const parametros = {
        ejercicio: Number(txtEjercicio),
        nombre: String(txtNombre || "").trim()
    };

    try {
        mostrarLoader(true);
        const respuesta = await API.consultarProveedores(parametros);

        if (respuesta && respuesta.ok) {
            ultimosResultados = respuesta.data || [];
            mostrarResultadosTabla(ultimosResultados);

            if (ultimosResultados.length > 0) {
                mostrarToast(`Se encontraron ${ultimosResultados.length} registro(s).`, "success");
            } else {
                mostrarToast("No se encontraron coincidencias para la búsqueda.", "warning");
            }
        } else {
            throw new Error(respuesta.message || "Error al realizar la consulta.");
        }
    } catch (error) {
        console.error("SIPC.JS: ERROR EN CONSULTA COMBINADA:", error);
        mostrarToast(error.message || "No fue posible realizar la consulta.", "danger");
        mostrarResultadosTabla([]);
    } finally {
        mostrarLoader(false);
    }
}

// ============================================================
// CONSULTA 2: SOLO POR NOMBRE
// ============================================================
async function ejecutarConsultaSoloNombre(event) {
    event.preventDefault();

    const txtNombreUnico = document.getElementById("txtNombreUnico")?.value;

    if (!txtNombreUnico || txtNombreUnico.trim() === "") {
        mostrarToast("Por favor ingresa un nombre para realizar la búsqueda.", "warning");
        return;
    }

    try {
        mostrarLoader(true);
        const respuesta = await API.consultarPorNombre(txtNombreUnico);

        if (respuesta && respuesta.ok) {
            ultimosResultados = respuesta.data || [];
            mostrarResultadosTabla(ultimosResultados);

            if (ultimosResultados.length > 0) {
                mostrarToast(`Se encontraron ${ultimosResultados.length} registro(s).`, "success");
            } else {
                mostrarToast("No se encontraron coincidencias para ese nombre.", "warning");
            }
        } else {
            throw new Error(respuesta.message || "Error al realizar la consulta.");
        }
    } catch (error) {
        console.error("SIPC.JS: ERROR EN CONSULTA SOLO NOMBRE:", error);
        mostrarToast(error.message || "No fue posible realizar la consulta.", "danger");
        mostrarResultadosTabla([]);
    } finally {
        mostrarLoader(false);
    }
}

// ============================================================
// MOSTRAR RESULTADOS EN TABLA
// ============================================================
function mostrarResultadosTabla(registros) {
    const contenedor = document.getElementById("resultadosNomina");

    if (!contenedor) return;

    if (!registros || registros.length === 0) {
        contenedor.innerHTML = `
            <div class="alert alert-secondary mb-0">
                <i class="bi bi-info-circle me-2"></i>
                No se encontraron resultados para los criterios seleccionados.
            </div>
        `;
        return;
    }

    let html = `
        <table class="table table-striped table-hover align-middle border">
            <thead class="table-dark">
                <tr>
                    <th>#</th>
                    <th>Secretaría / OPD / Municipio</th>
                    <th>Oficio Autorización</th>
                    <th>Ej. Fiscal</th>
                    <th>Proveedor / Contratista</th>
                    <th>Monto Contrato</th>
                    <th class="text-center">Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    registros.forEach((reg, index) => {
        const monto = reg.monto_contrato 
            ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(reg.monto_contrato)
            : "$0.00";

        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(reg.secretaria_opds_municipio || '-')}</td>
                <td><span class="badge bg-secondary">${escapeHtml(reg.oficio_autorizacion || '-')}</span></td>
                <td>${escapeHtml(String(reg.ejercicio_fiscal || '-'))}</td>
                <td class="fw-bold">${escapeHtml(reg.nombre_proveedor_contratista || '-')}</td>
                <td class="text-success fw-bold">${monto}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="verDetalleRegistro(${index})" title="Ver Detalle">
                        <i class="bi bi-eye-fill"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    contenedor.innerHTML = html;
}

// ============================================================
// MOSTRAR DETALLE EN MODAL
// ============================================================
function verDetalleRegistro(index) {
    const reg = ultimosResultados[index];
    if (!reg) return;

    const modalEl = document.getElementById("modalDetalle");
    const contenedorDetalle = document.getElementById("detalleRegistro");

    if (!modalEl || !contenedorDetalle) return;

    const monto = reg.monto_contrato 
        ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(reg.monto_contrato)
        : "$0.00";

    const fechaFirma = reg.fecha_firma_contrato 
        ? formatearFecha(reg.fecha_firma_contrato) 
        : '-';

    contenedorDetalle.innerHTML = `
        <div class="row g-3">
            <div class="col-md-6">
                <p class="mb-2"><strong>Secretaría / OPD / Municipio:</strong><br>${escapeHtml(reg.secretaria_opds_municipio || '-')}</p>
                <p class="mb-2"><strong>Nombre Sec. / Muni. / OPD:</strong><br>${escapeHtml(reg.nombre_sec_muni_opd || '-')}</p>
                <p class="mb-2"><strong>Oficio de Autorización:</strong><br>${escapeHtml(reg.oficio_autorizacion || '-')}</p>
                <p class="mb-2"><strong>Ejercicio Fiscal:</strong><br>${escapeHtml(String(reg.ejercicio_fiscal || '-'))}</p>
            </div>
            <div class="col-md-6">
                <p class="mb-2"><strong>Proveedor / Contratista:</strong><br><span class="text-primary fw-bold">${escapeHtml(reg.nombre_proveedor_contratista || '-')}</span></p>
                <p class="mb-2"><strong>Número de Contrato:</strong><br>${escapeHtml(reg.numero_contrato || '-')}</p>
                <p class="mb-2"><strong>Fecha Firma de Contrato:</strong><br>${fechaFirma}</p>
                <p class="mb-2"><strong>Monto del Contrato:</strong><br><span class="text-success fw-bold fs-5">${monto}</span></p>
            </div>
            <div class="col-12"><hr></div>
            <div class="col-12">
                <p class="mb-0"><strong>Nombre de la Obra:</strong><br>${escapeHtml(reg.nombre_obra || '-')}</p>
            </div>
        </div>
    `;

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
}

// ============================================================
// EXPORTAR A EXCEL
// ============================================================
/*function exportarExcel() {
    if (!ultimosResultados || ultimosResultados.length === 0) {
        mostrarToast("No hay registros para exportar.", "warning");
        return;
    }

    const datosFormateados = ultimosResultados.map(item => ({
        "Secretaría/OPD/Municipio": item.secretaria_opds_municipio,
        "Oficio Autorización": item.oficio_autorizacion,
        "Ejercicio Fiscal": item.ejercicio_fiscal,
        "Monto Contrato": item.monto_contrato,
        "Nombre Obra": item.nombre_obra,
        "Fecha Firma Contrato": item.fecha_firma_contrato,
        "Número Contrato": item.numero_contrato,
        "Proveedor/Contratista": item.nombre_proveedor_contratista,
        "Nombre Sec/Muni/OPD": item.nombre_sec_muni_opd
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosFormateados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Proveedores");

    XLSX.writeFile(workbook, `Consulta_Proveedores.xlsx`);
}*/

// ============================================================
// EXPORTAR A EXCEL (CON FORMATEO NUMÉRICO DE MONTO)
// ============================================================
function exportarExcel() {
    if (!ultimosResultados || ultimosResultados.length === 0) {
        mostrarToast("No hay registros para exportar.", "warning");
        return;
    }

    // Mapeo forzando el formato numérico en la columna de monto
    const datosFormateados = ultimosResultados.map(item => {
        // Convertir el monto a número puro de JavaScript
        const montoNumero = item.monto_contrato !== null && item.monto_contrato !== undefined 
            ? Number(item.monto_contrato) 
            : 0;

        return {
            "Secretaría/OPD/Municipio": item.secretaria_opds_municipio || "-",
            "Oficio Autorización": item.oficio_autorizacion || "-",
            "Ejercicio Fiscal": item.ejercicio_fiscal || "-",
            "Monto Contrato": isNaN(montoNumero) ? 0 : montoNumero, // Número puro para Excel
            "Nombre Obra": item.nombre_obra || "-",
            "Fecha Firma Contrato": item.fecha_firma_contrato ? formatearFecha(item.fecha_firma_contrato) : "-",
            "Número Contrato": item.numero_contrato || "-",
            "Proveedor/Contratista": item.nombre_proveedor_contratista || "-",
            "Nombre Sec/Muni/OPD": item.nombre_sec_muni_opd || "-"
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(datosFormateados);

    // Asignar explícitamente el formato de celda $#,##0.00 en SheetJS para la columna "Monto Contrato" (Columna D / Indice 3)
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: 3 }); // Columna D (Monto Contrato)
        if (worksheet[cellAddress]) {
            worksheet[cellAddress].t = 'n'; // Fuerza el tipo 'n' (number)
            worksheet[cellAddress].z = '$#,##0.00'; // Formato de moneda para Excel
        }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Proveedores");

    XLSX.writeFile(workbook, `Consulta_Proveedores.xlsx`);
}


// ============================================================
// LIMPIAR FORMULARIOS
// ============================================================
function limpiarFormulario() {
    const frmConsulta = document.getElementById("frmConsulta");
    const frmConsultaSoloNombre = document.getElementById("frmConsultaSoloNombre");

    if (frmConsulta) frmConsulta.reset();
    if (frmConsultaSoloNombre) frmConsultaSoloNombre.reset();

    const resultados = document.getElementById("resultadosNomina");
    if (resultados) {
        resultados.innerHTML = `
            <div class="alert alert-secondary">
                <i class="bi bi-info-circle me-2"></i>
                Los resultados de la consulta aparecerán aquí.
            </div>
        `;
    }

    ultimosResultados = [];
}

// ============================================================
// CERRAR SESIÓN / UTILIDADES
// ============================================================
function cerrarSesion() {
    window.location.reload();
}

function mostrarLoader(mostrar) {
    const loader = document.getElementById("loader");
    if (!loader) return;

    if (mostrar) {
        loader.classList.remove("d-none");
    } else {
        loader.classList.add("d-none");
    }
}

function mostrarToast(mensaje, tipo = "info") {
    const toastEl = document.getElementById("toastMensaje");
    const toastTexto = document.getElementById("toastTexto");

    if (!toastEl || !toastTexto) return;

    toastTexto.textContent = mensaje;
    toastEl.className = `toast align-items-center text-bg-${tipo} border-0 show`;

    setTimeout(() => {
        toastEl.classList.remove("show");
    }, 4000);
}

function formatearFecha(fecha) {
    if (!fecha) return "—";
    try {
        const fechaObj = new Date(fecha);
        return isNaN(fechaObj.getTime()) ? fecha : fechaObj.toLocaleDateString("es-MX");
    } catch {
        return fecha;
    }
}

function escapeHtml(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}