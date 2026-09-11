<?php

// ---------------------------------------------------------------
// Conexión a la base de datos usando el puerto MySQL de producción.
// ---------------------------------------------------------------

// La sesión debe estar iniciada antes de incluir este archivo.
// (sesion.php lo hace; si se usa fuera de ese contexto lo iniciamos aquí)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$host     = "sql111.infinityfree.com";
$dbname   = "if0_42877241_plataforma_empleo";
$username = "if0_42877241";
$password = "dTxjpEDYHfrrM";

try {
    $conexion = new PDO(
        "mysql:host=$host;port=3306;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT            => 1
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error de conexión con la base de datos: " . $e->getMessage()
    ]);
    exit;
}
