<?php

class Usuario
{
    public function __construct(private PDO $db)
    {
    }

    public function actual(): ?array
    {
        if (empty($_SESSION['id_usuario'])) {
            return null;
        }

        $q = $this->db->prepare(
            "SELECT u.id_usuario,
                    u.nombre_usuario,
                    r.nombre_rol,
                    c.id_cliente,
                    c.nombre_cliente
             FROM Usuario u
             JOIN Rol r USING(id_rol)
             LEFT JOIN Cliente c USING(id_usuario)
             WHERE u.id_usuario=?
               AND u.estado_usuario='activo'"
        );

        $q->execute([$_SESSION['id_usuario']]);

        return $q->fetch() ?: null;
    }

    public function registrar(array $d): void
    {
        $nombre = texto($d, 'nombre', 100);
        $correo = strtolower(texto($d, 'correo', 100));
        $clave = (string)($d['clave'] ?? '');

        if (
            !filter_var($correo, FILTER_VALIDATE_EMAIL)
            || strlen($clave) < 8
            || strlen($clave) > 72
        ) {
            throw new DomainException(
                'Usa un correo válido y una contraseña de 8 a 72 bytes.'
            );
        }

        $rol = $this->db->query(
            "SELECT id_rol FROM Rol WHERE nombre_rol='Cliente'"
        )->fetchColumn();

        if (!$rol) {
            throw new DomainException(
                'Primero ejecuta el SQL de preparación de roles.'
            );
        }

        $hash = password_hash($clave, PASSWORD_DEFAULT);

        $this->db->beginTransaction();

        try {
            $q = $this->db->prepare(
                'INSERT INTO Usuario (
                    id_rol,
                    nombre_usuario,
                    contrasena_usuario
                 ) VALUES (?,?,?)'
            );

            $q->execute([$rol, $correo, $hash]);
            $id = $this->db->lastInsertId();

            $q = $this->db->prepare(
                "INSERT INTO Cliente (
                    id_usuario,
                    nombre_cliente,
                    apellido_cliente,
                    correo_cliente,
                    contrasena_cliente
                 ) VALUES (?,?,'',?,?)"
            );

            $q->execute([$id, $nombre, $correo, $hash]);

            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $e;
        }
    }

    public function entrar(array $d): void
    {
        $limite = $_SESSION['intentos']
            ?? ['cantidad' => 0, 'hasta' => 0];

        if (
            $limite['cantidad'] >= 5
            && $limite['hasta'] > time()
        ) {
            throw new DomainException(
                'Espera unos minutos antes de volver a intentar.'
            );
        }

        $q = $this->db->prepare(
            "SELECT *
             FROM Usuario
             WHERE nombre_usuario=?
               AND estado_usuario='activo'"
        );

        $q->execute([
            strtolower(texto($d, 'correo', 100))
        ]);

        $u = $q->fetch();

        if (
            !$u
            || !password_verify(
                (string)($d['clave'] ?? ''),
                $u['contrasena_usuario']
            )
        ) {
            $_SESSION['intentos'] = [
                'cantidad' => $limite['hasta'] > time()
                    ? $limite['cantidad'] + 1
                    : 1,
                'hasta' => time() + 300
            ];

            throw new DomainException(
                'Correo o contraseña incorrectos.'
            );
        }

        session_regenerate_id(true);

        $_SESSION['id_usuario'] = (int)$u['id_usuario'];
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        $_SESSION['compra_token'] = bin2hex(random_bytes(32));

        unset($_SESSION['intentos'], $_SESSION['compras']);
    }
}