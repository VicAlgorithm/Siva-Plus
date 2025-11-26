// ====================================
// VARIABLES GLOBALES
// ====================================
const API_URL = 'http://localhost:3000/api/peliculas';
const API_PELICULAS = 'http://localhost:3000/api/peliculas/tipo/1';
const API_SERIES = 'http://localhost:3000/api/peliculas/tipo/2';
const API_FAVORITOS = 'http://localhost:3000/api/favoritos';

const anchoMiniatura = 200;
const gap = 30;

// Datos por sección
const secciones = {
    inicio: { peliculas: [], cargado: false },
    peliculas: { peliculas: [], cargado: false },
    series: { peliculas: [], cargado: false },
    favoritos: { peliculas: [], cargado: false },
    busqueda: { peliculas: [], cargado: false }
};

// Variable para guardar la sección anterior antes de entrar a búsqueda
let seccionAnterior = 'inicio';

// ====================================
// CONEXIÓN CON LA API
// ====================================

async function obtenerContenido(url) {
    try {
        const respuesta = await fetch(url);
        const datos = await respuesta.json();

        if (datos.success) {
            console.log('✅ Contenido obtenido:', datos.total);
            return datos.peliculas;
        } else {
            console.error('❌ Error en la respuesta:', datos.mensaje);
            return [];
        }
    } catch (error) {
        console.error('❌ Error al conectar con la API:', error);
        return [];
    }
}

// ====================================
// GENERACIÓN DE HTML
// ====================================

async function generarImagenesPrincipales(peliculas, contenedorId) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    contenedor.innerHTML = '';

    // Obtener usuario logueado para verificar favoritos
    const usuarioData = localStorage.getItem('usuarioLogueado');
    let favoritosIds = [];

    if (usuarioData) {
        const usuario = JSON.parse(usuarioData);
        try {
            const respuesta = await fetch(`${API_FAVORITOS}/${usuario.id_usuario}`);
            const datos = await respuesta.json();
            if (datos.success) {
                favoritosIds = datos.favoritos.map(f => f.id_pelicula);
            }
        } catch (error) {
            console.error('Error al verificar favoritos:', error);
        }
    }

    peliculas.forEach(pelicula => {
        const esFavorito = favoritosIds.includes(pelicula.id_pelicula);
        const textoBoton = esFavorito ? 'Quitar' : 'Mi Lista';

        const itemHTML = `
            <div class="item" data-pelicula-id="${pelicula.id_pelicula}">
                <img src="${pelicula.imagen_url}" alt="${pelicula.titulo}">
                <div class="contenido">
                    <div class="titulo_principal">${pelicula.titulo}</div>
                    <div class="autor">${pelicula.director}</div>
                    <div class="sinopsis">${pelicula.sinopsis}</div>
                    <div class="botones_peli">
                        <button class="btn-reproducir require-login" data-contenido-url="${pelicula.contenido_url || ''}">Reproducir</button>
                        <button class="btn-mi-lista require-login" data-pelicula-id="${pelicula.id_pelicula}">${textoBoton}</button>
                    </div>
                </div>
            </div>
        `;
        contenedor.innerHTML += itemHTML;
    });
}

function generarMiniaturas(peliculas, contenedorId, seccion) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    contenedor.innerHTML = '';

    peliculas.forEach((pelicula, indice) => {
        const itemHTML = `
            <div class="item1" data-indice="${indice}" data-seccion="${seccion}">
                <img src="${pelicula.imagen_url}" alt="${pelicula.titulo}">
                <div class="contenido1">
                    <div class="titulo">${pelicula.titulo}</div>
                    <div class="des">${pelicula.director}</div>
                </div>
            </div>
        `;
        contenedor.innerHTML += itemHTML;
    });

    // Agregar eventos a las miniaturas
    const miniaturas = contenedor.querySelectorAll('.item1');
    miniaturas.forEach(miniatura => {
        miniatura.addEventListener('click', () => {
            const indice = parseInt(miniatura.getAttribute('data-indice'));
            const seccionActual = miniatura.getAttribute('data-seccion');
            cambiarImagenPrincipal(indice, seccionActual);
        });
    });
}

// ====================================
// INICIALIZACIÓN DE SECCIONES
// ====================================

