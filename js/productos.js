const productos = [
    // HERRAMIENTAS
    {
        id: 1,
        nombre: "Taladro percutor 20V",
        descripcion: "Motor sin escobillas · 2 baterías",
        precio: 112.50,
        categoria: "herramientas",
        imagen: "imagenes/Taladro.png",
        disponible: true
    },
    {
        id: 2,
        nombre: "Sierra circular 7¼\"",
        descripcion: "Potencia de 1,800 W · Guía láser",
        precio: 120.00,
        categoria: "herramientas",
        imagen: "imagenes/sierra.png",
        disponible: true
    },
    {
        id: 3,
        nombre: "Juego mecánico 108 pzas.",
        descripcion: "Acero cromo vanadio · Estuche rígido",
        precio: 62.00,
        categoria: "herramientas",
        imagen: "imagenes/ToolCase.png",
        disponible: true
    },

    // AUTOMOTRIZ
    {
        id: 4,
        nombre: "Gato hidráulico 3 t",
        descripcion: "Perfil bajo · Elevación rápida",
        precio: 61.00,
        categoria: "automotriz",
        imagen: "imagenes/GatoHidraulico.png",
        disponible: true
    },
    {
        id: 5,
        nombre: "Compresor portátil",
        descripcion: "12 V · Pantalla digital · 150 PSI",
        precio: 44.95,
        categoria: "automotriz",
        imagen: "imagenes/compresor.png",
        disponible: true
    },
    {
        id: 6,
        nombre: "Aceite sintético 5W-30",
        descripcion: "Protección avanzada · 4.73 L",
        precio: 22.99,
        categoria: "automotriz",
        imagen: "imagenes/aceite.png",
        disponible: true
    },

    // CONSTRUCCION
    {
        id: 7,
        nombre: "Cemento gris 50 kg",
        descripcion: "Alta resistencia · Uso estructural",
        precio: 8.95,
        categoria: "construccion",
        imagen: "imagenes/cemento.png",
        disponible: true
    },
    {
        id: 8,
        nombre: "Rotomartillo SDS Plus",
        descripcion: "1050 W · 3 modos de operación",
        precio: 41.00,
        categoria: "construccion",
        imagen: "imagenes/rotomartillo.png",
        disponible: true
    },
    {
        id: 9,
        nombre: "Nivel láser 360°",
        descripcion: "Línea verde · Alcance de 30 m",
        precio: 85.99,
        categoria: "construccion",
        imagen: "imagenes/laser.png",
        disponible: true
    },

    // PINTURAS
    {
        id: 10,
        nombre: "Pintura interior mate",
        descripcion: "Lavable · Bajo olor · 19 L",
        precio: 26.00,
        categoria: "pinturas",
        imagen: "imagenes/pinturaroja.png",
        disponible: true
    },
    {
        id: 11,
        nombre: "Esmalte multiusos",
        descripcion: "Secado rápido · Alto brillo · 4 L",
        precio: 47.90,
        categoria: "pinturas",
        imagen: "imagenes/paintceleste.png",
        disponible: true
    },
    {
        id: 12,
        nombre: "Kit profesional 9\"",
        descripcion: "Rodillo, charola y extensión",
        precio: 24.90,
        categoria: "pinturas",
        imagen: "imagenes/brochas.png",
        disponible: true
    },

    // ELECTRICA
    {
        id: 13,
        nombre: "Centro de carga 12 polos",
        descripcion: "Sobreponer · Certificación NOM",
        precio: 20.00,
        categoria: "electrica",
        imagen: "imagenes/centro-carga.png",
        disponible: true
    },
    {
        id: 14,
        nombre: "Multímetro digital",
        descripcion: "Rango automático · True RMS",
        precio: 24.99,
        categoria: "electrica",
        imagen: "imagenes/multimetro.png",
        disponible: true
    },
    {
        id: 15,
        nombre: "Cable THW-LS calibre 12",
        descripcion: "Rollo 100 m · Cobre 100%",
        precio: 49.99,
        categoria: "electrica",
        imagen: "imagenes/cable-thw.png",
        disponible: true
    },

    {
        id: 16,
        nombre: "Bomba presurizadora",
        descripcion: "Automática · 1/3 HP · Silenciosa",
        precio: 199.99,
        categoria: "plomeria",
        imagen: "imagenes/bomba-presurizadora.png",
        disponible: true
    },
    {
        id: 17,
        nombre: "Llave Stillson 14\"",
        descripcion: "Acero forjado · Mordaza ajustable",
        precio: 12.95,
        categoria: "plomeria",
        imagen: "imagenes/llave-stillson.png",
        disponible: true
    },
    {
        id: 18,
        nombre: "Kit mezcladora monomando",
        descripcion: "Acabado cromo · Ahorro de agua",
        precio: 22.99,
        categoria: "plomeria",
        imagen: "imagenes/kit-mezcladora.png",
        disponible: true
    }
];

const catalogoGrid = document.getElementById("catalogo-grid");
const contador = document.getElementById("contador-productos");
const tituloResultados = document.getElementById("titulo-resultados");
const sinResultados = document.getElementById("sin-resultados");

const busqueda = document.getElementById("busqueda-header");
const precioMin = document.getElementById("precio-min");
const precioMax = document.getElementById("precio-max");
const ordenar = document.getElementById("ordenar-productos");
const disponibles = document.getElementById("solo-disponibles");

