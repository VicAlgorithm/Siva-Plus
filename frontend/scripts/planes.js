// ====================================
// SISTEMA DE PLANES Y MEMBRESÍAS
// ====================================

const API_PLANES = 'http://localhost:3000/api/planes';
const API_SUSCRIPCIONES = 'http://localhost:3000/api/suscripciones';
const API_METODOS_PAGO = 'http://localhost:3000/api/metodos-pago';

// Elementos del DOM
const modalPlanes = document.getElementById('modal-planes');
const modalMetodosPago = document.getElementById('modal-metodos-pago');
const btnCerrarPlanes = document.getElementById('btn-cerrar-planes');
const btnCerrarMetodos = document.getElementById('btn-cerrar-metodos');
const btnPlan = document.getElementById('btn-plan');
const btnMetodosPago = document.getElementById('btn-metodos-pago');

// Debug: Verificar que los elementos existen
console.log('🔍 Elementos del DOM de planes:');
console.log('btnPlan:', btnPlan);
console.log('btnMetodosPago:', btnMetodosPago);
console.log('modalPlanes:', modalPlanes);
console.log('modalMetodosPago:', modalMetodosPago);

// Secciones del modal de planes
const seccionSuscripcionActiva = document.getElementById('seccion-suscripcion-activa');
const seccionSeleccionarPlan = document.getElementById('seccion-seleccionar-plan');
const planesGrid = document.getElementById('planes-grid');

// Elementos de suscripción activa
const planNombreActual = document.getElementById('plan-nombre-actual');
const fechaInicio = document.getElementById('fecha-inicio');
const fechaFin = document.getElementById('fecha-fin');
const diasRestantes = document.getElementById('dias-restantes');
const precioActual = document.getElementById('precio-actual');
const caracteristicasActuales = document.getElementById('caracteristicas-actuales');
const toggleAutoRenovacion = document.getElementById('toggle-auto-renovacion');
const btnCancelarSuscripcion = document.getElementById('btn-cancelar-suscripcion');

// Elementos de métodos de pago
const metodosLista = document.getElementById('metodos-lista');
const btnAgregarMetodo = document.getElementById('btn-agregar-metodo');
const formularioMetodoPago = document.getElementById('formulario-metodo-pago');
const formAgregarMetodo = document.getElementById('form-agregar-metodo');
const btnCancelarFormMetodo = document.getElementById('btn-cancelar-form-metodo');

// ====================================
// ABRIR MODAL DE PLANES
// ====================================

if (btnPlan) {
    console.log('✅ Event listener añadido a btn-plan');
    btnPlan.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Click en Plan detectado');

        const usuarioData = localStorage.getItem('usuarioLogueado');

        if (!usuarioData) {
            mostrarModalInfo('Sesión requerida', 'Debes iniciar sesión para ver los planes.');
            return;
        }

        const usuario = JSON.parse(usuarioData);

        // Verificar si tiene suscripción activa
        await verificarSuscripcionActiva(usuario.id_usuario);

        modalPlanes.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
} else {
    console.error('No se encontró el elemento btn-plan');
}

// ====================================
// VERIFICAR SUSCRIPCIÓN ACTIVA
// ====================================

async function verificarSuscripcionActiva(idUsuario) {
    try {
        const respuesta = await fetch(`${API_SUSCRIPCIONES}/usuario/${idUsuario}`);
        const datos = await respuesta.json();

        // Solo mostrar suscripción activa si es Premium (tiene registro en BD)
        if (datos.tiene_suscripcion && datos.suscripcion) {
            // Usuario tiene Plan Premium activo
            mostrarSuscripcionActiva(datos.suscripcion);
            seccionSuscripcionActiva.style.display = 'block';
            seccionSeleccionarPlan.style.display = 'none';
        } else {
            // Usuario tiene Plan Básico (gratis) por defecto
            mostrarPlanBasicoActivo(idUsuario);
            seccionSuscripcionActiva.style.display = 'block';
            seccionSeleccionarPlan.style.display = 'none';
        }
    } catch (error) {
        console.error('Error al verificar suscripción:', error);
        // En caso de error, mostrar Plan Básico
        mostrarPlanBasicoActivo(idUsuario);
        seccionSuscripcionActiva.style.display = 'block';
        seccionSeleccionarPlan.style.display = 'none';
    }
}

