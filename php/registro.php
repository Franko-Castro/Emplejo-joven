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

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$correo = trim($data["correo"] ?? "");
$confirmacionCorreo = trim($data["confirmacion_correo"] ?? "");

$password = $data["password"] ?? "";
$confirmacionPassword = $data["confirmacion_password"] ?? "";

$tipoUsuario = $data["tipo_usuario"] ?? "";

$nombreCompleto = trim($data["nombre_completo"] ?? "");
$nombreEmpresa = trim($data["nombre_empresa"] ?? "");


/*
|--------------------------------------------------------------------------
| Validaciones
|--------------------------------------------------------------------------
*/

if (
    empty($correo) ||
    empty($confirmacionCorreo) ||
    empty($password) ||
    empty($confirmacionPassword) ||
    empty($tipoUsuario)
) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Todos los campos obligatorios deben estar completos"
    ]);

    exit;
}


if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "El correo electrónico no es válido"
    ]);

    exit;
}


if ($correo !== $confirmacionCorreo) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Los correos electrónicos no coinciden"
    ]);

    exit;
}


if ($password !== $confirmacionPassword) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Las contraseñas no coinciden"
    ]);

    exit;
}


if (!in_array($tipoUsuario, ["persona", "empresa"], true)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Tipo de usuario no válido"
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Validar nombre según el tipo de usuario
|--------------------------------------------------------------------------
*/

if ($tipoUsuario === "persona" && empty($nombreCompleto)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "El nombre completo es obligatorio"
    ]);

    exit;
}


if ($tipoUsuario === "empresa" && empty($nombreEmpresa)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "El nombre de la empresa es obligatorio"
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Verificar correo existente
|--------------------------------------------------------------------------
*/

$sql = "
    SELECT id_usuario
    FROM usuarios
    WHERE correo = :correo
    LIMIT 1
";

$stmt = $conexion->prepare($sql);

$stmt->execute([
    ":correo" => $correo
]);

if ($stmt->fetch()) {

    http_response_code(409);

    echo json_encode([
        "success" => false,
        "message" => "El correo electrónico ya está registrado"
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Registrar usuario
|--------------------------------------------------------------------------
*/

try {

    $conexion->beginTransaction();

    $passwordHash = password_hash(
        $password,
        PASSWORD_DEFAULT
    );


    /*
    |--------------------------------------------------------------------------
    | Crear usuario
    |--------------------------------------------------------------------------
    */

    $sqlUsuario = "
        INSERT INTO usuarios (
            correo,
            password_hash,
            tipo_usuario
        )
        VALUES (
            :correo,
            :password_hash,
            :tipo_usuario
        )
    ";

    $stmtUsuario = $conexion->prepare($sqlUsuario);

    $stmtUsuario->execute([
        ":correo" => $correo,
        ":password_hash" => $passwordHash,
        ":tipo_usuario" => $tipoUsuario
    ]);

    $idUsuario = $conexion->lastInsertId();


    /*
    |--------------------------------------------------------------------------
    | Crear perfil de persona
    |--------------------------------------------------------------------------
    */

    if ($tipoUsuario === "persona") {

        $sqlPerfil = "
            INSERT INTO perfil_personas (
                id_usuario,
                nombre_completo
            )
            VALUES (
                :id_usuario,
                :nombre_completo
            )
        ";

        $stmtPerfil = $conexion->prepare($sqlPerfil);

        $stmtPerfil->execute([
            ":id_usuario" => $idUsuario,
            ":nombre_completo" => $nombreCompleto
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Crear perfil de empresa
    |--------------------------------------------------------------------------
    */

    if ($tipoUsuario === "empresa") {

        $sqlEmpresa = "
            INSERT INTO empresas (
                id_usuario,
                nombre_empresa
            )
            VALUES (
                :id_usuario,
                :nombre_empresa
            )
        ";

        $stmtEmpresa = $conexion->prepare($sqlEmpresa);

        $stmtEmpresa->execute([
            ":id_usuario" => $idUsuario,
            ":nombre_empresa" => $nombreEmpresa
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Confirmar transacción
    |--------------------------------------------------------------------------
    */

    $conexion->commit();

    // Iniciar sesión automáticamente al registrarse
    $_SESSION["id_usuario"] = (int)$idUsuario;
    $_SESSION["correo"] = $correo;
    $_SESSION["tipo_usuario"] = $tipoUsuario;


    http_response_code(201);

    echo json_encode([
        "success" => true,
        "message" => "Usuario registrado correctamente",
        "data" => [
            "id_usuario" => (int)$idUsuario,
            "tipo_usuario" => $tipoUsuario
        ]
    ]);

} catch (Exception $e) {

    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "No fue posible completar el registro"
    ]);
}