async function inicializarSeccion(seccion) {
    let url, mainMovieId, barId;

    switch(seccion) {
        case 'inicio':
            url = API_URL;
            mainMovieId = 'mainMovie-inicio';
            barId = 'bar-inicio';
            break;
        case 'peliculas':
            url = API_PELICULAS;
            mainMovieId = 'mainMovie-peliculas';
            barId = 'bar-peliculas';
            break;
        case 'series':
            url = API_SERIES;
            mainMovieId = 'mainMovie-series';
            barId = 'bar-series';
            break;
        case 'favoritos':
            mainMovieId = 'mainMovie-favoritos';
            barId = 'bar-favoritos';
            break;
    }

    let peliculas;

    // Para favoritos, cargar de manera diferente
    if (seccion === 'favoritos') {
        peliculas = await cargarFavoritos();

        if (peliculas.length === 0) {
            const mainMovie = document.getElementById(mainMovieId);
            const bar = document.getElementById(barId);
            mainMovie.innerHTML = '<div style="color: white; text-align: center; padding: 100px;">No tienes películas favoritas aún</div>';
            bar.innerHTML = '';
            return;
        }
    } else {
        // Si ya está cargado, no volver a cargar
        if (secciones[seccion].cargado && secciones[seccion].peliculas.length > 0) {
            return;
        }

        peliculas = await obtenerContenido(url);

        if (peliculas.length === 0) {
            console.error(`❌ No se pudo cargar contenido para ${seccion}`);
            return;
        }
    }

    secciones[seccion].peliculas = peliculas;
    secciones[seccion].cargado = true;

    await generarImagenesPrincipales(peliculas, mainMovieId);
    generarMiniaturas(peliculas, barId, seccion);

    // Mostrar primera película
    const imagenes = document.querySelectorAll(`#${mainMovieId} .item`);
    imagenes.forEach(img => {
        img.style.opacity = '0';
        img.style.zIndex = '0';
    });

    if (imagenes[0]) {
        imagenes[0].style.opacity = '1';
        imagenes[0].style.zIndex = '1';
    }

    console.log(`✅ Sección ${seccion} cargada correctamente`);

    // Si es la sección de películas, generar botones de géneros
    if (seccion === 'peliculas') {
        generarBotonesGeneros(peliculas);
    }

    // Si es la sección de series, generar botones de géneros
    if (seccion === 'series') {
        generarBotonesGenerosSeries(peliculas);
    }
}

// ====================================
// PANTALLA DE CARGA
// ====================================

window.addEventListener('load', async () => {
    // Inicializar sección de inicio
    await inicializarSeccion('inicio');

    // Actualizar icono de usuario según el estado de login
    actualizarIconoUsuario();

    setTimeout(() => {
        cambiarImagenPrincipal(0, 'inicio');

        setTimeout(() => {
            document.getElementById('loading_screen').classList.add('hidden');
        }, 600);
    }, 100);
});

// ====================================
// NAVEGACIÓN ENTRE SECCIONES
// ====================================

document.querySelectorAll('.menu a[data-seccion]').forEach(link => {
    link.addEventListener('click', async (e) => {
        e.preventDefault();

        // Verificar si es una ruta protegida y el usuario no está logueado
        if (link.classList.contains('require-login')) {
            const usuarioLogueado = localStorage.getItem('usuarioLogueado');
            if (!usuarioLogueado) {
                // Dejar que el manejador de protección se encargue
                return;
            }
        }

        const seccionId = link.getAttribute('data-seccion');
        const seccionNombre = seccionId.replace('seccion-', '');

        // Obtener la sección actual
        const seccionActual = document.querySelector('.seccion-contenido.activa');
        const seccionActualNombre = seccionActual ? seccionActual.id.replace('seccion-', '') : null;

        // Si es la misma sección, no hacer nada
        if (seccionActualNombre === seccionNombre) {
            return;
        }

        // Actualizar navegación activa
        document.querySelectorAll('.menu a').forEach(a => a.classList.remove('nav-activo'));
        link.classList.add('nav-activo');

        // Ocultar todas las secciones
        document.querySelectorAll('.seccion-contenido').forEach(seccion => {
            seccion.classList.remove('activa');
        });

        // Mostrar la sección seleccionada
        const seccion = document.getElementById(seccionId);
        if (seccion) {
            seccion.classList.add('activa');

            // Cargar contenido si es necesario
            await inicializarSeccion(seccionNombre);

            // Siempre activar la primera miniatura después de cambiar de sección
            setTimeout(() => {
                cambiarImagenPrincipal(0, seccionNombre);
            }, 100);
        }
    });
});

// ====================================
// FUNCIONES DE BARRA (SCROLL)
// ====================================

function obtenerBarra(seccion) {
    return document.getElementById(`bar-${seccion}`);
}

function calcularMiniaturasVisibles(barra) {
    if (!barra) return 1;
    const anchoVisible = barra.clientWidth;
    return Math.floor(anchoVisible / (anchoMiniatura + gap));
}

function obtenerIndiceActual(barra) {
    if (!barra) return 0;
    const scrollActual = barra.scrollLeft;
    return Math.round(scrollActual / (anchoMiniatura + gap));
}

function scrollearAIndice(barra, indice) {
    if (!barra) return;
    const posicion = indice * (anchoMiniatura + gap);
    barra.scrollTo({
        left: posicion,
        behavior: 'smooth'
    });
}

// ====================================
// BOTONES NEXT Y PREV
// ====================================

document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
        const seccion = btn.getAttribute('data-seccion');
        const barra = obtenerBarra(seccion);
        const miniaturas = barra ? barra.querySelectorAll('.item1') : [];

        const indiceActual = obtenerIndiceActual(barra);
        const miniaturasVisibles = calcularMiniaturasVisibles(barra);
        const totalMiniaturas = miniaturas.length;

        let nuevoIndice = indiceActual + miniaturasVisibles;

        if (nuevoIndice >= totalMiniaturas) {
            const miniaturasRestantes = totalMiniaturas - indiceActual;
            if (miniaturasRestantes <= miniaturasVisibles) {
                nuevoIndice = 0;
            }
        } else {
            const miniaturasRestantes = totalMiniaturas - nuevoIndice;
            if (miniaturasRestantes < miniaturasVisibles && miniaturasRestantes > 0) {
                nuevoIndice = totalMiniaturas - miniaturasRestantes;
            }
        }

        scrollearAIndice(barra, nuevoIndice);
    });
});