const categorias = document.querySelectorAll(
    'input[name="categoria"]'
);

const nombresCategorias = {
    todos: "Todos los productos",
    herramientas: "Herramientas",
    automotriz: "Automotriz",
    construccion: "Construcción",
    pinturas: "Pinturas",
    electrica: "Eléctrica",
    plomeria: "Plomería"
};

function formatoPrecio(precio) {
    return "$" + precio.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function mostrarProductos(lista) {
    catalogoGrid.innerHTML = "";

    contador.textContent = `${lista.length} productos encontrados`;
    sinResultados.hidden = lista.length !== 0;

    lista.forEach(producto => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "catalogo-card";

        tarjeta.innerHTML = `
            <div class="catalogo-imagen">
                <img src="${producto.imagen}"
                     alt="${producto.nombre}"
                     loading="lazy">
            </div>

            <div class="catalogo-detalles">
                <span class="catalogo-categoria">
                    ${nombresCategorias[producto.categoria]}
                </span>

                <h3 class="catalogo-nombre">
                    ${producto.nombre}
                </h3>

                <p class="catalogo-descripcion">
                    ${producto.descripcion}
                </p>

                <span class="${producto.disponible
                    ? 'catalogo-disponible'
                    : 'catalogo-disponible catalogo-agotado'}">
                    ${producto.disponible
                        ? '● DISPONIBLE'
                        : '● AGOTADO'}
                </span>

                <div class="catalogo-precio">
                    ${formatoPrecio(producto.precio)}
                </div>

                <button type="button"
                        class="catalogo-agregar"
                        ${!producto.disponible ? "disabled" : ""}>
                    <i class="fa-solid fa-cart-plus"></i>
                    ${producto.disponible
                        ? "Agregar al carrito"
                        : "Agotado"}
                </button>
            </div>
        `;

        const boton = tarjeta.querySelector(".catalogo-agregar");

        if (producto.disponible) {
            boton.addEventListener("click", () => {
                agregarProductoCatalogo(producto);
            });
        }
        catalogoGrid.appendChild(tarjeta);
    });
}

function agregarProductoCatalogo(producto) {
    // Usa el mismo carrito de main.js.
    const existente = carrito.find(
        item => item.id === producto.id ||
        item.nombre === producto.nombre
    );

    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1
        });
    }

    guardarCarrito();
    actualizarCarrito();
    abrirCarrito();
}

function filtrarProductos() {
    const categoriaSeleccionada = document.querySelector(
        'input[name="categoria"]:checked'
    ).value;

    const texto = busqueda.value.trim().toLowerCase();
    const minimo = precioMin.value === ""
        ? 0 : Number(precioMin.value);

    const maximo = precioMax.value === ""
        ? Infinity : Number(precioMax.value);

    let resultado = productos.filter(producto => {
        const coincideCategoria =
            categoriaSeleccionada === "todos" ||
            producto.categoria === categoriaSeleccionada;

            const coincideBusqueda =
            producto.nombre.toLowerCase().includes(texto) ||
            producto.descripcion.toLowerCase().includes(texto) ||
            nombresCategorias[producto.categoria]
                .toLowerCase().includes(texto);

            const coincidePrecio =
            producto.precio >= minimo &&
            producto.precio <= maximo;

            const coincideDisponibilidad =
            !disponibles.checked || producto.disponible;
            return coincideCategoria &&
               coincideBusqueda &&
               coincidePrecio &&
               coincideDisponibilidad;
        });
    if (ordenar.value === "menor") {
        resultado.sort((a, b) => a.precio - b.precio);
    }
    if (ordenar.value === "mayor") {
        resultado.sort((a, b) => b.precio - a.precio);
    }
    if (ordenar.value === "nombre") {
        resultado.sort((a, b) =>
            a.nombre.localeCompare(b.nombre, "es")
        );
    }

    tituloResultados.textContent =
        nombresCategorias[categoriaSeleccionada];

    mostrarProductos(resultado);
}

busqueda.addEventListener("input", filtrarProductos);
precioMin.addEventListener("input", filtrarProductos);
precioMax.addEventListener("input", filtrarProductos);
ordenar.addEventListener("change", filtrarProductos);
disponibles.addEventListener("change", filtrarProductos);

categorias.forEach(radio => {
    radio.addEventListener("change", filtrarProductos);
});

document.getElementById("buscar-header")
    .addEventListener("click", filtrarProductos);

document.getElementById("limpiar-filtros")
    .addEventListener("click", () => {
        busqueda.value = "";
        precioMin.value = "";
        precioMax.value = "";
        ordenar.value = "relevancia";
        disponibles.checked = false;

        document.querySelector(
            'input[name="categoria"][value="todos"]'
        ).checked = true;

        history.replaceState(null, "", "productos.html");
        filtrarProductos();
    });

function cargarFiltrosURL() {
    const parametros = new URLSearchParams(window.location.search);
    const categoria = parametros.get("cat");
    const texto = parametros.get("buscar");
    if (categoria) {
        const radio = Array.from(categorias).find(
            item => item.value === categoria
        );
        if (radio) radio.checked = true;
    }
    if (texto) {
        busqueda.value = texto;
    }
    filtrarProductos();
}

cargarFiltrosURL();
