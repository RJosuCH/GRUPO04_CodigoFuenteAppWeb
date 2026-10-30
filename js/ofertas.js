const productosOferta = [
    // HERRAMIENTAS
    {
        id: 1,
        nombre: "Taladro percutor 20V",
        descripcion: "Motor sin escobillas · 2 baterías",
        precio: 112.50,
        descuento: 20,
        categoria: "herramientas",
        imagen: "imagenes/Taladro.png"
    },
    {
        id: 2,
        nombre: "Sierra circular 7¼\"",
        descripcion: "Potencia de 1,800 W · Guía láser",
        precio: 120.00,
        descuento: 15,
        categoria: "herramientas",
        imagen: "imagenes/sierra.png"
    },

    // AUTOMOTRIZ
    {
        id: 4,
        nombre: "Gato hidráulico 3 t",
        descripcion: "Perfil bajo · Elevación rápida",
        precio: 61.00,
        descuento: 15,
        categoria: "automotriz",
        imagen: "imagenes/GatoHidraulico.png"
    },
    {
        id: 5,
        nombre: "Compresor portátil",
        descripcion: "12 V · Pantalla digital · 150 PSI",
        precio: 44.95,
        descuento: 20,
        categoria: "automotriz",
        imagen: "imagenes/compresor.png"
    },

    // CONSTRUCCION
    {
        id: 7,
        nombre: "Cemento gris 50 kg",
        descripcion: "Alta resistencia · Uso estructural",
        precio: 8.95,
        descuento: 10,
        categoria: "construccion",
        imagen: "imagenes/cemento.png"
    },
    {
        id: 8,
        nombre: "Rotomartillo SDS Plus",
        descripcion: "1050 W · 3 modos de operación",
        precio: 41.00,
        descuento: 25,
        categoria: "construccion",
        imagen: "imagenes/rotomartillo.png"
    },

    // PINTURAS
    {
        id: 10,
        nombre: "Pintura interior mate",
        descripcion: "Lavable · Bajo olor · 19 L",
        precio: 26.00,
        descuento: 25,
        categoria: "pinturas",
        imagen: "imagenes/pinturaroja.png"
    },
    {
        id: 12,
        nombre: "Kit profesional 9\"",
        descripcion: "Rodillo, charola y extensión",
        precio: 24.90,
        descuento: 30,
        categoria: "pinturas",
        imagen: "imagenes/brochas.png"
    },

    // ELECTRICA
    {
        id: 13,
        nombre: "Centro de carga 12 polos",
        descripcion: "Sobreponer · Certificación NOM",
        precio: 20.00,
        descuento: 20,
        categoria: "electrica",
        imagen: "imagenes/centro-carga.png"
    },
    {
        id: 14,
        nombre: "Multímetro digital",
        descripcion: "Rango automático · True RMS",
        precio: 24.99,
        descuento: 10,
        categoria: "electrica",
        imagen: "imagenes/multimetro.png"
    },

    // PLOMERIA
    {
        id: 16,
        nombre: "Bomba presurizadora",
        descripcion: "Automática · 1/3 HP · Silenciosa",
        precio: 199.99,
        descuento: 20,
        categoria: "plomeria",
        imagen: "imagenes/bomba-presurizadora.png"
    },
    {
        id: 17,
        nombre: "Llave Stillson 14\"",
        descripcion: "Acero forjado · Mordaza ajustable",
        precio: 12.95,
        descuento: 15,
        categoria: "plomeria",
        imagen: "imagenes/llave-stillson.png"
    }
];


const ofertasGrid = document.getElementById("ofertas-grid");
const contadorOfertas = document.getElementById("contador-ofertas");
const ofertasVacio = document.getElementById("ofertas-vacio");
const buscarOferta = document.getElementById("buscar-oferta");
const ordenarOfertas = document.getElementById("ordenar-ofertas");
const botonesFiltro = document.querySelectorAll(".filtro-oferta");

let categoriaActual = "todos";

const categoriasOferta = {
    herramientas: "Herramientas",
    automotriz: "Automotriz",
    construccion: "Construcción",
    pinturas: "Pinturas",
    electrica: "Eléctrica",
    plomeria: "Plomería"
};

function calcularPrecioOferta(producto) {
    return Number(
        (producto.precio * (1 - producto.descuento / 100)).toFixed(2)
    );
}