// ====================================
// MOSTRAR PLAN BÁSICO ACTIVO (POR DEFECTO)
// ====================================

function mostrarPlanBasicoActivo(idUsuario) {
    planNombreActual.textContent = 'Plan Básico (Gratis)';
    fechaInicio.textContent = 'Desde el registro';
    fechaFin.textContent = 'Ilimitado';
    diasRestantes.textContent = '∞';
    precioActual.textContent = '0.00';
    toggleAutoRenovacion.checked = false;
    toggleAutoRenovacion.disabled = true; // No se puede renovar el plan gratis

    // Mostrar características del plan básico
    caracteristicasActuales.innerHTML = `
        <li><i class="bi bi-check-circle-fill"></i> Acceso a películas y series</li>
        <li><i class="bi bi-check-circle-fill"></i> Calidad SD</li>
        <li><i class="bi bi-check-circle-fill"></i> 1 dispositivo simultáneo</li>
        <li><i class="bi bi-check-circle-fill"></i> Con anuncios ocasionales</li>
    `;

    // Cambiar el botón de cancelar por "Mejorar a Premium"
    const accionesSuscripcion = document.querySelector('.acciones-suscripcion');
    if (accionesSuscripcion) {
        // Remover el botón de cancelar y el toggle de auto-renovación
        accionesSuscripcion.innerHTML = `
            <button class="btn-mejorar-premium" id="btn-mejorar-premium">
                <i class="bi bi-star-fill"></i> Mejorar a Plan Premium
            </button>
        `;

        // Agregar event listener al nuevo botón
        const btnMejorarPremium = document.getElementById('btn-mejorar-premium');
        if (btnMejorarPremium) {
            btnMejorarPremium.addEventListener('click', () => iniciarCompraPremium(idUsuario));
        }
    }
}

// ====================================
// MOSTRAR SUSCRIPCIÓN ACTIVA (PREMIUM)
// ====================================

