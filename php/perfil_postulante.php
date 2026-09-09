<?php
require_once "../config/sesion.php";
header("Content-Type: application/json; charset=UTF-8");
require_once "../config/conexion.php";

if (!isset($_SESSION["id_usuario"]) || ($_SESSION["tipo_usuario"] ?? "") !== "persona") {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Debes iniciar sesión como postulante/empleado"]);
    exit;
}

$idUsuario = (int)$_SESSION["id_usuario"];

function obtenerPerfilPostulante($conexion, $idUsuario) {
    $stmt = $conexion->prepare(
        "SELECT p.nombre_completo, p.telefono, p.foto_perfil, p.cargo_profesion,
                p.id_categoria, p.cargo_interes, p.descripcion_profesional,
                p.experiencia, p.habilidades, u.correo,
                h.id_hoja_vida, h.nombre_archivo AS cv_nombre, h.ruta_archivo AS cv_ruta, h.fecha_carga AS cv_fecha
         FROM usuarios u
         LEFT JOIN perfil_personas p ON p.id_usuario = u.id_usuario
         LEFT JOIN hojas_de_vida h ON h.id_usuario = u.id_usuario AND h.activa = 1
         WHERE u.id_usuario = :id_usuario
         ORDER BY h.id_hoja_vida DESC
         LIMIT 1"
    );
    $stmt->execute([":id_usuario" => $idUsuario]);
    return $stmt->fetch();
}

// -------------------------------------------------------------
// GET: Obtener perfil completo
// -------------------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    try {
        $perfil = obtenerPerfilPostulante($conexion, $idUsuario);
        if (!$perfil) {
            throw new Exception("Perfil no encontrado");
        }
        echo json_encode(["success" => true, "data" => $perfil]);
    } catch (Exception $e) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "No encontramos los datos del perfil"]);
    }
    exit;
}

// -------------------------------------------------------------
// POST: Actualizar perfil de postulante
// -------------------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

$nombreCompleto = trim($_POST["nombre_completo"] ?? "");
$correo = trim($_POST["correo"] ?? "");
$telefono = trim($_POST["telefono"] ?? "");
$cargoProfesion = trim($_POST["cargo_profesion"] ?? "");
$idCategoriaRaw = $_POST["id_categoria"] ?? "";
$idCategoria = ($idCategoriaRaw !== "" && is_numeric($idCategoriaRaw)) ? (int)$idCategoriaRaw : null;
$cargoInteres = trim($_POST["cargo_interes"] ?? "");
$descripcionProfesional = trim($_POST["descripcion_profesional"] ?? "");
$experiencia = trim($_POST["experiencia"] ?? "");
$habilidades = trim($_POST["habilidades"] ?? "");

// Validaciones básicas
if ($nombreCompleto === "") {
    http_response_code(422);
    echo json_encode(["success" => false, "message" => "El nombre completo es obligatorio"]);
    exit;
}

if ($correo === "" || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(["success" => false, "message" => "Proporciona un correo electrónico válido"]);
    exit;
}

