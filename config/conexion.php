<?php

$host = "127.0.0.1";
$ports = ["3307", "3306"];
$dbname = "plataforma_empleo";
$username = "root";
$password = "";

$conexion = null;
$errorMsg = "";

foreach ($ports as $port) {
    try {
        $conexion = new PDO(
            "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 2
            ]
        );
        break; // Conexión exitosa
    } catch (PDOException $e) {
        $errorMsg = $e->getMessage();
        $conexion = null;
    }
}

if (!$conexion) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error de conexión con la base de datos: " . $errorMsg
    ]);
    exit;
}