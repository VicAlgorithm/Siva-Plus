
const imagenesPrincipales = document.querySelectorAll('.mainMovie .item');
const barra = document.querySelector('.bar');
const miniaturas = document.querySelectorAll('.bar .item1');
const btnNext = document.getElementById('next');
const btnPrev = document.getElementById('prev');
const anchoMiniatura = 200;
const gap = 30;


/*PANTALLA DE CARGA AL INICIO*/

window.addEventListener('load', () => {
    setTimeout(() => {
        cambiarImagenPrincipal(0);

        setTimeout(() => {
            document.getElementById('loading_screen').classList.add('hidden');
        }, 600);
    }, 100);
});


/*EL INDEX COMIENZA CON LA IMAGEN DE LA MINIATURA 1*/

imagenesPrincipales.forEach(img => {
    img.style.opacity = '0';
    img.style.zIndex = '0';
});

imagenesPrincipales[0].style.opacity = '1';
imagenesPrincipales[0].style.zIndex = '1';



/*CALCULAR CUANTAS MINIATURAS CABEN EN LA BARRA SEGUN EL TAMAÑO DE LA VENTANA */

function calcularMiniaturasVisibles() {
    const anchoVisible = barra.clientWidth;

    const miniaturasCompletas = Math.floor(anchoVisible / (anchoMiniatura + gap));
    return miniaturasCompletas;
}

/*CALCULAMOS EL INDICE DEL SCROLL DE LAS MINIATURAS */

function obtenerIndiceActual() {
    const scrollActual = barra.scrollLeft;

    const indice = Math.round(scrollActual / (anchoMiniatura + gap));
    return indice;
}

/*HACER SCROLL*/

function scrollearAIndice(indice) {
    const posicion = indice * (anchoMiniatura + gap);
    
    barra.scrollTo({
        left: posicion,
        behavior: 'smooth'
    });
}

/*NEXT*/

btnNext.addEventListener('click', () => {
    const indiceActual = obtenerIndiceActual();
    const miniaturasVisibles = calcularMiniaturasVisibles();
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
    
    scrollearAIndice(nuevoIndice);
});

/*PREV*/

btnPrev.addEventListener('click', () => {
    const indiceActual = obtenerIndiceActual();
    const miniaturasVisibles = calcularMiniaturasVisibles();
    const totalMiniaturas = miniaturas.length;
    
    let nuevoIndice = indiceActual - miniaturasVisibles;

    if (nuevoIndice < 0) {
        const ultimoGrupo = Math.floor((totalMiniaturas - 1) / miniaturasVisibles) * miniaturasVisibles;
        nuevoIndice = ultimoGrupo;
    }
    
    scrollearAIndice(nuevoIndice);
});


/* ANIMACIÓN DE SELECCIÓN DE MINIATURAS */

let animando = false;

function cambiarImagenPrincipal(indice) {
    if (animando) return;
    
    animando = true;
    
    const principal = document.querySelector('.main');
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

/* HACER MINIATURAS CLICKEABLES */

miniaturas.forEach((miniatura, indice) => {
    miniatura.addEventListener('click', () => {
        cambiarImagenPrincipal(indice);
    });
});