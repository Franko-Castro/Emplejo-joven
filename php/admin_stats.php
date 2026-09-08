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

try {
    // 1. Contadores principales
    $stats = [
        "total_usuarios"    => 0,
        "total_postulantes" => 0,
        "total_empresas"    => 0,
        "total_ofertas"     => 0,
        "ofertas_activas"   => 0,
        "ofertas_cerradas"  => 0,
        "total_cvs"         => 0,
        "total_categorias"  => 0
    ];

    // Usuarios
    $stmtUsers = $conexion->query("
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN tipo_usuario = 'persona' THEN 1 ELSE 0 END) AS postulantes,
            SUM(CASE WHEN tipo_usuario = 'empresa' THEN 1 ELSE 0 END) AS empresas
        FROM usuarios
    ");
    $uData = $stmtUsers->fetch();
    if ($uData) {
        $stats["total_usuarios"] = (int)($uData["total"] ?? 0);
        $stats["total_postulantes"] = (int)($uData["postulantes"] ?? 0);
        $stats["total_empresas"] = (int)($uData["empresas"] ?? 0);
    }

    // Ofertas
    $stmtOffers = $conexion->query("
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN estado = 'activa' THEN 1 ELSE 0 END) AS activas,
            SUM(CASE WHEN estado = 'cerrada' THEN 1 ELSE 0 END) AS cerradas
        FROM ofertas_laborales
    ");
    $oData = $stmtOffers->fetch();
    if ($oData) {
        $stats["total_ofertas"] = (int)($oData["total"] ?? 0);
        $stats["ofertas_activas"] = (int)($oData["activas"] ?? 0);
        $stats["ofertas_cerradas"] = (int)($oData["cerradas"] ?? 0);
    }

    // Hojas de vida
    $stmtCvs = $conexion->query("SELECT COUNT(*) AS total FROM hojas_de_vida WHERE activa = 1");
    $stats["total_cvs"] = (int)($stmtCvs->fetch()["total"] ?? 0);

    // Categorías
    $stmtCats = $conexion->query("SELECT COUNT(*) AS total FROM categorias WHERE activo = 1");
    $stats["total_categorias"] = (int)($stmtCats->fetch()["total"] ?? 0);

    // Eventos
    $stats["total_eventos"] = 0;
    try {
        $stmtEvents = $conexion->query("SELECT COUNT(*) AS total FROM eventos WHERE activo = 1");
        $stats["total_eventos"] = (int)($stmtEvents->fetch()["total"] ?? 0);
    } catch (Exception $e) {
        $stats["total_eventos"] = 0;
    }

    // 2. Distribución de ofertas por categoría
    $stmtCatsDist = $conexion->query("
        SELECT 
            c.nombre AS categoria,
            COUNT(o.id_oferta) AS total_ofertas
        FROM categorias c
        LEFT JOIN ofertas_laborales o ON o.id_categoria = c.id_categoria
        GROUP BY c.id_categoria, c.nombre
        ORDER BY total_ofertas DESC
        LIMIT 6
    ");
    $ofertasPorCategoria = $stmtCatsDist->fetchAll();

    // 3. Últimos usuarios registrados
    $stmtRecentUsers = $conexion->query("
        SELECT 
            u.id_usuario,
            u.correo,
            u.tipo_usuario,
            u.activo,
            u.fecha_creacion,
            CASE 
                WHEN u.tipo_usuario = 'persona' THEN COALESCE(p.nombre_completo, 'Postulante')
                WHEN u.tipo_usuario = 'empresa' THEN COALESCE(e.nombre_empresa, 'Empresa')
                ELSE 'Administrador'
            END AS nombre_identificador
        FROM usuarios u
        LEFT JOIN perfil_personas p ON p.id_usuario = u.id_usuario
        LEFT JOIN empresas e ON e.id_usuario = u.id_usuario
        ORDER BY u.fecha_creacion DESC
        LIMIT 5
    ");
    $ultimosUsuarios = $stmtRecentUsers->fetchAll();

    // 4. Últimas ofertas publicadas
    $stmtRecentJobs = $conexion->query("
        SELECT 
            o.id_oferta,
            o.cargo,
            o.estado,
            o.fecha_publicacion,
            COALESCE(NULLIF(e.nombre_empresa, ''), 'Empresa Confidencial') AS nombre_empresa,
            c.nombre AS categoria
        FROM ofertas_laborales o
        INNER JOIN empresas e ON e.id_empresa = o.id_empresa
        INNER JOIN categorias c ON c.id_categoria = o.id_categoria
        ORDER BY o.fecha_publicacion DESC
        LIMIT 5
    ");
    $ultimasOfertas = $stmtRecentJobs->fetchAll();

    echo json_encode([
        "success" => true,
        "data" => [
            "stats"                 => $stats,
            "ofertas_por_categoria" => $ofertasPorCategoria,
            "ultimos_usuarios"      => $ultimosUsuarios,
            "ultimas_ofertas"       => $ultimasOfertas
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener estadísticas del sistema: " . $e->getMessage()
    ]);
}