try {
    $perfilActual = obtenerPerfilPostulante($conexion, $idUsuario);

    // Validar unicidad del correo electrónico
    $correoExistente = $conexion->prepare("SELECT id_usuario FROM usuarios WHERE correo = :correo AND id_usuario <> :id_usuario");
    $correoExistente->execute([":correo" => $correo, ":id_usuario" => $idUsuario]);
    if ($correoExistente->fetch()) {
        throw new InvalidArgumentException("Ese correo electrónico ya está registrado por otro usuario");
    }

    // Validar categoría si fue seleccionada
    if ($idCategoria !== null) {
        $catStmt = $conexion->prepare("SELECT id_categoria FROM categorias WHERE id_categoria = :id AND activo = TRUE");
        $catStmt->execute([":id" => $idCategoria]);
        if (!$catStmt->fetch()) {
            throw new InvalidArgumentException("La categoría seleccionada no es válida");
        }
    }

    // ---------------------------------------------------------
    // Manejo de la Foto de Perfil
    // ---------------------------------------------------------
    $fotoPerfil = $perfilActual["foto_perfil"] ?? null;

    if (isset($_FILES["foto_perfil"]) && $_FILES["foto_perfil"]["error"] !== UPLOAD_ERR_NO_FILE) {
        if ($_FILES["foto_perfil"]["error"] !== UPLOAD_ERR_OK) {
            throw new InvalidArgumentException("Error al subir la imagen de perfil");
        }
        if ($_FILES["foto_perfil"]["size"] > 3 * 1024 * 1024) {
            throw new InvalidArgumentException("La foto de perfil debe pesar máximo 3 MB");
        }

        $tiposPermitidos = [
            "image/jpeg" => "jpg",
            "image/png"  => "png",
            "image/webp" => "webp"
        ];
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($_FILES["foto_perfil"]["tmp_name"]);

        if (!isset($tiposPermitidos[$mime])) {
            throw new InvalidArgumentException("La foto debe ser una imagen en formato JPG, PNG o WEBP");
        }

        $directorioFotos = "../uploads/perfiles";
        if (!is_dir($directorioFotos) && !mkdir($directorioFotos, 0755, true)) {
            throw new Exception("No se pudo preparar la carpeta para guardar la foto de perfil");
        }

        $extension = $tiposPermitidos[$mime];
        $nombreFoto = "postulante_" . $idUsuario . "_" . bin2hex(random_bytes(8)) . "." . $extension;
        $rutaDestinoFoto = "$directorioFotos/$nombreFoto";

        if (!move_uploaded_file($_FILES["foto_perfil"]["tmp_name"], $rutaDestinoFoto)) {
            throw new Exception("No fue posible guardar la foto de perfil en el servidor");
        }

        // Eliminar foto anterior si existía en uploads
        if (!empty($perfilActual["foto_perfil"]) && str_starts_with($perfilActual["foto_perfil"], "uploads/perfiles/")) {
            $antiguaFoto = "../" . $perfilActual["foto_perfil"];
            if (file_exists($antiguaFoto)) {
                @unlink($antiguaFoto);
            }
        }

        $fotoPerfil = "uploads/perfiles/$nombreFoto";
    }

    // ---------------------------------------------------------
    // Manejo de la Hoja de Vida (CV)
    // ---------------------------------------------------------
    $nuevoCvGuardado = null;

    if (isset($_FILES["hoja_de_vida"]) && $_FILES["hoja_de_vida"]["error"] !== UPLOAD_ERR_NO_FILE) {
        if ($_FILES["hoja_de_vida"]["error"] !== UPLOAD_ERR_OK) {
            throw new InvalidArgumentException("Error al subir la hoja de vida");
        }
        if ($_FILES["hoja_de_vida"]["size"] > 8 * 1024 * 1024) {
            throw new InvalidArgumentException("La hoja de vida debe pesar máximo 8 MB");
        }

        $extensionOriginal = strtolower(pathinfo($_FILES["hoja_de_vida"]["name"], PATHINFO_EXTENSION));
        $extensionesPermitidas = ["pdf", "doc", "docx"];

        if (!in_array($extensionOriginal, $extensionesPermitidas, true)) {
            throw new InvalidArgumentException("La hoja de vida debe ser un archivo PDF, DOC o DOCX");
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeCv = $finfo->file($_FILES["hoja_de_vida"]["tmp_name"]);
        $contenidoCv = file_get_contents($_FILES["hoja_de_vida"]["tmp_name"]);
        $contenidoValido = false;

        if ($extensionOriginal === "pdf") {
            $contenidoValido = $mimeCv === "application/pdf" && str_starts_with($contenidoCv, "%PDF-");
        } elseif ($extensionOriginal === "doc") {
            $contenidoValido = $mimeCv === "application/msword" && str_starts_with($contenidoCv, "\xD0\xCF\x11\xE0");
        } elseif ($extensionOriginal === "docx" && $mimeCv === "application/zip" && class_exists("ZipArchive")) {
            $zip = new ZipArchive();
            if ($zip->open($_FILES["hoja_de_vida"]["tmp_name"]) === true) {
                $contenidoValido = $zip->locateName("[Content_Types].xml") !== false
                    && $zip->locateName("word/document.xml") !== false;
                $zip->close();
            }
        }

        if (!$contenidoValido) {
            throw new InvalidArgumentException("El contenido de la hoja de vida no coincide con su extensión");
        }

        $directorioCvs = "../uploads/hojas_vida";
        if (!is_dir($directorioCvs) && !mkdir($directorioCvs, 0755, true)) {
            throw new Exception("No se pudo preparar la carpeta para guardar la hoja de vida");
        }

        $nombreOriginal = $_FILES["hoja_de_vida"]["name"];
        $nombreArchivoCv = "cv_" . $idUsuario . "_" . bin2hex(random_bytes(8)) . "." . $extensionOriginal;
        $rutaDestinoCv = "$directorioCvs/$nombreArchivoCv";

        if (!move_uploaded_file($_FILES["hoja_de_vida"]["tmp_name"], $rutaDestinoCv)) {
            throw new Exception("No fue posible guardar la hoja de vida en el servidor");
        }

        // Eliminar CV anterior si existía en uploads
        if (!empty($perfilActual["cv_ruta"]) && str_starts_with($perfilActual["cv_ruta"], "uploads/hojas_vida/")) {
            $antiguoCv = "../" . $perfilActual["cv_ruta"];
            if (file_exists($antiguoCv)) {
                @unlink($antiguoCv);
            }
        }

        $tipoArchivo = $mimeCv;
        $tamanoArchivo = (int)$_FILES["hoja_de_vida"]["size"];

        $nuevoCvGuardado = [
            "nombre_archivo" => $nombreOriginal,
            "ruta_archivo"   => "uploads/hojas_vida/$nombreArchivoCv",
            "tipo_archivo"   => $tipoArchivo,
            "tamano_archivo" => $tamanoArchivo
        ];
    }

    // ---------------------------------------------------------
    // Transacción en Base de Datos
    // ---------------------------------------------------------
    $conexion->beginTransaction();

    // 1. Actualizar correo en usuarios
    $updateUsuario = $conexion->prepare("UPDATE usuarios SET correo = :correo WHERE id_usuario = :id_usuario");
    $updateUsuario->execute([":correo" => $correo, ":id_usuario" => $idUsuario]);

    // 2. Insertar o actualizar perfil_personas
    $checkPerfil = $conexion->prepare("SELECT id_perfil FROM perfil_personas WHERE id_usuario = :id_usuario LIMIT 1");
    $checkPerfil->execute([":id_usuario" => $idUsuario]);
    $existePerfil = $checkPerfil->fetch();

    if ($existePerfil) {
        $updatePerfil = $conexion->prepare(
            "UPDATE perfil_personas SET
                nombre_completo = :nombre_completo,
                telefono = :telefono,
                foto_perfil = :foto_perfil,
                cargo_profesion = :cargo_profesion,
                id_categoria = :id_categoria,
                cargo_interes = :cargo_interes,
                descripcion_profesional = :descripcion_profesional,
                experiencia = :experiencia,
                habilidades = :habilidades
             WHERE id_usuario = :id_usuario"
        );
        $updatePerfil->execute([
            ":nombre_completo"        => $nombreCompleto,
            ":telefono"               => $telefono ?: null,
            ":foto_perfil"            => $fotoPerfil ?: null,
            ":cargo_profesion"        => $cargoProfesion ?: null,
            ":id_categoria"           => $idCategoria,
            ":cargo_interes"          => $cargoInteres ?: null,
            ":descripcion_profesional"=> $descripcionProfesional ?: null,
            ":experiencia"            => $experiencia ?: null,
            ":habilidades"            => $habilidades ?: null,
            ":id_usuario"             => $idUsuario
        ]);
    } else {
        $insertPerfil = $conexion->prepare(
            "INSERT INTO perfil_personas (
                id_usuario, nombre_completo, telefono, foto_perfil, cargo_profesion,
                id_categoria, cargo_interes, descripcion_profesional, experiencia, habilidades
            ) VALUES (
                :id_usuario, :nombre_completo, :telefono, :foto_perfil, :cargo_profesion,
                :id_categoria, :cargo_interes, :descripcion_profesional, :experiencia, :habilidades
            )"
        );
        $insertPerfil->execute([
            ":id_usuario"             => $idUsuario,
            ":nombre_completo"        => $nombreCompleto,
            ":telefono"               => $telefono ?: null,
            ":foto_perfil"            => $fotoPerfil ?: null,
            ":cargo_profesion"        => $cargoProfesion ?: null,
            ":id_categoria"           => $idCategoria,
            ":cargo_interes"          => $cargoInteres ?: null,
            ":descripcion_profesional"=> $descripcionProfesional ?: null,
            ":experiencia"            => $experiencia ?: null,
            ":habilidades"            => $habilidades ?: null
        ]);
    }

    // 3. Registrar nueva hoja de vida si se cargó un archivo
    if ($nuevoCvGuardado !== null) {
        // Desactivar hojas de vida anteriores
        $desactivarCvs = $conexion->prepare("UPDATE hojas_de_vida SET activa = 0 WHERE id_usuario = :id_usuario");
        $desactivarCvs->execute([":id_usuario" => $idUsuario]);

        // Insertar la nueva hoja de vida activa
        $insertCv = $conexion->prepare(
            "INSERT INTO hojas_de_vida (id_usuario, nombre_archivo, ruta_archivo, tipo_archivo, tamano_archivo, activa)
             VALUES (:id_usuario, :nombre_archivo, :ruta_archivo, :tipo_archivo, :tamano_archivo, 1)"
        );
        $insertCv->execute([
            ":id_usuario"     => $idUsuario,
            ":nombre_archivo" => $nuevoCvGuardado["nombre_archivo"],
            ":ruta_archivo"   => $nuevoCvGuardado["ruta_archivo"],
            ":tipo_archivo"   => $nuevoCvGuardado["tipo_archivo"],
            ":tamano_archivo" => $nuevoCvGuardado["tamano_archivo"]
        ]);
    }

    $conexion->commit();
    $_SESSION["correo"] = $correo;

    // Calcular nuevo porcentaje de completitud
    $fields = [$nombreCompleto, $telefono, $fotoPerfil, $cargoProfesion, $idCategoria, $cargoInteres, $descripcionProfesional, $experiencia, $habilidades];
    $filled = 0;
    foreach ($fields as $val) {
        if ($val !== null && trim((string)$val) !== "") {
            $filled++;
        }
    }
    $completionPct = (int)round(($filled / count($fields)) * 100);

    echo json_encode([
        "success" => true,
        "message" => "Tu perfil y hoja de vida se han actualizado exitosamente",
        "data" => [
            "nombre_completo"        => $nombreCompleto,
            "correo"                 => $correo,
            "telefono"               => $telefono,
            "foto"                   => $fotoPerfil,
            "cargo_profesion"        => $cargoProfesion,
            "id_categoria"           => $idCategoria,
            "cargo_interes"          => $cargoInteres,
            "descripcion_profesional"=> $descripcionProfesional,
            "experiencia"            => $experiencia,
            "habilidades"            => $habilidades,
            "perfil_completado"      => $completionPct,
            "cv"                     => $nuevoCvGuardado ?? ($perfilActual["cv_nombre"] ? [
                "nombre_archivo" => $perfilActual["cv_nombre"],
                "ruta_archivo"   => $perfilActual["cv_ruta"]
            ] : null)
        ]
    ]);

} catch (InvalidArgumentException $e) {
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }
    http_response_code(422);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} catch (Exception $e) {
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Ocurrió un error al intentar guardar los cambios de tu perfil"]);
}
