// ====================================
// VARIABLES GLOBALES
// ====================================
const API_URL = 'http://localhost:3000/api/peliculas';
const API_GENEROS = 'http://localhost:3000/api/generos';
const API_TIPOS = 'http://localhost:3000/api/tipos';
const API_USUARIOS = 'http://localhost:3000/api/usuarios';
let peliculasOriginales = [];
let generosDisponibles = [];
let tiposDisponibles = [];
let usuariosOriginales = [];

// ====================================
// CARGAR GÉNEROS Y TIPOS
// ====================================
async function cargarGenerosYTipos() {
    try {
        console.log('🔄 Cargando géneros y tipos...');
        const [respGeneros, respTipos] = await Promise.all([
            fetch(API_GENEROS),
            fetch(API_TIPOS)
        ]);

        const datosGeneros = await respGeneros.json();
        const datosTipos = await respTipos.json();

        console.log('📦 Géneros recibidos:', datosGeneros);
        console.log('📦 Tipos recibidos:', datosTipos);

        if (datosGeneros.success) {
            generosDisponibles = datosGeneros.generos;
            llenarSelectGeneros();
            console.log('✅ Géneros cargados en select:', generosDisponibles.length);
        } else {
            console.error('❌ Error en respuesta de géneros:', datosGeneros);
        }

        if (datosTipos.success) {
            tiposDisponibles = datosTipos.tipos;
            llenarSelectTipos();
            console.log('✅ Tipos cargados en select:', tiposDisponibles.length);
        } else {
            console.error('❌ Error en respuesta de tipos:', datosTipos);
        }
    } catch (error) {
        console.error('❌ Error al cargar géneros y tipos:', error);
    }
}

function llenarSelectGeneros() {
    const selects = document.querySelectorAll('#select-genero, #edit-genero');
    console.log('🎯 Selects de género encontrados:', selects.length);
    selects.forEach(select => {
        select.innerHTML = '<option value="">Seleccionar...</option>';
        generosDisponibles.forEach(genero => {
            select.innerHTML += `<option value="${genero.id_genero}">${genero.nombre}</option>`;
        });
        console.log('✅ Select llenado con', select.options.length, 'opciones');
    });
}

function llenarSelectTipos() {
    const selects = document.querySelectorAll('#select-tipo, #edit-tipo');
    console.log('🎯 Selects de tipo encontrados:', selects.length);
    selects.forEach(select => {
        select.innerHTML = '<option value="">Seleccionar...</option>';
        tiposDisponibles.forEach(tipo => {
            select.innerHTML += `<option value="${tipo.id_tipo}">${tipo.nombre}</option>`;
        });
        console.log('✅ Select llenado con', select.options.length, 'opciones');
    });
}

// ====================================
// PANTALLA DE CARGA
// ====================================
window.addEventListener('load', async () => {
    await cargarGenerosYTipos();
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('ocultar');
        }
    }, 400);
});

// ====================================
// NAVEGACIÓN ENTRE SECCIONES
// ====================================
document.querySelectorAll('.sidebar ul li a[data-seccion]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const seccionId = link.getAttribute('data-seccion');
        
        // Ocultar todas las secciones
        document.querySelectorAll('.section').forEach(seccion => {
            seccion.classList.remove('activa');
        });
        
        // Mostrar la sección seleccionada
        const seccion = document.getElementById(seccionId);
        if (seccion) {
            seccion.classList.add('activa');

            // Si es "Ver contenido", cargar películas
            if (seccionId === 'ver-contenido') {
                cargarPeliculas();
            }

            // Si es "Usuarios", cargar usuarios
            if (seccionId === 'usuarios') {
                cargarUsuarios();
            }

            // Si es "Plan Premium", cargar configuración y estadísticas
            if (seccionId === 'plan-premium') {
                cargarConfiguracionPlan();
                cargarEstadisticasPremium();
            }
        }
    });
});

// ====================================
// CARGAR PELÍCULAS EN GRID
// ====================================
async function cargarPeliculas() {
    try {
        const respuesta = await fetch(API_URL);
        const datos = await respuesta.json();
        
        if (datos.success) {
            peliculasOriginales = datos.peliculas;
            mostrarPeliculas(peliculasOriginales);
            console.log('✅ Películas cargadas:', datos.total);
        }
    } catch (error) {
        console.error('❌ Error al cargar películas:', error);
        alert('Error al cargar las películas');
    }
}