document.querySelectorAll('.btn-prev').forEach(btn => {
    btn.addEventListener('click', () => {
        const seccion = btn.getAttribute('data-seccion');
        const barra = obtenerBarra(seccion);
        const miniaturas = barra ? barra.querySelectorAll('.item1') : [];

        const indiceActual = obtenerIndiceActual(barra);
        const miniaturasVisibles = calcularMiniaturasVisibles(barra);
        const totalMiniaturas = miniaturas.length;

        let nuevoIndice = indiceActual - miniaturasVisibles;

        if (nuevoIndice < 0) {
            const ultimoGrupo = Math.floor((totalMiniaturas - 1) / miniaturasVisibles) * miniaturasVisibles;
            nuevoIndice = ultimoGrupo;
        }

        scrollearAIndice(barra, nuevoIndice);
    });
});

// ====================================
// ANIMACIÓN DE SELECCIÓN DE MINIATURAS
// ====================================

let animando = false;

function cambiarImagenPrincipal(indice, seccion) {
    if (animando) return;

    animando = true;

    const mainMovieId = `mainMovie-${seccion}`;
    const barId = `bar-${seccion}`;
    const seccionElement = document.getElementById(`seccion-${seccion}`);

    if (!seccionElement) {
        animando = false;
        return;
    }

    const principal = seccionElement.querySelector('.main');
    const imagenesPrincipales = document.querySelectorAll(`#${mainMovieId} .item`);
    const miniaturas = document.querySelectorAll(`#${barId} .item1`);

    if (!miniaturas[indice] || !imagenesPrincipales[indice]) {
        console.error('❌ No existe contenido en el índice:', indice);
        animando = false;
        return;
    }

    const miniaturaClickeada = miniaturas[indice];
    const rect = miniaturaClickeada.getBoundingClientRect();

    const imagenEntrante = imagenesPrincipales[indice];
    imagenEntrante.style.setProperty('--miniatura-left', rect.left + 'px');
    imagenEntrante.style.setProperty('--miniatura-top', rect.top + 'px');

    principal.classList.add('animando');

    imagenesPrincipales.forEach(img => {
        if (img.style.opacity === '1') {
            img.classList.add('saliendo');
        }
        img.classList.remove('entrando');
    });

    imagenEntrante.classList.add('entrando');

    imagenesPrincipales.forEach(img => {
        img.style.opacity = '0';
        img.style.zIndex = '0';
    });

    imagenEntrante.style.opacity = '1';
    imagenEntrante.style.zIndex = '1';

    setTimeout(() => {
        principal.classList.remove('animando');
        imagenesPrincipales.forEach(img => {
            img.classList.remove('saliendo', 'entrando');
        });
        animando = false;
    }, 1000);
}

// ====================================
// MODAL DE LOGIN Y SIDEBAR DE USUARIO
// ====================================

const modalLogin = document.getElementById('modal-login');
const btnUserIcon = document.getElementById('btn-user-icon');
const iconUser = document.getElementById('icon-user');
const modalClose = document.querySelector('.modal-close');
const modalTitulo = document.getElementById('modal-titulo');
const userSidebar = document.getElementById('user-sidebar');
const btnLogout = document.getElementById('btn-logout');

const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const btnMostrarRegistro = document.getElementById('btn-mostrar-registro');
const btnVolverLogin = document.getElementById('btn-volver-login');

// Función para actualizar el icono de usuario según el estado de login
function actualizarIconoUsuario() {
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');

    if (usuarioLogueado) {
        // Cambiar a carita feliz
        iconUser.className = 'bi bi-emoji-smile';

        // Actualizar información en el sidebar
        const usuario = JSON.parse(usuarioLogueado);
        document.getElementById('user-sidebar-nombre').textContent = usuario.nombre;
        document.getElementById('user-sidebar-plan').textContent = usuario.plan_nombre || 'Plan Básico';
    } else {
        // Cambiar a icono de persona
        iconUser.className = 'bi bi-person-circle';
    }
}

// Abrir modal o sidebar al hacer click en el icono de usuario
btnUserIcon.addEventListener('click', (e) => {
    e.preventDefault();

    const usuarioLogueado = localStorage.getItem('usuarioLogueado');

    if (usuarioLogueado) {
        // Si está logueado, mostrar/ocultar sidebar
        userSidebar.classList.toggle('active');
    } else {
        // Si no está logueado, mostrar modal de login
        modalLogin.classList.add('active');
        mostrarFormularioLogin();
    }
});

// Cerrar sidebar al hacer click fuera
document.addEventListener('click', (e) => {
    if (!userSidebar.contains(e.target) && !btnUserIcon.contains(e.target)) {
        userSidebar.classList.remove('active');
    }
});

// Función de logout
btnLogout.addEventListener('click', (e) => {
    e.preventDefault();

    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        // Limpiar localStorage
        localStorage.removeItem('usuarioLogueado');

        // Cerrar sidebar
        userSidebar.classList.remove('active');

        // Actualizar icono
        actualizarIconoUsuario();

        // Recargar la página de inicio
        window.location.reload();
    }
});

// Cerrar modal al hacer click en la X
modalClose.addEventListener('click', () => {
    modalLogin.classList.remove('active');
});

// Cerrar modal al hacer click fuera de la caja azul
modalLogin.addEventListener('click', (e) => {
    if (e.target === modalLogin) {
        modalLogin.classList.remove('active');
    }
});

