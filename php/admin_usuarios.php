<?php
session_start();
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
// GET: Listar usuarios con filtros y búsqueda
// =============================================================
if ($metodo === "GET") {
    try {
        $q = trim($_GET["q"] ?? "");
        $tipo = trim($_GET["tipo"] ?? "todos");
        $activo = trim($_GET["activo"] ?? "todos");

        $sql = "
            SELECT 
                u.id_usuario,
                u.correo,
                u.tipo_usuario,
                u.activo,
                u.correo_verificado,
                u.fecha_creacion,
                u.fecha_actualizacion,
                CASE 
                    WHEN u.tipo_usuario = 'persona' THEN COALESCE(p.nombre_completo, 'Postulante')
                    WHEN u.tipo_usuario = 'empresa' THEN COALESCE(e.nombre_empresa, 'Empresa')
                    ELSE 'Administrador'
                END AS nombre,
                p.telefono AS tel_persona,
                p.foto_perfil,
                p.cargo_profesion,
                p.cargo_interes,
                p.descripcion_profesional,
                e.telefono AS tel_empresa,
                e.logo,
                e.descripcion AS desc_empresa,
                c.nombre AS categoria_nombre,
                h.nombre_archivo AS cv_nombre,
                h.ruta_archivo AS cv_ruta
            FROM usuarios u
            LEFT JOIN perfil_personas p ON p.id_usuario = u.id_usuario
            LEFT JOIN empresas e ON e.id_usuario = u.id_usuario
            LEFT JOIN categorias c ON c.id_categoria = COALESCE(p.id_categoria, e.id_categoria)
            LEFT JOIN hojas_de_vida h ON h.id_usuario = u.id_usuario AND h.activa = 1
            WHERE 1=1
        ";

        $params = [];

        if ($tipo !== "todos" && in_array($tipo, ["persona", "empresa", "admin"], true)) {
            $sql .= " AND u.tipo_usuario = :tipo";
            $params[":tipo"] = $tipo;
        }

        if ($activo === "1" || $activo === "0") {
            $sql .= " AND u.activo = :activo";
            $params[":activo"] = (int)$activo;
        }

        if ($q !== "") {
            $sql .= " AND (
                u.correo LIKE :q 
                OR p.nombre_completo LIKE :q 
                OR e.nombre_empresa LIKE :q 
                OR p.cargo_profesion LIKE :q
            )";
            $params[":q"] = "%" . $q . "%";
        }

        $sql .= " ORDER BY u.fecha_creacion DESC";

        $stmt = $conexion->prepare($sql);
        $stmt->execute($params);
        $usuarios = $stmt->fetchAll();

        echo json_encode([
            "success" => true,
            "data" => $usuarios,
            "total" => count($usuarios)
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Error al consultar usuarios: " . $e->getMessage()
        ]);
    }
    exit;
}

// =============================================================
// POST: Acciones de administración sobre usuarios
// =============================================================
if ($metodo === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Datos de solicitud inválidos."]);
        exit;
    }

    $action = $data["action"] ?? "";
    $idUsuario = filter_var($data["id_usuario"] ?? null, FILTER_VALIDATE_INT);

    if (!$idUsuario) {
        http_response_code(422);
        echo json_encode(["success" => false, "message" => "ID de usuario requerido."]);
        exit;
    }

    try {
        // 1. Cambiar estado (Activar / Suspender)
        if ($action === "toggle_status") {
            // Evitar suspenderse a sí mismo
            if ($idUsuario === (int)$_SESSION["id_usuario"]) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "No puedes cambiar el estado de tu propia cuenta de administrador."]);
                exit;
            }

            $nuevoEstado = isset($data["activo"]) && ((int)$data["activo"] === 1 || $data["activo"] === true) ? 1 : 0;

            $stmt = $conexion->prepare("UPDATE usuarios SET activo = :activo WHERE id_usuario = :id");
            $stmt->execute([":activo" => $nuevoEstado, ":id" => $idUsuario]);

            echo json_encode([
                "success" => true,
                "message" => $nuevoEstado === 1 ? "Usuario reactivado exitosamente." : "Usuario suspendido correctamente.",
                "activo"  => $nuevoEstado
            ]);
            exit;
        }

        // 2. Eliminar usuario
        if ($action === "delete_user") {
            if ($idUsuario === (int)$_SESSION["id_usuario"]) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "No puedes eliminar tu propia cuenta de administrador."]);
                exit;
            }

            // Consultar archivos para eliminarlos del disco
            $stmtPersona = $conexion->prepare("SELECT foto_perfil FROM perfil_personas WHERE id_usuario = :id");
            $stmtPersona->execute([":id" => $idUsuario]);
            $p = $stmtPersona->fetch();
            if ($p && !empty($p["foto_perfil"]) && str_starts_with($p["foto_perfil"], "uploads/perfiles/")) {
                @unlink("../" . $p["foto_perfil"]);
            }

            $stmtEmp = $conexion->prepare("SELECT logo FROM empresas WHERE id_usuario = :id");
            $stmtEmp->execute([":id" => $idUsuario]);
            $e = $stmtEmp->fetch();
            if ($e && !empty($e["logo"]) && str_starts_with($e["logo"], "uploads/perfiles/")) {
                @unlink("../" . $e["logo"]);
            }

            $stmtCvs = $conexion->prepare("SELECT ruta_archivo FROM hojas_de_vida WHERE id_usuario = :id");
            $stmtCvs->execute([":id" => $idUsuario]);
            while ($cv = $stmtCvs->fetch()) {
                if (!empty($cv["ruta_archivo"]) && str_starts_with($cv["ruta_archivo"], "uploads/hojas_vida/")) {
                    @unlink("../" . $cv["ruta_archivo"]);
                }
            }

            // Eliminar de la base de datos (las FK en cascada eliminan el perfil, cvs y ofertas vinculadas)
            $stmtDelete = $conexion->prepare("DELETE FROM usuarios WHERE id_usuario = :id");
            $stmtDelete->execute([":id" => $idUsuario]);

            echo json_encode([
                "success" => true,
                "message" => "Usuario y todos sus datos eliminados correctamente."
            ]);
            exit;
        }

        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Acción no reconocida."]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al procesar la solicitud: " . $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Método no permitido."]);