function mostrarPeliculas(peliculas) {
    const grid = document.getElementById('grid-peliculas');
    grid.innerHTML = '';
    
    if (peliculas.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #999;">No se encontraron películas</p>';
        return;
    }
    
    peliculas.forEach(pelicula => {
        const card = `
            <div class="pelicula-card">
                <img src="${pelicula.imagen_url || 'https://via.placeholder.com/250x350?text=Sin+Imagen'}" alt="${pelicula.titulo}">
                <div class="info">
                    <div class="titulo">${pelicula.titulo}</div>
                    <div class="director">${pelicula.director}</div>
                    <div class="detalles">
                        <span>${pelicula.anio || 'N/A'}</span>
                        <span>${pelicula.genero || 'Sin género'}</span>
                        <span>${pelicula.tipo || ''}</span>
                    </div>
                    <div class="acciones">
                        <button class="btn-card-editar" onclick="editarPelicula(${pelicula.id_pelicula})">Editar</button>
                        <button class="btn-card-eliminar" onclick="eliminarPelicula(${pelicula.id_pelicula}, '${pelicula.titulo.replace(/'/g, "\\'")}')">Eliminar</button>
                    </div>
                </div>
            </div>
        `;
        grid.innerHTML += card;
    });
}

// ====================================
// BÚSQUEDA DE PELÍCULAS
// ====================================
document.getElementById('input-buscar').addEventListener('input', (e) => {
    const termino = e.target.value.toLowerCase();
    
    const peliculasFiltradas = peliculasOriginales.filter(pelicula => {
        return pelicula.titulo.toLowerCase().includes(termino) ||
               pelicula.director.toLowerCase().includes(termino) ||
               (pelicula.genero && pelicula.genero.toLowerCase().includes(termino));
    });
    
    mostrarPeliculas(peliculasFiltradas);
});

// ====================================
// AGREGAR PELÍCULA
// ====================================
document.getElementById('form-agregar').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const pelicula = {
        titulo: formData.get('titulo'),
        director: formData.get('director'),
        sinopsis: formData.get('sinopsis'),
        imagen_url: formData.get('imagen_url') || null,
        contenido_url: formData.get('contenido_url') || null,
        anio: formData.get('anio') ? parseInt(formData.get('anio')) : null,
        id_genero: formData.get('id_genero') ? parseInt(formData.get('id_genero')) : null,
        id_seriepeli: formData.get('id_seriepeli') ? parseInt(formData.get('id_seriepeli')) : null,
        premium: document.getElementById('check-premium').checked
    };

    try {
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pelicula)
        });

        const datos = await respuesta.json();

        if (datos.success) {
            alert('✅ Película agregada exitosamente');
            e.target.reset();
        } else {
            alert('❌ Error: ' + datos.mensaje);
        }
    } catch (error) {
        console.error('❌ Error al agregar película:', error);
        alert('Error al agregar la película');
    }
});

function cancelarAgregar() {
    document.getElementById('form-agregar').reset();
    // Ocultar sección de agregar
    document.querySelectorAll('.section').forEach(s => s.classList.remove('activa'));
}

// ====================================
// EDITAR PELÍCULA (MODAL)
// ====================================
async function editarPelicula(id) {
    try {
        const pelicula = peliculasOriginales.find(p => p.id_pelicula === id);

        if (!pelicula) {
            alert('Película no encontrada');
            return;
        }

        // Llenar el formulario del modal
        document.getElementById('edit-id').value = pelicula.id_pelicula;
        document.getElementById('edit-titulo').value = pelicula.titulo;
        document.getElementById('edit-director').value = pelicula.director;
        document.getElementById('edit-sinopsis').value = pelicula.sinopsis;
        document.getElementById('edit-imagen_url').value = pelicula.imagen_url || '';
        document.getElementById('edit-contenido_url').value = pelicula.contenido_url || '';
        document.getElementById('edit-anio').value = pelicula.anio || '';
        document.getElementById('edit-genero').value = pelicula.id_genero || '';
        document.getElementById('edit-tipo').value = pelicula.id_seriepeli || '';
        document.getElementById('edit-premium').checked = pelicula.premium || false;

        // Mostrar modal
        document.getElementById('modal-editar').classList.add('activo');

    } catch (error) {
        console.error('❌ Error al cargar película:', error);
        alert('Error al cargar los datos de la película');
    }
}

document.getElementById('form-editar').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;
    const formData = new FormData(e.target);
    const pelicula = {
        titulo: formData.get('titulo'),
        director: formData.get('director'),
        sinopsis: formData.get('sinopsis'),
        imagen_url: formData.get('imagen_url') || null,
        contenido_url: formData.get('contenido_url') || null,
        anio: formData.get('anio') ? parseInt(formData.get('anio')) : null,
        id_genero: formData.get('id_genero') ? parseInt(formData.get('id_genero')) : null,
        id_seriepeli: formData.get('id_seriepeli') ? parseInt(formData.get('id_seriepeli')) : null,
        premium: document.getElementById('edit-premium').checked
    };

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pelicula)
        });

        const datos = await respuesta.json();

        if (datos.success) {
            alert('✅ Película actualizada exitosamente');
            cerrarModal();
            cargarPeliculas();
        } else {
            alert('❌ Error: ' + datos.mensaje);
        }
    } catch (error) {
        console.error('❌ Error al editar película:', error);
        alert('Error al editar la película');
    }
});

