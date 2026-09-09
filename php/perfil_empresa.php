<?php
require_once "../config/sesion.php";
header("Content-Type: application/json; charset=UTF-8");
require_once "../config/conexion.php";

if (!isset($_SESSION["id_usuario"]) || ($_SESSION["tipo_usuario"] ?? "") !== "empresa") {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Debes iniciar sesión como empresa"]);
    exit;
}

function obtenerPerfilEmpresa($conexion, $idUsuario) {
    $stmt = $conexion->prepare(
        "SELECT e.nombre_empresa, e.telefono, e.descripcion, e.id_categoria, e.logo, u.correo
         FROM empresas e INNER JOIN usuarios u ON u.id_usuario = e.id_usuario
         WHERE e.id_usuario = :id_usuario LIMIT 1"
    );
    $stmt->execute([":id_usuario" => $idUsuario]);
    return $stmt->fetch();
}

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    try {
        $perfil = obtenerPerfilEmpresa($conexion, $_SESSION["id_usuario"]);
        if (!$perfil) throw new Exception();
        echo json_encode(["success" => true, "data" => $perfil]);
    } catch (Exception $e) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "No encontramos el perfil empresarial"]);
    }
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

$nombre = trim($_POST["nombre_empresa"] ?? "");
$correo = trim($_POST["correo"] ?? "");
$telefono = trim($_POST["telefono"] ?? "");
$descripcion = trim($_POST["descripcion"] ?? "");
$idCategoria = filter_var($_POST["id_categoria"] ?? null, FILTER_VALIDATE_INT);
if ($nombre === "" || $correo === "" || $telefono === "" || $descripcion === "" || !$idCategoria || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(["success" => false, "message" => "Completa todos los campos obligatorios con datos válidos"]);
    exit;
}

try {
    $perfilActual = obtenerPerfilEmpresa($conexion, $_SESSION["id_usuario"]);
    if (!$perfilActual) throw new Exception("Perfil no encontrado");
    $categoria = $conexion->prepare("SELECT id_categoria FROM categorias WHERE id_categoria = :id AND activo = TRUE");
    $categoria->execute([":id" => $idCategoria]);
    if (!$categoria->fetch()) throw new InvalidArgumentException("La categoría seleccionada no es válida");
    $correoExistente = $conexion->prepare("SELECT id_usuario FROM usuarios WHERE correo = :correo AND id_usuario <> :id_usuario");
    $correoExistente->execute([":correo" => $correo, ":id_usuario" => $_SESSION["id_usuario"]]);
    if ($correoExistente->fetch()) throw new InvalidArgumentException("Ese correo electrónico ya está registrado");

    $logo = $perfilActual["logo"];
    if (isset($_FILES["logo"]) && $_FILES["logo"]["error"] !== UPLOAD_ERR_NO_FILE) {
        if ($_FILES["logo"]["error"] !== UPLOAD_ERR_OK || $_FILES["logo"]["size"] > 2 * 1024 * 1024) throw new InvalidArgumentException("El logo debe pesar máximo 2 MB");
        $tipos = ["image/jpeg" => "jpg", "image/png" => "png", "image/webp" => "webp"];
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($_FILES["logo"]["tmp_name"]);
        if (!isset($tipos[$mime])) throw new InvalidArgumentException("El logo debe ser una imagen PNG, JPG o WEBP");
        $directorio = "../uploads/perfiles";
        if (!is_dir($directorio) && !mkdir($directorio, 0755, true)) throw new Exception("No se pudo preparar el directorio del logo");
        $nombreArchivo = "empresa_" . $_SESSION["id_usuario"] . "_" . bin2hex(random_bytes(8)) . "." . $tipos[$mime];
        if (!move_uploaded_file($_FILES["logo"]["tmp_name"], "$directorio/$nombreArchivo")) throw new Exception("No fue posible guardar el logo");

        // Eliminar logo anterior si existía en uploads
        if (!empty($perfilActual["logo"]) && str_starts_with($perfilActual["logo"], "uploads/perfiles/")) {
            $antiguoLogo = "../" . $perfilActual["logo"];
            if (file_exists($antiguoLogo)) {
                @unlink($antiguoLogo);
            }
        }

        $logo = "uploads/perfiles/$nombreArchivo";
    }

    $conexion->beginTransaction();
    $actualizarUsuario = $conexion->prepare("UPDATE usuarios SET correo = :correo WHERE id_usuario = :id_usuario");
    $actualizarUsuario->execute([":correo" => $correo, ":id_usuario" => $_SESSION["id_usuario"]]);
    $actualizarEmpresa = $conexion->prepare("UPDATE empresas SET nombre_empresa = :nombre, telefono = :telefono, descripcion = :descripcion, id_categoria = :categoria, logo = :logo WHERE id_usuario = :id_usuario");
    $actualizarEmpresa->execute([":nombre" => $nombre, ":telefono" => $telefono, ":descripcion" => $descripcion, ":categoria" => $idCategoria, ":logo" => $logo, ":id_usuario" => $_SESSION["id_usuario"]]);
    $conexion->commit();
    $_SESSION["correo"] = $correo;
    echo json_encode(["success" => true, "message" => "Perfil actualizado", "data" => ["nombre" => $nombre, "correo" => $correo, "foto" => $logo, "telefono" => $telefono, "descripcion" => $descripcion, "id_categoria" => $idCategoria]]);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} catch (Exception $e) {
    if ($conexion->inTransaction()) $conexion->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "No fue posible guardar el perfil empresarial"]);
}
