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
// GET: Listar ofertas con filtros
// =============================================================
if ($metodo === "GET") {
    try {
        $q = trim($_GET["q"] ?? "");
        $estado = trim($_GET["estado"] ?? "todos");
        $idCategoria = filter_var($_GET["id_categoria"] ?? null, FILTER_VALIDATE_INT);

        $sql = "
            SELECT 
                o.id_oferta,
                o.cargo,
                o.descripcion,
                o.experiencia_requerida,
                o.habilidades_requeridas,
                o.datos_contacto,
                o.estado,
                o.fecha_publicacion,
                o.fecha_actualizacion,
                o.fecha_cierre,
                c.id_categoria,
                c.nombre AS categoria_nombre,
                e.id_empresa,
                COALESCE(NULLIF(e.nombre_empresa, ''), 'Empresa Confidencial') AS nombre_empresa,
                e.logo,
                e.telefono AS telefono_empresa,
                u.correo AS correo_empresa
            FROM ofertas_laborales o
            INNER JOIN empresas e ON e.id_empresa = o.id_empresa
            INNER JOIN usuarios u ON u.id_usuario = e.id_usuario
            INNER JOIN categorias c ON c.id_categoria = o.id_categoria
            WHERE 1=1
        ";

        $params = [];

        if ($estado === "activa" || $estado === "cerrada") {
            $sql .= " AND o.estado = :estado";
            $params[":estado"] = $estado;
        }

        if ($idCategoria) {
            $sql .= " AND o.id_categoria = :id_categoria";
            $params[":id_categoria"] = $idCategoria;
        }

        if ($q !== "") {
            $sql .= " AND (
                o.cargo LIKE :q 
                OR e.nombre_empresa LIKE :q 
                OR c.nombre LIKE :q 
                OR o.descripcion LIKE :q
                OR o.datos_contacto LIKE :q
            )";
            $params[":q"] = "%" . $q . "%";
        }

        $sql .= " ORDER BY o.fecha_publicacion DESC";

        $stmt = $conexion->prepare($sql);
        $stmt->execute($params);
        $ofertas = $stmt->fetchAll();

        echo json_encode([
            "success" => true,
            "data" => $ofertas,
            "total" => count($ofertas)
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Error al consultar ofertas: " . $e->getMessage()
        ]);
    }
    exit;
}

// =============================================================
// POST: Moderación de ofertas (Activar / Cerrar / Eliminar)
// =============================================================
if ($metodo === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Datos de solicitud inválidos."]);
        exit;
    }

    $action = $data["action"] ?? "";
    $idOferta = filter_var($data["id_oferta"] ?? null, FILTER_VALIDATE_INT);

    if (!$idOferta) {
        http_response_code(422);
        echo json_encode(["success" => false, "message" => "ID de oferta requerido."]);
        exit;
    }

    try {
        // 1. Cambiar estado (Activar / Cerrar)
        if ($action === "toggle_status") {
            $nuevoEstado = ($data["estado"] ?? "") === "activa" ? "activa" : "cerrada";

            $stmt = $conexion->prepare("
                UPDATE ofertas_laborales 
                SET estado = :estado, 
                    fecha_cierre = CASE WHEN :estado_cierre = 'cerrada' THEN NOW() ELSE NULL END
                WHERE id_oferta = :id
            ");
            $stmt->execute([
                ":estado"        => $nuevoEstado,
                ":estado_cierre" => $nuevoEstado,
                ":id"            => $idOferta
            ]);

            echo json_encode([
                "success" => true,
                "message" => $nuevoEstado === "activa" ? "Vacante activada correctamente." : "Vacante cerrada correctamente.",
                "estado"  => $nuevoEstado
            ]);
            exit;
        }

        // 2. Eliminar oferta
        if ($action === "delete_offer") {
            $stmt = $conexion->prepare("DELETE FROM ofertas_laborales WHERE id_oferta = :id");
            $stmt->execute([":id" => $idOferta]);

            echo json_encode([
                "success" => true,
                "message" => "Oferta laboral eliminada exitosamente del sistema."
            ]);
            exit;
        }

        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Acción no reconocida."]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al procesar la oferta: " . $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Método no permitido."]);
