document.addEventListener('DOMContentLoaded', () => {
    console.log("Página de Construcción inicializada correctamente.");
    const productCards = document.querySelectorAll(
        '.featured-section .product-card'
    );

    productCards.forEach(card => {
        card.addEventListener('click', () => {

            const productName = card.querySelector(
                '.product-name'
            ).textContent;
            const productPrice = card.querySelector(
                '.product-price'
            ).textContent;
            console.log(
                `Producto seleccionado: ${productName} (${productPrice})`
            );
        });
    });
});