// Cambiar a formulario de registro
btnMostrarRegistro.addEventListener('click', () => {
    formLogin.style.display = 'none';
    formRegistro.style.display = 'flex';
    modalTitulo.textContent = 'Crear cuenta en SIVA+';
});

// Volver a formulario de login
btnVolverLogin.addEventListener('click', () => {
    mostrarFormularioLogin();
});

function mostrarFormularioLogin() {
    formLogin.style.display = 'flex';
    formRegistro.style.display = 'none';
    modalTitulo.textContent = 'Bienvenido a SIVA+';
}

// ====================================
// PROTEGER SECCIONES QUE REQUIEREN LOGIN
// ====================================

// Función para verificar login y manejar el evento
function manejarAccesoProtegido(e) {
    e.preventDefault();
    e.stopPropagation();

    // Verificar si el usuario está logueado
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');

    if (!usuarioLogueado) {
        // Si no está logueado, abrir el modal de login
        modalLogin.classList.add('active');
        mostrarFormularioLogin();
    } else {
        // Si está logueado, permitir el acceso (aquí puedes agregar la funcionalidad futura)
        console.log('Usuario autenticado, acceso permitido');
        // TODO: Implementar funcionalidad de favoritos, notificaciones, reproducir y mi lista
    }
}

// Usar delegación de eventos para los elementos protegidos (incluyendo los generados dinámicamente)
document.addEventListener('click', (e) => {
    // Verificar si el elemento clickeado o su padre tiene la clase require-login
    const elementoProtegido = e.target.closest('.require-login');

    if (elementoProtegido) {
        manejarAccesoProtegido(e);
    }
});

// ====================================
// MANEJO DE FORMULARIOS DE AUTENTICACIÓN
// ====================================

// Manejar el formulario de REGISTRO
formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const correo = document.getElementById('correo').value;
    const telefono = document.getElementById('telefono-registro').value;
    const password = document.getElementById('password-registro').value;

    try {
        const respuesta = await fetch('http://localhost:3000/api/auth/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, correo, telefono, password })
        });

        const datos = await respuesta.json();

        if (datos.success) {
            alert('✅ ' + datos.mensaje + '\n\nAhora puedes iniciar sesión con tu teléfono y contraseña.');
            // Limpiar el formulario
            formRegistro.reset();
            // Mostrar el formulario de login
            mostrarFormularioLogin();
        } else {
            alert('❌ ' + datos.mensaje);
        }
    } catch (error) {
        console.error('Error al registrar:', error);
        alert('❌ Error al conectar con el servidor');
    }
});

// Manejar el formulario de LOGIN
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const telefono = document.getElementById('telefono-login').value;
    const password = document.getElementById('password-login').value;

    try {
        const respuesta = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telefono, password })
        });

        const datos = await respuesta.json();

        if (datos.success) {
            // Guardar los datos del usuario en localStorage
            localStorage.setItem('usuarioLogueado', JSON.stringify(datos.usuario));

            alert('✅ ' + datos.mensaje + '\n\n¡Bienvenido ' + datos.usuario.nombre + '!\nPlan: ' + datos.usuario.plan_nombre);

            // Cerrar el modal
            modalLogin.classList.remove('active');

            // Limpiar el formulario
            formLogin.reset();

            // Actualizar el icono de usuario
            actualizarIconoUsuario();

            // Actualizar la interfaz (puedes agregar más lógica aquí)
            console.log('Usuario logueado:', datos.usuario);
        } else {
            alert('❌ ' + datos.mensaje);
        }
    } catch (error) {
        console.error('Error al hacer login:', error);
        alert('❌ Error al conectar con el servidor');
    }
});

// ====================================
// SISTEMA DE FAVORITOS
// ====================================

// Función para cargar favoritos del usuario
async function cargarFavoritos() {
    const usuarioData = localStorage.getItem('usuarioLogueado');

    if (!usuarioData) {
        console.log('No hay usuario logueado');
        return [];
    }

    const usuario = JSON.parse(usuarioData);

    try {
        const respuesta = await fetch(`${API_FAVORITOS}/${usuario.id_usuario}`);
        const datos = await respuesta.json();

        if (datos.success) {
            return datos.favoritos;
        }
        return [];
    } catch (error) {
        console.error('Error al cargar favoritos:', error);
        return [];
    }
}

// Función para agregar/quitar de favoritos
async function toggleFavorito(id_pelicula, botonElement) {
    const usuarioData = localStorage.getItem('usuarioLogueado');

    if (!usuarioData) {
        alert('Debes iniciar sesión para agregar favoritos');
        return;
    }

    const usuario = JSON.parse(usuarioData);

    try {
        // Verificar si ya es favorito
        const checkResp = await fetch(`${API_FAVORITOS}/check/${usuario.id_usuario}/${id_pelicula}`);
        const checkData = await checkResp.json();

        if (checkData.esFavorito) {
            // Quitar de favoritos
            const respuesta = await fetch(`${API_FAVORITOS}/${usuario.id_usuario}/${id_pelicula}`, {
                method: 'DELETE'
            });
            const datos = await respuesta.json();

            if (datos.success) {
                alert('✅ Quitado de favoritos');

                // Actualizar el texto del botón
                if (botonElement) {
                    botonElement.textContent = 'Mi Lista';
                }

                // Si estamos en la sección de favoritos, recargarla
                if (document.getElementById('seccion-favoritos').classList.contains('activa')) {
                    await inicializarSeccion('favoritos');
                }
                return false; // No es favorito ahora
            }
        } else {
            // Agregar a favoritos
            const respuesta = await fetch(API_FAVORITOS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_usuario: usuario.id_usuario,
                    id_pelicula: id_pelicula
                })
            });
            const datos = await respuesta.json();

            if (datos.success) {
                alert('✅ Agregado a favoritos');

                // Actualizar el texto del botón
                if (botonElement) {
                    botonElement.textContent = 'Quitar';
                }
                return true; // Ahora es favorito
            } else {
                alert('❌ ' + datos.mensaje);
            }
        }
    } catch (error) {
        console.error('Error al manejar favorito:', error);
        alert('❌ Error al procesar favorito');
    }
}

