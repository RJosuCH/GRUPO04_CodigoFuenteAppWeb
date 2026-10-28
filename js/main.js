
const drawer = document.getElementById("cart-drawer");
const overlay = document.getElementById("cart-overlay");
const cartItems = document.getElementById("cart-items");
const cartBadge = document.getElementById("cart-badge");

const subtotalElement = document.getElementById("cart-subtotal");
const totalElement = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");

let carrito = [];

const precios = {
    "Taladro Percutor 20V": 89.99,
    "Pintura Latex 5 Gal": 45.00
};

function abrirCarrito() {
    drawer.classList.add("active");
    overlay.classList.add("active");
    document.body.classList.add("cart-open");
}

function cerrarCarrito() {
    drawer.classList.remove("active");
    overlay.classList.remove("active");
    document.body.classList.remove("cart-open");
}

document.getElementById("open-cart").addEventListener("click", abrirCarrito);
document.getElementById("close-cart").addEventListener("click", cerrarCarrito);
overlay.addEventListener("click", cerrarCarrito);

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") cerrarCarrito();
});

function agregarAlCarrito(nombre) {
    const precio = precios[nombre];

    if (precio === undefined) {
        alert("No se encontró el precio de este producto.");
        return;
    }

    const existente = carrito.find(producto => producto.nombre === nombre);

    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            nombre: nombre,
            precio: precio,
            cantidad: 1
        });
    }

    actualizarCarrito();
    abrirCarrito();
}

function actualizarCarrito() {
    cartItems.innerHTML = "";

    if (carrito.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <i class="fa-solid fa-cart-shopping"
                   style="font-size: 42px; margin-bottom: 15px;"></i>
                <p>Tu carrito está vacío.</p>
                <p>¡Agrega productos para comenzar!</p>
            </div>
        `;
    }

    carrito.forEach((producto, index) => {
        const item = document.createElement("div");
        item.className = "cart-item";

        const info = document.createElement("div");
        const nombre = document.createElement("h3");
        const precio = document.createElement("p");
        const cantidad = document.createElement("span");

        nombre.textContent = producto.nombre;
        precio.textContent = `$${(producto.precio * producto.cantidad).toFixed(2)}`;
        cantidad.textContent = `Cantidad: ${producto.cantidad}`;

        info.append(nombre, precio, cantidad);

        const eliminar = document.createElement("button");
        eliminar.type = "button";
        eliminar.innerHTML = '<i class="fa-solid fa-trash"></i>';
        eliminar.setAttribute("aria-label", "Eliminar producto");

        eliminar.addEventListener("click", function () {
            carrito.splice(index, 1);
            actualizarCarrito();
        });

        item.append(info, eliminar);
        cartItems.appendChild(item);
    });

    const unidades = carrito.reduce(
        (total, producto) => total + producto.cantidad, 0
    );

    const subtotal = carrito.reduce(
        (total, producto) => total + producto.precio * producto.cantidad, 0
    );

    cartBadge.textContent = unidades;
    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    totalElement.textContent = `$${subtotal.toFixed(2)}`;

    checkoutBtn.disabled = carrito.length === 0;
}

checkoutBtn.addEventListener("click", function () {
    if (carrito.length === 0) return;

    alert("Carrito listo para continuar con el proceso de compra.");
});

actualizarCarrito();
