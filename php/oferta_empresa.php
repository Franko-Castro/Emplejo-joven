<?php
require_once "../config/sesion.php";
header("Content-Type: application/json; charset=UTF-8");
require_once "../config/conexion.php";

if (!isset($_SESSION["id_usuario"]) || ($_SESSION["tipo_usuario"] ?? "") !== "empresa") {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Debes iniciar sesión como empresa"]);
    exit;
}

function obtenerOfertaEmpresa($conexion, $idUsuario, $idOferta) {
    $stmt = $conexion->prepare(
        "SELECT o.id_oferta, o.id_categoria, o.cargo, o.descripcion, o.experiencia_requerida,
                o.habilidades_requeridas, o.datos_contacto, o.estado, o.fecha_publicacion
         FROM ofertas_laborales o INNER JOIN empresas e ON e.id_empresa = o.id_empresa
         WHERE e.id_usuario = :id_usuario AND o.id_oferta = :id_oferta LIMIT 1"
    );
    $stmt->execute([":id_usuario" => $idUsuario, ":id_oferta" => $idOferta]);
    return $stmt->fetch();
}

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $idOferta = filter_var($_GET["id"] ?? null, FILTER_VALIDATE_INT);
    if (!$idOferta) {
        http_response_code(422);
        echo json_encode(["success" => false, "message" => "Vacante inválida"]);
        exit;
    }
    try {
        $oferta = obtenerOfertaEmpresa($conexion, $_SESSION["id_usuario"], $idOferta);
        if (!$oferta) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "No encontramos esta vacante"]);
            exit;
        }
        echo json_encode(["success" => true, "data" => $oferta]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "No fue posible consultar la vacante"]);
    }
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$idOferta = filter_var($data["id_oferta"] ?? null, FILTER_VALIDATE_INT);
$idCategoria = filter_var($data["id_categoria"] ?? null, FILTER_VALIDATE_INT);
$cargo = trim($data["cargo"] ?? "");
$descripcion = trim($data["descripcion"] ?? "");
$experiencia = trim($data["experiencia_requerida"] ?? "");
$habilidades = trim($data["habilidades_requeridas"] ?? "");
$contacto = trim($data["datos_contacto"] ?? "");
$estado = $data["estado"] ?? "";
if (!$idOferta || !$idCategoria || $cargo === "" || $descripcion === "" || $experiencia === "" || $habilidades === "" || $contacto === "" || !in_array($estado, ["activa", "cerrada"], true)) {
    http_response_code(422);
    echo json_encode(["success" => false, "message" => "Completa todos los campos con datos válidos"]);
    exit;
}

try {
    if (!obtenerOfertaEmpresa($conexion, $_SESSION["id_usuario"], $idOferta)) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "No tienes permiso para modificar esta vacante"]);
        exit;
    }
    $categoria = $conexion->prepare("SELECT id_categoria FROM categorias WHERE id_categoria = :id_categoria AND activo = TRUE");
    $categoria->execute([":id_categoria" => $idCategoria]);
    if (!$categoria->fetch()) throw new InvalidArgumentException("La categoría seleccionada no es válida");
    $stmt = $conexion->prepare("UPDATE ofertas_laborales SET id_categoria = :id_categoria, cargo = :cargo, descripcion = :descripcion, experiencia_requerida = :experiencia, habilidades_requeridas = :habilidades, datos_contacto = :contacto, estado = :estado, fecha_cierre = CASE WHEN :estado_cierre = 'cerrada' THEN COALESCE(fecha_cierre, NOW()) ELSE NULL END WHERE id_oferta = :id_oferta");
    $stmt->execute([":id_categoria" => $idCategoria, ":cargo" => $cargo, ":descripcion" => $descripcion, ":experiencia" => $experiencia, ":habilidades" => $habilidades, ":contacto" => $contacto, ":estado" => $estado, ":estado_cierre" => $estado, ":id_oferta" => $idOferta]);
    echo json_encode(["success" => true, "message" => $estado === "cerrada" ? "Vacante cerrada correctamente" : "Vacante actualizada correctamente"]);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "No fue posible actualizar la vacante"]);
}
