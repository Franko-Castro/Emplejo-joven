<?php
require_once "../config/sesion.php";
header("Content-Type: application/json; charset=UTF-8");
require_once "../config/conexion.php";

// Verificación estricta de rol administrador
if (!isset($_SESSION["id_usuario"]) || ($_SESSION["tipo_usuario"] ?? "") !== "admin") {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Acceso denegado. Se requieren permisos de administrador."
    ]);
    exit;
}

$metodo = $_SERVER["REQUEST_METHOD"];

// =============================================================
// GET: Listar todas las categorías con estadísticas de uso
// =============================================================
if ($metodo === "GET") {
    try {
        $stmt = $conexion->query("
            SELECT 
                c.id_categoria,
                c.nombre,
                c.descripcion,
                c.activo,
                c.fecha_creacion,
                COUNT(o.id_oferta) AS total_ofertas,
                SUM(CASE WHEN o.estado = 'activa' THEN 1 ELSE 0 END) AS ofertas_activas,
                COUNT(DISTINCT p.id_perfil) AS total_postulantes,
                COUNT(DISTINCT e.id_empresa) AS total_empresas
            FROM categorias c
            LEFT JOIN ofertas_laborales o ON o.id_categoria = c.id_categoria
            LEFT JOIN perfil_personas p ON p.id_categoria = c.id_categoria
            LEFT JOIN empresas e ON e.id_categoria = c.id_categoria
            GROUP BY c.id_categoria, c.nombre, c.descripcion, c.activo, c.fecha_creacion
            ORDER BY c.nombre ASC
        ");

        $categorias = $stmt->fetchAll();

        echo json_encode([
            "success" => true,
            "data" => $categorias
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Error al obtener categorías: " . $e->getMessage()
        ]);
    }
    exit;
}

// =============================================================
// POST: Crear, actualizar o cambiar estado de categorías
// =============================================================
if ($metodo === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Datos de solicitud inválidos."]);
        exit;
    }

    $action = $data["action"] ?? "";

    try {
        // 1. Crear nueva categoría
        if ($action === "create") {
            $nombre = trim($data["nombre"] ?? "");
            $descripcion = trim($data["descripcion"] ?? "");
            $activo = isset($data["activo"]) && ((int)$data["activo"] === 1 || $data["activo"] === true) ? 1 : 1;

            if ($nombre === "") {
                http_response_code(422);
                echo json_encode(["success" => false, "message" => "El nombre de la categoría es obligatorio."]);
                exit;
            }

            // Verificar nombre único
            $check = $conexion->prepare("SELECT id_categoria FROM categorias WHERE LOWER(nombre) = LOWER(:nombre) LIMIT 1");
            $check->execute([":nombre" => $nombre]);
            if ($check->fetch()) {
                http_response_code(409);
                echo json_encode(["success" => false, "message" => "Ya existe una categoría con este nombre."]);
                exit;
            }

            $stmt = $conexion->prepare("INSERT INTO categorias (nombre, descripcion, activo) VALUES (:nombre, :descripcion, :activo)");
            $stmt->execute([
                ":nombre"      => $nombre,
                ":descripcion" => $descripcion ?: null,
                ":activo"      => $activo
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Categoría creada exitosamente.",
                "data"    => ["id_categoria" => (int)$conexion->lastInsertId(), "nombre" => $nombre]
            ]);
            exit;
        }

        // 2. Actualizar categoría existente
        if ($action === "update") {
            $idCategoria = filter_var($data["id_categoria"] ?? null, FILTER_VALIDATE_INT);
            $nombre = trim($data["nombre"] ?? "");
            $descripcion = trim($data["descripcion"] ?? "");
            $activo = isset($data["activo"]) && ((int)$data["activo"] === 1 || $data["activo"] === true) ? 1 : 0;

            if (!$idCategoria || $nombre === "") {
                http_response_code(422);
                echo json_encode(["success" => false, "message" => "Nombre e ID de categoría son obligatorios."]);
                exit;
            }

            // Verificar nombre único en otras categorías
            $check = $conexion->prepare("SELECT id_categoria FROM categorias WHERE LOWER(nombre) = LOWER(:nombre) AND id_categoria <> :id LIMIT 1");
            $check->execute([":nombre" => $nombre, ":id" => $idCategoria]);
            if ($check->fetch()) {
                http_response_code(409);
                echo json_encode(["success" => false, "message" => "Ya existe otra categoría con este nombre."]);
                exit;
            }

            $stmt = $conexion->prepare("UPDATE categorias SET nombre = :nombre, descripcion = :descripcion, activo = :activo WHERE id_categoria = :id");
            $stmt->execute([
                ":nombre"      => $nombre,
                ":descripcion" => $descripcion ?: null,
                ":activo"      => $activo,
                ":id"          => $idCategoria
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Categoría actualizada correctamente."
            ]);
            exit;
        }

        // 3. Cambiar estado activo / inactivo
        if ($action === "toggle_status") {
            $idCategoria = filter_var($data["id_categoria"] ?? null, FILTER_VALIDATE_INT);
            if (!$idCategoria) {
                http_response_code(422);
                echo json_encode(["success" => false, "message" => "ID de categoría requerido."]);
                exit;
            }

            $nuevoEstado = isset($data["activo"]) && ((int)$data["activo"] === 1 || $data["activo"] === true) ? 1 : 0;

            $stmt = $conexion->prepare("UPDATE categorias SET activo = :activo WHERE id_categoria = :id");
            $stmt->execute([":activo" => $nuevoEstado, ":id" => $idCategoria]);

            echo json_encode([
                "success" => true,
                "message" => $nuevoEstado === 1 ? "Categoría habilitada." : "Categoría deshabilitada.",
                "activo"  => $nuevoEstado
            ]);
            exit;
        }

        // 4. Eliminar categoría (si no tiene ofertas)
        if ($action === "delete") {
            $idCategoria = filter_var($data["id_categoria"] ?? null, FILTER_VALIDATE_INT);
            if (!$idCategoria) {
                http_response_code(422);
                echo json_encode(["success" => false, "message" => "ID de categoría requerido."]);
                exit;
            }

            $checkOffers = $conexion->prepare("SELECT COUNT(*) AS total FROM ofertas_laborales WHERE id_categoria = :id");
            $checkOffers->execute([":id" => $idCategoria]);
            if ((int)($checkOffers->fetch()["total"] ?? 0) > 0) {
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "message" => "No se puede eliminar la categoría porque tiene ofertas laborales asociadas. Puedes desactivarla en su lugar."
                ]);
                exit;
            }

            $stmt = $conexion->prepare("DELETE FROM categorias WHERE id_categoria = :id");
            $stmt->execute([":id" => $idCategoria]);

            echo json_encode([
                "success" => true,
                "message" => "Categoría eliminada exitosamente."
            ]);
            exit;
        }

        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Acción no reconocida."]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al procesar categoría: " . $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Método no permitido."]);
