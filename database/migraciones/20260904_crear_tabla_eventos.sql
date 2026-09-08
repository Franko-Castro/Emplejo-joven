-- Migración: Crear tabla de eventos para la plataforma
-- Fecha: 2026-09-04

CREATE TABLE IF NOT EXISTS `eventos` (
  `id_evento` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_usuario_creador` int UNSIGNED NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `tipo_evento` varchar(100) NOT NULL DEFAULT 'Webinar Gratuito',
  `descripcion` text NOT NULL,
  `fecha_evento` datetime NOT NULL,
  `modalidad` enum('virtual', 'presencial', 'hibrido') NOT NULL DEFAULT 'virtual',
  `ubicacion_enlace` varchar(500) DEFAULT NULL,
  `enlace_inscripcion` varchar(500) DEFAULT NULL,
  `organizador` varchar(150) DEFAULT 'EmpleoJoven',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_evento`),
  KEY `idx_evento_fecha` (`fecha_evento`),
  KEY `idx_evento_activo` (`activo`),
  CONSTRAINT `fk_evento_usuario` FOREIGN KEY (`id_usuario_creador`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insertar eventos de ejemplo iniciales vinculados al primer usuario administrador o existente
INSERT INTO `eventos` (`id_usuario_creador`, `titulo`, `tipo_evento`, `descripcion`, `fecha_evento`, `modalidad`, `ubicacion_enlace`, `enlace_inscripcion`, `organizador`, `activo`)
SELECT 
    u.id_usuario,
    'Cómo armar tu primer CV de alto impacto',
    'Webinar Gratuito',
    'Aprende las claves y secretos que buscan los reclutadores para destacar sin tener amplia experiencia previa.',
    DATE_ADD(NOW(), INTERVAL 3 DAY),
    'virtual',
    'https://meet.google.com/ejemplo-webinar',
    'https://forms.gle/ejemplo-registro-cv',
    'EmpleoJoven Talento',
    1
FROM `usuarios` u 
WHERE u.tipo_usuario = 'admin'
ORDER BY u.id_usuario
LIMIT 1;

INSERT INTO `eventos` (`id_usuario_creador`, `titulo`, `tipo_evento`, `descripcion`, `fecha_evento`, `modalidad`, `ubicacion_enlace`, `enlace_inscripcion`, `organizador`, `activo`)
SELECT 
    u.id_usuario,
    'Expo Joven Talento 2026: Conexión con Startups',
    'Feria de Empleo',
    'Feria virtual interactiva donde más de 40 empresas tecnológicas y de servicios buscan jóvenes talentos para puestos junior y pasantías.',
    DATE_ADD(NOW(), INTERVAL 10 DAY),
    'virtual',
    'Plataforma Virtual EmpleoJoven',
    'https://forms.gle/ejemplo-expo-2026',
    'EmpleoJoven & Alianzas',
    1
FROM `usuarios` u 
WHERE u.tipo_usuario = 'admin'
ORDER BY u.id_usuario
LIMIT 1;
