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
                        <button class="btn-reproducir require-login" data-contenido-url="${pelicula.contenido_url || ''}" data-premium="${pelicula.premium || false}">Reproducir</button>
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
                ${pelicula.premium ? '<span class="badge-premium-miniatura"><i class="bi bi-star-fill"></i></span>' : ''}
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

    // Generar botones de géneros para todas las secciones
    generarBotonesGenerosUnificado(seccion, peliculas);
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

    // Si es el botón de Reproducir, abrir reproductor
    if (elementoProtegido && elementoProtegido.classList.contains('btn-reproducir')) {
        e.preventDefault();
        e.stopPropagation();

        const usuarioLogueado = localStorage.getItem('usuarioLogueado');

        if (!usuarioLogueado) {
            modalLogin.classList.add('active');
            mostrarFormularioLogin();
        } else {
            // Verificar si el contenido es premium
            const esPremium = elementoProtegido.getAttribute('data-premium') === 'true';

            if (esPremium) {
                // Verificar si el usuario tiene plan premium
                const usuario = JSON.parse(usuarioLogueado);

                // Verificar suscripción activa
                fetch(`http://localhost:3000/api/suscripciones/usuario/${usuario.id_usuario}`)
                    .then(res => res.json())
                    .then(async datos => {
                        if (datos.success && datos.tiene_suscripcion && datos.suscripcion) {
                            // Usuario tiene plan premium activo, puede reproducir
                            const contenidoUrl = elementoProtegido.getAttribute('data-contenido-url');

                            if (contenidoUrl && contenidoUrl.trim() !== '') {
                                abrirReproductor(contenidoUrl);
                            } else {
                                alert('Esta película no tiene contenido disponible');
                            }
                        } else {
                            // Usuario tiene plan básico, mostrar modal de planes
                            const modalPlanes = document.getElementById('modal-planes');
                            if (modalPlanes && typeof verificarSuscripcionActiva === 'function') {
                                await verificarSuscripcionActiva(usuario.id_usuario);
                                modalPlanes.classList.add('active');
                                document.body.style.overflow = 'hidden';
                            }
                        }
                    })
                    .catch(error => {
                        console.error('Error al verificar suscripción:', error);
                        alert('Error al verificar tu plan. Intenta de nuevo.');
                    });
            } else {
                // Contenido gratuito, reproducir directamente
                const contenidoUrl = elementoProtegido.getAttribute('data-contenido-url');

                if (contenidoUrl && contenidoUrl.trim() !== '') {
                    // Abrir reproductor en modal
                    abrirReproductor(contenidoUrl);
                } else {
                    alert('Esta película no tiene contenido disponible');
                }
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
// SISTEMA DE FILTRADO POR GÉNEROS UNIFICADO
// ====================================

// Delegación de eventos para TODOS los botones de género
document.addEventListener('click', (e) => {
    // Abrir/cerrar dropdown
    if (e.target.closest('.btn-abrir-generos-general')) {
        e.preventDefault();
        e.stopPropagation();

        const boton = e.target.closest('.btn-abrir-generos-general');
        const dropdown = boton.parentElement.querySelector('.generos-dropdown-general');

        // Cerrar todos los otros dropdowns
        document.querySelectorAll('.generos-dropdown-general').forEach(d => {
            if (d !== dropdown) {
                d.classList.remove('active');
            }
        });

        document.querySelectorAll('.btn-abrir-generos-general').forEach(b => {
            if (b !== boton) {
                b.classList.remove('active');
            }
        });

        // Toggle el dropdown actual
        dropdown.classList.toggle('active');
        boton.classList.toggle('active');
        return;
    }

    // Filtrar por género
    if (e.target.classList.contains('genero-item')) {
        const generoSeleccionado = e.target.getAttribute('data-genero');
        const textoGenero = e.target.textContent;

        // Determinar en qué sección estamos
        const seccionActiva = document.querySelector('.seccion-contenido.activa');
        if (!seccionActiva) return;

        const seccion = seccionActiva.id.replace('seccion-', '');

        // Filtrar por género
        filtrarPorGeneroUnificado(seccion, generoSeleccionado, textoGenero);

        // Actualizar botones activos en el dropdown correspondiente
        const dropdown = e.target.closest('.generos-dropdown-general');
        dropdown.querySelectorAll('.genero-item').forEach(b => b.classList.remove('activo'));
        e.target.classList.add('activo');

        // Cerrar el dropdown
        dropdown.classList.remove('active');
        dropdown.parentElement.querySelector('.btn-abrir-generos-general').classList.remove('active');
        return;
    }

    // Cerrar dropdowns al hacer click fuera
    if (!e.target.closest('.generos-container')) {
        document.querySelectorAll('.generos-dropdown-general').forEach(d => {
            d.classList.remove('active');
        });
        document.querySelectorAll('.btn-abrir-generos-general').forEach(b => {
            b.classList.remove('active');
        });
    }
});

// Función para generar botones de géneros de forma unificada
function generarBotonesGenerosUnificado(seccion, contenido) {
    const dropdown = document.getElementById(`generos-dropdown-${seccion}`);
    if (!dropdown) return;

    // Extraer géneros únicos
    const generosSet = new Set();
    contenido.forEach(item => {
        if (item.genero) {
            const generos = item.genero.split(',').map(g => g.trim());
            generos.forEach(genero => generosSet.add(genero));
        }
    });

    // Convertir a array y ordenar
    const generosArray = Array.from(generosSet).sort();

    // Limpiar y agregar botón "Todos"
    dropdown.innerHTML = '<button class="genero-item activo" data-genero="todos">Todos</button>';

    // Agregar botones de géneros
    generosArray.forEach(genero => {
        const botonHTML = `<button class="genero-item" data-genero="${genero}">${genero}</button>`;
        dropdown.innerHTML += botonHTML;
    });
}

// Función para filtrar por género de forma unificada
async function filtrarPorGeneroUnificado(seccion, genero, textoGenero) {
    const contenidoCompleto = secciones[seccion].peliculas;
    const botonTexto = document.getElementById(`genero-actual-texto-${seccion}`);

    if (!contenidoCompleto || !botonTexto) return;

    let contenidoFiltrado;

    if (genero === 'todos') {
        contenidoFiltrado = contenidoCompleto;
        // Actualizar texto según la sección
        if (seccion === 'peliculas') {
            botonTexto.textContent = 'Todas las Películas';
        } else if (seccion === 'series') {
            botonTexto.textContent = 'Todas las Series';
        } else if (seccion === 'inicio') {
            botonTexto.textContent = 'Todo el Contenido';
        } else if (seccion === 'favoritos') {
            botonTexto.textContent = 'Todos los Favoritos';
        } else if (seccion === 'busqueda') {
            botonTexto.textContent = 'Todos los Resultados';
        }
    } else {
        contenidoFiltrado = contenidoCompleto.filter(item => {
            if (!item.genero) return false;
            const generos = item.genero.split(',').map(g => g.trim());
            return generos.includes(genero);
        });
        botonTexto.textContent = textoGenero;
    }

    // Regenerar carrusel
    await generarImagenesPrincipales(contenidoFiltrado, `mainMovie-${seccion}`);
    generarMiniaturas(contenidoFiltrado, `bar-${seccion}`, seccion);

    // Mostrar primera película/serie
    setTimeout(() => {
        cambiarImagenPrincipal(0, seccion);
    }, 100);
}

// ====================================
// REPRODUCTOR DE VIDEO (YouTube) CON CONTROLES PERSONALIZADOS
// ====================================

let playerYT = null;
let intervaloActualizacion = null;
const modalReproductor = document.getElementById('modal-reproductor');
const btnCerrarReproductor = document.getElementById('btn-cerrar-reproductor');
const controlesOverlay = document.getElementById('controles-overlay');
const btnPlayCentral = document.getElementById('btn-play-central');
const btnPlayPause = document.getElementById('btn-play-pause');
const btnVolume = document.getElementById('btn-volume');
const volumeRange = document.getElementById('volume-range');
const btnFullscreen = document.getElementById('btn-fullscreen');
const progressBar = document.getElementById('progress-bar');
const progressFilled = document.getElementById('progress-filled');
const tiempoActual = document.getElementById('tiempo-actual');
const tiempoTotal = document.getElementById('tiempo-total');

// Cargar API de YouTube
function cargarAPIYouTube() {
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
}

// Función que se ejecuta cuando la API de YouTube está lista
window.onYouTubeIframeAPIReady = function() {
    console.log('✅ API de YouTube cargada');
};

// Extraer ID de video de YouTube desde URL
function extraerVideoIdYouTube(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

// Formatear tiempo (segundos a MM:SS)
function formatearTiempo(segundos) {
    const mins = Math.floor(segundos / 60);
    const secs = Math.floor(segundos % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Actualizar barra de progreso
function actualizarProgreso() {
    if (!playerYT || typeof playerYT.getCurrentTime !== 'function') return;

    const tiempoActualSeg = playerYT.getCurrentTime();
    const duracionSeg = playerYT.getDuration();

    if (duracionSeg) {
        const porcentaje = (tiempoActualSeg / duracionSeg) * 100;
        progressFilled.style.width = porcentaje + '%';
        tiempoActual.textContent = formatearTiempo(tiempoActualSeg);
        tiempoTotal.textContent = formatearTiempo(duracionSeg);
    }
}

// Ocultar elementos de marca de YouTube
function ocultarElementosYouTube() {
    // Intentar acceder al iframe del reproductor
    try {
        const playerFrame = document.getElementById('player-youtube');

        if (playerFrame) {
            // Agregar estilos directamente al iframe para ocultar elementos
            const style = document.createElement('style');
            style.textContent = `
                .ytp-chrome-top,
                .ytp-show-cards-title,
                .ytp-title,
                .ytp-title-text,
                .ytp-title-link,
                .ytp-title-channel,
                .ytp-watermark,
                .ytp-gradient-top,
                .ytp-cards-button,
                .ytp-cards-teaser,
                .ytp-ce-element,
                .ytp-pause-overlay,
                .ytp-suggested-action,
                .iv-branding,
                .branding-img,
                .annotation,
                .ytp-chrome-top-buttons {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                }
            `;

            // Intentar aplicar el estilo en el documento principal
            if (!document.getElementById('youtube-hide-style')) {
                style.id = 'youtube-hide-style';
                document.head.appendChild(style);
            }
        }
    } catch (error) {
        // Los iframes de dominios diferentes bloquean el acceso por seguridad
        console.log('No se puede acceder al contenido del iframe de YouTube por políticas de seguridad');
    }
}

// Abrir reproductor con video de YouTube
function abrirReproductor(videoUrl) {
    const videoId = extraerVideoIdYouTube(videoUrl);

    if (!videoId) {
        alert('❌ URL de YouTube no válida');
        return;
    }

    modalReproductor.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (playerYT) {
        playerYT.loadVideoById(videoId);
    } else {
        playerYT = new YT.Player('player-youtube', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                autoplay: 1,
                controls: 0,
                modestbranding: 1,
                rel: 0,
                fs: 0,
                disablekb: 1,
                iv_load_policy: 3,
                showinfo: 0,
                autohide: 1,
                playsinline: 1,
                cc_load_policy: 0,
                color: 'white'
            },
            events: {
                onReady: function(event) {
                    event.target.playVideo();
                    btnPlayCentral.classList.add('playing');
                    actualizarIconoPlay(true);
                    iniciarActualizacionProgreso();

                    // Ocultar elementos de marca de YouTube después de cargar
                    ocultarElementosYouTube();
                },
                onStateChange: function(event) {
                    if (event.data === YT.PlayerState.PLAYING) {
                        btnPlayCentral.classList.add('playing');
                        actualizarIconoPlay(true);
                        iniciarActualizacionProgreso();

                        // Asegurar que los elementos permanezcan ocultos al reproducir
                        ocultarElementosYouTube();
                    } else if (event.data === YT.PlayerState.PAUSED) {
                        btnPlayCentral.classList.remove('playing');
                        actualizarIconoPlay(false);
                        detenerActualizacionProgreso();
                    }
                }
            }
        });
    }
}

// Actualizar icono de play/pause
function actualizarIconoPlay(estaReproduciendo) {
    const iconoPlayPause = btnPlayPause.querySelector('i');
    const iconoPlayCentral = btnPlayCentral.querySelector('i');

    if (estaReproduciendo) {
        iconoPlayPause.className = 'bi bi-pause-fill';
        iconoPlayCentral.className = 'bi bi-pause-fill';
    } else {
        iconoPlayPause.className = 'bi bi-play-fill';
        iconoPlayCentral.className = 'bi bi-play-fill';
    }
}

// Iniciar actualización de progreso
function iniciarActualizacionProgreso() {
    detenerActualizacionProgreso();
    intervaloActualizacion = setInterval(actualizarProgreso, 100);
}

// Detener actualización de progreso
function detenerActualizacionProgreso() {
    if (intervaloActualizacion) {
        clearInterval(intervaloActualizacion);
        intervaloActualizacion = null;
    }
}

// Cerrar reproductor
function cerrarReproductor() {
    modalReproductor.classList.remove('active');
    document.body.style.overflow = '';
    detenerActualizacionProgreso();

    if (playerYT) {
        playerYT.pauseVideo();
    }

    btnPlayCentral.classList.remove('playing');
    progressFilled.style.width = '0%';
}

// Eventos de controles personalizados

// Play/Pause (botón central)
btnPlayCentral.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!playerYT) return;

    const estado = playerYT.getPlayerState();
    if (estado === YT.PlayerState.PLAYING) {
        playerYT.pauseVideo();
    } else {
        playerYT.playVideo();
    }
});

// Play/Pause (botón inferior)
btnPlayPause.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!playerYT) return;

    const estado = playerYT.getPlayerState();
    if (estado === YT.PlayerState.PLAYING) {
        playerYT.pauseVideo();
    } else {
        playerYT.playVideo();
    }
});

