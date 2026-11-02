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

document.getElementById("formRegistro").addEventListener("submit", function(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const password = document.getElementById("passwordRegistro").value;
    const confirmar = document.getElementById("confirmarPassword").value;

    if (password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres.");
        return;
    }

    if (password !== confirmar) {
        alert("Las contraseñas no coinciden.");
        return;
    }

    alert("¡Cuenta creada exitosamente! Bienvenido a FERREMAS.");

    window.location.href = "iniciosesion.html";
});
