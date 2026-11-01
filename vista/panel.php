<?php

/**
 * Datos proporcionados por controller/index.php al cargar esta vista.
 *
 * @var string $pagina
 * @var array<string, mixed>|null $usuario
 * @var array<int, array<string, mixed>> $pedidos
 * @var array<int, array<string, mixed>> $categorias
 * @var array<int, array<string, mixed>> $productos
 * @var array<int, array<string, mixed>> $marcas
 */

$pedidos = $pedidos ?? [];
$categorias = $categorias ?? [];
$productos = $productos ?? [];
$marcas = $marcas ?? [];

function abrirFormulario(
    string $accion,
    array $datos = []
): void {
    global $pagina;

    $extra = $pagina === 'inventario' && isset($_GET['cat'])
        ? ['cat' => $_GET['cat']]
        : [];

    echo '<form method="post" action="'
        . e(ruta($pagina, $extra)) . '">';

    foreach (
        [
            'accion' => $accion,
            'csrf' => $_SESSION['csrf']
        ] + $datos as $k => $v
    ) {
        echo '<input type="hidden" name="' . e($k)
            . '" value="' . e($v) . '">';
    }
}

function entrada(
    string $nombre,
    string $etiqueta,
    $valor = '',
    string $tipo = 'text',
    string $extra = ''
): void {
    echo '<label>' . e($etiqueta)
        . '<input name="' . e($nombre)
        . '" type="' . e($tipo)
        . '" value="' . e($valor)
        . '" ' . $extra . '></label>';
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>FERREMAS</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="panel.css">
</head>
<body>

<header class="main-header">
    <a class="logo" href="<?= e(ruta('inicio')) ?>">FERREMAS</a>

    <nav>
        <a href="<?= e(ruta('productos')) ?>">Productos</a>
        <a href="<?= e(ruta('pedidos')) ?>">Mis pedidos</a>

        <?php if (
            $usuario
            && $usuario['nombre_rol'] === 'Administrador'
        ): ?>
            <a href="<?= e(ruta('admin')) ?>">Administración</a>
            <a href="<?= e(ruta('inventario')) ?>">Inventario</a>
        <?php endif; ?>
    </nav>

    <?php if ($usuario): ?>
        <?php abrirFormulario('salir'); ?>
            <button class="btn-primary">Cerrar sesión</button>
        </form>
    <?php else: ?>
        <a href="<?= e(ruta('login')) ?>">Iniciar sesión</a>
    <?php endif; ?>
</header>

<main class="panel-fondo">

    <?php if (isset($_SESSION['mensaje'])): ?>
        <p class="mensaje" role="status">
            <?= e($_SESSION['mensaje']) ?>
        </p>
        <?php unset($_SESSION['mensaje']); ?>
    <?php endif; ?>

    <?php if (in_array($pagina, ['login', 'registro'], true)): ?>
        <section class="cuenta">
            <h1>
                <?= $pagina === 'registro'
                    ? 'Crear cuenta'
                    : 'Iniciar sesión' ?>
            </h1>

            <?php abrirFormulario($pagina); ?>

                <?php if ($pagina === 'registro'): ?>
                    <?php entrada(
                        'nombre',
                        'Nombre completo:',
                        '',
                        'text',
                        'required maxlength="100"'
                    ); ?>
                <?php endif; ?>

                <?php entrada(
                    'correo',
                    'Correo:',
                    '',
                    'email',
                    'required maxlength="100" autocomplete="username"'
                ); ?>

                <?php entrada(
                    'clave',
                    'Contraseña:',
                    '',
                    'password',
                    'required minlength="8" maxlength="72" autocomplete="'
                    . (
                        $pagina === 'registro'
                            ? 'new-password'
                            : 'current-password'
                    ) . '"'
                ); ?>

                <button class="btn-primary">Ingresar</button>
            </form>

            <a href="<?= e(ruta(
                $pagina === 'login' ? 'registro' : 'login'
            )) ?>">
                <?= $pagina === 'login'
                    ? 'Crear cuenta'
                    : 'Ya tengo cuenta' ?>
            </a>
        </section>
    <?php endif; ?>

    <?php if ($pagina === 'admin' && $usuario !== null): ?>
        <h1>
            Bienvenido,
            <?= e(
                $usuario['nombre_cliente']
                ?: $usuario['nombre_usuario']
            ) ?>
        </h1>

        <div class="categorias-admin">
            <a href="<?= e(ruta('productos')) ?>">Productos</a>
            <a href="<?= e(ruta('inventario')) ?>">Inventario</a>
        </div>

        <p>
            Marca un pedido como pagado únicamente cuando hayas
            confirmado el pago por otro medio.
        </p>
    <?php endif; ?>

    <?php if (in_array($pagina, ['pedidos', 'admin'], true)): ?>
        <h1>
            <?= $pagina === 'admin'
                ? 'Gestión de pedidos'
                : 'Tus pedidos' ?>
        </h1>

        <?php if (!$pedidos): ?>
            <p class="caja">Todavía no hay pedidos.</p>
        <?php endif; ?>

        <div class="lista-pedidos">
            <?php foreach ($pedidos as $p): ?>
                <article class="caja">
                    <h2>Pedido #<?= (int)$p['id_pedido'] ?></h2>

                    <p>
                        <?= e($p['fecha_pedido']) ?>
                        · Estado: <?= e($p['estado_pedido']) ?>
                    </p>

                    <?php if ($pagina === 'admin'): ?>
                        <p>
                            <?= e($p['nombre_cliente']) ?>
                            · <?= e($p['correo_cliente']) ?>
                        </p>
                    <?php endif; ?>

                    <?php foreach ($p['detalles'] as $d): ?>
                        <p>
                            <?= e($d['nombre_producto']) ?>
                            · <?= e($d['nombre_marca']) ?>
                            × <?= (int)$d['cantidad_detalle'] ?>
                            — <?= dinero($d['subtotal_detalle']) ?>
                        </p>
                    <?php endforeach; ?>

                    <strong>
                        Total de productos: <?= dinero($p['total']) ?>
                    </strong>

                    <?php if ($p['estado_pedido'] === 'pendiente'): ?>
                        <p>Pendiente de pago. Entrega por coordinar.</p>
                    <?php endif; ?>

                    <?php if (
                        $pagina === 'pedidos'
                        && $p['estado_pedido'] === 'pendiente'
                    ): ?>
                        <?php abrirFormulario(
                            'cancelar',
                            ['id' => $p['id_pedido']]
                        ); ?>
                            <button class="btn-primary">
                                Cancelar pedido
                            </button>
                        </form>
                    <?php endif; ?>

                    <?php if ($pagina === 'admin'): ?>
                        <?php
                        $opciones = [
                            'pendiente' => ['pagado', 'cancelado'],
                            'pagado' => ['enviado', 'cancelado'],
                            'enviado' => ['entregado'],
                            'entregado' => [],
                            'cancelado' => []
                        ][$p['estado_pedido']];
                        ?>

                        <?php if ($opciones): ?>
                            <?php abrirFormulario(
                                'estado',
                                ['id' => $p['id_pedido']]
                            ); ?>
                                <label>
                                    Nuevo estado
                                    <select name="estado">
                                        <?php foreach (
                                            $opciones as $estado
                                        ): ?>
                                            <option>
                                                <?= e($estado) ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                </label>

                                <button class="btn-primary">
                                    Actualizar estado
                                </button>
                            </form>
                        <?php endif; ?>
                    <?php endif; ?>
                </article>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <?php if ($pagina === 'inventario'): ?>
        <h1>INVENTARIO</h1>

        <div class="categorias-admin">
            <?php foreach ($categorias as $c): ?>
                <a href="<?= e(ruta(
                    'inventario',
                    ['cat' => $c['id_categoria']]
                )) ?>">
                    <?= e($c['nombre_categoria']) ?>
                </a>
            <?php endforeach; ?>
        </div>

        <section class="caja">
            <h2>Marcas</h2>

            <?php abrirFormulario('marca'); ?>

                <?php entrada(
                    'nombre_marca',
                    'Nueva marca:',
                    '',
                    'text',
                    'required maxlength="100"'
                ); ?>

                <button class="btn-primary">Agregar marca</button>
            </form>
        </section>

        <?php
        $categoria = (int)($_GET['cat'] ?? 0);

        $seleccion = array_values(
            array_filter(
                $categorias,
                fn($c) => (int)$c['id_categoria'] === $categoria
            )
        );
        ?>

        <?php if ($seleccion): ?>
            <?php
            $lista = array_filter(
                $productos,
                fn($p) => (int)$p['id_categoria'] === $categoria
            );

            $editado = [];

            foreach ($lista as $p) {
                if (
                    (int)$p['id_producto']
                    === (int)($_GET['editar'] ?? 0)
                ) {
                    $editado = $p;
                }
            }
            ?>

            <section class="caja inventario-detalle">
                <a class="cerrar"
                   href="<?= e(ruta('inventario')) ?>">×</a>

                <h2><?= e($seleccion[0]['nombre_categoria']) ?></h2>

                <p>
                    <?= count($lista) ?> artículos ·

                    <?= array_sum(
                        array_column($lista, 'existencia')
                    ) ?> unidades ·

                    <?= count(array_filter(
                        $lista,
                        fn($p) =>
                            $p['existencia'] <= $p['stock_minimo']
                    )) ?> alertas
                </p>

                <?php foreach ($lista as $p): ?>
                    <article class="articulo">
                        <strong>
                            <?= e($p['nombre_producto']) ?>
                        </strong>

                        <p>
                            <?= dinero($p['precio_final']) ?>
                            · Existencias:
                            <?= (int)$p['existencia'] ?>
                        </p>

                        <a href="<?= e(ruta(
                            'inventario',
                            [
                                'cat' => $categoria,
                                'editar' => $p['id_producto']
                            ]
                        )) ?>">Editar</a>

                        <?php abrirFormulario(
                            'eliminar',
                            ['id' => $p['id_producto']]
                        ); ?>
                            <button>
                                Eliminar si no tiene movimientos
                                ni pedidos
                            </button>
                        </form>

                        <?php abrirFormulario(
                            'movimiento',
                            ['id_producto' => $p['id_producto']]
                        ); ?>

                            <label>
                                Movimiento
                                <select name="tipo">
                                    <option value="entrada">
                                        Entrada
                                    </option>
                                    <option value="salida">
                                        Salida
                                    </option>
                                </select>
                            </label>

                            <?php entrada(
                                'cantidad',
                                'Cantidad:',
                                '',
                                'number',
                                'required min="1" max="1000000"'
                            ); ?>

                            <?php entrada(
                                'motivo',
                                'Motivo:',
                                '',
                                'text',
                                'required maxlength="255"'
                            ); ?>

                            <button class="btn-primary">
                                Registrar movimiento
                            </button>
                        </form>
                    </article>
                <?php endforeach; ?>

                <h2>
                    <?= $editado
                        ? 'Editar artículo'
                        : 'Agregar artículo' ?>
                </h2>

                <?php abrirFormulario(
                    'guardar',
                    [
                        'id_producto' => $editado['id_producto'] ?? 0,
                        'id_categoria' => $categoria
                    ]
                ); ?>

                    <?php entrada(
                        'nombre_producto',
                        'Nombre:',
                        $editado['nombre_producto'] ?? '',
                        'text',
                        'required maxlength="150"'
                    ); ?>

                    <label>
                        Marca
                        <select name="id_marca" required>
                            <?php foreach ($marcas as $m): ?>
                                <option
                                    value="<?= (int)$m['id_marca'] ?>"
                                    <?= (int)(
                                        $editado['id_marca'] ?? 0
                                    ) === (int)$m['id_marca']
                                        ? 'selected'
                                        : '' ?>
                                >
                                    <?= e($m['nombre_marca']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </label>

                    <?php entrada(
                        'precio_producto',
                        'Precio base:',
                        $editado['precio_producto'] ?? '',
                        'number',
                        'required min="0" max="99999999.99" step="0.01"'
                    ); ?>

                    <?php entrada(
                        'stock_minimo',
                        'Stock mínimo:',
                        $editado['stock_minimo'] ?? 0,
                        'number',
                        'required min="0" max="1000000"'
                    ); ?>

                    <?php entrada(
                        'stock_maximo',
                        'Stock máximo:',
                        $editado['stock_maximo'] ?? 100,
                        'number',
                        'required min="0" max="1000000"'
                    ); ?>

                    <?php if (!$editado): ?>
                        <?php entrada(
                            'existencia',
                            'Existencia inicial:',
                            0,
                            'number',
                            'required min="0" max="1000000"'
                        ); ?>
                    <?php endif; ?>

                    <?php entrada(
                        'descuento_porcentaje',
                        'Descuento (%):',
                        $editado['descuento_porcentaje'] ?? 0,
                        'number',
                        'required min="0" max="100"'
                    ); ?>

                    <?php entrada(
                        'fotografia',
                        'Fotografía (ej. imagenes/Taladro.png):',
                        $editado['fotografia'] ?? '',
                        'text',
                        'maxlength="255"'
                    ); ?>

                    <label>
                        Descripción
                        <textarea
                            name="descripcion_producto"
                            maxlength="500"
                        ><?= e(
                            $editado['descripcion_producto'] ?? ''
                        ) ?></textarea>
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            name="destacado"
                            value="1"
                            <?= !empty($editado['destacado'])
                                ? 'checked'
                                : '' ?>
                        >
                        Destacar en inicio
                    </label>

                    <button class="btn-primary">
                        Guardar artículo
                    </button>

                    <a href="<?= e(ruta(
                        'inventario',
                        ['cat' => $categoria]
                    )) ?>">Cancelar edición</a>
                </form>
            </section>
        <?php endif; ?>
    <?php endif; ?>

    <a class="btn-primary volver"
       href="<?= e(ruta('inicio')) ?>">Inicio</a>
</main>

</body>
</html>