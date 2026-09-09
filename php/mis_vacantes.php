<?php
require_once "../config/sesion.php";
header("Content-Type: application/json; charset=UTF-8");
require_once "../config/conexion.php";

if (!isset($_SESSION["id_usuario"]) || ($_SESSION["tipo_usuario"] ?? "") !== "empresa") {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Debes iniciar sesión como empresa"]);
    exit;
}

try {
    $incluirCerradas = ($_GET["todas"] ?? "0") === "1";
    $sql = "SELECT o.id_oferta, o.cargo, o.estado, o.fecha_publicacion, c.nombre AS categoria
            FROM ofertas_laborales o
            INNER JOIN empresas e ON e.id_empresa = o.id_empresa
            INNER JOIN categorias c ON c.id_categoria = o.id_categoria
            WHERE e.id_usuario = :id_usuario";
    if (!$incluirCerradas) $sql .= " AND o.estado = 'activa'";
    $sql .= " ORDER BY o.fecha_publicacion DESC";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([":id_usuario" => $_SESSION["id_usuario"]]);
    echo json_encode(["success" => true, "data" => $stmt->fetchAll(), "total" => $stmt->rowCount()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "No fue posible cargar tus vacantes"]);
}