// Modificar la función de protección para manejar favoritos
const originalManejarAccesoProtegido = manejarAccesoProtegido;
function manejarAccesoProtegido(e) {
    const elementoProtegido = e.target.closest('.require-login');

    // Si es el botón de Reproducir, redirigir al contenido
    if (elementoProtegido && elementoProtegido.classList.contains('btn-reproducir')) {
        e.preventDefault();
        e.stopPropagation();

        const usuarioLogueado = localStorage.getItem('usuarioLogueado');

        if (!usuarioLogueado) {
            modalLogin.classList.add('active');
            mostrarFormularioLogin();
        } else {
            // Obtener la URL del contenido
            const contenidoUrl = elementoProtegido.getAttribute('data-contenido-url');

            if (contenidoUrl && contenidoUrl.trim() !== '') {
                // Redirigir a la URL del contenido en una nueva pestaña
                window.open(contenidoUrl, '_blank');
            } else {
                alert('Esta película no tiene contenido disponible');
            }
        }
        return;
    }

    // Si es el botón de Mi Lista, manejar favoritos
    if (elementoProtegido && elementoProtegido.classList.contains('btn-mi-lista')) {
        e.preventDefault();
        e.stopPropagation();

        const usuarioLogueado = localStorage.getItem('usuarioLogueado');

        if (!usuarioLogueado) {
            modalLogin.classList.add('active');
            mostrarFormularioLogin();
        } else {
            // Obtener el id de la película directamente del atributo data
            const idPelicula = elementoProtegido.getAttribute('data-pelicula-id');

            if (idPelicula) {
                toggleFavorito(parseInt(idPelicula), elementoProtegido);
            }
        }
        return;
    }

    // Si es el menú de favoritos
    if (elementoProtegido && elementoProtegido.classList.contains('nav-favoritos')) {
        e.preventDefault();
        e.stopPropagation();

        const usuarioLogueado = localStorage.getItem('usuarioLogueado');

        if (!usuarioLogueado) {
            // No cambiar de sección, solo mostrar modal
            modalLogin.classList.add('active');
            mostrarFormularioLogin();
            return;
        }

        // Si está logueado, cargar la sección de favoritos
        document.querySelectorAll('.seccion-contenido').forEach(sec => sec.classList.remove('activa'));
        document.querySelectorAll('.menu a').forEach(link => link.classList.remove('nav-activo'));

        document.getElementById('seccion-favoritos').classList.add('activa');
        elementoProtegido.classList.add('nav-activo');

        inicializarSeccion('favoritos');
        return;
    }

    // Para otros elementos protegidos (notificaciones, etc.)
    if (elementoProtegido) {
        e.preventDefault();
        e.stopPropagation();

        const usuarioLogueado = localStorage.getItem('usuarioLogueado');

        if (!usuarioLogueado) {
            modalLogin.classList.add('active');
            mostrarFormularioLogin();
        } else {
            // Aquí puedes agregar funcionalidad futura para notificaciones
            console.log('Usuario autenticado - funcionalidad de notificaciones próximamente');
        }
        return;
    }
}

// ====================================
// SISTEMA DE NOTIFICACIONES
// ====================================

const API_NOTIFICACIONES = 'http://localhost:3000/api/notificaciones';
const btnNotificaciones = document.getElementById('btn-notificaciones');
const notificacionesDropdown = document.getElementById('notificaciones-dropdown');
const notificacionesLista = document.getElementById('notificaciones-lista');
const notifBadge = document.getElementById('notif-badge');
const btnMarcarTodasLeidas = document.getElementById('btn-marcar-todas-leidas');

// Cargar notificaciones del usuario
async function cargarNotificaciones() {
    const usuarioData = localStorage.getItem('usuarioLogueado');

    if (!usuarioData) {
        return;
    }

    const usuario = JSON.parse(usuarioData);

    try {
        const respuesta = await fetch(`${API_NOTIFICACIONES}/${usuario.id_usuario}`);
        const datos = await respuesta.json();

        if (datos.success) {
            mostrarNotificaciones(datos.notificaciones);
            actualizarBadgeNotificaciones();
        }
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
    }
}

