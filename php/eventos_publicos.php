<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
require_once "../config/conexion.php";

try {
    $limit = isset($_GET["limit"]) ? max(1, min(50, (int)$_GET["limit"])) : null;

    $sql = "
        SELECT 
            id_evento,
            titulo,
            tipo_evento,
            descripcion,
            fecha_evento,
            modalidad,
            ubicacion_enlace,
            enlace_inscripcion,
            COALESCE(organizador, 'EmpleoJoven') AS organizador
        FROM eventos
        WHERE activo = 1
        ORDER BY fecha_evento ASC
    ";

    if ($limit) {
        $sql .= " LIMIT :limit";
        $stmt = $conexion->prepare($sql);
        $stmt->bindValue(":limit", $limit, PDO::PARAM_INT);
        $stmt->execute();
    } else {
        $stmt = $conexion->query($sql);
    }

    $eventos = $stmt->fetchAll();

    echo json_encode([
        "success" => true,
        "data"    => $eventos,
        "total"   => count($eventos)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "No fue posible cargar los eventos en este momento."
    ]);
}
