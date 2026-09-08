<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

require_once "../config/conexion.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

if (!isset($_SESSION["id_usuario"]) || ($_SESSION["tipo_usuario"] ?? "") !== "empresa") {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Debes iniciar sesión como empresa"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos de solicitud inválidos"]);
    exit;
}

$cargo = trim($data["cargo"] ?? "");
$idCategoria = filter_var($data["id_categoria"] ?? null, FILTER_VALIDATE_INT);
$descripcion = trim($data["descripcion"] ?? "");
$experiencia = trim($data["experiencia_requerida"] ?? "");
$habilidades = trim($data["habilidades_requeridas"] ?? "");
$contacto = trim($data["datos_contacto"] ?? "");
$estado = $data["estado"] ?? "activa";

if ($cargo === "" || !$idCategoria || $descripcion === "" || $experiencia === "" || $habilidades === "" || $contacto === "") {
    http_response_code(422);
    echo json_encode(["success" => false, "message" => "Completa todos los campos de la oferta"]);
    exit;
}

if (strlen($cargo) > 150 || !in_array($estado, ["activa", "cerrada"], true)) {
    http_response_code(422);
    echo json_encode(["success" => false, "message" => "Los datos de la oferta no son válidos"]);
    exit;
}

try {
    $stmtEmpresa = $conexion->prepare("SELECT id_empresa FROM empresas WHERE id_usuario = :id_usuario LIMIT 1");
    $stmtEmpresa->execute([":id_usuario" => $_SESSION["id_usuario"]]);
    $empresa = $stmtEmpresa->fetch();

    if (!$empresa) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "No encontramos el perfil de empresa"]);
        exit;
    }

    $stmtCategoria = $conexion->prepare("SELECT id_categoria FROM categorias WHERE id_categoria = :id_categoria AND activo = TRUE");
    $stmtCategoria->execute([":id_categoria" => $idCategoria]);
    if (!$stmtCategoria->fetch()) {
        http_response_code(422);
        echo json_encode(["success" => false, "message" => "La categoría seleccionada no es válida"]);
        exit;
    }

    $stmt = $conexion->prepare(
        "INSERT INTO ofertas_laborales
            (id_empresa, id_categoria, cargo, descripcion, experiencia_requerida, habilidades_requeridas, datos_contacto, estado)
         VALUES
            (:id_empresa, :id_categoria, :cargo, :descripcion, :experiencia, :habilidades, :contacto, :estado)"
    );
    $stmt->execute([
        ":id_empresa" => $empresa["id_empresa"],
        ":id_categoria" => $idCategoria,
        ":cargo" => $cargo,
        ":descripcion" => $descripcion,
        ":experiencia" => $experiencia ?: null,
        ":habilidades" => $habilidades ?: null,
        ":contacto" => $contacto,
        ":estado" => $estado
    ]);

    http_response_code(201);
    echo json_encode(["success" => true, "message" => "Vacante publicada correctamente", "data" => ["id_oferta" => (int)$conexion->lastInsertId(), "cargo" => $cargo, "estado" => $estado]]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "No fue posible publicar la vacante"]);
}
