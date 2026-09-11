<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
require_once "../config/conexion.php";

try {
    $limitParam = $_GET["limit"] ?? "6";
    $showAll = $limitParam === "all";
    $limit = max(1, min(100, (int)$limitParam));
    $limitSql = $showAll ? "" : " LIMIT :limit";

    $stmt = $conexion->prepare(
        "SELECT o.id_oferta,
                o.cargo,
                o.experiencia_requerida,
                o.fecha_publicacion,
                COALESCE(NULLIF(e.nombre_empresa, ''), 'Empresa Confidencial') AS nombre_empresa,
                e.logo,
                c.nombre AS categoria
         FROM ofertas_laborales o
         INNER JOIN empresas e ON e.id_empresa = o.id_empresa
         INNER JOIN categorias c ON c.id_categoria = o.id_categoria
         WHERE o.estado = 'activa'
            ORDER BY o.fecha_publicacion DESC$limitSql"
    );
        if (!$showAll) {
           $stmt->bindValue(":limit", $limit, PDO::PARAM_INT);
        }
    $stmt->execute();

    $vacantes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data"    => $vacantes,
        "total"   => count($vacantes)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "No fue posible cargar las vacantes"
    ]);
}
