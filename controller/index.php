<?php

require_once __DIR__ . '/../config/app.php';

$pagina = (string)($_GET['p'] ?? 'inicio');

$permitidas = [
    'inicio',
    'productos',
    'herramientas',
    'automotriz',
    'construccion',
    'pinturas',
    'electrica',
    'plomeria',
    'login',
    'registro',
    'pedidos',
    'admin',
    'inventario'
];

if (!in_array($pagina, $permitidas, true)) {
    http_response_code(404);
    exit('Página no encontrada.');
}

$api = (string)($_GET['api'] ?? '');
$usuario = null;

try {
    $db = (new Conexion())->getConexion();

    $producto = new Producto($db);
    $cuenta = new Usuario($db);
    $pedido = new Pedido($db);

    $usuario = $cuenta->actual();

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (
            !is_string($_POST['csrf'] ?? null)
            || !hash_equals($_SESSION['csrf'], $_POST['csrf'])
        ) {
            throw new DomainException(
                'La sesión cambió. Recarga la página.'
            );
        }

        if ($api === 'carrito') {
            $id = entero($_POST['id'] ?? '');
            $cantidad = entero($_POST['cantidad'] ?? '', 0, 9999);

            if ($cantidad === 0) {
                unset($_SESSION['carrito'][$id]);
            } else {
                $fila = null;

                foreach ($producto->todos() as $p) {
                    if ((int)$p['id_producto'] === $id) {
                        $fila = $p;
                    }
                }

                if (!$fila || $cantidad > $fila['existencia']) {
                    throw new DomainException(
                        'No hay existencias suficientes.'
                    );
                }

                $_SESSION['carrito'][$id] = $cantidad;
            }

            respuesta([
                'ok' => true,
                'carrito' => $_SESSION['carrito']
            ]);
        }

        if ($api === 'comprar') {
            $cliente = exigirCliente($usuario);
            $token = (string)($_POST['token'] ?? '');

            // Una solicitud repetida devuelve el mismo pedido.
            if (isset($_SESSION['compras'][$token])) {
                respuesta([
                    'ok' => true,
                    'pedido' => $_SESSION['compras'][$token]
                ]);
            }

            if (!hash_equals($_SESSION['compra_token'], $token)) {
                throw new DomainException(
                    'Esta compra ya cambió. Recarga la página.'
                );
            }

            $id = $pedido->crear(
                $cliente,
                $_SESSION['carrito']
            );

            $_SESSION['compras'][$token] = $id;
            $_SESSION['carrito'] = [];
            $_SESSION['compra_token'] = bin2hex(random_bytes(32));

            respuesta([
                'ok' => true,
                'pedido' => $id
            ]);
        }

        if ($api !== '') {
            throw new DomainException('Operación no disponible.');
        }

        switch ($_POST['accion'] ?? '') {
            case 'registro':
                $cuenta->registrar($_POST);

                $_SESSION['mensaje'] =
                    'Cuenta creada. Ya puedes iniciar sesión.';

                redirigir('login');

            case 'login':
                $cuenta->entrar($_POST);
                redirigir('pedidos');

            case 'salir':
                $_SESSION = [];
                session_regenerate_id(true);
                redirigir('inicio');

            case 'cancelar':
                $pedido->cambiar(
                    entero($_POST['id'] ?? ''),
                    'cancelado',
                    exigirCliente($usuario)
                );
                break;

            case 'guardar':
                exigirAdmin($usuario);
                $producto->guardar($_POST);
                break;

            case 'movimiento':
                exigirAdmin($usuario);
                $producto->movimiento($_POST);
                break;

            case 'eliminar':
                exigirAdmin($usuario);
                $producto->eliminar(entero($_POST['id'] ?? ''));
                break;

            case 'marca':
                exigirAdmin($usuario);

                $producto->crearMarca(
                    texto($_POST, 'nombre_marca', 100)
                );
                break;

            case 'estado':
                exigirAdmin($usuario);

                $pedido->cambiar(
                    entero($_POST['id'] ?? ''),
                    (string)($_POST['estado'] ?? '')
                );
                break;

            default:
                throw new DomainException('Acción no disponible.');
        }

        $_SESSION['mensaje'] = 'Operación realizada.';

        redirigir(
            $pagina,
            isset($_GET['cat']) ? ['cat' => $_GET['cat']] : []
        );
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        header('Allow: GET, POST');
        http_response_code(405);
        exit;
    }

    if ($api === 'datos') {
        respuesta([
            'ok' => true,
            'productos' => $producto->todos(),
            'carrito' => $_SESSION['carrito']
        ]);
    }

    if ($api !== '') {
        throw new DomainException('Operación no disponible.');
    }

    if (in_array($pagina, ['admin', 'inventario'], true)) {
        exigirAdmin($usuario);
    }

    if ($pagina === 'pedidos' && !$usuario) {
        redirigir('login');
    }

    $categorias = $producto->categorias();
    $marcas = $producto->marcas();

    $productos = $pagina === 'inventario'
        ? $producto->todos()
        : [];

    $pedidos = $pagina === 'pedidos'
        ? $pedido->listar(exigirCliente($usuario))
        : ($pagina === 'admin' ? $pedido->listar() : []);

    require ROOT . '/vista/render.php';
} catch (Throwable $error) {
    error_log('Ferreteria: ' . $error->getMessage());

    $mensaje = $error instanceof DomainException
        ? $error->getMessage()
        : (
            $error instanceof PDOException
            && $error->getCode() === '23000'
                ? 'El registro está duplicado o tiene '
                    . 'movimientos/pedidos asociados.'
                : 'No se pudo completar la operación. Revisa '
                    . 'la conexión y el SQL de preparación.'
        );

    if ($api !== '') {
        respuesta([
            'ok' => false,
            'mensaje' => $mensaje
        ], 400);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $_SESSION['mensaje'] = $mensaje;
        redirigir($pagina);
    }

    http_response_code(400);

    echo '<p>' . e($mensaje) . '</p>'
        . '<a href="' . e(ruta('inicio')) . '">Inicio</a>';
}