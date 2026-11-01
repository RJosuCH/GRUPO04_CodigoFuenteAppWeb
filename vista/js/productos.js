document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('catalogo-grid');
    const contador = document.getElementById('contador-productos');
    const titulo = document.getElementById('titulo-resultados');
    const sinResultados = document.getElementById('sin-resultados');

    const busqueda = document.getElementById('busqueda-header');
    const minimo = document.getElementById('precio-min');
    const maximo = document.getElementById('precio-max');
    const ordenar = document.getElementById('ordenar-productos');
    const disponibles = document.getElementById('solo-disponibles');

    const categorias = document.querySelectorAll('input[name="categoria"]');

    let productos = [];
    let cargaCompleta = false;

    const mensaje = document.createElement('p');
    mensaje.setAttribute('role', 'status');
    grid.before(mensaje);

    function normalizar(texto) {
        return texto
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    function mostrarError(texto) {
        mensaje.setAttribute('role', 'alert');
        mensaje.textContent = texto;
    }

    function crearTarjeta(producto) {
        const tarjeta = document.createElement('article');
        tarjeta.className = 'catalogo-card';

        // La estructura es fija; los datos se asignan como texto.
        tarjeta.innerHTML = `
            <div class="catalogo-imagen"></div>
            <div class="catalogo-detalles">
                <span class="catalogo-categoria"></span>
                <h3 class="catalogo-nombre"></h3>
                <p class="catalogo-descripcion"></p>
                <span class="catalogo-disponible"></span>
                <div class="catalogo-precio"></div>
                <button type="button" class="catalogo-agregar"></button>
            </div>
        `;

        const contenedorImagen = tarjeta.querySelector('.catalogo-imagen');

        if (producto.imagen) {
            const imagen = document.createElement('img');

            imagen.src = producto.imagen;
            imagen.alt = producto.nombre;
            imagen.loading = 'lazy';

            imagen.addEventListener('error', () => {
                contenedorImagen.textContent = 'Imagen no disponible';
            }, { once: true });

            contenedorImagen.appendChild(imagen);
        } else {
            contenedorImagen.textContent = 'Sin imagen';
        }

        tarjeta.querySelector('.catalogo-categoria').textContent =
            producto.categoria;

        tarjeta.querySelector('.catalogo-nombre').textContent =
            producto.nombre;

        tarjeta.querySelector('.catalogo-descripcion').textContent =
            producto.descripcion;

        tarjeta.querySelector('.catalogo-precio').textContent =
            '$' + producto.precio.toFixed(2);

        const estado = tarjeta.querySelector('.catalogo-disponible');
        const boton = tarjeta.querySelector('.catalogo-agregar');
        const hayExistencias = producto.existencia > 0;

        estado.textContent = hayExistencias ? '● DISPONIBLE' : '● AGOTADO';
        estado.classList.toggle('catalogo-agotado', !hayExistencias);

        boton.textContent = hayExistencias ? 'Agregar al carrito' : 'Agotado';
        boton.disabled = !hayExistencias;

        boton.addEventListener('click', () => agregarProducto(producto));

        return tarjeta;
    }

    function filtrarProductos() {
        if (!cargaCompleta) return;

        mensaje.textContent = '';
        mensaje.setAttribute('role', 'status');

        const desde = minimo.value === '' ? 0 : Number(minimo.value);
        const hasta = maximo.value === '' ? Infinity : Number(maximo.value);

        if (
            minimo.validity.badInput ||
            maximo.validity.badInput ||
            !Number.isFinite(desde) ||
            (maximo.value !== '' && !Number.isFinite(hasta)) ||
            desde < 0 ||
            hasta < 0 ||
            desde > hasta
        ) {
            grid.replaceChildren();
            sinResultados.hidden = true;
            contador.textContent = 'Revisa los filtros de precio';

            mostrarError(
                'Usa precios válidos. El mínimo no debe superar al máximo.'
            );

            return;
        }

        const seleccionada = document.querySelector(
            'input[name="categoria"]:checked'
        );

        const categoria = seleccionada.value;
        const texto = normalizar(busqueda.value.trim());

        const resultado = productos.filter(producto => {
            const coincideCategoria =
                categoria === 'todos' ||
                normalizar(producto.categoria) === categoria;

            const contenido = normalizar(
                producto.nombre + ' ' +
                producto.descripcion + ' ' +
                producto.categoria
            );

            return coincideCategoria &&
                contenido.includes(texto) &&
                producto.precio >= desde &&
                producto.precio <= hasta &&
                (!disponibles.checked || producto.existencia > 0);
        });

        if (ordenar.value === 'menor') {
            resultado.sort((a, b) => a.precio - b.precio);
        }

        if (ordenar.value === 'mayor') {
            resultado.sort((a, b) => b.precio - a.precio);
        }

        if (ordenar.value === 'nombre') {
            resultado.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        }

        titulo.textContent = seleccionada.parentElement.textContent.trim();
        contador.textContent = `${resultado.length} productos encontrados`;

        grid.replaceChildren(...resultado.map(crearTarjeta));
        sinResultados.hidden = resultado.length !== 0;

        sinResultados.querySelector('h3').textContent =
            productos.length === 0
                ? 'Todavía no hay productos registrados'
                : 'No encontramos productos';

        sinResultados.querySelector('p').textContent =
            productos.length === 0
                ? 'Los productos aparecerán aquí cuando se registren en la base de datos.'
                : 'Prueba con otra búsqueda o cambia los filtros.';
    }

    function agregarProducto(producto) {
        // Reutilizamos el carrito actual mientras conectamos los pedidos con PHP.
        if (typeof carrito === 'undefined' || !Array.isArray(carrito)) {
            mostrarError('No se pudo abrir el carrito. Recarga la página.');
            return;
        }

        const existente = carrito.find(item =>
            item.origen === 'bd' && item.id === producto.id
        );

        const cantidad = existente ? Number(existente.cantidad) : 0;

        if (!Number.isInteger(cantidad) || cantidad < 0) {
            mostrarError(
                'El carrito contiene una cantidad inválida. Retira ese producto.'
            );
            return;
        }

        if (cantidad + 1 > producto.existencia) {
            mostrarError('No hay más unidades disponibles de este producto.');
            return;
        }

        const anterior = carrito.map(item => ({ ...item }));

        if (existente) {
            existente.cantidad = cantidad + 1;
            existente.precio = producto.precio;
            existente.nombre = producto.nombre;
        } else {
            carrito.push({
                origen: 'bd',
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: 1
            });
        }

        try {
            guardarCarrito();
        } catch (error) {
            carrito = anterior;
            mostrarError('El navegador no pudo guardar el carrito.');
            return;
        }

        mensaje.textContent = '';
        actualizarCarrito();
        abrirCarrito();
    }

    async function cargarProductos() {
        try {
            const respuesta = await fetch('acciones/listar_productos.php', {
                headers: { Accept: 'application/json' },
                cache: 'no-store'
            });

            const datos = await respuesta.json();

            if (
                !respuesta.ok ||
                datos.ok !== true ||
                !Array.isArray(datos.productos)
            ) {
                throw new Error('Respuesta inválida del servidor');
            }

            productos = datos.productos;
            cargaCompleta = true;

            filtrarProductos();

        } catch (error) {
            contador.textContent = 'Catálogo no disponible';
            sinResultados.hidden = true;

            mostrarError(
                'No se pudo cargar el catálogo. Revisa XAMPP y recarga la página.'
            );

            console.error('Error al cargar el catalogo:', error);
        }
    }

    busqueda.addEventListener('input', filtrarProductos);
    minimo.addEventListener('input', filtrarProductos);
    maximo.addEventListener('input', filtrarProductos);
    ordenar.addEventListener('change', filtrarProductos);
    disponibles.addEventListener('change', filtrarProductos);

    categorias.forEach(radio => {
        radio.addEventListener('change', filtrarProductos);
    });

    document.getElementById('buscar-header')
        .addEventListener('click', filtrarProductos);

    document.getElementById('limpiar-filtros')
        .addEventListener('click', () => {
            busqueda.value = '';
            minimo.value = '';
            maximo.value = '';
            ordenar.value = 'relevancia';
            disponibles.checked = false;

            document.querySelector(
                'input[name="categoria"][value="todos"]'
            ).checked = true;

            history.replaceState(null, '', window.location.pathname);
            filtrarProductos();
        });

    const parametros = new URLSearchParams(window.location.search);

    const categoriaURL = Array.from(categorias).find(radio =>
        radio.value === parametros.get('cat')
    );

    if (categoriaURL) categoriaURL.checked = true;

    busqueda.value = parametros.get('buscar') || '';

    cargarProductos();
});