function cerrarModal() {
    document.getElementById('modal-editar').classList.remove('activo');
    document.getElementById('form-editar').reset();
}

// Cerrar modal al hacer click fuera
document.getElementById('modal-editar').addEventListener('click', (e) => {
    if (e.target.id === 'modal-editar') {
        cerrarModal();
    }
});

// ====================================
// ELIMINAR PELÍCULA
// ====================================
async function eliminarPelicula(id, titulo) {
    if (!confirm(`¿Estás seguro de eliminar "${titulo}"?`)) {
        return;
    }
    
    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        const datos = await respuesta.json();
        
        if (datos.success) {
            alert('✅ Película eliminada exitosamente');
            cargarPeliculas();
        } else {
            alert('❌ Error: ' + datos.mensaje);
        }
    } catch (error) {
        console.error('❌ Error al eliminar película:', error);
        alert('Error al eliminar la película');
    }
}

// ====================================
// GESTIÓN DE USUARIOS
// ====================================

async function cargarUsuarios() {
    try {
        const respuesta = await fetch(API_USUARIOS);
        const datos = await respuesta.json();

        if (datos.success) {
            usuariosOriginales = datos.usuarios;
            mostrarUsuarios(usuariosOriginales);
            console.log('✅ Usuarios cargados:', datos.total);
        } else {
            console.error('❌ Error:', datos.mensaje);
        }
    } catch (error) {
        console.error('❌ Error al cargar usuarios:', error);
    }
}

function mostrarUsuarios(usuarios) {
    const tbody = document.getElementById('tbody-usuarios');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay usuarios registrados</td></tr>';
        return;
    }

    usuarios.forEach(usuario => {
        const fecha = new Date(usuario.created_at).toLocaleDateString('es-ES');

        const fila = `
            <tr>
                <td>${usuario.id_usuario}</td>
                <td>${usuario.nombre}</td>
                <td>${usuario.correo}</td>
                <td>${usuario.telefono}</td>
                <td><span class="badge-plan">${usuario.plan_nombre || 'Sin plan'}</span></td>
                <td>${fecha}</td>
                <td>
                    <button class="btn-ver-favoritos" onclick="verFavoritos(${usuario.id_usuario}, '${usuario.nombre.replace(/'/g, "\\'")}')">
                        Ver
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

// Función para ver favoritos de un usuario
async function verFavoritos(idUsuario, nombreUsuario) {
    try {
        const respuesta = await fetch(`http://localhost:3000/api/favoritos/${idUsuario}`);
        const datos = await respuesta.json();

        if (datos.success) {
            mostrarModalFavoritos(nombreUsuario, datos.favoritos);
        } else {
            alert('Error al cargar favoritos');
        }
    } catch (error) {
        console.error('Error al obtener favoritos:', error);
        alert('Error al cargar favoritos del usuario');
    }
}

