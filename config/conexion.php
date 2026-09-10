<?php

// ---------------------------------------------------------------
// Conexión a la base de datos con caché de puerto en sesión.
// En la primera petición exitosa guardamos el puerto que funcionó
// en $_SESSION['_db_port'] para evitar el timeout de reintento en
// cada petición posterior dentro de la misma sesión del usuario.
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

// Ponemos el puerto conocido primero (si ya lo detectamos antes)
$allPorts = ["3307", "3306"];
if (!empty($_SESSION['_db_port'])) {
    // Mueve el puerto guardado al inicio para probar primero
    $cachedPort = $_SESSION['_db_port'];
    $allPorts = array_merge(
        [$cachedPort],
        array_filter($allPorts, fn($p) => $p !== $cachedPort)
    );
}

$conexion = null;
$errorMsg = "";

foreach ($allPorts as $port) {
    try {
        $conexion = new PDO(
            "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT            => 1   // 1 s por intento (antes: 2 s)
            ]
        );
        // Guardar el puerto funcional en sesión para la próxima petición
        $_SESSION['_db_port'] = $port;
        break; // Conexión exitosa
    } catch (PDOException $e) {
        $errorMsg = $e->getMessage();
        $conexion = null;
        // Si el puerto cacheado falló, borrarlo para que la próxima petición reintente
        if (isset($_SESSION['_db_port']) && $_SESSION['_db_port'] === $port) {
            unset($_SESSION['_db_port']);
        }
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
