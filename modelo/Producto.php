<?php

class Producto
{
    public function __construct(private PDO $db)
    {
    }

    public function categorias(): array
    {
        return $this->db->query(
            'SELECT * FROM Categoria ORDER BY id_categoria'
        )->fetchAll();
    }

    public function marcas(): array
    {
        return $this->db->query(
            'SELECT * FROM Marca ORDER BY nombre_marca'
        )->fetchAll();
    }

    public static function precioFinal(array $p): int
    {
        return intdiv(
            centavos($p['precio_producto'])
                * (100 - (int)$p['descuento_porcentaje']) + 50,
            100
        );
    }

    public function todos(): array
    {
        $filas = $this->db->query(
            'SELECT p.*, c.nombre_categoria, m.nombre_marca
             FROM Producto p
             JOIN Categoria c USING(id_categoria)
             JOIN Marca m USING(id_marca)
             ORDER BY p.id_producto'
        )->fetchAll();

        foreach ($filas as &$p) {
            $p['precio_final'] = decimal(self::precioFinal($p));
            $p['fotografia'] = $this->imagen($p['fotografia'] ?? '');
        }

        return $filas;
    }

    private function imagen(string $ruta): string
    {
        if (
            !preg_match(
                '~^imagenes/[a-zA-Z0-9_.-]+\.(png|jpg|jpeg|webp|gif)$~D',
                $ruta
            )
        ) {
            return '';
        }

        return is_file(ROOT . '/vista/' . $ruta) ? $ruta : '';
    }

    public function guardar(array $d): void
    {
        $id = entero($d['id_producto'] ?? 0, 0);
        $nombre = texto($d, 'nombre_producto', 150);
        $descripcion = texto($d, 'descripcion_producto', 500, false);
        $precio = decimal(centavos($d['precio_producto'] ?? ''));

        $min = entero($d['stock_minimo'] ?? 0, 0);
        $max = entero($d['stock_maximo'] ?? '', $min);

        $inicial = $id
            ? 0
            : entero($d['existencia'] ?? 0, 0, $max);

        $foto = texto($d, 'fotografia', 255, false);

        if ($foto !== '' && $this->imagen($foto) === '') {
            throw new DomainException(
                'La fotografía debe existir dentro de vista/imagenes.'
            );
        }

        $valores = [
            entero($d['id_categoria'] ?? ''),
            entero($d['id_marca'] ?? ''),
            $nombre,
            $descripcion,
            $precio,
            $min,
            $max,
            $foto,
            entero($d['descuento_porcentaje'] ?? 0, 0, 100),
            isset($d['destacado']) ? 1 : 0
        ];

        $this->db->beginTransaction();

        try {
            if ($id) {
                $q = $this->db->prepare(
                    'SELECT existencia
                     FROM Producto
                     WHERE id_producto=?
                     FOR UPDATE'
                );

                $q->execute([$id]);
                $stock = $q->fetchColumn();

                if ($stock === false || (int)$stock > $max) {
                    throw new DomainException(
                        'El producto no existe o el máximo es menor '
                        . 'que su existencia.'
                    );
                }

                $q = $this->db->prepare(
                    'UPDATE Producto
                     SET id_categoria=?,
                         id_marca=?,
                         nombre_producto=?,
                         descripcion_producto=?,
                         precio_producto=?,
                         stock_minimo=?,
                         stock_maximo=?,
                         fotografia=?,
                         descuento_porcentaje=?,
                         destacado=?
                     WHERE id_producto=?'
                );

                $q->execute([...$valores, $id]);
            } else {
                $q = $this->db->prepare(
                    'INSERT INTO Producto (
                        id_categoria,
                        id_marca,
                        nombre_producto,
                        descripcion_producto,
                        precio_producto,
                        stock_minimo,
                        stock_maximo,
                        fotografia,
                        descuento_porcentaje,
                        destacado,
                        existencia
                     ) VALUES (?,?,?,?,?,?,?,?,?,?,0)'
                );

                $q->execute($valores);
                $id = (int)$this->db->lastInsertId();

                if ($inicial > 0) {
                    $this->insertarMovimiento(
                        $id,
                        'entrada',
                        $inicial,
                        'Existencia inicial'
                    );
                }
            }

            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $e;
        }
    }

    public function insertarMovimiento(
        int $id,
        string $tipo,
        int $cantidad,
        string $motivo
    ): void {
        $q = $this->db->prepare(
            'INSERT INTO Movimiento_Inventario (
                id_producto,
                tipo_movimiento,
                cantidad_movimiento,
                motivo_movimiento
             ) VALUES (?,?,?,?)'
        );

        $q->execute([$id, $tipo, $cantidad, $motivo]);
    }

    public function movimiento(array $d): void
    {
        $id = entero($d['id_producto'] ?? '');
        $cantidad = entero($d['cantidad'] ?? '');
        $tipo = (string)($d['tipo'] ?? '');

        if (!in_array($tipo, ['entrada', 'salida'], true)) {
            throw new DomainException('Movimiento inválido.');
        }

        $motivo = texto($d, 'motivo', 255);

        $this->db->beginTransaction();

        try {
            $q = $this->db->prepare(
                'SELECT existencia, stock_maximo
                 FROM Producto
                 WHERE id_producto=?
                 FOR UPDATE'
            );

            $q->execute([$id]);
            $p = $q->fetch();

            if (
                !$p
                || ($tipo === 'salida' && $cantidad > $p['existencia'])
                || (
                    $tipo === 'entrada'
                    && $p['existencia'] + $cantidad > $p['stock_maximo']
                )
            ) {
                throw new DomainException(
                    'El movimiento supera las existencias '
                    . 'o el stock máximo.'
                );
            }

            $this->insertarMovimiento($id, $tipo, $cantidad, $motivo);
            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $e;
        }
    }

    public function eliminar(int $id): void
    {
        $q = $this->db->prepare(
            'DELETE FROM Producto WHERE id_producto=?'
        );

        $q->execute([$id]);
    }

    public function crearMarca(string $nombre): void
    {
        $q = $this->db->prepare(
            'INSERT INTO Marca(nombre_marca) VALUES (?)'
        );

        $q->execute([$nombre]);
    }
}