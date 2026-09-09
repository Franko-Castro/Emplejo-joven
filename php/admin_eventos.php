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
// GET: Listar eventos para panel de administración
// =============================================================
if ($metodo === "GET") {
    try {
        $q = trim($_GET["q"] ?? "");
        $activo = trim($_GET["activo"] ?? "todos");
        $modalidad = trim($_GET["modalidad"] ?? "todos");

        $sql = "
            SELECT 
                e.id_evento,
                e.titulo,
                e.tipo_evento,
                e.descripcion,
                e.fecha_evento,
                e.modalidad,
                e.ubicacion_enlace,
                e.enlace_inscripcion,
                e.organizador,
                e.activo,
                e.fecha_creacion,
                e.fecha_actualizacion,
                u.correo AS creador_correo
            FROM eventos e
            INNER JOIN usuarios u ON u.id_usuario = e.id_usuario_creador
            WHERE 1=1
        ";

        $params = [];

        if ($activo === "1" || $activo === "0") {
            $sql .= " AND e.activo = :activo";
            $params[":activo"] = (int)$activo;
        }

        if ($modalidad !== "todos" && in_array($modalidad, ["virtual", "presencial", "hibrido"], true)) {
            $sql .= " AND e.modalidad = :modalidad";
            $params[":modalidad"] = $modalidad;
        }

        if ($q !== "") {
            $sql .= " AND (
                e.titulo LIKE :q 
                OR e.tipo_evento LIKE :q 
                OR e.organizador LIKE :q 
                OR e.descripcion LIKE :q
            )";
            $params[":q"] = "%" . $q . "%";
        }

        $sql .= " ORDER BY e.fecha_evento DESC";

        $stmt = $conexion->prepare($sql);
        $stmt->execute($params);
        $eventos = $stmt->fetchAll();

        echo json_encode([
            "success" => true,
            "data"    => $eventos,
            "total"   => count($eventos)
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Error al obtener eventos: " . $e->getMessage()
        ]);
    }
    exit;
}

