-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3307
-- Generation Time: Sep 09, 2026 at 08:15 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `plataforma_empleo`
--

-- --------------------------------------------------------

--
-- Table structure for table `categorias`
--

CREATE TABLE `categorias` (
  `id_categoria` int UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `categorias`
--

INSERT INTO `categorias` (`id_categoria`, `nombre`, `descripcion`, `activo`, `fecha_creacion`) VALUES
(1, 'Tecnología', 'Desarrollo de software, sistemas, infraestructura y tecnología', 1, '2026-08-21 12:09:25'),
(2, 'Administración', 'Administración y gestión empresarial', 1, '2026-08-21 12:09:25'),
(3, 'Contabilidad', 'Contabilidad, finanzas y áreas relacionadas', 1, '2026-08-21 12:09:25'),
(4, 'Diseño', 'Diseño gráfico, UX/UI y áreas creativas', 1, '2026-08-21 12:09:25'),
(5, 'Marketing', 'Marketing, publicidad y comunicación', 1, '2026-08-21 12:09:25'),
(6, 'Ventas', 'Ventas, comercio y atención comercial', 1, '2026-08-21 12:09:25'),
(7, 'Logística', 'Logística, distribución y cadena de suministro', 1, '2026-08-21 12:09:25'),
(8, 'Recursos Humanos', 'Gestión y administración del talento humano', 1, '2026-08-21 12:09:25'),
(9, 'Servicio al Cliente', 'Atención y soporte a clientes', 1, '2026-08-21 12:09:25');

-- --------------------------------------------------------

--
-- Table structure for table `empresas`
--

CREATE TABLE `empresas` (
  `id_empresa` int UNSIGNED NOT NULL,
  `id_usuario` int UNSIGNED NOT NULL,
  `nombre_empresa` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `descripcion` text,
  `id_categoria` int UNSIGNED DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


INSERT INTO `eventos` (`id_evento`, `id_usuario_creador`, `titulo`, `tipo_evento`, `descripcion`, `fecha_evento`, `modalidad`, `ubicacion_enlace`, `enlace_inscripcion`, `organizador`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 3, 'Cómo armar tu primer CV de alto impacto', 'Webinar Gratuito', 'Aprende las claves y secretos que buscan los reclutadores para destacar sin tener amplia experiencia previa.', '2026-09-07 20:36:15', 'virtual', 'https://meet.google.com/ejemplo-webinar', 'https://forms.gle/ejemplo-registro-cv', 'EmpleoJoven Talento', 1, '2026-09-04 20:36:15', '2026-09-04 21:22:30'),
(2, 3, 'Expo Joven Talento 2026: Conexión con Startups', 'Feria de Empleo', 'Feria virtual interactiva donde más de 40 empresas tecnológicas y de servicios buscan jóvenes talentos para puestos junior y pasantías.', '2026-09-14 20:36:15', 'virtual', 'Plataforma Virtual EmpleoJoven', 'https://forms.gle/ejemplo-expo-2026', 'EmpleoJoven & Alianzas', 1, '2026-09-04 20:36:15', '2026-09-04 21:22:29'),
(4, 1, 'Cómo armar tu primer CV de alto impacto', 'Webinar Gratuito', 'Aprende las claves para destacar frente a los reclutadores.', '2026-09-07 21:08:16', 'virtual', 'https://meet.google.com/ejemplo-webinar', 'https://forms.gle/ejemplo-registro-cv', 'EmpleoJoven Talento', 1, '2026-09-04 21:08:16', '2026-09-04 21:22:30'),
(5, 1, 'Expo Joven Talento 2026', '', 'Conecta con empresas que buscan jóvenes talentos.', '2026-09-14 21:08:00', 'virtual', 'Plataforma Virtual EmpleoJoven', 'https://forms.gle/ejemplo-expo-2026', 'EmpleoJoven & Alianzas', 1, '2026-09-04 21:08:16', '2026-09-06 20:15:12');

-- --------------------------------------------------------

--
-- Table structure for table `hojas_de_vida`
--

CREATE TABLE `hojas_de_vida` (
  `id_hoja_vida` int UNSIGNED NOT NULL,
  `id_usuario` int UNSIGNED NOT NULL,
  `nombre_archivo` varchar(255) NOT NULL,
  `ruta_archivo` varchar(500) NOT NULL,
  `tipo_archivo` varchar(100) NOT NULL,
  `tamano_archivo` int UNSIGNED DEFAULT NULL,
  `activa` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_carga` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `hojas_de_vida`
--

INSERT INTO `hojas_de_vida` (`id_hoja_vida`, `id_usuario`, `nombre_archivo`, `ruta_archivo`, `tipo_archivo`, `tamano_archivo`, `activa`, `fecha_carga`, `fecha_actualizacion`) VALUES
(1, 1, 'certificado de base de datos.pdf', 'uploads/hojas_vida/cv_1_27fd388b06e3816d.pdf', 'application/pdf', 74605, 1, '2026-08-31 19:06:06', '2026-08-31 19:06:06');

-- --------------------------------------------------------

--
-- Table structure for table `ofertas_laborales`
--

CREATE TABLE `ofertas_laborales` (
  `id_oferta` int UNSIGNED NOT NULL,
  `id_empresa` int UNSIGNED NOT NULL,
  `id_categoria` int UNSIGNED NOT NULL,
  `cargo` varchar(150) NOT NULL,
  `descripcion` text NOT NULL,
  `experiencia_requerida` text,
  `habilidades_requeridas` text,
  `datos_contacto` text NOT NULL,
  `estado` enum('activa','cerrada') NOT NULL DEFAULT 'activa',
  `fecha_publicacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_cierre` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ofertas_laborales`
--

INSERT INTO `ofertas_laborales` (`id_oferta`, `id_empresa`, `id_categoria`, `cargo`, `descripcion`, `experiencia_requerida`, `habilidades_requeridas`, `datos_contacto`, `estado`, `fecha_publicacion`, `fecha_actualizacion`, `fecha_cierre`) VALUES
(1, 1, 9, 'empleada domestica', 'Desarrollé una plataforma web que fortaleció la presencia digital del\nrestaurante y facilitó la interacción con sus clientes.\nImplementé un sistema de reservas en línea para agilizar la gestión de\nmesas y mejorar la atención al cliente.\nDiseñé una experiencia de usuario moderna mediante un menú digital\ninteractivo, galería de imágenes y navegación intuitiva.\nIntegré un formulario de contacto con información del restaurante para\nfacilitar la comunicación con los clientes.\nOptimicé el sitio para dispositivos móviles y diferentes navegadores,\ngarantizando una experiencia de usuario consistente.\nParticipé en todas las etapas del proyecto, desde el análisis de\nrequerimientos y el diseño de la interfaz hasta el desarrollo, pruebas e\nimplementación\nHTML • CSS • JavaScript • PHP • MySQL', 'mínimo 1 ano de experiencia', 'que se amable y ordenada', 'pizza10@gmail.com\n3107404575', 'activa', '2026-08-24 19:13:03', '2026-09-01 10:17:51', NULL),
(2, 1, 1, 'Técnico de sistemas', 'Desarrollé aplicaciones web enfocadas en mejorar la experiencia del\nusuario mediante interfaces intuitivas y responsivas.\nImplementé funcionalidades que optimizaron los procesos de gestión y\nadministración de información dentro de la plataforma.\nDiseñé e integré bases de datos relacionales, garantizando la integridad y\ndisponibilidad de los datos.\nIdentifiqué y solucioné incidencias técnicas, mejorando la estabilidad y el\nrendimiento de las aplicaciones.\nColaboré con diferentes áreas para analizar requerimientos y transformar\nnecesidades del negocio en soluciones de software eficientes.\nInvestigué e incorporé nuevas tecnologías y herramientas para optimizar\nel desarrollo y mantenimiento de los proyectos', 'sin experiencia', 'Educado, Solida Dario Respetuoso', '3226065720\nfm3949461@gmail.com', 'activa', '2026-09-01 10:10:52', '2026-09-01 10:47:13', NULL),
(3, 1, 2, 'Aministradora', 'RAIOLA NETWORKS, S.L., con domicilio social en avda. de Magoi, 66, Semisótano Dcha., 27002 Lugo (Lugo), NIF.: B27453489 y con email info@raiolanetworks.es, es la Responsable de Tratamiento de los datos personales recabados. El tratamiento se realizará con la exclusiva finalidad de atender solicitudes de información basada en el interés legítimo, la ejecución de la contratación de servicios basado en esa contratación y la remisión de comunicaciones comerciales si has prestado tu consentimiento o, si eres cliente, y no te has opuesto a ello en cualquier momento. Dispones de derechos para acceder, rectificar y suprimir los datos, portabilidad de los datos, limitación u oposición a su tratamiento. Más información en nuestra Política de Privacidad.', '3 anos de experiencia', 'excel contabilidad', 'fmcomar14@gmail.com', 'activa', '2026-09-01 11:05:14', '2026-09-01 11:05:14', NULL),
(4, 1, 9, 'Mesera', 'RAIOLA NETWORKS, S.L., con domicilio social en avda. de Magoi, 66, Semisótano Dcha., 27002 Lugo (Lugo), NIF.: B27453489 y con email info@raiolanetworks.es, es la Responsable de Tratamiento de los datos personales recabados. El tratamiento se realizará con la exclusiva finalidad de atender solicitudes de información basada en el interés legítimo, la ejecución de la contratación de servicios basado en esa contratación y la remisión de comunicaciones comerciales si has prestado tu consentimiento o, si eres cliente, y no te has opuesto a ello en cualquier momento. Dispones de derechos para acceder, rectificar y suprimir los datos, portabilidad de los datos, limitación u oposición a su tratamiento. Más información en nuestra Política de Privacidad.', 'sin experiencia', 'buena actitud', '3226065720\n info@raiolanetworks.es', 'activa', '2026-09-01 11:07:28', '2026-09-01 11:07:28', NULL),
(5, 1, 7, 'lava platos', 'vbvbvbvbvbvbv', 'nimmguna', 'cualquieras', 'bgbgbgbgbgbgbgbgbgbgbg', 'activa', '2026-09-06 20:23:45', '2026-09-09 13:12:19', NULL),
(6, 2, 3, 'Contadora', 'Explora 22.217 ilustraciones y gráficos vectoriales de stock sobre logos de zapatos libres de derechos o realiza una nueva búsqueda para encontrar más ...', 'Mima de dos anos', 'responsabilida,', '3107404775', 'activa', '2026-09-09 13:52:53', '2026-09-09 13:52:53', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `perfil_personas`
--

CREATE TABLE `perfil_personas` (
  `id_perfil` int UNSIGNED NOT NULL,
  `id_usuario` int UNSIGNED NOT NULL,
  `nombre_completo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `foto_perfil` varchar(255) DEFAULT NULL,
  `cargo_profesion` varchar(150) DEFAULT NULL,
  `id_categoria` int UNSIGNED DEFAULT NULL,
  `cargo_interes` varchar(150) DEFAULT NULL,
  `descripcion_profesional` text,
  `experiencia` text,
  `habilidades` text,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `perfil_personas`
--

INSERT INTO `perfil_personas` (`id_perfil`, `id_usuario`, `nombre_completo`, `telefono`, `foto_perfil`, `cargo_profesion`, `id_categoria`, `cargo_interes`, `descripcion_profesional`, `experiencia`, `habilidades`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 1, 'Frank Martínez', '3001234567', 'uploads/perfiles/postulante_1_c74a012eba404de0.jpg', 'Desarrollador Web', 1, 'Backend Developer', 'Experto en PHP y JavaScript', '5 años en proyectos de software', 'PHP, JS, SQL', '2026-08-21 15:48:42', '2026-09-08 20:38:03'),
(2, 3, 'yosmany cordoba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-04 20:08:34', '2026-09-04 20:08:34');

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int UNSIGNED NOT NULL,
  `correo` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `tipo_usuario` enum('persona','empresa','admin') NOT NULL,
  `correo_verificado` tinyint(1) NOT NULL DEFAULT '0',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `correo`, `password_hash`, `tipo_usuario`, `correo_verificado`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'fm3949461@gmail.com', '', 'persona', 0, 1, '2026-08-21 15:48:42', '2026-08-21 15:48:42'),
(2, 'pizza10@gmail.com', '', 'empresa', 0, 1, '2026-08-21 16:10:13', '2026-09-04 20:14:00'),
(3, 'Yosmany123@hotmail.com', '', 'admin', 0, 1, '2026-09-04 20:08:34', '2026-09-04 20:46:13'),
(4, 'zapatos123@gmail.com', '', 'empresa', 0, 1, '2026-09-09 13:44:31', '2026-09-09 13:44:31');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id_categoria`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indexes for table `empresas`
--
ALTER TABLE `empresas`
  ADD PRIMARY KEY (`id_empresa`),
  ADD UNIQUE KEY `id_usuario` (`id_usuario`),
  ADD KEY `idx_empresa_categoria` (`id_categoria`);

--
-- Indexes for table `eventos`
--
ALTER TABLE `eventos`
  ADD PRIMARY KEY (`id_evento`),
  ADD KEY `idx_evento_fecha` (`fecha_evento`),
  ADD KEY `idx_evento_activo` (`activo`),
  ADD KEY `fk_evento_usuario` (`id_usuario_creador`);

--
-- Indexes for table `hojas_de_vida`
--
ALTER TABLE `hojas_de_vida`
  ADD PRIMARY KEY (`id_hoja_vida`),
  ADD KEY `idx_hoja_vida_usuario` (`id_usuario`);

--
-- Indexes for table `ofertas_laborales`
--
ALTER TABLE `ofertas_laborales`
  ADD PRIMARY KEY (`id_oferta`),
  ADD KEY `idx_oferta_empresa` (`id_empresa`),
  ADD KEY `idx_oferta_categoria` (`id_categoria`),
  ADD KEY `idx_oferta_estado` (`estado`),
  ADD KEY `idx_oferta_fecha` (`fecha_publicacion`);

--
-- Indexes for table `perfil_personas`
--
ALTER TABLE `perfil_personas`
  ADD PRIMARY KEY (`id_perfil`),
  ADD UNIQUE KEY `id_usuario` (`id_usuario`),
  ADD KEY `idx_perfil_categoria` (`id_categoria`);

--
-- Indexes for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `correo` (`correo`),
  ADD KEY `idx_usuarios_tipo` (`tipo_usuario`),
  ADD KEY `idx_usuarios_activo` (`activo`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id_categoria` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `empresas`
--
ALTER TABLE `empresas`
  MODIFY `id_empresa` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `eventos`
--
ALTER TABLE `eventos`
  MODIFY `id_evento` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `hojas_de_vida`
--
ALTER TABLE `hojas_de_vida`
  MODIFY `id_hoja_vida` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `ofertas_laborales`
--
ALTER TABLE `ofertas_laborales`
  MODIFY `id_oferta` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `perfil_personas`
--
ALTER TABLE `perfil_personas`
  MODIFY `id_perfil` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints removed intentionally.
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
