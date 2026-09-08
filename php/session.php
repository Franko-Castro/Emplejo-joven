<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

require_once "../config/conexion.php";

if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "loggedIn" => false
    ]);
    exit;
}

$idUsuario = $_SESSION["id_usuario"];
$tipoUsuario = $_SESSION["tipo_usuario"];
$correo = $_SESSION["correo"];

try {
    if ($tipoUsuario === "admin") {
        echo json_encode([
            "loggedIn" => true,
            "user" => [
                "id_usuario" => $idUsuario,
                "tipo_usuario" => "admin",
                "nombre" => "Administrador",
                "nombre_completo" => "Administrador del Sistema",
                "apellido" => "",
                "correo" => $correo,
                "foto" => "https://lh3.googleusercontent.com/aida-public/AB6AXuDEN3Hrty16niOb5EqSw3ZS-Sss3iopV6f7bmMWpTK0v0nLcuGLPz6jzlJxBpTsaTLXYSqrrownRpj34VqN05sUzP3q7Mo7kvDsQ1EVSPQffKW6z4fUPpDSWLmMNQWXcvNlZpADHigEuvlmuRZtqtlQNyspnpB2pAWIjWecrykbHi_2JdUN_D_9AQE49YpyNzPoL4BzmvXkJfj1rtPugk1SE_ln8uM0EBrb78dNW6U0MElwhp69aNAmW8_0UoZ3FZiTbg",
                "perfil_completado" => 100
            ]
        ]);
        exit;
    } elseif ($tipoUsuario === "persona") {
        // Consultar el perfil de persona
        $sql = "SELECT nombre_completo, telefono, foto_perfil, cargo_profesion, id_categoria, cargo_interes, descripcion_profesional, experiencia, habilidades 
                FROM perfil_personas 
                WHERE id_usuario = :id_usuario 
                LIMIT 1";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([":id_usuario" => $idUsuario]);
        $profile = $stmt->fetch();

        if ($profile) {
            // Calcular el porcentaje de completitud dinámicamente
            $fields = [
                'nombre_completo',
                'telefono',
                'foto_perfil',
                'cargo_profesion',
                'id_categoria',
                'cargo_interes',
                'descripcion_profesional',
                'experiencia',
                'habilidades'
            ];
            $filled = 0;
            foreach ($fields as $field) {
                if (isset($profile[$field]) && trim((string)$profile[$field]) !== "") {
                    $filled++;
                }
            }
            $pct = (int)round(($filled / count($fields)) * 100);

            // Nombre completo y separación para diseño
            $nombreCompleto = trim($profile["nombre_completo"]);
            $parts = explode(" ", $nombreCompleto, 2);
            $nombre = $parts[0] ?? $nombreCompleto;
            $apellido = $parts[1] ?? "";

            // URL por defecto para la foto si no existe
            $foto = $profile["foto_perfil"] ?: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGF39068ZsKH6PfCL0I-mj6qbC3hf9i3RVeP6zlkZcmeWG7_3hIdqrhdgKs9oj85-hgT4JHFEElJ0qHB9MalbICxMd0tPVzerCrXFk0ZJT9XVP-1cIE4gpZnUZP4p0yeUNU3zuMysW8andOrZAeYrrw30nULtU6TPsHAKCmj_ttyIGYZb-gn_dzGBDUg-nF0bL0rCgH9Am2qrrZESTKlK5drdCQPycZLMmLp_JcBy-VfViJaP6PXWg";

            echo json_encode([
                "loggedIn" => true,
                "user" => [
                    "id_usuario" => $idUsuario,
                    "tipo_usuario" => $tipoUsuario,
                    "nombre" => $nombre,
                    "nombre_completo" => $nombreCompleto,
                    "apellido" => $apellido,
                    "correo" => $correo,
                    "foto" => $foto,
                    "perfil_completado" => $pct
                ]
            ]);
            exit;
        }
    } else {
        // Consultar el perfil de empresa
        $sql = "SELECT nombre_empresa, telefono, descripcion, id_categoria, logo 
                FROM empresas 
                WHERE id_usuario = :id_usuario 
                LIMIT 1";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([":id_usuario" => $idUsuario]);
        $empresa = $stmt->fetch();

        if ($empresa) {
            $fields = ['nombre_empresa', 'telefono', 'descripcion', 'id_categoria', 'logo'];
            $filled = 0;
            foreach ($fields as $field) {
                if (isset($empresa[$field]) && trim((string)$empresa[$field]) !== "") {
                    $filled++;
                }
            }
            $pct = (int)round(($filled / count($fields)) * 100);

            $foto = $empresa["logo"] ?: "https://lh3.googleusercontent.com/aida-public/AB6AXuDEN3Hrty16niOb5EqSw3ZS-Sss3iopV6f7bmMWpTK0v0nLcuGLPz6jzlJxBpTsaTLXYSqrrownRpj34VqN05sUzP3q7Mo7kvDsQ1EVSPQffKW6z4fUPpDSWLmMNQWXcvNlZpADHigEuvlmuRZtqtlQNyspnpB2pAWIjWecrykbHi_2JdUN_D_9AQE49YpyNzPoL4BzmvXkJfj1rtPugk1SE_ln8uM0EBrb78dNW6U0MElwhp69aNAmW8_0UoZ3FZiTbg";

            echo json_encode([
                "loggedIn" => true,
                "user" => [
                    "id_usuario" => $idUsuario,
                    "tipo_usuario" => $tipoUsuario,
                    "nombre" => $empresa["nombre_empresa"],
                    "apellido" => "",
                    "correo" => $correo,
                    "foto" => $foto,
                    "perfil_completado" => $pct
                ]
            ]);
            exit;
        }
    }

    // Si falló encontrar perfil pero el usuario existe
    echo json_encode([
        "loggedIn" => true,
        "user" => [
            "id_usuario" => $idUsuario,
            "tipo_usuario" => $tipoUsuario,
            "nombre" => "Usuario",
            "apellido" => "",
            "correo" => $correo,
            "foto" => "https://lh3.googleusercontent.com/aida-public/AB6AXuAGF39068ZsKH6PfCL0I-mj6qbC3hf9i3RVeP6zlkZcmeWG7_3hIdqrhdgKs9oj85-hgT4JHFEElJ0qHB9MalbICxMd0tPVzerCrXFk0ZJT9XVP-1cIE4gpZnUZP4p0yeUNU3zuMysW8andOrZAeYrrw30nULtU6TPsHAKCmj_ttyIGYZb-gn_dzGBDUg-nF0bL0rCgH9Am2qrrZESTKlK5drdCQPycZLMmLp_JcBy-VfViJaP6PXWg",
            "perfil_completado" => 10
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener datos del perfil"
    ]);
}