// Mostrar notificaciones en el dropdown
function mostrarNotificaciones(notificaciones) {
    if (notificaciones.length === 0) {
        notificacionesLista.innerHTML = `
            <div class="notificaciones-vacio">
                <i class="bi bi-bell-slash"></i>
                <p>No tienes notificaciones</p>
            </div>
        `;
        return;
    }

    notificacionesLista.innerHTML = '';

    notificaciones.forEach(notif => {
        const fecha = formatearFecha(notif.created_at);
        const claseNoLeida = !notif.leida ? 'no-leida' : '';

        const notifHTML = `
            <div class="notificacion-item ${claseNoLeida}" data-id="${notif.id_notificacion}" data-leida="${notif.leida}">
                <div class="notificacion-tipo">${notif.tipo.replace('_', ' ')}</div>
                <div class="notificacion-mensaje">${notif.mensaje}</div>
                <div class="notificacion-fecha">${fecha}</div>
            </div>
        `;

        notificacionesLista.innerHTML += notifHTML;
    });

    // Agregar eventos de click a las notificaciones
    document.querySelectorAll('.notificacion-item').forEach(item => {
        item.addEventListener('click', async () => {
            const idNotificacion = item.getAttribute('data-id');
            const leida = item.getAttribute('data-leida') === 'true';

            if (!leida) {
                await marcarNotificacionComoLeida(idNotificacion);
                item.classList.remove('no-leida');
                item.setAttribute('data-leida', 'true');
                actualizarBadgeNotificaciones();
            }
        });
    });
}

// Formatear fecha relativa (hace 5 minutos, hace 1 hora, etc.)
function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diferencia = ahora - fecha;

    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;

    return fecha.toLocaleDateString('es-ES');
}

// Actualizar badge de notificaciones no leídas
async function actualizarBadgeNotificaciones() {
    const usuarioData = localStorage.getItem('usuarioLogueado');

    if (!usuarioData) {
        notifBadge.style.display = 'none';
        return;
    }

    const usuario = JSON.parse(usuarioData);

    try {
        const respuesta = await fetch(`${API_NOTIFICACIONES}/${usuario.id_usuario}/no-leidas`);
        const datos = await respuesta.json();

        if (datos.success && datos.total > 0) {
            notifBadge.textContent = datos.total > 99 ? '99+' : datos.total;
            notifBadge.style.display = 'flex';
        } else {
            notifBadge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error al actualizar badge:', error);
    }
}

// Marcar una notificación como leída
async function marcarNotificacionComoLeida(idNotificacion) {
    try {
        await fetch(`${API_NOTIFICACIONES}/${idNotificacion}/leer`, {
            method: 'PUT'
        });
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
    }
}

// Marcar todas las notificaciones como leídas
async function marcarTodasComoLeidas() {
    const usuarioData = localStorage.getItem('usuarioLogueado');

    if (!usuarioData) {
        return;
    }

    const usuario = JSON.parse(usuarioData);

    try {
        const respuesta = await fetch(`${API_NOTIFICACIONES}/${usuario.id_usuario}/leer-todas`, {
            method: 'PUT'
        });

        const datos = await respuesta.json();

        if (datos.success) {
            await cargarNotificaciones();
            notifBadge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error al marcar todas como leídas:', error);
    }
}

// Toggle dropdown de notificaciones
btnNotificaciones.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const usuarioLogueado = localStorage.getItem('usuarioLogueado');

    if (!usuarioLogueado) {
        // El manejador de protección ya muestra el modal
        return;
    }

    // Si está logueado, mostrar/ocultar dropdown
    const estaActivo = notificacionesDropdown.classList.contains('active');

    if (!estaActivo) {
        await cargarNotificaciones();
        notificacionesDropdown.classList.add('active');
    } else {
        notificacionesDropdown.classList.remove('active');
    }
});

// Cerrar dropdown al hacer click fuera
document.addEventListener('click', (e) => {
    if (!notificacionesDropdown.contains(e.target) && !btnNotificaciones.contains(e.target)) {
        notificacionesDropdown.classList.remove('active');
    }
});

// Botón marcar todas como leídas
btnMarcarTodasLeidas.addEventListener('click', async (e) => {
    e.preventDefault();
    await marcarTodasComoLeidas();
});

// Actualizar notificaciones cada 30 segundos si el usuario está logueado
setInterval(() => {
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');
    if (usuarioLogueado) {
        actualizarBadgeNotificaciones();
    }
}, 30000);

// Cargar notificaciones al iniciar si hay usuario logueado
window.addEventListener('load', () => {
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');
    if (usuarioLogueado) {
        actualizarBadgeNotificaciones();
    }
});

// ====================================
// SISTEMA DE BÚSQUEDA
// ====================================

const btnSearch = document.getElementById('btn-search');
const searchBar = document.getElementById('search-bar');
const inputSearch = document.getElementById('input-search');
const btnCloseSearch = document.getElementById('btn-close-search');


// Abrir barra de búsqueda
btnSearch.addEventListener('click', (e) => {
    e.preventDefault();
    searchBar.classList.add('active');
    inputSearch.focus();
});

// Cerrar barra de búsqueda y volver a la sección anterior
btnCloseSearch.addEventListener('click', () => {
    searchBar.classList.remove('active');
    inputSearch.value = '';
    volverDeBusqueda();
});

// Cerrar con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchBar.classList.contains('active')) {
        searchBar.classList.remove('active');
        inputSearch.value = '';
        volverDeBusqueda();
    }
});

// Buscar películas en tiempo real
inputSearch.addEventListener('input', (e) => {
    const textoBusqueda = e.target.value.toLowerCase().trim();

    if (textoBusqueda === '') {
        return; // No hacer nada si el input está vacío
    }

    buscarPeliculas(textoBusqueda);
});

