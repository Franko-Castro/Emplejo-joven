<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

require_once "../config/conexion.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$correo = trim($data["correo"] ?? "");
$password = $data["password"] ?? "";
$roleInput = $data["tipo_usuario"] ?? ""; // 'persona' o 'empresa'

if (empty($correo) || empty($password) || empty($roleInput)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Todos los campos son obligatorios"
    ]);
    exit;
}

try {
    // Buscar usuario en la base de datos
    $sql = "SELECT id_usuario, password_hash, tipo_usuario, activo FROM usuarios WHERE correo = :correo LIMIT 1";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([":correo" => $correo]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Correo electrónico o contraseña incorrectos"
        ]);
        exit;
    }

    if (!$user["activo"]) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Esta cuenta está desactivada"
        ]);
        exit;
    }

    // Verificar contraseña
    if (!password_verify($password, $user["password_hash"])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Correo electrónico o contraseña incorrectos"
        ]);
        exit;
    }

    // Verificar tipo de usuario (si es admin en BD, se permite el acceso como administrador)
    if ($user["tipo_usuario"] !== "admin" && $user["tipo_usuario"] !== $roleInput) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "El rol seleccionado no corresponde a esta cuenta"
        ]);
        exit;
    }

    // Iniciar sesión
    $_SESSION["id_usuario"] = (int)$user["id_usuario"];
    $_SESSION["correo"] = $correo;
    $_SESSION["tipo_usuario"] = $user["tipo_usuario"];

    echo json_encode([
        "success" => true,
        "message" => "Sesión iniciada con éxito",
        "data" => [
            "id_usuario" => (int)$user["id_usuario"],
            "tipo_usuario" => $user["tipo_usuario"]
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Ocurrió un error en el servidor al intentar iniciar sesión"
    ]);
}
