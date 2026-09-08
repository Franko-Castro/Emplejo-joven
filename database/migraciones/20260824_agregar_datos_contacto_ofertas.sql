-- Ejecuta este archivo solo si ya creaste la base de datos con una version anterior.
ALTER TABLE ofertas_laborales
    ADD COLUMN datos_contacto TEXT NOT NULL AFTER habilidades_requeridas;
