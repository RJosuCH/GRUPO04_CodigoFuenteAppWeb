<?php

class Proveedor
{
    public function __construct(private PDO $db)
    {
    }

    // Mostrar todos los proveedores
    public function todos(): array
    {
        return $this->db->query(
            'SELECT * FROM Proveedor ORDER BY id_proveedor DESC'
        )->fetchAll();
    }

    // Buscar un proveedor por su ID
    public function buscar(int $id): array|false
    {
        $sql = 'SELECT * FROM Proveedor WHERE id_proveedor = ?';
        $consulta = $this->db->prepare($sql);
        $consulta->execute([$id]);

        return $consulta->fetch();
    }

    // Registrar un proveedor
    public function guardar(
        string $nombre,
        string $direccion,
        string $correo,
        string $telefono
    ): bool {
        $sql = 'INSERT INTO Proveedor
                (nombre_proveedor, direccion_proveedor,
                 correo_proveedor, telefono_proveedor)
                VALUES (?, ?, ?, ?)';

        $consulta = $this->db->prepare($sql);

        return $consulta->execute([
            $nombre,
            $direccion,
            $correo,
            $telefono
        ]);
    }

    // Actualizar un proveedor
    public function actualizar(
        int $id,
        string $nombre,
        string $direccion,
        string $correo,
        string $telefono
    ): bool {
        $sql = 'UPDATE Proveedor
                SET nombre_proveedor = ?,
                    direccion_proveedor = ?,
                    correo_proveedor = ?,
                    telefono_proveedor = ?
                WHERE id_proveedor = ?';

        $consulta = $this->db->prepare($sql);

        return $consulta->execute([
            $nombre,
            $direccion,
            $correo,
            $telefono,
            $id
        ]);
    }

    // Eliminar un proveedor
    public function eliminar(int $id): bool
    {
        $sql = 'DELETE FROM Proveedor WHERE id_proveedor = ?';
        $consulta = $this->db->prepare($sql);

        return $consulta->execute([$id]);
    }

    
    // Registrar un suministro y su entrada al inventario
    public function registrarSuministro(array $datos): void
    {
        $idProveedor = entero($datos['id_proveedor'] ?? '');
        $idProducto = entero($datos['id_producto'] ?? '');
        $cantidad = entero($datos['cantidad'] ?? '');

        $fechaCompra = (string)($datos['fecha_compra'] ?? '');
        $fechaSuministro = (string)($datos['fecha_suministro'] ?? '');

        if (
            !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaCompra)
            || !checkdate(
                (int)substr($fechaCompra, 5, 2),
                (int)substr($fechaCompra, 8, 2),
                (int)substr($fechaCompra, 0, 4)
            )
        ) {
            throw new DomainException('Fecha de compra inválida.');
        }

        if ($fechaSuministro === '') {
            $fechaSuministro = null;
        } elseif (
            !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaSuministro)
            || !checkdate(
                (int)substr($fechaSuministro, 5, 2),
                (int)substr($fechaSuministro, 8, 2),
                (int)substr($fechaSuministro, 0, 4)
            )
            || $fechaSuministro < $fechaCompra
        ) {
            throw new DomainException(
                'La fecha de suministro debe ser válida y no anterior a la compra.'
            );
        }

        $this->db->beginTransaction();

        try {
            $q = $this->db->prepare(
                'SELECT nombre_proveedor
                 FROM Proveedor
                 WHERE id_proveedor = ?'
            );
            $q->execute([$idProveedor]);
            $nombreProveedor = $q->fetchColumn();

            if ($nombreProveedor === false) {
                throw new DomainException('Proveedor no encontrado.');
            }

            $q = $this->db->prepare(
                'SELECT existencia, stock_maximo
                 FROM Producto
                 WHERE id_producto = ?
                 FOR UPDATE'
            );
            $q->execute([$idProducto]);
            $producto = $q->fetch();

            if (!$producto) {
                throw new DomainException('Producto no encontrado.');
            }

            if (
                (int)$producto['existencia'] + $cantidad
                > (int)$producto['stock_maximo']
            ) {
                throw new DomainException(
                    'El suministro supera el stock máximo del producto.'
                );
            }

            $q = $this->db->prepare(
                'INSERT INTO proveedor_producto
                 (id_proveedor, id_producto,
                  fecha_compra, fecha_suministro)
                 VALUES (?, ?, ?, ?)'
            );
            $q->execute([
                $idProveedor,
                $idProducto,
                $fechaCompra,
                $fechaSuministro
            ]);

            $motivo = 'Suministro del proveedor #'
                . $idProveedor . ': '
                . mb_substr((string)$nombreProveedor, 0, 180);

            $q = $this->db->prepare(
                'INSERT INTO Movimiento_Inventario
                 (id_producto, tipo_movimiento,
                  cantidad_movimiento, motivo_movimiento)
                 VALUES (?, ?, ?, ?)'
            );
            $q->execute([
                $idProducto,
                'entrada',
                $cantidad,
                $motivo
            ]);

            // El trigger actualiza las existencias.
            $this->db->commit();

        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $e;
        }
    }
}
