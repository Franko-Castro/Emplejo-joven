<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
require_once "../config/conexion.php";

if (!isset($_SESSION["id_usuario"]) || ($_SESSION["tipo_usuario"] ?? "") !== "persona") {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Debes iniciar sesión como postulante"]);
    exit;
}

try {
    $stmt = $conexion->query(
        "SELECT o.id_oferta, o.cargo, o.descripcion, o.experiencia_requerida,
                o.habilidades_requeridas, o.datos_contacto, o.fecha_publicacion,
                COALESCE(NULLIF(e.nombre_empresa, ''), 'Empresa Confidencial') AS nombre_empresa,
                e.logo, e.telefono AS telefono_empresa, c.nombre AS categoria
         FROM ofertas_laborales o
         INNER JOIN empresas e ON e.id_empresa = o.id_empresa
         INNER JOIN categorias c ON c.id_categoria = o.id_categoria
         WHERE o.estado = 'activa'
         ORDER BY o.fecha_publicacion DESC"
    );
    echo json_encode(["success" => true, "data" => $stmt->fetchAll()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "No fue posible cargar las vacantes disponibles"]);
}
