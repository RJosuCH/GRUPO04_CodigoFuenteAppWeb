(() => {
    const A = window.APP;
    const $ = s => document.querySelector(s);

    const ruta = p =>
        A.base + "controller/index.php?p=" + p;

    const dinero = n =>
        "$" + Number(n).toFixed(2);

    const normal = s =>
        String(s)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

    const slug = p =>
        normal(p.nombre_categoria).replace(/\s+/g, "-");

    const precio = p => Number(p.precio_final);

    let productos = [];
    let carrito = {};
    let enviando = false;

    const cantidades = c =>
        Object.fromEntries(
            Object.entries(c || {})
                .filter(([, n]) => Number(n) > 0)
        );

    async function peticion(api, datos) {
        const r = await fetch(
            A.base + "controller/index.php?api=" + api,
            {
                method: datos ? "POST" : "GET",
                credentials: "same-origin",
                headers: datos
                    ? {
                        "Content-Type":
                            "application/x-www-form-urlencoded;charset=UTF-8"
                    }
                    : {},
                body: datos
                    ? new URLSearchParams({
                        csrf: A.csrf,
                        ...datos
                    })
                    : undefined
            }
        );

        const d = await r.json();

        if (!r.ok || !d.ok) {
            throw new Error(
                d.mensaje || "No se pudo completar la operación."
            );
        }

        return d;
    }

    function abrir() {
        $("#cart-drawer")?.classList.add("active");
        $("#cart-overlay")?.classList.add("active");
        document.body.classList.add("cart-open");
    }

    function cerrar() {
        $("#cart-drawer")?.classList.remove("active");
        $("#cart-overlay")?.classList.remove("active");
        document.body.classList.remove("cart-open");
    }

    function texto(nodo, selector, valor) {
        const elemento = nodo.querySelector(selector);

        if (elemento) {
            elemento.textContent = valor;
        }
    }

    function imagen(nodo, selector, p) {
        const contenedor = nodo.querySelector(selector);

        if (!p.fotografia) {
            contenedor.textContent = "Sin imagen";
            return;
        }

        const img = document.createElement("img");

        img.src = A.base + "vista/" + p.fotografia;
        img.alt = p.nombre_producto;
        img.loading = "lazy";

        img.onerror = () => {
            contenedor.textContent = "Imagen no disponible";
        };

        contenedor.replaceChildren(img);
    }

    async function cambiar(id, cantidad) {
        if (enviando) return;

        enviando = true;

        try {
            const d = await peticion("carrito", {
                id,
                cantidad
            });

            carrito = cantidades(d.carrito);

            pintarCarrito();
            abrir();
        } catch (e) {
            alert(e.message);
        } finally {
            enviando = false;
        }
    }

    function agregar(p) {
        cambiar(
            p.id_producto,
            Number(carrito[p.id_producto] || 0) + 1
        );
    }

    function pintarCarrito() {
        const contenedor = $("#cart-items");

        if (!contenedor) return;

        contenedor.replaceChildren();

        let total = 0;
        let unidades = 0;
        let invalido = false;

        for (const [id, cantidad] of Object.entries(carrito)) {
            const p = productos.find(
                p => Number(p.id_producto) === Number(id)
            );

            unidades += Number(cantidad);

            const fila = document.createElement("div");
            fila.className = "cart-item";

            const info = document.createElement("div");
            const nombre = document.createElement("h3");

            nombre.textContent = p
                ? p.nombre_producto
                : "Producto no disponible";

            const importe = document.createElement("p");

            importe.textContent = p
                ? dinero(precio(p) * cantidad)
                : "";

            const detalle = document.createElement("span");

            detalle.textContent = "Cantidad: " + cantidad;

            if (
                !p
                || Number(cantidad) > Number(p.existencia)
            ) {
                detalle.textContent +=
                    " · Revisa las existencias";

                invalido = true;
            }

            if (p) {
                total += precio(p) * cantidad;
            }

            info.append(nombre, importe, detalle);

            const eliminar = document.createElement("button");

            eliminar.type = "button";
            eliminar.textContent = "Eliminar";
            eliminar.onclick = () => cambiar(id, 0);

            fila.append(info, eliminar);
            contenedor.append(fila);
        }

        if (!unidades) {
            contenedor.innerHTML = `
                <div class="cart-empty">
                    <i class="fa-solid fa-cart-shopping"></i>
                    <p>Tu carrito está vacío.</p>
                    <p>¡Agrega productos para comenzar!</p>
                </div>
            `;
        }

        if ($("#cart-badge")) {
            $("#cart-badge").textContent = unidades;
        }

        if ($("#cart-subtotal")) {
            $("#cart-subtotal").textContent = dinero(total);
        }

        if ($("#cart-total")) {
            $("#cart-total").textContent = dinero(total);
        }

        if ($(".free-shipping")) {
            $(".free-shipping").textContent = "Por coordinar";
        }

        if ($("#checkout-btn")) {
            $("#checkout-btn").disabled =
                !unidades || invalido;
        }
    }

    function tarjeta(p, tipo) {
        const n = document.createElement(
            tipo === "catalogo" ? "article" : "div"
        );

        if (tipo === "catalogo") {
            n.className = "catalogo-card";

            n.innerHTML = `
                <div class="catalogo-imagen"></div>
                <div class="catalogo-detalles">
                    <span class="catalogo-categoria"></span>
                    <h3 class="catalogo-nombre"></h3>
                    <p class="catalogo-descripcion"></p>
                    <span class="catalogo-disponible"></span>
                    <div class="catalogo-precio"></div>
                    <button
                        class="catalogo-agregar"
                        type="button"
                    ></button>
                </div>
            `;

            imagen(n, ".catalogo-imagen", p);

            texto(
                n,
                ".catalogo-categoria",
                p.nombre_categoria
            );

            texto(n, ".catalogo-nombre", p.nombre_producto);

            texto(
                n,
                ".catalogo-descripcion",
                p.descripcion_producto || ""
            );

            texto(
                n,
                ".catalogo-disponible",
                p.existencia > 0
                    ? "● DISPONIBLE"
                    : "● AGOTADO"
            );

            texto(n, ".catalogo-precio", dinero(precio(p)));

            if (Number(p.descuento_porcentaje)) {
                const etiqueta = document.createElement("span");

                etiqueta.className = "catalogo-descuento";
                etiqueta.textContent =
                    "-" + p.descuento_porcentaje + "%";

                n.querySelector(".catalogo-imagen")
                    .append(etiqueta);
            }

            const boton = n.querySelector("button");

            boton.textContent = p.existencia > 0
                ? "Agregar al carrito"
                : "Agotado";

            boton.disabled = Number(p.existencia) === 0;
            boton.onclick = () => agregar(p);
        } else if (tipo === "inicio") {
            n.className = "product-card";

            n.innerHTML = `
                <span class="discount-tag"></span>
                <div class="foto"></div>
                <span class="product-cat"></span>
                <h3></h3>
                <div class="price-box">
                    <span class="current-price"></span>
                    <span class="old-price"></span>
                </div>
                <button
                    class="add-to-cart-btn"
                    type="button"
                >Agregar al Carrito</button>
            `;

            imagen(n, ".foto", p);

            const foto = n.querySelector(".foto");
            foto.replaceWith(...foto.childNodes);

            texto(n, ".product-cat", p.nombre_categoria);
            texto(n, "h3", p.nombre_producto);
            texto(n, ".current-price", dinero(precio(p)));

            texto(
                n,
                ".old-price",
                dinero(p.precio_producto)
            );

            texto(
                n,
                ".discount-tag",
                "-" + p.descuento_porcentaje + "%"
            );

            n.querySelector(".old-price").hidden =
                !Number(p.descuento_porcentaje);

            n.querySelector(".discount-tag").hidden =
                !Number(p.descuento_porcentaje);

            n.querySelector("button").disabled =
                Number(p.existencia) === 0;

            n.querySelector("button").onclick =
                () => agregar(p);
        } else {
            n.className = "product-card";

            n.innerHTML = `
                <div class="card-img-container"></div>
                <div class="card-details">
                    <span class="stock-tag"></span>
                    <h3 class="product-name"></h3>
                    <p class="product-specs"></p>
                    <div class="product-price"></div>
                </div>
            `;

            imagen(n, ".card-img-container", p);

            texto(
                n,
                ".stock-tag",
                p.existencia > 0 ? "DISPONIBLE" : "AGOTADO"
            );

            texto(n, ".product-name", p.nombre_producto);

            texto(
                n,
                ".product-specs",
                p.descripcion_producto || ""
            );

            texto(n, ".product-price", dinero(precio(p)));

            n.tabIndex = 0;
            n.setAttribute("role", "button");

            n.setAttribute(
                "aria-label",
                "Agregar " + p.nombre_producto + " al carrito"
            );

            const seleccionar = () => {
                if (Number(p.existencia) > 0) {
                    agregar(p);
                } else {
                    alert("Producto agotado.");
                }
            };

            n.onclick = seleccionar;

            n.onkeydown = e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    seleccionar();
                }
            };
        }

        return n;
    }

    function filtrar() {
        const grid = $("#catalogo-grid");

        if (!grid) return;

        const cat =
            $('input[name="categoria"]:checked')?.value
            || "todos";

        const busqueda = normal(
            $("#busqueda-header")?.value || ""
        );

        const min = Number($("#precio-min")?.value || 0);

        const max = $("#precio-max")?.value
            ? Number($("#precio-max").value)
            : Infinity;

        const ofertas = new URLSearchParams(
            location.search
        ).has("ofertas");

        let lista = productos.filter(p =>
            (cat === "todos" || slug(p) === cat)
            && normal(
                p.nombre_producto + " "
                + (p.descripcion_producto || "") + " "
                + p.nombre_categoria
            ).includes(busqueda)
            && precio(p) >= min
            && precio(p) <= max
            && (
                !$("#solo-disponibles")?.checked
                || p.existencia > 0
            )
            && (
                !ofertas
                || Number(p.descuento_porcentaje) > 0
            )
        );

        const orden = $("#ordenar-productos")?.value;

        if (orden === "menor") {
            lista.sort((a, b) => precio(a) - precio(b));
        }

        if (orden === "mayor") {
            lista.sort((a, b) => precio(b) - precio(a));
        }

        if (orden === "nombre") {
            lista.sort((a, b) =>
                a.nombre_producto.localeCompare(
                    b.nombre_producto,
                    "es"
                )
            );
        }

        grid.replaceChildren(
            ...lista.map(p => tarjeta(p, "catalogo"))
        );

        $("#contador-productos").textContent =
            lista.length + " productos encontrados";

        $("#sin-resultados").hidden = lista.length > 0;

        $("#titulo-resultados").textContent =
            $('input[name="categoria"]:checked')
                ?.parentElement.textContent.trim()
            || "Productos";
    }

    async function iniciar() {
        const acceso = $(".header-actions a.action-btn");

        if (acceso && A.autenticado) {
            acceso.href = ruta(
                A.admin ? "admin" : "pedidos"
            );

            texto(
                acceso,
                ".label",
                A.admin ? "Administración" : "Mi cuenta"
            );
        }

        if (!$("#cart-drawer") && !$("#catalogo-grid")) {
            return;
        }

        $("#open-cart")?.addEventListener("click", abrir);
        $("#close-cart")?.addEventListener("click", cerrar);
        $("#cart-overlay")?.addEventListener("click", cerrar);

        document.addEventListener("keydown", e => {
            if (e.key === "Escape") cerrar();
        });

        document.querySelectorAll(
            ".featured-products .add-to-cart-btn"
        ).forEach(b => {
            b.disabled = true;
        });

        const d = await peticion("datos");

        productos = d.productos;
        carrito = cantidades(d.carrito);

        pintarCarrito();

        const grid = $("#catalogo-grid");

        if (grid) {
            const params = new URLSearchParams(
                location.search
            );

            const padres = {
                "herramientas-electricas": "herramientas",
                "herramientas-manuales": "herramientas",
                "cajas-herramientas": "herramientas",
                aceites: "automotriz",
                baterias: "automotriz",
                cemento: "construccion",
                varillas: "construccion",
                interiores: "pinturas",
                brochas: "pinturas",
                cables: "electrica",
                iluminacion: "electrica",
                tuberias: "plomeria",
                griferia: "plomeria"
            };

            const cat =
                padres[params.get("cat")]
                || params.get("cat");

            document.querySelectorAll(
                'input[name="categoria"]'
            ).forEach(r => {
                if (r.value === cat) {
                    r.checked = true;
                }

                r.addEventListener("change", filtrar);
            });

            $("#busqueda-header").value =
                params.get("buscar") || "";

            [
                "#busqueda-header",
                "#precio-min",
                "#precio-max",
                "#ordenar-productos",
                "#solo-disponibles"
            ].forEach(s => {
                $(s)?.addEventListener("input", filtrar);
                $(s)?.addEventListener("change", filtrar);
            });

            $("#buscar-header")
                ?.addEventListener("click", filtrar);

            $("#limpiar-filtros")
                ?.addEventListener("click", () => {
                    [
                        "#busqueda-header",
                        "#precio-min",
                        "#precio-max"
                    ].forEach(s => {
                        $(s).value = "";
                    });

                    $("#solo-disponibles").checked = false;

                    $("#ordenar-productos").value =
                        "relevancia";

                    $(
                        'input[name="categoria"][value="todos"]'
                    ).checked = true;

                    history.replaceState(
                        null,
                        "",
                        ruta("productos")
                    );

                    filtrar();
                });

            filtrar();
        } else {
            const destino =
                $(".featured-products .products-grid")
                || $(".featured-section .products-grid");

            if (destino) {
                const lista = A.pagina === "inicio"
                    ? productos
                        .filter(p => Number(p.destacado))
                        .slice(0, 2)
                    : productos
                        .filter(p => slug(p) === A.pagina)
                        .slice(0, 3);

                destino.replaceChildren(
                    ...lista.map(p =>
                        tarjeta(
                            p,
                            A.pagina === "inicio"
                                ? "inicio"
                                : "categoria"
                        )
                    )
                );

                if (!lista.length) {
                    destino.textContent =
                        "No hay productos registrados en esta sección.";
                }
            }

            const buscar = () => {
                location.href =
                    ruta("productos")
                    + "&buscar="
                    + encodeURIComponent(
                        $(".search-box input")?.value || ""
                    );
            };

            $(".search-box button")
                ?.addEventListener("click", buscar);

            $(".search-box input")
                ?.addEventListener("keydown", e => {
                    if (e.key === "Enter") buscar();
                });
        }

        $("#checkout-btn")
            ?.addEventListener("click", async () => {
                if (enviando) return;

                if (!A.autenticado) {
                    location.href = ruta("login");
                    return;
                }

                if (!confirm(
                    "Registrar pedido pendiente de pago. "
                    + "La entrega se coordinará después."
                )) {
                    return;
                }

                enviando = true;
                $("#checkout-btn").disabled = true;

                try {
                    const d = await peticion("comprar", {
                        token: A.token
                    });

                    location.href =
                        ruta("pedidos")
                        + "&pedido="
                        + d.pedido;
                } catch (e) {
                    alert(e.message);
                    pintarCarrito();
                } finally {
                    enviando = false;
                }
            });
    }

    iniciar().catch(e => {
        const mensaje = document.createElement("p");

        mensaje.setAttribute("role", "alert");
        mensaje.textContent = e.message;

        (
            $("main")
            || $(".featured-products")
            || $(".featured-section")
            || document.body
        ).prepend(mensaje);

        if ($("#checkout-btn")) {
            $("#checkout-btn").disabled = true;
        }

        if ($("#contador-productos")) {
            $("#contador-productos").textContent =
                "No se pudo cargar el catálogo.";
        }
    });
})();