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

document.getElementById("formAdmin").addEventListener("submit", function(event) {
    event.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const password = document.getElementById("passwordAdmin").value;

    if (usuario !== "" && password !== "") {
        window.location.href = "inicio-admin.html";
    }
});
