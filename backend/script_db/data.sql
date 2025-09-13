DROP DATABASE IF EXISTS POKEMON;
CREATE DATABASE POKEMON CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
USE POKEMON;
-- Bảng Sets (Bộ thẻ)
CREATE TABLE sets (
    set_id VARCHAR(10) PRIMARY KEY,
    set_name VARCHAR(100) NOT NULL,
    series VARCHAR(50),
    release_date DATE,
    total_cards INT,
    symbol_url VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bảng Cards (Thông tin thẻ cơ bản)
CREATE TABLE cards (
    card_id VARCHAR(20) PRIMARY KEY,
    set_id VARCHAR(10) NOT NULL,
    card_number VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    supertype VARCHAR(20),
    subtypes VARCHAR(100),
    hp INT,
    rarity VARCHAR(20),
    artist VARCHAR(100),
    flavor_text TEXT,
    image_url VARCHAR(255),
    tcgplayer_url VARCHAR(255),
    cardmarket_url VARCHAR(255),
    CONSTRAINT fk_cards_sets FOREIGN KEY (set_id) REFERENCES sets(set_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bảng Pokemon Types
CREATE TABLE pokemon_types (
    type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(20) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bảng liên kết Card với Types (N-N)
CREATE TABLE card_types (
    card_id VARCHAR(20),
    type_id INT,
    PRIMARY KEY (card_id, type_id),
    CONSTRAINT fk_cardtypes_cards FOREIGN KEY (card_id) REFERENCES cards(card_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cardtypes_types FOREIGN KEY (type_id) REFERENCES pokemon_types(type_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bảng Attacks/Moves
CREATE TABLE attacks (
    attack_id INT AUTO_INCREMENT PRIMARY KEY,
    card_id VARCHAR(20) NOT NULL,
    attack_name VARCHAR(100) NOT NULL,
    attack_cost VARCHAR(50),
    damage VARCHAR(20),
    attack_text TEXT,
    CONSTRAINT fk_attacks_cards FOREIGN KEY (card_id) REFERENCES cards(card_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bảng Weaknesses & Resistances
CREATE TABLE weaknesses_resistances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_id VARCHAR(20) NOT NULL,
    type ENUM('weakness', 'resistance') NOT NULL,
    element VARCHAR(20) NOT NULL,
    value VARCHAR(10),
    CONSTRAINT fk_wr_cards FOREIGN KEY (card_id) REFERENCES cards(card_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bảng Inventory
CREATE TABLE inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    card_id VARCHAR(20) NOT NULL,
    condition_type ENUM('Mint', 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged') DEFAULT 'Near Mint',
    language VARCHAR(10) DEFAULT 'EN',
    is_first_edition BOOLEAN DEFAULT FALSE,
    is_shadowless BOOLEAN DEFAULT FALSE,
    is_reverse_holo BOOLEAN DEFAULT FALSE,
    is_holo BOOLEAN DEFAULT FALSE,
    quantity INT NOT NULL DEFAULT 1,
    purchase_price DECIMAL(8,2),
    current_market_price DECIMAL(8,2),
    purchase_date DATE,
    storage_location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_cards FOREIGN KEY (card_id) REFERENCES cards(card_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bảng Price History
CREATE TABLE price_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_id VARCHAR(20) NOT NULL,
    condition_type ENUM('Mint', 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'),
    price DECIMAL(8,2) NOT NULL,
    source VARCHAR(50),
    recorded_date DATE NOT NULL,
    CONSTRAINT fk_pricehistory_cards FOREIGN KEY (card_id) REFERENCES cards(card_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bảng Sales
CREATE TABLE sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NOT NULL,
    sale_price DECIMAL(8,2) NOT NULL,
    buyer_info VARCHAR(255),
    platform VARCHAR(50),
    sale_date DATE NOT NULL,
    fees DECIMAL(8,2) DEFAULT 0,
    shipping_cost DECIMAL(8,2) DEFAULT 0,
    profit DECIMAL(8,2) AS (sale_price - fees - shipping_cost) STORED,
    notes TEXT,
    CONSTRAINT fk_sales_inventory FOREIGN KEY (inventory_id) REFERENCES inventory(inventory_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes để tối ưu hiệu suất
CREATE INDEX idx_cards_set_number ON cards(set_id, card_number);
CREATE INDEX idx_cards_name ON cards(name);
CREATE INDEX idx_inventory_card ON inventory(card_id);
CREATE INDEX idx_inventory_condition ON inventory(condition_type);
CREATE INDEX idx_price_history_card_date ON price_history(card_id, recorded_date);

-- Insert Pokemon types
INSERT INTO pokemon_types (type_name) VALUES 
('Grass'), ('Fire'), ('Water'), ('Lightning'), ('Psychic'), 
('Fighting'), ('Darkness'), ('Metal'), ('Fairy'), ('Dragon'), 
('Colorless');

-- Sample data Sets
INSERT INTO sets (set_id, set_name, series, release_date, total_cards, symbol_url) VALUES
('base1', 'Base Set', 'Base', '1999-01-09', 102, 'https://images.pokemontcg.io/base1/symbol.png'),
('base2', 'Jungle', 'Base', '1999-06-16', 64, 'https://images.pokemontcg.io/base2/symbol.png'),
('xy1', 'XY Base Set', 'XY', '2014-02-05', 146, 'https://images.pokemontcg.io/xy1/symbol.png');
