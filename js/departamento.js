
document.addEventListener('DOMContentLoaded', () => {
    const deptBtn = document.getElementById('toggle-dept');
    const dropdown = document.querySelector('.dropdown-dept');
    const megaMenu = document.getElementById('mega-menu');
    const catItems = document.querySelectorAll('.cat-list li');
    const subcatContents = document.querySelectorAll('.subcat-content');

    // Abrir y cerrar con clic
    deptBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        megaMenu.classList.toggle('show');
    });

    // Cambiar subcategorias al pasar el mouse
    catItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            catItems.forEach(i => i.classList.remove('active'));
            subcatContents.forEach(c => c.classList.remove('active'));

            item.classList.add('active');

            const targetId = item.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);

            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Cerrar al hacer clic fuera del menu
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            megaMenu.classList.remove('show');
        }
    });

    // Cerrar al salir del menu con el mouse
    dropdown.addEventListener('mouseleave', () => {
        megaMenu.classList.remove('show');
    });
});
