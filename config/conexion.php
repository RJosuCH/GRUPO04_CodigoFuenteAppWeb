<?php

class Conexion
{
    private $host = 'localhost';
    private $user = 'root';
    private $pass = '';
    private $db = 'ferreteria';
    private $conBD;

    public function __construct()
    {
        $cadena = "mysql:host={$this->host};dbname={$this->db};charset=utf8mb4";

        // El archivo que usa la conexion se encarga de mostrar el error.
        $this->conBD = new PDO($cadena, $this->user, $this->pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
    }

    public function getConexion(): PDO
    {
        return $this->conBD;
    }
}