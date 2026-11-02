function mostrarPassword(id, boton) {
    const campo = document.getElementById(id);
    if (campo.type === "password") {
        campo.type = "text";
        boton.textContent = "Ocultar";
    } else {
        campo.type = "password";
        boton.textContent = "Mostrar";
    }
}

document.getElementById("formCliente").addEventListener("submit", function(event) {
    event.preventDefault();
    alert("Bienvenido");
});