function mostrarModalFavoritos(nombreUsuario, favoritos) {
    // Crear el modal si no existe
    let modal = document.getElementById('modal-favoritos');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-favoritos';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    let contenidoHTML = `
        <div class="modal-contenido">
            <span class="cerrar-modal" onclick="cerrarModalFavoritos()">&times;</span>
            <h2>Favoritos de ${nombreUsuario}</h2>
    `;

    if (favoritos.length === 0) {
        contenidoHTML += '<p class="mensaje-info">Este usuario no tiene películas favoritas.</p>';
    } else {
        contenidoHTML += '<div class="lista-favoritos">';
        favoritos.forEach((fav, index) => {
            contenidoHTML += `
                <div class="favorito-item">
                    <span class="favorito-numero">${index + 1}.</span>
                    <span class="favorito-nombre">${fav.titulo}</span>
                </div>
            `;
        });
        contenidoHTML += '</div>';
    }

    contenidoHTML += '</div>';
    modal.innerHTML = contenidoHTML;
    modal.classList.add('activo');
}

function cerrarModalFavoritos() {
    const modal = document.getElementById('modal-favoritos');
    if (modal) {
        modal.classList.remove('activo');
    }
}

// Búsqueda de usuarios
const inputBuscarUsuarios = document.getElementById('input-buscar-usuarios');
if (inputBuscarUsuarios) {
    inputBuscarUsuarios.addEventListener('input', (e) => {
        const textoBusqueda = e.target.value.toLowerCase();

        const usuariosFiltrados = usuariosOriginales.filter(usuario => {
            return usuario.nombre.toLowerCase().includes(textoBusqueda) ||
                   usuario.correo.toLowerCase().includes(textoBusqueda) ||
                   usuario.telefono.includes(textoBusqueda);
        });

        mostrarUsuarios(usuariosFiltrados);
    });
}

// ====================================
// GESTIÓN DEL PLAN PREMIUM
// ====================================

const API_PLANES = 'http://localhost:3000/api/planes';
const API_SUSCRIPCIONES = 'http://localhost:3000/api/suscripciones';

// Cargar configuración del plan premium
async function cargarConfiguracionPlan() {
    try {
        const respuesta = await fetch(`${API_PLANES}/2`); // ID 2 es el Plan Premium
        const datos = await respuesta.json();

        if (datos.success) {
            const plan = datos.plan;
            document.getElementById('plan-nombre').value = plan.nombre;
            document.getElementById('plan-precio').value = plan.precio;
            document.getElementById('plan-descripcion').value = plan.descripcion;

            // Convertir array de características a texto (una por línea)
            if (plan.caracteristicas && Array.isArray(plan.caracteristicas)) {
                document.getElementById('plan-caracteristicas').value = plan.caracteristicas.join('\n');
            }
        }
    } catch (error) {
        console.error('Error al cargar configuración del plan:', error);
    }
}

// Guardar configuración del plan premium
const formPlanPremium = document.getElementById('form-plan-premium');
if (formPlanPremium) {
    formPlanPremium.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('plan-nombre').value;
        const precio = parseFloat(document.getElementById('plan-precio').value);
        const descripcion = document.getElementById('plan-descripcion').value;
        const caracteristicasTexto = document.getElementById('plan-caracteristicas').value;

        // Convertir texto a array (separar por líneas)
        const caracteristicas = caracteristicasTexto
            .split('\n')
            .map(c => c.trim())
            .filter(c => c.length > 0);

        try {
            const respuesta = await fetch(`${API_PLANES}/2`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre,
                    precio,
                    descripcion,
                    caracteristicas
                })
            });

            const datos = await respuesta.json();

            if (datos.success) {
                alert('Configuración del plan actualizada exitosamente');
                await cargarEstadisticasPremium();
            } else {
                alert('Error: ' + datos.mensaje);
            }
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            alert('Error al actualizar la configuración del plan');
        }
    });
}

// Cargar estadísticas del plan premium
async function cargarEstadisticasPremium() {
    try {
        // Obtener total de usuarios premium
        const respuestaSuscripciones = await fetch(`${API_SUSCRIPCIONES}/activas`);
        const datosSuscripciones = await respuestaSuscripciones.json();

        if (datosSuscripciones.success) {
            const suscripcionesActivas = datosSuscripciones.suscripciones;
            const totalUsuariosPremium = suscripcionesActivas.length;

            // Actualizar contador de usuarios premium
            document.getElementById('total-usuarios-premium').textContent = totalUsuariosPremium;
            document.getElementById('suscripciones-activas').textContent = totalUsuariosPremium;

            // Calcular ingresos mensuales
            const respuestaPlan = await fetch(`${API_PLANES}/2`);
            const datosPlan = await respuestaPlan.json();

            if (datosPlan.success) {
                const precioPlan = datosPlan.plan.precio;
                const ingresosMensuales = totalUsuariosPremium * precioPlan;
                document.getElementById('ingresos-mensuales').textContent = `$${ingresosMensuales.toFixed(2)}`;
            }

            // Mostrar usuarios premium en la tabla
            mostrarUsuariosPremium(suscripcionesActivas);
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Mostrar usuarios premium en la tabla
function mostrarUsuariosPremium(suscripciones) {
    const tbody = document.getElementById('tbody-usuarios-premium');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (suscripciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay usuarios premium activos</td></tr>';
        return;
    }

    suscripciones.forEach(sub => {
        const tr = document.createElement('tr');

        const fechaInicio = new Date(sub.fecha_inicio).toLocaleDateString('es-MX');
        const fechaFin = new Date(sub.fecha_vencimiento).toLocaleDateString('es-MX');
        const estadoBadge = sub.estado === 'activo'
            ? '<span class="badge-activo">Activo</span>'
            : '<span class="badge-inactivo">Inactivo</span>';
        const autoRenovacion = sub.auto_renovacion
            ? '<span class="badge-si">Sí</span>'
            : '<span class="badge-no">No</span>';

        tr.innerHTML = `
            <td>${sub.nombre_usuario || 'N/A'}</td>
            <td>${sub.email || 'N/A'}</td>
            <td>${fechaInicio}</td>
            <td>${fechaFin}</td>
            <td>${estadoBadge}</td>
            <td>${autoRenovacion}</td>
        `;

        tbody.appendChild(tr);
    });
}