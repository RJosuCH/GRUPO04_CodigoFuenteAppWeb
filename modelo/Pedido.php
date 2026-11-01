<?php

class Pedido
{
    public function __construct(private PDO $db)
    {
    }

    public function crear(int $cliente, array $carrito): int
    {
        if (!$carrito) {
            throw new DomainException('El carrito está vacío.');
        }

        ksort($carrito, SORT_NUMERIC);

        $this->db->beginTransaction();

        try {
            $q = $this->db->prepare(
                'SELECT *
                 FROM Producto
                 WHERE id_producto=?
                 FOR UPDATE'
            );

            $lineas = [];
            $total = 0;

            foreach ($carrito as $id => $cantidad) {
                $id = entero($id);
                $cantidad = entero($cantidad, 1, 9999);

                $q->execute([$id]);
                $p = $q->fetch();

                if (!$p || $cantidad > $p['existencia']) {
                    throw new DomainException(
                        'Existencia insuficiente. Revisa tu carrito.'
                    );
                }

                $precio = Producto::precioFinal($p);
                $total += $precio * $cantidad;

                if ($total > 9999999999) {
                    throw new DomainException(
                        'El total supera el límite permitido.'
                    );
                }

                $lineas[] = [$id, $cantidad, decimal($precio)];
            }

            $q = $this->db->prepare(
                "INSERT INTO Pedido(id_cliente,estado_pedido)
                 VALUES (?,'pendiente')"
            );

            $q->execute([$cliente]);
            $pedido = (int)$this->db->lastInsertId();

            $detalle = $this->db->prepare(
                'INSERT INTO Detalle_Pedido (
                    id_pedido,
                    id_producto,
                    cantidad_detalle,
                    precio_unitario_detalle
                 ) VALUES (?,?,?,?)'
            );

            $inventario = new Producto($this->db);

            foreach ($lineas as [$id, $cantidad, $precio]) {
                $detalle->execute([
                    $pedido,
                    $id,
                    $cantidad,
                    $precio
                ]);

                $inventario->insertarMovimiento(
                    $id,
                    'salida',
                    $cantidad,
                    'Reserva de pedido #' . $pedido
                );
            }

            // Los triggers actualizan el total y las existencias.
            $this->db->commit();

            return $pedido;
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $e;
        }
    }

    public function listar(?int $cliente = null): array
    {
        $q = $this->db->prepare(
            'SELECT p.*, c.nombre_cliente, c.correo_cliente
             FROM Pedido p
             JOIN Cliente c USING(id_cliente)'
            . ($cliente !== null ? ' WHERE p.id_cliente=?' : '')
            . ' ORDER BY p.id_pedido DESC'
        );

        $q->execute($cliente !== null ? [$cliente] : []);
        $pedidos = $q->fetchAll();

        $detalle = $this->db->prepare(
            'SELECT d.*,
                    p.nombre_producto,
                    p.fotografia,
                    m.nombre_marca
             FROM Detalle_Pedido d
             JOIN Producto p USING(id_producto)
             JOIN Marca m USING(id_marca)
             WHERE d.id_pedido=?
             ORDER BY d.id_producto'
        );

        foreach ($pedidos as &$p) {
            $detalle->execute([$p['id_pedido']]);
            $p['detalles'] = $detalle->fetchAll();
        }

        return $pedidos;
    }

    public function cambiar(
        int $id,
        string $estado,
        ?int $cliente = null
    ): void {
        $transiciones = [
            'pendiente' => ['pagado', 'cancelado'],
            'pagado' => ['enviado', 'cancelado'],
            'enviado' => ['entregado'],
            'entregado' => [],
            'cancelado' => []
        ];

        $this->db->beginTransaction();

        try {
            $q = $this->db->prepare(
                'SELECT * FROM Pedido WHERE id_pedido=? FOR UPDATE'
            );

            $q->execute([$id]);
            $pedido = $q->fetch();

            if (
                !$pedido
                || (
                    $cliente !== null
                    && (int)$pedido['id_cliente'] !== $cliente
                )
            ) {
                throw new DomainException('Pedido no disponible.');
            }

            $actual = $pedido['estado_pedido'];

            if (
                $cliente !== null
                && ($actual !== 'pendiente' || $estado !== 'cancelado')
            ) {
                throw new DomainException(
                    'Solo puedes cancelar tus pedidos pendientes.'
                );
            }

            if (!in_array($estado, $transiciones[$actual], true)) {
                throw new DomainException(
                    'Ese cambio de estado no está permitido.'
                );
            }

            if ($estado === 'cancelado') {
                $q = $this->db->prepare(
                    'SELECT *
                     FROM Detalle_Pedido
                     WHERE id_pedido=?
                     ORDER BY id_producto'
                );

                $q->execute([$id]);
                $inventario = new Producto($this->db);

                foreach ($q->fetchAll() as $d) {
                    $inventario->insertarMovimiento(
                        (int)$d['id_producto'],
                        'entrada',
                        (int)$d['cantidad_detalle'],
                        'Cancelación de pedido #' . $id
                    );
                }
            }

            $q = $this->db->prepare(
                'UPDATE Pedido
                 SET estado_pedido=?
                 WHERE id_pedido=?'
            );

            $q->execute([$estado, $id]);

            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $e;
        }
    }
}