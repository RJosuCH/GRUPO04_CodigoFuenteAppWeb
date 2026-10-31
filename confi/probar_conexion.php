<?php

require_once __DIR__ . "/conexion.php";

$conexion = new Conexion();
$baseDatos = $conexion->getConexion();

echo "Conexión exitosa a la base de datos ferreteria.";