// =============================================================
// POST: Crear, actualizar, alternar estado o eliminar eventos
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
        // 1. Crear nuevo evento
        if ($action === "create") {
            $titulo = trim($data["titulo"] ?? "");
            $tipoEvento = trim($data["tipo_evento"] ?? "Webinar Gratuito");
            $descripcion = trim($data["descripcion"] ?? "");
            $fechaEvento = trim($data["fecha_evento"] ?? "");
            $modalidad = trim($data["modalidad"] ?? "virtual");
            $ubicacion = trim($data["ubicacion_enlace"] ?? "");
            $enlaceInscripcion = trim($data["enlace_inscripcion"] ?? "");
            $organizador = trim($data["organizador"] ?? "EmpleoJoven");
            $activo = !isset($data["activo"]) || ((int)$data["activo"] === 1 || $data["activo"] === true) ? 1 : 0;

            if ($titulo === "" || $descripcion === "" || $fechaEvento === "") {
                http_response_code(422);
                echo json_encode(["success" => false, "message" => "Título, descripción y fecha del evento son obligatorios."]);
                exit;
            }

            if (!in_array($modalidad, ["virtual", "presencial", "hibrido"], true)) {
                $modalidad = "virtual";
            }

            $stmt = $conexion->prepare("
                INSERT INTO eventos 
                    (id_usuario_creador, titulo, tipo_evento, descripcion, fecha_evento, modalidad, ubicacion_enlace, enlace_inscripcion, organizador, activo)
                VALUES 
                    (:id_creador, :titulo, :tipo, :descripcion, :fecha, :modalidad, :ubicacion, :enlace, :organizador, :activo)
            ");

            $stmt->execute([
                ":id_creador"   => $_SESSION["id_usuario"],
                ":titulo"       => $titulo,
                ":tipo"         => $tipoEvento,
                ":descripcion"  => $descripcion,
                ":fecha"        => $fechaEvento,
                ":modalidad"    => $modalidad,
                ":ubicacion"    => $ubicacion ?: null,
                ":enlace"       => $enlaceInscripcion ?: null,
                ":organizador"  => $organizador ?: "EmpleoJoven",
                ":activo"       => $activo
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Evento publicado exitosamente.",
                "data"    => ["id_evento" => (int)$conexion->lastInsertId(), "titulo" => $titulo]
            ]);
            exit;
        }

        // 2. Actualizar evento existente
        if ($action === "update") {
            $idEvento = filter_var($data["id_evento"] ?? null, FILTER_VALIDATE_INT);
            $titulo = trim($data["titulo"] ?? "");
            $tipoEvento = trim($data["tipo_evento"] ?? "Webinar Gratuito");
            $descripcion = trim($data["descripcion"] ?? "");
            $fechaEvento = trim($data["fecha_evento"] ?? "");
            $modalidad = trim($data["modalidad"] ?? "virtual");
            $ubicacion = trim($data["ubicacion_enlace"] ?? "");
            $enlaceInscripcion = trim($data["enlace_inscripcion"] ?? "");
            $organizador = trim($data["organizador"] ?? "EmpleoJoven");
            $activo = isset($data["activo"]) && ((int)$data["activo"] === 1 || $data["activo"] === true) ? 1 : 0;

            if (!$idEvento || $titulo === "" || $descripcion === "" || $fechaEvento === "") {
                http_response_code(422);
                echo json_encode(["success" => false, "message" => "Todos los campos obligatorios deben estar completos."]);
                exit;
            }

            if (!in_array($modalidad, ["virtual", "presencial", "hibrido"], true)) {
                $modalidad = "virtual";
            }

            $stmt = $conexion->prepare("
                UPDATE eventos 
                SET titulo = :titulo,
                    tipo_evento = :tipo,
                    descripcion = :descripcion,
                    fecha_evento = :fecha,
                    modalidad = :modalidad,
                    ubicacion_enlace = :ubicacion,
                    enlace_inscripcion = :enlace,
                    organizador = :organizador,
                    activo = :activo
                WHERE id_evento = :id
            ");

            $stmt->execute([
                ":titulo"       => $titulo,
                ":tipo"         => $tipoEvento,
                ":descripcion"  => $descripcion,
                ":fecha"        => $fechaEvento,
                ":modalidad"    => $modalidad,
                ":ubicacion"    => $ubicacion ?: null,
                ":enlace"       => $enlaceInscripcion ?: null,
                ":organizador"  => $organizador ?: "EmpleoJoven",
                ":activo"       => $activo,
                ":id"           => $idEvento
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Evento actualizado correctamente."
            ]);
            exit;
        }

        // 3. Cambiar estado activo / inactivo
        if ($action === "toggle_status") {
            $idEvento = filter_var($data["id_evento"] ?? null, FILTER_VALIDATE_INT);
            if (!$idEvento) {
                http_response_code(422);
                echo json_encode(["success" => false, "message" => "ID de evento requerido."]);
                exit;
            }

            $nuevoEstado = isset($data["activo"]) && ((int)$data["activo"] === 1 || $data["activo"] === true) ? 1 : 0;

            $stmt = $conexion->prepare("UPDATE eventos SET activo = :activo WHERE id_evento = :id");
            $stmt->execute([":activo" => $nuevoEstado, ":id" => $idEvento]);

            echo json_encode([
                "success" => true,
                "message" => $nuevoEstado === 1 ? "Evento habilitado para el público." : "Evento deshabilitado.",
                "activo"  => $nuevoEstado
            ]);
            exit;
        }

        // 4. Eliminar evento
        if ($action === "delete") {
            $idEvento = filter_var($data["id_evento"] ?? null, FILTER_VALIDATE_INT);
            if (!$idEvento) {
                http_response_code(422);
                echo json_encode(["success" => false, "message" => "ID de evento requerido."]);
                exit;
            }

            $stmt = $conexion->prepare("DELETE FROM eventos WHERE id_evento = :id");
            $stmt->execute([":id" => $idEvento]);

            echo json_encode([
                "success" => true,
                "message" => "Evento eliminado exitosamente."
            ]);
            exit;
        }

        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Acción no reconocida."]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al procesar el evento: " . $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Método no permitido."]);