function mostrarSuscripcionActiva(suscripcion) {
    planNombreActual.textContent = suscripcion.nombre_plan;
    fechaInicio.textContent = formatearFechaLocal(suscripcion.fecha_inicio);
    fechaFin.textContent = formatearFechaLocal(suscripcion.fecha_fin);
    diasRestantes.textContent = suscripcion.dias_restantes;
    precioActual.textContent = suscripcion.precio;
    toggleAutoRenovacion.checked = suscripcion.auto_renovacion;
    toggleAutoRenovacion.disabled = false;

    // Mostrar características
    caracteristicasActuales.innerHTML = '';
    if (suscripcion.caracteristicas && suscripcion.caracteristicas.length > 0) {
        suscripcion.caracteristicas.forEach(caract => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${caract}`;
            caracteristicasActuales.appendChild(li);
        });
    }

    // Restaurar los botones originales de suscripción Premium
    const accionesSuscripcion = document.querySelector('.acciones-suscripcion');
    if (accionesSuscripcion) {
        accionesSuscripcion.innerHTML = `
            <label class="switch-renovacion">
                <input type="checkbox" id="toggle-auto-renovacion" ${suscripcion.auto_renovacion ? 'checked' : ''}>
                <span class="slider-renovacion"></span>
                <span class="label-renovacion">Auto-renovación</span>
            </label>
            <button class="btn-cancelar-suscripcion" id="btn-cancelar-suscripcion">
                <i class="bi bi-x-circle"></i> Cancelar Suscripción
            </button>
        `;
    }

    // Guardar ID de suscripción y agregar event listeners
    const btnCancelarNuevo = document.getElementById('btn-cancelar-suscripcion');
    const toggleNuevo = document.getElementById('toggle-auto-renovacion');

    if (btnCancelarNuevo) {
        btnCancelarNuevo.setAttribute('data-id-suscripcion', suscripcion.id_suscripcion);

        // Event listener para cancelar suscripción
        btnCancelarNuevo.addEventListener('click', async () => {
            mostrarModalConfirmacion(
                'Cancelar Suscripción',
                '¿Estás seguro de que deseas cancelar tu suscripción? Seguirás teniendo acceso hasta la fecha de vencimiento.',
                async () => {
                    try {
                        const respuesta = await fetch(`${API_SUSCRIPCIONES}/${suscripcion.id_suscripcion}/cancelar`, {
                            method: 'PUT'
                        });

                        const datos = await respuesta.json();

                        cerrarModalCustom();
                        if (datos.success) {
                            mostrarModalInfo(
                                'Suscripción Cancelada',
                                'Tu suscripción ha sido cancelada exitosamente. Seguirás teniendo acceso hasta la fecha de vencimiento.',
                                () => {
                                    modalPlanes.classList.remove('active');
                                    document.body.style.overflow = '';
                                }
                            );
                        } else {
                            mostrarModalInfo('Error', datos.mensaje);
                        }
                    } catch (error) {
                        console.error('Error al cancelar suscripción:', error);
                        cerrarModalCustom();
                        mostrarModalInfo('Error', 'Error al cancelar la suscripción. Intenta de nuevo.');
                    }
                }
            );
        });
    }

    if (toggleNuevo) {
        toggleNuevo.setAttribute('data-id-suscripcion', suscripcion.id_suscripcion);

        // Event listener para auto-renovación
        toggleNuevo.addEventListener('change', async () => {
            const autoRenovacion = toggleNuevo.checked;

            try {
                const respuesta = await fetch(`${API_SUSCRIPCIONES}/${suscripcion.id_suscripcion}/auto-renovacion`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ auto_renovacion: autoRenovacion })
                });

                const datos = await respuesta.json();

                if (!datos.success) {
                    toggleNuevo.checked = !autoRenovacion;
                    mostrarModalInfo('Error', 'Error al actualizar auto-renovación. Intenta de nuevo.');
                }
            } catch (error) {
                console.error('Error al actualizar auto-renovación:', error);
                toggleNuevo.checked = !autoRenovacion;
                mostrarModalInfo('Error', 'Error al actualizar auto-renovación. Intenta de nuevo.');
            }
        });
    }
}

// ====================================
// INICIAR COMPRA DE PLAN PREMIUM
// ====================================

async function iniciarCompraPremium(idUsuario) {
    try {
        // Verificar si el usuario tiene métodos de pago
        const respuesta = await fetch(`${API_METODOS_PAGO}/usuario/${idUsuario}`);
        const datos = await respuesta.json();

        if (datos.success && datos.metodos_pago && datos.metodos_pago.length > 0) {
            // Usuario tiene métodos de pago, mostrar opciones
            mostrarSeleccionMetodoPago(idUsuario, datos.metodos_pago);
        } else {
            // Usuario NO tiene métodos de pago, mostrar modal de confirmación
            mostrarModalConfirmacion(
                'Sin métodos de pago',
                'Para continuar con la compra del Plan Premium necesitas agregar un método de pago.',
                async () => {
                    // Si confirma, abrir modal de métodos de pago
                    modalPlanes.classList.remove('active');
                    modalMetodosPago.classList.add('active');
                    await cargarMetodosPago(idUsuario);

                    // Mostrar formulario de agregar método
                    formularioMetodoPago.style.display = 'block';
                    btnAgregarMetodo.style.display = 'none';

                    mostrarModalInfo(
                        'Instrucción',
                        'Después de agregar tu método de pago, vuelve a hacer clic en "Plan" para completar tu compra Premium.'
                    );
                }
            );
        }
    } catch (error) {
        console.error('Error al verificar métodos de pago:', error);
        mostrarModalInfo('Error', 'Error al verificar métodos de pago. Intenta de nuevo.');
    }
}

// ====================================
// MOSTRAR SELECCIÓN DE MÉTODO DE PAGO
// ====================================

function mostrarSeleccionMetodoPago(idUsuario, metodosPago) {
    // Crear contenido HTML para el modal
    let metodosHTML = metodosPago.map(metodo => `
        <div class="metodo-opcion" data-id="${metodo.id_metodo_pago}">
            <div class="metodo-icono">
                <i class="bi bi-credit-card"></i>
            </div>
            <div class="metodo-datos">
                <strong>${metodo.tipo.replace('_', ' ').toUpperCase()}</strong>
                <span>**** **** **** ${metodo.ultimos_digitos}</span>
                <span>${metodo.nombre_titular}</span>
            </div>
            ${metodo.es_principal ? '<span class="badge-principal-small">Principal</span>' : ''}
            <button class="btn-seleccionar-metodo" onclick="window.seleccionarMetodoCompra(${idUsuario}, ${metodo.id_metodo_pago}, '${metodo.tipo}', '${metodo.ultimos_digitos}')">
                Usar este método
            </button>
        </div>
    `).join('');

    metodosHTML += `
        <div class="metodo-opcion metodo-nuevo">
            <div class="metodo-icono">
                <i class="bi bi-plus-circle"></i>
            </div>
            <div class="metodo-datos">
                <strong>Agregar nuevo método</strong>
                <span>Tarjeta de crédito, débito o PayPal</span>
            </div>
            <button class="btn-seleccionar-metodo" onclick="window.abrirFormularioMetodo(${idUsuario})">
                Agregar
            </button>
        </div>
    `;

    mostrarModalSeleccion(
        'Selecciona tu método de pago',
        `<p class="subtitulo-modal">Plan Premium - $9.99/mes</p>${metodosHTML}`
    );
}

// ====================================
// CONFIRMAR COMPRA DE PLAN PREMIUM
// ====================================

async function confirmarCompraPremium(idUsuario, idMetodoPago, tipoMetodo, ultimosDigitos) {
    mostrarModalConfirmacion(
        'Confirmar compra de Plan Premium',
        `
        <div class="resumen-compra">
            <div class="detalle-compra">
                <i class="bi bi-star-fill"></i>
                <span>Plan Premium</span>
            </div>
            <div class="detalle-compra">
                <i class="bi bi-cash-stack"></i>
                <span>$9.99/mes</span>
            </div>
            <div class="detalle-compra">
                <i class="bi bi-credit-card"></i>
                <span>${tipoMetodo.replace('_', ' ').toUpperCase()} **** ${ultimosDigitos}</span>
            </div>
        </div>
        <p style="margin-top: 20px; text-align: center;">¿Deseas continuar con la compra?</p>
        `,
        async () => {
            try {
                // Obtener el ID del plan Premium (asumiendo que es el plan 2)
                const idPlanPremium = 2;

                const respuesta = await fetch(API_SUSCRIPCIONES, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_usuario: idUsuario,
                        id_plan: idPlanPremium,
                        id_metodo_pago: idMetodoPago
                    })
                });

                const datos = await respuesta.json();

                if (datos.success) {
                    cerrarModalCustom();
                    mostrarModalExito(
                        'Compra Exitosa',
                        'Ahora tienes el Plan Premium. Disfruta de todas las ventajas: 4K+HDR, 4 dispositivos, sin anuncios y más.',
                        async () => {
                            // Recargar la información de suscripción
                            await verificarSuscripcionActiva(idUsuario);
                        }
                    );
                } else {
                    cerrarModalCustom();
                    mostrarModalInfo('Error', datos.mensaje);
                }
            } catch (error) {
                console.error('Error al crear suscripción:', error);
                cerrarModalCustom();
                mostrarModalInfo('Error', 'Error al procesar la compra. Intenta de nuevo.');
            }
        }
    );
}

// ====================================
// CARGAR PLANES DISPONIBLES
// ====================================

async function cargarPlanesDisponibles() {
    try {
        const respuesta = await fetch(API_PLANES);
        const datos = await respuesta.json();

        if (datos.success) {
            mostrarPlanesEnGrid(datos.planes);
        }
    } catch (error) {
        console.error('Error al cargar planes:', error);
        planesGrid.innerHTML = '<p>Error al cargar los planes. Por favor intenta más tarde.</p>';
    }
}

// ====================================
// MOSTRAR PLANES EN GRID
// ====================================

function mostrarPlanesEnGrid(planes) {
    planesGrid.innerHTML = '';

    planes.forEach((plan, index) => {
        const caracteristicasHTML = plan.caracteristicas
            .map(caract => `<li><i class="bi bi-check-circle-fill"></i> ${caract}</li>`)
            .join('');

        const planCard = `
            <div class="plan-card ${index === 1 ? 'plan-destacado' : ''}">
                ${index === 1 ? '<div class="badge-popular">Más Popular</div>' : ''}
                <h3>${plan.nombre}</h3>
                <p class="descripcion-plan">${plan.descripcion}</p>
                <div class="precio-plan">
                    <span class="simbolo">$</span>
                    <span class="cantidad">${plan.precio}</span>
                    <span class="periodo">/mes</span>
                </div>
                <ul class="caracteristicas-lista">
                    ${caracteristicasHTML}
                </ul>
                <button class="btn-seleccionar-plan" data-id-plan="${plan.id_plan}" data-precio="${plan.precio}">
                    Seleccionar Plan
                </button>
            </div>
        `;

        planesGrid.innerHTML += planCard;
    });

    // Agregar eventos a los botones de seleccionar plan
    document.querySelectorAll('.btn-seleccionar-plan').forEach(btn => {
        btn.addEventListener('click', () => seleccionarPlan(btn.getAttribute('data-id-plan')));
    });
}

// ====================================
// SELECCIONAR PLAN
// ====================================

async function seleccionarPlan(idPlan) {
    const usuarioData = localStorage.getItem('usuarioLogueado');

    if (!usuarioData) {
        mostrarModalInfo('Sesión requerida', 'Debes iniciar sesión para suscribirte.');
        return;
    }

    const usuario = JSON.parse(usuarioData);

    // Confirmar selección
    mostrarModalConfirmacion(
        'Confirmar suscripción',
        '¿Estás seguro de que deseas suscribirte a este plan?',
        async () => {
            try {
                const respuesta = await fetch(API_SUSCRIPCIONES, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id_usuario: usuario.id_usuario,
                        id_plan: idPlan
                    })
                });

                const datos = await respuesta.json();

                cerrarModalCustom();
                if (datos.success) {
                    mostrarModalExito(
                        'Suscripción creada',
                        'Tu suscripción ha sido creada exitosamente.',
                        async () => {
                            // Recargar para mostrar la suscripción activa
                            await verificarSuscripcionActiva(usuario.id_usuario);
                        }
                    );
                } else {
                    mostrarModalInfo('Error', datos.mensaje);
                }
            } catch (error) {
                console.error('Error al crear suscripción:', error);
                cerrarModalCustom();
                mostrarModalInfo('Error', 'Error al procesar la suscripción. Intenta de nuevo.');
            }
        }
    );
}

// Event listeners para cancelar suscripción y auto-renovación
// se manejan dinámicamente en mostrarSuscripcionActiva()

// ====================================
// MÉTODOS DE PAGO
// ====================================

if (btnMetodosPago) {
    console.log('✅ Event listener añadido a btn-metodos-pago');
    btnMetodosPago.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Click en Métodos de Pago detectado');

        const usuarioData = localStorage.getItem('usuarioLogueado');

        if (!usuarioData) {
            mostrarModalInfo('Sesión requerida', 'Debes iniciar sesión para ver tus métodos de pago.');
            return;
        }

        const usuario = JSON.parse(usuarioData);
        await cargarMetodosPago(usuario.id_usuario);

        modalMetodosPago.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
} else {
    console.error('No se encontró el elemento btn-metodos-pago');
}

// ====================================
// CARGAR MÉTODOS DE PAGO
// ====================================

async function cargarMetodosPago(idUsuario) {
    try {
        const respuesta = await fetch(`${API_METODOS_PAGO}/usuario/${idUsuario}`);
        const datos = await respuesta.json();

        if (datos.success) {
            mostrarMetodosPago(datos.metodos_pago);
        }
    } catch (error) {
        console.error('Error al cargar métodos de pago:', error);
        metodosLista.innerHTML = '<p>Error al cargar métodos de pago</p>';
    }
}

// ====================================
// MOSTRAR MÉTODOS DE PAGO
// ====================================

function mostrarMetodosPago(metodos) {
    if (metodos.length === 0) {
        metodosLista.innerHTML = '<p class="sin-metodos">No tienes métodos de pago registrados</p>';
        return;
    }

    metodosLista.innerHTML = '';

    metodos.forEach(metodo => {
        const iconoTipo = obtenerIconoTipoPago(metodo.tipo);
        const textoTipo = metodo.tipo.replace('_', ' ').split(' ').map(palabra =>
            palabra.charAt(0).toUpperCase() + palabra.slice(1)
        ).join(' ');

        const metodoHTML = `
            <div class="metodo-item ${metodo.es_principal ? 'metodo-principal' : ''}">
                <div class="metodo-info">
                    <i class="bi bi-${iconoTipo}"></i>
                    <div class="metodo-detalles">
                        <strong>${textoTipo}</strong>
                        <span>${metodo.nombre_titular}</span>
                        ${metodo.ultimos_digitos ? `<span>•••• ${metodo.ultimos_digitos}</span>` : ''}
                    </div>
                </div>
                <div class="metodo-acciones">
                    ${metodo.es_principal ? '<span class="badge-principal">Principal</span>' : `
                        <button class="btn-marcar-principal" data-id="${metodo.id_metodo_pago}">
                            Marcar como principal
                        </button>
                    `}
                    <button class="btn-eliminar-metodo" data-id="${metodo.id_metodo_pago}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;

        metodosLista.innerHTML += metodoHTML;
    });

    // Agregar eventos
    document.querySelectorAll('.btn-marcar-principal').forEach(btn => {
        btn.addEventListener('click', () => marcarComoPrincipal(btn.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-eliminar-metodo').forEach(btn => {
        btn.addEventListener('click', () => eliminarMetodoPago(btn.getAttribute('data-id')));
    });
}

// ====================================
// OBTENER ICONO SEGÚN TIPO DE PAGO
// ====================================

function obtenerIconoTipoPago(tipo) {
    const iconos = {
        'tarjeta_credito': 'credit-card',
        'tarjeta_debito': 'credit-card-2-front',
        'paypal': 'paypal',
        'transferencia': 'bank'
    };
    return iconos[tipo] || 'credit-card';
}

// ====================================
// AGREGAR MÉTODO DE PAGO
// ====================================

btnAgregarMetodo?.addEventListener('click', () => {
    formularioMetodoPago.style.display = 'block';
    btnAgregarMetodo.style.display = 'none';
});

btnCancelarFormMetodo?.addEventListener('click', () => {
    formularioMetodoPago.style.display = 'none';
    btnAgregarMetodo.style.display = 'block';
    formAgregarMetodo.reset();
});

formAgregarMetodo?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuarioData = localStorage.getItem('usuarioLogueado');
    if (!usuarioData) return;

    const usuario = JSON.parse(usuarioData);

    const nuevoMetodo = {
        id_usuario: usuario.id_usuario,
        tipo: document.getElementById('tipo-pago').value,
        nombre_titular: document.getElementById('nombre-titular').value,
        ultimos_digitos: document.getElementById('ultimos-digitos').value,
        fecha_expiracion: document.getElementById('fecha-expiracion').value ?
            document.getElementById('fecha-expiracion').value + '-01' : null,
        es_principal: document.getElementById('es-principal-nuevo').checked
    };

    try {
        const respuesta = await fetch(API_METODOS_PAGO, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoMetodo)
        });

        const datos = await respuesta.json();

        if (datos.success) {
            formularioMetodoPago.style.display = 'none';
            btnAgregarMetodo.style.display = 'block';
            formAgregarMetodo.reset();
            await cargarMetodosPago(usuario.id_usuario);
            mostrarModalInfo('Método agregado', 'Método de pago agregado exitosamente.');
        } else {
            mostrarModalInfo('Error', datos.mensaje);
        }
    } catch (error) {
        console.error('Error al agregar método de pago:', error);
        mostrarModalInfo('Error', 'Error al agregar método de pago. Intenta de nuevo.');
    }
});

