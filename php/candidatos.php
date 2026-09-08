<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
require_once "../config/conexion.php";

if (!isset($_SESSION["id_usuario"]) || ($_SESSION["tipo_usuario"] ?? "") !== "empresa") {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Debes iniciar sesión como empresa"]);
    exit;
}

try {
    $stmt = $conexion->query(
        "SELECT 
            p.id_perfil,
            p.id_usuario,
            COALESCE(NULLIF(p.nombre_completo, ''), 'Candidato') AS nombre_completo,
            p.telefono,
            p.foto_perfil,
            COALESCE(NULLIF(p.cargo_profesion, ''), NULLIF(p.cargo_interes, ''), 'Profesional disponible') AS cargo_profesion,
            p.id_categoria,
            COALESCE(c.nombre, 'General') AS categoria_nombre,
            p.cargo_interes,
            p.descripcion_profesional,
            p.experiencia,
            p.habilidades,
            u.correo,
            h.id_hoja_vida,
            h.nombre_archivo AS cv_nombre,
            h.ruta_archivo AS cv_ruta,
            h.tipo_archivo AS cv_tipo,
            p.fecha_actualizacion
         FROM usuarios u
         INNER JOIN perfil_personas p ON p.id_usuario = u.id_usuario
         LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
         LEFT JOIN hojas_de_vida h ON h.id_usuario = u.id_usuario AND h.activa = 1
         WHERE u.tipo_usuario = 'persona' AND u.activo = 1
         ORDER BY p.fecha_actualizacion DESC, p.id_perfil DESC"
    );

    $candidatos = $stmt->fetchAll();

    echo json_encode([
        "success" => true,
        "data" => $candidatos
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "No fue posible cargar el listado de candidatos"
    ]);
}
