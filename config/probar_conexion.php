<?php

try {
    require_once __DIR__ . '/conexion.php';

    $conexion = (new Conexion())->getConexion();
    $conexion->query('SELECT 1');

    echo 'Conexión exitosa a la base de datos ferreteria.';

} catch (Throwable $error) {
    error_log('Error de conexion: ' . $error->getMessage());

    http_response_code(500);

    echo 'No se pudo conectar. Revisa MySQL y los datos de conexión.';
}