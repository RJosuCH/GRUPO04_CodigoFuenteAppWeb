<?php

class Conexion {
    private $host = "localhost";
    private $user = "root";
    private $pass = "";
    private $db = "ferreteria";
    private $conBD;

    public function __construct()
    {
        $cadena = "mysql:host=" . $this->host
                . ";dbname=" . $this->db
                . ";charset=utf8mb4";

        try {
            $this->conBD = new PDO(
                $cadena,
                $this->user,
                $this->pass
            );

            $this->conBD->setAttribute(
                PDO::ATTR_ERRMODE,
                PDO::ERRMODE_EXCEPTION
            );
        } catch (PDOException $e) {
            die("Error de conexión: " . $e->getMessage());
        }
    }

    public function getConexion()
    {
        return $this->conBD;
    }
}