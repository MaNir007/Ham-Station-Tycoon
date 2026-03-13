CREATE DATABASE IF NOT EXISTS ham_tycoon CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ham_tycoon;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    credits INT DEFAULT 0,
    xp INT DEFAULT 0,
    license_class VARCHAR(10) DEFAULT 'Novice',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shop_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    price INT NOT NULL,
    bonus_multiplier DECIMAL(5, 2) NOT NULL,
    required_class VARCHAR(10) DEFAULT 'Novice'
);

-- Insert some default shop items
INSERT INTO shop_items (name, type, price, bonus_multiplier, required_class) VALUES
('Dipole Antenna', 'Antenna', 100, 1.5, 'Novice'),
('Yagi Antenna', 'Antenna', 500, 3.0, 'Class P'),
('Basic VHF Transceiver', 'Transceiver', 200, 2.0, 'Novice'),
('Advanced HF Transceiver', 'Transceiver', 1000, 5.0, 'Class A');