// ====================================
// MARCAR COMO PRINCIPAL
// ====================================

async function marcarComoPrincipal(idMetodo) {
    const usuarioData = localStorage.getItem('usuarioLogueado');
    if (!usuarioData) return;

    const usuario = JSON.parse(usuarioData);

    try {
        const respuesta = await fetch(`${API_METODOS_PAGO}/${idMetodo}/principal`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_usuario: usuario.id_usuario })
        });

        const datos = await respuesta.json();

        if (datos.success) {
            await cargarMetodosPago(usuario.id_usuario);
        } else {
            mostrarModalInfo('Error', datos.mensaje);
        }
    } catch (error) {
        console.error('Error al marcar como principal:', error);
        mostrarModalInfo('Error', 'Error al actualizar método de pago. Intenta de nuevo.');
    }
}

// ====================================
// ELIMINAR MÉTODO DE PAGO
// ====================================

async function eliminarMetodoPago(idMetodo) {
    mostrarModalConfirmacion(
        'Eliminar método de pago',
        '¿Estás seguro de que deseas eliminar este método de pago?',
        async () => {
            const usuarioData = localStorage.getItem('usuarioLogueado');
            if (!usuarioData) return;

            const usuario = JSON.parse(usuarioData);

            try {
                const respuesta = await fetch(`${API_METODOS_PAGO}/${idMetodo}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id_usuario: usuario.id_usuario })
                });

                const datos = await respuesta.json();

                cerrarModalCustom();
                if (datos.success) {
                    await cargarMetodosPago(usuario.id_usuario);
                    mostrarModalInfo('Método eliminado', 'Método de pago eliminado exitosamente.');
                } else {
                    mostrarModalInfo('Error', datos.mensaje);
                }
            } catch (error) {
                console.error('Error al eliminar método de pago:', error);
                cerrarModalCustom();
                mostrarModalInfo('Error', 'Error al eliminar método de pago. Intenta de nuevo.');
            }
        }
    );
}

// ====================================
// CERRAR MODALES
// ====================================

if (btnCerrarPlanes) {
    btnCerrarPlanes.addEventListener('click', () => {
        modalPlanes.classList.remove('active');
        document.body.style.overflow = '';
    });
}

if (btnCerrarMetodos) {
    btnCerrarMetodos.addEventListener('click', () => {
        modalMetodosPago.classList.remove('active');
        document.body.style.overflow = '';
        formularioMetodoPago.style.display = 'none';
        btnAgregarMetodo.style.display = 'block';
        formAgregarMetodo.reset();
    });
}

// Cerrar al hacer click fuera del modal
if (modalPlanes) {
    modalPlanes.addEventListener('click', (e) => {
        if (e.target === modalPlanes) {
            modalPlanes.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

if (modalMetodosPago) {
    modalMetodosPago.addEventListener('click', (e) => {
        if (e.target === modalMetodosPago) {
            modalMetodosPago.classList.remove('active');
            document.body.style.overflow = '';
            formularioMetodoPago.style.display = 'none';
            btnAgregarMetodo.style.display = 'block';
            formAgregarMetodo.reset();
        }
    });
}

// ====================================
// UTILIDADES
// ====================================

function formatearFechaLocal(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ====================================
// SISTEMA DE MODALES PERSONALIZADOS
// ====================================

// Funciones globales para callbacks desde onclick en HTML
window.seleccionarMetodoCompra = function(idUsuario, idMetodoPago, tipoMetodo, ultimosDigitos) {
    cerrarModalCustom();
    confirmarCompraPremium(idUsuario, idMetodoPago, tipoMetodo, ultimosDigitos);
};

window.abrirFormularioMetodo = async function(idUsuario) {
    cerrarModalCustom();
    modalPlanes.classList.remove('active');
    modalMetodosPago.classList.add('active');
    await cargarMetodosPago(idUsuario);
    formularioMetodoPago.style.display = 'block';
    btnAgregarMetodo.style.display = 'none';
    mostrarModalInfo(
        'Instrucción',
        'Después de agregar tu método de pago, vuelve a hacer clic en "Plan" para completar tu compra Premium.'
    );
};

function mostrarModalInfo(titulo, mensaje, callback) {
    const modalHTML = `
        <div class="modal-custom-overlay" id="modal-custom-overlay">
            <div class="modal-custom-container modal-info">
                <div class="modal-custom-header">
                    <h2>${titulo}</h2>
                </div>
                <div class="modal-custom-body">
                    <p>${mensaje}</p>
                </div>
                <div class="modal-custom-footer">
                    <button class="btn-modal-aceptar" id="btn-modal-aceptar">Aceptar</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';

    const btnAceptar = document.getElementById('btn-modal-aceptar');
    btnAceptar.addEventListener('click', () => {
        cerrarModalCustom();
        if (callback) callback();
    });
}

function mostrarModalConfirmacion(titulo, mensaje, onConfirm) {
    const modalHTML = `
        <div class="modal-custom-overlay" id="modal-custom-overlay">
            <div class="modal-custom-container modal-confirmacion">
                <div class="modal-custom-header">
                    <h2>${titulo}</h2>
                </div>
                <div class="modal-custom-body">
                    ${typeof mensaje === 'string' ? `<p>${mensaje}</p>` : mensaje}
                </div>
                <div class="modal-custom-footer">
                    <button class="btn-modal-cancelar" id="btn-modal-cancelar">Cancelar</button>
                    <button class="btn-modal-confirmar" id="btn-modal-confirmar">Confirmar</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';

    const btnCancelar = document.getElementById('btn-modal-cancelar');
    const btnConfirmar = document.getElementById('btn-modal-confirmar');

    btnCancelar.addEventListener('click', () => {
        cerrarModalCustom();
    });

    btnConfirmar.addEventListener('click', () => {
        if (onConfirm) onConfirm();
    });
}

function mostrarModalExito(titulo, mensaje, callback) {
    const modalHTML = `
        <div class="modal-custom-overlay" id="modal-custom-overlay">
            <div class="modal-custom-container modal-exito">
                <div class="modal-custom-header">
                    <h2>${titulo}</h2>
                </div>
                <div class="modal-custom-body">
                    <div class="icono-exito">
                        <i class="bi bi-check-circle-fill"></i>
                    </div>
                    <p>${mensaje}</p>
                </div>
                <div class="modal-custom-footer">
                    <button class="btn-modal-aceptar" id="btn-modal-aceptar">Aceptar</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';

    const btnAceptar = document.getElementById('btn-modal-aceptar');
    btnAceptar.addEventListener('click', () => {
        cerrarModalCustom();
        if (callback) callback();
    });
}

function mostrarModalSeleccion(titulo, contenidoHTML) {
    const modalHTML = `
        <div class="modal-custom-overlay" id="modal-custom-overlay">
            <div class="modal-custom-container modal-seleccion">
                <div class="modal-custom-header">
                    <h2>${titulo}</h2>
                    <button class="btn-cerrar-modal-custom" id="btn-cerrar-modal-custom">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="modal-custom-body">
                    ${contenidoHTML}
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';

    const btnCerrar = document.getElementById('btn-cerrar-modal-custom');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarModalCustom);
    }

    // Cerrar al hacer clic fuera
    const overlay = document.getElementById('modal-custom-overlay');
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            cerrarModalCustom();
        }
    });
}

function cerrarModalCustom() {
    const modal = document.getElementById('modal-custom-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}
