-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3307
-- Generation Time: Aug 25, 2026 at 11:02 PM
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

--
-- Dumping data for table `empresas`
--

INSERT INTO `empresas` (`id_empresa`, `id_usuario`, `nombre_empresa`, `telefono`, `descripcion`, `id_categoria`, `logo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 2, 'pizzeriaFM', NULL, NULL, NULL, NULL, '2026-08-21 16:10:13', '2026-08-21 16:10:13');

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
(1, 1, 9, 'empleada domestica', 'cvcvcvcvcvcvcvcvcvcvcvcvcvcvcvcvvcvcvcvcvvcvcvcvcvcvcvcvcvcvcvcvcvcvcv', 'mínimo 1 ano de experiencia', 'que se amable y ordenada', 'pizza10@gmail.com\n3107404575', 'activa', '2026-08-24 19:13:03', '2026-08-24 19:13:03', NULL);

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
(1, 1, 'frank martinez', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-21 15:48:42', '2026-08-21 15:48:42');

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
(1, 'fm3949461@gmail.com', '$2y$10$B6g3hhMez0J.4Oz1aJg..eD0KbxzfVY/P01pK9nbARhMAeY3C50RO', 'persona', 0, 1, '2026-08-21 15:48:42', '2026-08-21 15:48:42'),
(2, 'pizza10@gmail.com', '$2y$10$O3tNxIizP7J1khMZDr/wieJkkuAbJOOkvnqFb9R/CSUXemcmxFxK.', 'empresa', 0, 1, '2026-08-21 16:10:13', '2026-08-21 16:10:13'),
(3, 'Yosmany123@hotmail.com', '$2b$10$XBgyl7xjjf5TcUS8ivcts.1cENrVPa8ygNF5uZgPbJnsdfjlhJaNO', 'admin', 1, 1, NOW(), NOW());

-- --------------------------------------------------------

--
-- Table structure for table `eventos`
--

CREATE TABLE `eventos` (
  `id_evento` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_usuario_creador` int UNSIGNED NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `tipo_evento` varchar(100) NOT NULL DEFAULT 'Webinar Gratuito',
  `descripcion` text NOT NULL,
  `fecha_evento` datetime NOT NULL,
  `modalidad` enum('virtual','presencial','hibrido') NOT NULL DEFAULT 'virtual',
  `ubicacion_enlace` varchar(500) DEFAULT NULL,
  `enlace_inscripcion` varchar(500) DEFAULT NULL,
  `organizador` varchar(150) NOT NULL DEFAULT 'EmpleoJoven',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_evento`),
  KEY `idx_evento_fecha` (`fecha_evento`),
  KEY `idx_evento_activo` (`activo`),
  KEY `idx_evento_creador` (`id_usuario_creador`),
  CONSTRAINT `fk_evento_usuario` FOREIGN KEY (`id_usuario_creador`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `eventos` (`id_usuario_creador`, `titulo`, `tipo_evento`, `descripcion`, `fecha_evento`, `modalidad`, `ubicacion_enlace`, `enlace_inscripcion`, `organizador`, `activo`) VALUES
(1, 'Cómo armar tu primer CV de alto impacto', 'Webinar Gratuito', 'Aprende las claves para destacar frente a los reclutadores.', DATE_ADD(NOW(), INTERVAL 3 DAY), 'virtual', 'https://meet.google.com/ejemplo-webinar', 'https://forms.gle/ejemplo-registro-cv', 'EmpleoJoven Talento', 1),
(1, 'Expo Joven Talento 2026', 'Feria de Empleo', 'Conecta con empresas que buscan jóvenes talentos.', DATE_ADD(NOW(), INTERVAL 10 DAY), 'virtual', 'Plataforma Virtual EmpleoJoven', 'https://forms.gle/ejemplo-expo-2026', 'EmpleoJoven & Alianzas', 1);

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
  MODIFY `id_empresa` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `hojas_de_vida`
--
ALTER TABLE `hojas_de_vida`
  MODIFY `id_hoja_vida` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ofertas_laborales`
--
ALTER TABLE `ofertas_laborales`
  MODIFY `id_oferta` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `perfil_personas`
--
ALTER TABLE `perfil_personas`
  MODIFY `id_perfil` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `empresas`
--
ALTER TABLE `empresas`
  ADD CONSTRAINT `fk_empresa_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_empresa_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `hojas_de_vida`
--
ALTER TABLE `hojas_de_vida`
  ADD CONSTRAINT `fk_hoja_vida_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `ofertas_laborales`
--
ALTER TABLE `ofertas_laborales`
  ADD CONSTRAINT `fk_oferta_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_oferta_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresas` (`id_empresa`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `perfil_personas`
--
ALTER TABLE `perfil_personas`
  ADD CONSTRAINT `fk_perfil_persona_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_perfil_persona_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
