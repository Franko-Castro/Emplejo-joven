-- Migración: Agregar rol 'admin' a la tabla usuarios
-- Fecha: 2026-09-04

ALTER TABLE `usuarios` 
MODIFY COLUMN `tipo_usuario` ENUM('persona', 'empresa', 'admin') NOT NULL;

-- Insertar usuario administrador por defecto si no existe
-- Correo: Yosmany123@hotmail.com
-- Contraseña por defecto: definida al instalar
INSERT INTO `usuarios` (`correo`, `password_hash`, `tipo_usuario`, `correo_verificado`, `activo`, `fecha_creacion`)
SELECT 'Yosmany123@hotmail.com', '$2b$10$XBgyl7xjjf5TcUS8ivcts.1cENrVPa8ygNF5uZgPbJnsdfjlhJaNO', 'admin', 1, 1, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM `usuarios` WHERE `correo` = 'Yosmany123@hotmail.com'
);
