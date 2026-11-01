<?php
declare(strict_types=1);

session_start([
    'use_strict_mode' => 1,
    'cookie_httponly' => 1,
    'cookie_samesite' => 'Lax',
    'cookie_secure' => !empty($_SERVER['HTTPS'])
        && $_SERVER['HTTPS'] !== 'off'
]);

header('Cache-Control: no-store');

const ROOT = __DIR__ . '/..';

define(
    'BASE',
    rtrim(
        str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME']))),
        '/'
    ) . '/'
);

require_once __DIR__ . '/conexion.php';
require_once ROOT . '/modelo/Producto.php';
require_once ROOT . '/modelo/Usuario.php';
require_once ROOT . '/modelo/Pedido.php';

$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
$_SESSION['compra_token'] ??= bin2hex(random_bytes(32));
$_SESSION['carrito'] ??= [];

function e($valor): string
{
    return htmlspecialchars((string)$valor, ENT_QUOTES, 'UTF-8');
}

function ruta(string $pagina, array $datos = []): string
{
    return BASE . 'controller/index.php?'
        . http_build_query(['p' => $pagina] + $datos);
}

function entero($valor, int $min = 1, int $max = 1000000): int
{
    $numero = filter_var($valor, FILTER_VALIDATE_INT);

    if ($numero === false || $numero < $min || $numero > $max) {
        throw new DomainException('Cantidad o identificador inválido.');
    }

    return $numero;
}

function centavos($valor): int
{
    $texto = (string)$valor;

    if (!preg_match('/^\d{1,8}(?:\.\d{1,2})?$/D', $texto)) {
        throw new DomainException(
            'Precio inválido; usa punto y hasta dos decimales.'
        );
    }

    $partes = explode('.', $texto);

    return (int)$partes[0] * 100
        + (int)str_pad($partes[1] ?? '', 2, '0');
}

function decimal(int $centavos): string
{
    return intdiv($centavos, 100) . '.'
        . str_pad((string)($centavos % 100), 2, '0', STR_PAD_LEFT);
}

function texto(
    array $datos,
    string $campo,
    int $max,
    bool $obligatorio = true
): string {
    $valor = trim((string)($datos[$campo] ?? ''));

    if (
        ($obligatorio && $valor === '')
        || mb_strlen($valor) > $max
    ) {
        throw new DomainException('Revisa el campo ' . $campo . '.');
    }

    return $valor;
}

function dinero($valor): string
{
    return '$' . number_format((float)$valor, 2);
}

function respuesta(array $datos, int $estado = 200): never
{
    http_response_code($estado);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode(
        $datos,
        JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
    );

    exit;
}

function redirigir(string $pagina, array $datos = []): never
{
    header('Location: ' . ruta($pagina, $datos), true, 303);
    exit;
}

function exigirCliente(?array $usuario): int
{
    if (!$usuario || !$usuario['id_cliente']) {
        throw new DomainException(
            'Inicia sesión con tu cuenta de cliente.'
        );
    }

    return (int)$usuario['id_cliente'];
}

function exigirAdmin(?array $usuario): void
{
    if (!$usuario || $usuario['nombre_rol'] !== 'Administrador') {
        throw new DomainException(
            'Esta operación requiere una cuenta administradora.'
        );
    }
}