// Control de volumen
volumeRange.addEventListener('input', (e) => {
    if (!playerYT) return;
    playerYT.setVolume(e.target.value);
    actualizarIconoVolumen(e.target.value);
});

function actualizarIconoVolumen(volumen) {
    const icono = btnVolume.querySelector('i');
    if (volumen == 0) {
        icono.className = 'bi bi-volume-mute-fill';
    } else if (volumen < 50) {
        icono.className = 'bi bi-volume-down-fill';
    } else {
        icono.className = 'bi bi-volume-up-fill';
    }
}

// Mute/Unmute al click en icono de volumen
btnVolume.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!playerYT) return;

    if (playerYT.isMuted()) {
        playerYT.unMute();
        volumeRange.value = playerYT.getVolume();
        actualizarIconoVolumen(volumeRange.value);
    } else {
        playerYT.mute();
        actualizarIconoVolumen(0);
    }
});

// Fullscreen
btnFullscreen.addEventListener('click', (e) => {
    e.stopPropagation();
    const container = document.querySelector('.reproductor-wrapper');

    if (!document.fullscreenElement) {
        container.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

// Barra de progreso - Seek
progressBar.addEventListener('click', (e) => {
    if (!playerYT) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const porcentaje = clickX / rect.width;
    const duracion = playerYT.getDuration();
    const nuevoTiempo = duracion * porcentaje;

    playerYT.seekTo(nuevoTiempo);
});

// Mostrar/ocultar controles al mover el mouse
let timeoutControles;
let timeoutOcultarControles;

function mostrarControles() {
    controlesOverlay.classList.add('mostrar');
    btnCerrarReproductor.classList.add('mostrar');
    reproductorContent.style.cursor = 'default';

    // Limpiar timeouts anteriores
    clearTimeout(timeoutControles);
    clearTimeout(timeoutOcultarControles);

    // Ocultar controles después de 3 segundos de inactividad
    timeoutOcultarControles = setTimeout(() => {
        if (playerYT && playerYT.getPlayerState() === YT.PlayerState.PLAYING) {
            controlesOverlay.classList.remove('mostrar');
            btnCerrarReproductor.classList.remove('mostrar');
            reproductorContent.style.cursor = 'none';
        }
    }, 3000);
}

function ocultarControlesInmediato() {
    clearTimeout(timeoutControles);
    clearTimeout(timeoutOcultarControles);
    if (playerYT && playerYT.getPlayerState() === YT.PlayerState.PLAYING) {
        controlesOverlay.classList.remove('mostrar');
        btnCerrarReproductor.classList.remove('mostrar');
        reproductorContent.style.cursor = 'none';
    }
}

// Mostrar controles al mover el mouse dentro del reproductor
const reproductorContent = document.querySelector('.reproductor-content');

reproductorContent.addEventListener('mousemove', mostrarControles);
reproductorContent.addEventListener('mouseenter', mostrarControles);
reproductorContent.addEventListener('mouseleave', () => {
    clearTimeout(timeoutControles);
    clearTimeout(timeoutOcultarControles);
    timeoutControles = setTimeout(ocultarControlesInmediato, 500);
});

// Eventos para cerrar reproductor
btnCerrarReproductor.addEventListener('click', cerrarReproductor);
document.querySelector('.reproductor-overlay').addEventListener('click', cerrarReproductor);

document.addEventListener('keydown', (e) => {
    if (modalReproductor.classList.contains('active')) {
        if (e.key === 'Escape') {
            cerrarReproductor();
        } else if (e.key === ' ') {
            e.preventDefault();
            if (playerYT) {
                const estado = playerYT.getPlayerState();
                if (estado === YT.PlayerState.PLAYING) {
                    playerYT.pauseVideo();
                } else {
                    playerYT.playVideo();
                }
            }
        }
    }
});

// Cargar API de YouTube al iniciar
cargarAPIYouTube();
