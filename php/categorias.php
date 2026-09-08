<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

require_once "../config/conexion.php";

if (!isset($_SESSION["id_usuario"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Debes iniciar sesión"]);
    exit;
}

try {
    $stmt = $conexion->query(
        "SELECT id_categoria, nombre FROM categorias WHERE activo = TRUE ORDER BY id_categoria ASC"
    );

    echo json_encode(["success" => true, "data" => $stmt->fetchAll()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "No fue posible cargar las categorías"]);
}
