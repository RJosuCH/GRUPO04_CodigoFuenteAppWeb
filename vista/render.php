<?php

$archivos = [
    'inicio' => 'index.html',
    'productos' => 'productos.html',
    'herramientas' => 'herramientas.html',
    'automotriz' => 'automotriz.html',
    'construccion' => 'construccion.html',
    'pinturas' => 'pinturas.html',
    'electrica' => 'electrica.html',
    'plomeria' => 'plomeria.html'
];

if (isset($archivos[$pagina])) {
    $html = file_get_contents(
        __DIR__ . '/' . $archivos[$pagina]
    );

    $rutas = [
        'index.html' => 'inicio',
        'productos.html' => 'productos',
        'herramientas.html' => 'herramientas',
        'automotriz.html' => 'automotriz',
        'construccion.html' => 'construccion',
        'pinturas.html' => 'pinturas',
        'electrica.html' => 'electrica',
        'plomeria.html' => 'plomeria',
        'iniciosesion.html' => 'login',
        'pedidos.html' => 'pedidos'
    ];

    $html = preg_replace_callback(
        '~\b(index|productos|herramientas|automotriz|construccion|pinturas|electrica|plomeria|iniciosesion|pedidos)\.html(\?)?~',
        fn($m) => ruta($rutas[$m[1] . '.html'])
            . (!empty($m[2]) ? '&' : ''),
        $html
    );

    // Se conserva departamento.js para el menú existente.
    $html = preg_replace(
        '~<script\s+src="js/(main|productos|herramientas|automotriz|construccion|pinturas|electrica|plomeria)\.js"></script>~',
        '',
        $html
    );
} else {
    ob_start();
    require __DIR__ . '/panel.php';
    $html = ob_get_clean();
}

$contexto = json_encode(
    [
        'base' => BASE,
        'pagina' => $pagina,
        'csrf' => $_SESSION['csrf'],
        'token' => $_SESSION['compra_token'],
        'autenticado' => (bool)$usuario,
        'admin' => $usuario
            && $usuario['nombre_rol'] === 'Administrador'
    ],
    JSON_HEX_TAG
        | JSON_HEX_AMP
        | JSON_HEX_APOS
        | JSON_HEX_QUOT
        | JSON_UNESCAPED_UNICODE
);

$html = str_replace(
    '<head>',
    '<head><base href="' . e(BASE . 'vista/') . '">',
    $html
);

$html = str_replace(
    '</body>',
    '<script>window.APP=' . $contexto . ';</script>'
        . '<script src="app.js"></script></body>',
    $html
);

echo $html;