// Función para buscar y filtrar películas - NUEVA LÓGICA
async function buscarPeliculas(texto) {
    // Guardar la sección actual antes de cambiar a búsqueda
    const seccionActiva = document.querySelector('.seccion-contenido.activa');
    if (!seccionActiva) return;

    const seccionActualNombre = seccionActiva.id.replace('seccion-', '');

    // Solo guardar si no estamos ya en búsqueda
    if (seccionActualNombre !== 'busqueda') {
        seccionAnterior = seccionActualNombre;
    }

    // Obtener TODAS las películas (de todas las secciones cargadas)
    let todasLasPeliculas = [];

    // Recopilar películas de todas las secciones cargadas
    if (secciones.inicio.cargado) {
        todasLasPeliculas = todasLasPeliculas.concat(secciones.inicio.peliculas);
    }
    if (secciones.peliculas.cargado) {
        todasLasPeliculas = todasLasPeliculas.concat(secciones.peliculas.peliculas);
    }
    if (secciones.series.cargado) {
        todasLasPeliculas = todasLasPeliculas.concat(secciones.series.peliculas);
    }

    // Si no hay secciones cargadas, cargar inicio
    if (todasLasPeliculas.length === 0) {
        todasLasPeliculas = await obtenerContenido(API_URL);
    }

    // Filtrar películas que coincidan con el texto
    const peliculasFiltradas = todasLasPeliculas.filter(pelicula => {
        return pelicula.titulo.toLowerCase().includes(texto) ||
               (pelicula.sinopsis && pelicula.sinopsis.toLowerCase().includes(texto)) ||
               (pelicula.director && pelicula.director.toLowerCase().includes(texto));
    });

    // Actualizar sección de búsqueda
    secciones.busqueda.peliculas = peliculasFiltradas;
    secciones.busqueda.cargado = true;

    // Ocultar todas las secciones
    document.querySelectorAll('.seccion-contenido').forEach(seccion => {
        seccion.classList.remove('activa');
    });

    // Mostrar sección de búsqueda
    document.getElementById('seccion-busqueda').classList.add('activa');

    // Generar contenido en la sección de búsqueda
    if (peliculasFiltradas.length > 0) {
        await generarImagenesPrincipales(peliculasFiltradas, 'mainMovie-busqueda');
        generarMiniaturas(peliculasFiltradas, 'bar-busqueda', 'busqueda');

        // Mostrar la primera película
        setTimeout(() => {
            cambiarImagenPrincipal(0, 'busqueda');
        }, 100);
    } else {
        // Mostrar mensaje de no resultados
        const contenedor = document.getElementById('mainMovie-busqueda');
        contenedor.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 500px; color: white;">
                <i class="bi bi-search" style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;"></i>
                <h2 style="opacity: 0.7;">No se encontraron resultados para "${texto}"</h2>
                <p style="opacity: 0.5;">Intenta con otro término de búsqueda</p>
            </div>
        `;
        document.getElementById('bar-busqueda').innerHTML = '';
    }
}

// Función para volver de la búsqueda a la sección anterior
function volverDeBusqueda() {
    // Verificar si estamos en la sección de búsqueda
    const seccionBusqueda = document.getElementById('seccion-busqueda');

    if (seccionBusqueda.classList.contains('activa')) {
        // Ocultar sección de búsqueda
        seccionBusqueda.classList.remove('activa');

        // Mostrar sección anterior
        const seccionAnteriorElement = document.getElementById(`seccion-${seccionAnterior}`);
        if (seccionAnteriorElement) {
            seccionAnteriorElement.classList.add('activa');
        }

        // Limpiar búsqueda
        secciones.busqueda.peliculas = [];
        secciones.busqueda.cargado = false;
    }
}

// ====================================
// SISTEMA DE FILTRADO POR GÉNEROS
// ====================================

const btnAbrirGeneros = document.getElementById('btn-abrir-generos');
const generosDropdown = document.getElementById('generos-dropdown');
const generoActualTexto = document.getElementById('genero-actual-texto');

// Toggle dropdown de géneros
btnAbrirGeneros.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    generosDropdown.classList.toggle('active');
    btnAbrirGeneros.classList.toggle('active');
});

// Cerrar dropdown al hacer click fuera
document.addEventListener('click', (e) => {
    if (!generosDropdown.contains(e.target) && !btnAbrirGeneros.contains(e.target)) {
        generosDropdown.classList.remove('active');
        btnAbrirGeneros.classList.remove('active');
    }
});

// Función para generar botones de géneros
function generarBotonesGeneros(peliculas) {
    const dropdown = document.getElementById('generos-dropdown');
    if (!dropdown) return;

    // Extraer géneros únicos de las películas
    const generosSet = new Set();
    peliculas.forEach(pelicula => {
        if (pelicula.genero) {
            // Si hay múltiples géneros separados por comas, dividirlos
            const generos = pelicula.genero.split(',').map(g => g.trim());
            generos.forEach(genero => generosSet.add(genero));
        }
    });

    // Convertir Set a Array y ordenar alfabéticamente
    const generosArray = Array.from(generosSet).sort();

    // Limpiar el dropdown (excepto el botón "Todos")
    dropdown.innerHTML = '<button class="genero-item activo" data-genero="todos">Todos</button>';

    // Agregar botones para cada género
    generosArray.forEach(genero => {
        const botonHTML = `<button class="genero-item" data-genero="${genero}">${genero}</button>`;
        dropdown.innerHTML += botonHTML;
    });

    // Agregar eventos a los botones
    const botones = dropdown.querySelectorAll('.genero-item');
    botones.forEach(boton => {
        boton.addEventListener('click', () => {
            const generoSeleccionado = boton.getAttribute('data-genero');
            const textoGenero = boton.textContent;

            filtrarPorGenero(generoSeleccionado, textoGenero);

            // Actualizar botón activo
            botones.forEach(b => b.classList.remove('activo'));
            boton.classList.add('activo');

            // Cerrar el dropdown
            generosDropdown.classList.remove('active');
            btnAbrirGeneros.classList.remove('active');
        });
    });
}

// Función para filtrar películas por género
async function filtrarPorGenero(genero, textoGenero) {
    const todasLasPeliculas = secciones.peliculas.peliculas;

    let peliculasFiltradas;

    if (genero === 'todos') {
        peliculasFiltradas = todasLasPeliculas;
        generoActualTexto.textContent = 'Todas las Películas';
    } else {
        peliculasFiltradas = todasLasPeliculas.filter(pelicula => {
            if (!pelicula.genero) return false;
            // Verificar si el género está en la lista (para películas con múltiples géneros)
            const generos = pelicula.genero.split(',').map(g => g.trim());
            return generos.includes(genero);
        });
        generoActualTexto.textContent = textoGenero;
    }

    // Regenerar el carrusel con las películas filtradas
    await generarImagenesPrincipales(peliculasFiltradas, 'mainMovie-peliculas');
    generarMiniaturas(peliculasFiltradas, 'bar-peliculas', 'peliculas');

    // Mostrar la primera película
    setTimeout(() => {
        cambiarImagenPrincipal(0, 'peliculas');
    }, 100);
}

// ====================================
// SISTEMA DE FILTRADO POR GÉNEROS PARA SERIES
// ====================================

const btnAbrirGenerosSeries = document.getElementById('btn-abrir-generos-series');
const generosDropdownSeries = document.getElementById('generos-dropdown-series');
const generoActualTextoSeries = document.getElementById('genero-actual-texto-series');

// Toggle dropdown de géneros para series
btnAbrirGenerosSeries.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    generosDropdownSeries.classList.toggle('active');
    btnAbrirGenerosSeries.classList.toggle('active');
});

// Cerrar dropdown al hacer click fuera
document.addEventListener('click', (e) => {
    if (!generosDropdownSeries.contains(e.target) && !btnAbrirGenerosSeries.contains(e.target)) {
        generosDropdownSeries.classList.remove('active');
        btnAbrirGenerosSeries.classList.remove('active');
    }
});

// Función para generar botones de géneros para series
function generarBotonesGenerosSeries(series) {
    const dropdown = document.getElementById('generos-dropdown-series');
    if (!dropdown) return;

    // Extraer géneros únicos de las series
    const generosSet = new Set();
    series.forEach(serie => {
        if (serie.genero) {
            // Si hay múltiples géneros separados por comas, dividirlos
            const generos = serie.genero.split(',').map(g => g.trim());
            generos.forEach(genero => generosSet.add(genero));
        }
    });

    // Convertir Set a Array y ordenar alfabéticamente
    const generosArray = Array.from(generosSet).sort();

    // Limpiar el dropdown (excepto el botón "Todos")
    dropdown.innerHTML = '<button class="genero-item activo" data-genero="todos">Todos</button>';

    // Agregar botones para cada género
    generosArray.forEach(genero => {
        const botonHTML = `<button class="genero-item" data-genero="${genero}">${genero}</button>`;
        dropdown.innerHTML += botonHTML;
    });

    // Agregar eventos a los botones
    const botones = dropdown.querySelectorAll('.genero-item');
    botones.forEach(boton => {
        boton.addEventListener('click', () => {
            const generoSeleccionado = boton.getAttribute('data-genero');
            const textoGenero = boton.textContent;

            filtrarPorGeneroSeries(generoSeleccionado, textoGenero);

            // Actualizar botón activo
            botones.forEach(b => b.classList.remove('activo'));
            boton.classList.add('activo');

            // Cerrar el dropdown
            generosDropdownSeries.classList.remove('active');
            btnAbrirGenerosSeries.classList.remove('active');
        });
    });
}

// Función para filtrar series por género
async function filtrarPorGeneroSeries(genero, textoGenero) {
    const todasLasSeries = secciones.series.peliculas;

    let seriesFiltradas;

    if (genero === 'todos') {
        seriesFiltradas = todasLasSeries;
        generoActualTextoSeries.textContent = 'Todas las Series';
    } else {
        seriesFiltradas = todasLasSeries.filter(serie => {
            if (!serie.genero) return false;
            // Verificar si el género está en la lista (para series con múltiples géneros)
            const generos = serie.genero.split(',').map(g => g.trim());
            return generos.includes(genero);
        });
        generoActualTextoSeries.textContent = textoGenero;
    }

    // Regenerar el carrusel con las series filtradas
    await generarImagenesPrincipales(seriesFiltradas, 'mainMovie-series');
    generarMiniaturas(seriesFiltradas, 'bar-series', 'series');

    // Mostrar la primera serie
    setTimeout(() => {
        cambiarImagenPrincipal(0, 'series');
    }, 100);
}