function formatearPrecioOferta(precio) {
    return "$" + precio.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function mostrarOfertas(lista) {
    ofertasGrid.innerHTML = "";
    contadorOfertas.textContent =
        `${lista.length} promociones encontradas`;
    ofertasVacio.hidden = lista.length > 0;

    lista.forEach(producto => {
        const precioFinal = calcularPrecioOferta(producto);
        const ahorro = producto.precio - precioFinal;

        const tarjeta = document.createElement("article");
        tarjeta.className = "oferta-card";

        tarjeta.innerHTML = `
            <div class="oferta-imagen">
                <span class="oferta-descuento">
                    -${producto.descuento}% OFF
                </span>

                <img src="${producto.imagen}"
                     alt="${producto.nombre}"
                     loading="lazy">
            </div>

            <div class="oferta-detalles">
                <span class="oferta-categoria">
                    ${categoriasOferta[producto.categoria]}
                </span>

                <h3 class="oferta-nombre">
                    ${producto.nombre}
                </h3>

                <p class="oferta-descripcion">
                    ${producto.descripcion}
                </p>

                <span class="oferta-disponible">
                    ● DISPONIBLE
                </span>

                <div class="oferta-precios">
                    <p class="oferta-precio-anterior">
                        ${formatearPrecioOferta(producto.precio)}
                    </p>

                    <p class="oferta-precio-actual">
                        ${formatearPrecioOferta(precioFinal)}
                    </p>
                </div>

                <p class="oferta-ahorro">
                    Ahorras ${formatearPrecioOferta(ahorro)}
                </p>

                <button type="button" class="oferta-agregar">
                    <i class="fa-solid fa-cart-plus"></i>
                    Agregar al carrito
                </button>
            </div>
        `;

        tarjeta.querySelector(".oferta-agregar")
            .addEventListener("click", () => {
                agregarOfertaAlCarrito(producto);
            });
            ofertasGrid.appendChild(tarjeta);
    });
}

function agregarOfertaAlCarrito(producto) {
    const precioFinal = calcularPrecioOferta(producto);
    const idOferta = "oferta-" + producto.id;
    const existente = carrito.find(
        item => item.id === idOferta
    );

    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            id: idOferta,
            nombre: producto.nombre + " (Oferta)",
            precio: precioFinal,
            cantidad: 1
        });
    }
    guardarCarrito();
    actualizarCarrito();
    abrirCarrito();
}

function filtrarOfertas() {
    const texto = buscarOferta.value.trim().toLowerCase();

    let resultado = productosOferta.filter(producto => {
        const coincideCategoria =
            categoriaActual === "todos" ||
            producto.categoria === categoriaActual;

        const coincideTexto =
            producto.nombre.toLowerCase().includes(texto) ||
            producto.descripcion.toLowerCase().includes(texto) ||
            categoriasOferta[producto.categoria]
                .toLowerCase().includes(texto);

        return coincideCategoria && coincideTexto;
    });

    switch (ordenarOfertas.value) {
        case "descuento":
            resultado.sort((a, b) => b.descuento - a.descuento);
            break;

        case "menor":
            resultado.sort((a, b) =>
                calcularPrecioOferta(a) - calcularPrecioOferta(b)
            );
            break;

        case "mayor":
            resultado.sort((a, b) =>
                calcularPrecioOferta(b) - calcularPrecioOferta(a)
            );
            break;

        case "nombre":
            resultado.sort((a, b) =>
                a.nombre.localeCompare(b.nombre, "es")
            );
            break;
    }

    mostrarOfertas(resultado);
}

botonesFiltro.forEach(boton => {
    boton.addEventListener("click", () => {
        botonesFiltro.forEach(item =>
            item.classList.remove("active")
        );

        boton.classList.add("active");
        categoriaActual = boton.dataset.categoria;
        filtrarOfertas();
    });
});

buscarOferta.addEventListener("input", filtrarOfertas);
ordenarOfertas.addEventListener("change", filtrarOfertas);

document.getElementById("btn-buscar")
    .addEventListener("click", filtrarOfertas);

document.getElementById("limpiar-ofertas")
    .addEventListener("click", () => {
        buscarOferta.value = "";
        ordenarOfertas.value = "destacados";
        categoriaActual = "todos";

        botonesFiltro.forEach(boton => {
            boton.classList.toggle(
                "active",
                boton.dataset.categoria === "todos"
            );
        });
        filtrarOfertas();
    });
filtrarOfertas();
