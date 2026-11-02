const filtro = document.getElementById('filtro-estado');
const pedidos = document.querySelectorAll('.pedido-card');
const mensajeVacio = document.getElementById('sin-pedidos');

filtro.addEventListener('change', function () {
    let visibles = 0;
    pedidos.forEach(function (pedido) {
        const coincide = filtro.value === 'todos' || pedido.dataset.estado === filtro.value;
        pedido.hidden = !coincide;
        if (coincide) visibles++;
    });
    
    mensajeVacio.hidden = visibles > 0;
});

function mostrarDetalle(numero) {
    alert('Detalles del ' + numero + '. No disponible');
}
