DROP DATABASE IF EXISTS POKEMON;
CREATE DATABASE POKEMON CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
USE POKEMON;
-- ================================================
-- POKEMON CARDS INVENTORY MANAGEMENT DATABASE
-- Core Focus: Quản lý kho hàng với khả năng mở rộng
-- ================================================

-- ================================================
-- MODULE 1: MASTER DATA (Reference Tables)
-- ================================================

-- Bảng Sets/Series Pokemon
CREATE TABLE pokemon_sets (
    set_id VARCHAR(15) PRIMARY KEY,
    set_name_en VARCHAR(100) NOT NULL,
    set_name_original VARCHAR(100), -- Tên gốc nếu không phải tiếng Anh
    series VARCHAR(50),
    release_year YEAR NOT NULL,
    total_cards INT,
    set_symbol_url VARCHAR(255),
    region VARCHAR(5) DEFAULT 'EN', -- EN, JP, KR, etc.
    series_order INT, -- Thứ tự series để sắp xếp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_series_year (series, release_year),
    INDEX idx_series_order (series_order)
);

-- Bảng Master Cards (Toàn bộ thẻ Pokemon từng release)
CREATE TABLE pokemon_cards_master (
    master_card_id VARCHAR(20) PRIMARY KEY, -- "base1-025", "xy1-143"
    set_id VARCHAR(15) NOT NULL,
    card_number VARCHAR(15) NOT NULL, -- "025/102", "143/146"
    
    -- Tên thẻ đa ngôn ngữ
    name_en VARCHAR(100) NOT NULL,
    name_original VARCHAR(100), -- Tên gốc nếu không phải tiếng Anh
    
    -- Version/Variant info
    version_en VARCHAR(100), -- "Base Set", "1st Edition", "Shadowless"
    version_original VARCHAR(100), -- Version gốc nếu không phải tiếng Anh
    
    -- Card properties
    supertype ENUM('Pokemon', 'Trainer', 'Energy') NOT NULL,
    subtypes VARCHAR(100), -- "Stage 1", "Basic", "Item"
    hp INT,
    rarity VARCHAR(30) NOT NULL,
    illustrator VARCHAR(100), -- Tên họa sĩ
    spec TEXT, -- Thông số đặc biệt (attacks, abilities, etc.)
    
    -- Reference image (1 ảnh đại diện)
    reference_image_url VARCHAR(255),
    
    -- Metadata
    release_year YEAR,
    is_promo BOOLEAN DEFAULT FALSE,
    is_special_variant BOOLEAN DEFAULT FALSE, -- Holo, reverse holo, etc.
    
    FOREIGN KEY (set_id) REFERENCES pokemon_sets(set_id),
    INDEX idx_name_en (name_en),
    INDEX idx_set_number (set_id, card_number),
    INDEX idx_rarity (rarity),
    INDEX idx_year (release_year)
);

-- ================================================
-- MODULE 2: INVENTORY MANAGEMENT (Core Module)
-- ================================================

-- Bảng chính: INVENTORY (Kho hàng thực tế)
CREATE TABLE inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    master_card_id VARCHAR(20) NOT NULL, -- Link tới master data
    
    -- Business Information
    quantity_in_stock INT NOT NULL DEFAULT 0,
    quantity_sold INT DEFAULT 0, -- Để track lịch sử bán
    purchase_price DECIMAL(12,2) NOT NULL, -- Giá nhập (VNĐ)
    selling_price DECIMAL(12,2), -- Giá bán hiện tại
    
    -- Physical Storage
    storage_location VARCHAR(100), -- "Box-001-A1", "Safe-Premium-Slot-05"
    physical_condition_us ENUM('Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged') NOT NULL,
    physical_condition_jp ENUM('A', 'B', 'C', 'D') NOT NULL,
    
    -- Card Photos (10+ ảnh chi tiết)
    card_photos JSON, -- Array URLs: ["front.jpg", "back.jpg", "corner1.jpg", ...]
    photo_count INT DEFAULT 0, -- Số lượng ảnh thực tế
    
    -- Inventory Management
    date_added DATE NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE, -- FALSE khi đã bán hết
    notes TEXT, -- Ghi chú riêng
    
    -- Future expansion fields
    language VARCHAR(5) DEFAULT 'EN',
    is_graded BOOLEAN DEFAULT FALSE,
    grade_company VARCHAR(20), -- PSA, BGS, CGC
    grade_score DECIMAL(3,1), -- 9.5, 10.0
    
    FOREIGN KEY (master_card_id) REFERENCES pokemon_cards_master(master_card_id),
    
    -- Indexes cho performance
    INDEX idx_master_card (master_card_id),
    INDEX idx_active_stock (is_active, quantity_in_stock),
    INDEX idx_condition_us (physical_condition_us),
    INDEX idx_condition_jp (physical_condition_jp),
    INDEX idx_location (storage_location),
    INDEX idx_date_added (date_added),
    INDEX idx_selling_price (selling_price DESC)
);

-- ================================================
-- MODULE 3: MARKET ANALYSIS & PRICING
-- ================================================

-- Bảng theo dõi giá thị trường
CREATE TABLE market_prices (
    price_id INT AUTO_INCREMENT PRIMARY KEY,
    master_card_id VARCHAR(20) NOT NULL,
    
    -- Market sources
    tcgplayer_nm_price DECIMAL(10,2), -- US Near Mint
    tcgplayer_lp_price DECIMAL(10,2), -- US Lightly Played
    ebay_avg_price DECIMAL(10,2),
    pricecharting_price DECIMAL(10,2),
    
    -- Japanese sources  
    cardrush_a_price DECIMAL(10,2), -- JP Grade A
    cardrush_b_price DECIMAL(10,2), -- JP Grade B
    snkrdunk_price DECIMAL(10,2),
    yahoo_auction_avg DECIMAL(10,2),
    
    -- Exchange rates
    usd_to_vnd_rate DECIMAL(10,2),
    jpy_to_vnd_rate DECIMAL(6,2),
    
    -- Metadata
    price_date DATE NOT NULL,
    data_source VARCHAR(50) DEFAULT 'Manual',
    
    FOREIGN KEY (master_card_id) REFERENCES pokemon_cards_master(master_card_id),
    INDEX idx_card_date (master_card_id, price_date),
    INDEX idx_date (price_date)
);

-- Bảng cảnh báo giá (Price Alerts)
CREATE TABLE price_alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NOT NULL,
    
    alert_type ENUM('PROFIT_OPPORTUNITY', 'PRICE_DROP', 'HIGH_DEMAND', 'OVERPRICED') NOT NULL,
    
    -- Price comparison
    purchase_price DECIMAL(12,2),
    current_market_price DECIMAL(12,2),
    price_difference DECIMAL(12,2), -- Market - Purchase
    percentage_change DECIMAL(6,2), -- % thay đổi
    
    alert_message TEXT,
    alert_date DATE NOT NULL,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (inventory_id) REFERENCES inventory(inventory_id),
    INDEX idx_unacknowledged (is_acknowledged, alert_date),
    INDEX idx_alert_type (alert_type)
);

-- ================================================
-- MODULE 4: ORDER MANAGEMENT (Prepared for future)
-- ================================================

-- Bảng Orders (Chuẩn bị cho tương lai)
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    order_date DATE NOT NULL,
    customer_name VARCHAR(100),
    customer_contact TEXT,
    
    order_status ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
    total_amount DECIMAL(12,2) DEFAULT 0,
    
    shipping_address TEXT,
    payment_method VARCHAR(50),
    platform VARCHAR(50), -- Facebook, Shopee, etc.
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status_date (order_status, order_date),
    INDEX idx_platform (platform)
);

-- Bảng Order Details
CREATE TABLE order_details (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    inventory_id INT NOT NULL,
    
    quantity_ordered INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (inventory_id) REFERENCES inventory(inventory_id),
    
    INDEX idx_order (order_id),
    INDEX idx_inventory (inventory_id)
);

-- ================================================
-- MODULE 5: REPORTING & ANALYTICS VIEWS
-- ================================================

-- View: Inventory Summary (Thống kê kho hàng)
CREATE VIEW inventory_summary AS
SELECT 
    i.inventory_id,
    i.master_card_id,
    pcm.name_en,
    pcm.set_id,
    ps.set_name_en,
    i.quantity_in_stock,
    i.quantity_sold,
    i.purchase_price,
    i.selling_price,
    i.physical_condition_us,
    i.physical_condition_jp,
    i.storage_location,
    
    -- Tính toán giá trị
    (i.quantity_in_stock * i.purchase_price) AS total_purchase_value,
    (i.quantity_in_stock * i.selling_price) AS total_selling_value,
    (i.selling_price - i.purchase_price) AS unit_profit,
    ((i.selling_price - i.purchase_price) / i.purchase_price * 100) AS profit_percentage,
    
    i.date_added,
    i.is_active
FROM inventory i
JOIN pokemon_cards_master pcm ON i.master_card_id = pcm.master_card_id
JOIN pokemon_sets ps ON pcm.set_id = ps.set_id
WHERE i.is_active = TRUE;

-- View: Market Comparison (So sánh với thị trường)
CREATE VIEW market_comparison AS
SELECT 
    i.inventory_id,
    pcm.name_en,
    i.quantity_in_stock,
    i.purchase_price,
    i.selling_price,
    i.physical_condition_us,
    
    -- Market prices
    mp.tcgplayer_nm_price * mp.usd_to_vnd_rate AS tcg_price_vnd,
    mp.cardrush_a_price * mp.jpy_to_vnd_rate AS cardrush_price_vnd,
    
    -- Comparisons
    (mp.tcgplayer_nm_price * mp.usd_to_vnd_rate) - i.purchase_price AS tcg_profit_potential,
    ((mp.tcgplayer_nm_price * mp.usd_to_vnd_rate) - i.purchase_price) / i.purchase_price * 100 AS tcg_profit_percentage,
    
    mp.price_date AS last_price_update
FROM inventory i
JOIN pokemon_cards_master pcm ON i.master_card_id = pcm.master_card_id
LEFT JOIN market_prices mp ON pcm.master_card_id = mp.master_card_id
WHERE i.is_active = TRUE 
  AND i.quantity_in_stock > 0
  AND mp.price_date = (
      SELECT MAX(price_date) 
      FROM market_prices mp2 
      WHERE mp2.master_card_id = mp.master_card_id
  );

-- ================================================
-- STORED PROCEDURES FOR INVENTORY OPERATIONS
-- ================================================

-- Procedure: Thêm thẻ vào kho
DELIMITER //
CREATE PROCEDURE add_card_to_inventory(
    IN p_master_card_id VARCHAR(20),
    IN p_quantity INT,
    IN p_purchase_price DECIMAL(12,2),
    IN p_selling_price DECIMAL(12,2),
    IN p_condition_us VARCHAR(20),
    IN p_condition_jp VARCHAR(5),
    IN p_storage_location VARCHAR(100),
    IN p_photos JSON
)
BEGIN
    INSERT INTO inventory (
        master_card_id, quantity_in_stock, purchase_price, selling_price,
        physical_condition_us, physical_condition_jp, storage_location,
        card_photos, photo_count, date_added
    ) VALUES (
        p_master_card_id, p_quantity, p_purchase_price, p_selling_price,
        p_condition_us, p_condition_jp, p_storage_location,
        p_photos, JSON_LENGTH(p_photos), CURDATE()
    );
END//

-- Procedure: Cập nhật số lượng sau khi bán
CREATE PROCEDURE update_inventory_after_sale(
    IN p_inventory_id INT,
    IN p_quantity_sold INT
)
BEGIN
    UPDATE inventory 
    SET quantity_sold = quantity_sold + p_quantity_sold,
        quantity_in_stock = quantity_in_stock - p_quantity_sold,
        is_active = CASE 
            WHEN quantity_in_stock - p_quantity_sold <= 0 THEN FALSE 
            ELSE TRUE 
        END
    WHERE inventory_id = p_inventory_id;
END//

-- Function: Tính tổng giá trị kho
CREATE FUNCTION calculate_total_inventory_value() 
RETURNS DECIMAL(15,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE total_value DECIMAL(15,2);
    
    SELECT SUM(quantity_in_stock * selling_price) INTO total_value
    FROM inventory 
    WHERE is_active = TRUE;
    
    RETURN COALESCE(total_value, 0);
END//
DELIMITER ;

-- ================================================
-- SAMPLE DATA FOR TESTING
-- ================================================

-- Insert sample sets
INSERT INTO pokemon_sets (set_id, set_name_en, set_name_original, series, release_year, total_cards, set_symbol_url, region, series_order) VALUES
('base1', 'Base Set', NULL, 'Original', 1999, 102, 'https://assets.pokemon.com/assets/cms2/img/trading-card-game/series/base/base1.png', 'EN', 1),
('base2', 'Jungle', NULL, 'Original', 1999, 64, 'https://assets.pokemon.com/assets/cms2/img/trading-card-game/series/base/base2.png', 'EN', 2),
('base3', 'Fossil', NULL, 'Original', 1999, 62, 'https://assets.pokemon.com/assets/cms2/img/trading-card-game/series/base/base3.png', 'EN', 3),
('xy1', 'XY', NULL, 'XY', 2014, 146, 'https://assets.pokemon.com/assets/cms2/img/trading-card-game/series/xy/xy1.png', 'EN', 10),
('sm1', 'Sun & Moon', NULL, 'Sun & Moon', 2017, 163, 'https://assets.pokemon.com/assets/cms2/img/trading-card-game/series/sm/sm1.png', 'EN', 20);


-- Insert sample master cards
INSERT INTO pokemon_cards_master VALUES
('base1-004', 'base1', '4/102', 'Charizard', NULL, 'Base Set', NULL, 'Pokemon', 'Stage 2', 120, 'Rare Holo', 'Mitsuhiro Arita', 'Fire type attacks', NULL, 1999, FALSE, FALSE),
('base1-025', 'base1', '25/102', 'Pikachu', NULL, 'Base Set', NULL, 'Pokemon', 'Basic', 60, 'Common', 'Atsuko Nishida', 'Electric attacks', NULL, 1999, FALSE, FALSE),
('base1-002', 'base1', '2/102', 'Blastoise', NULL, 'Base Set', NULL, 'Pokemon', 'Stage 2', 100, 'Rare Holo', 'Ken Sugimori', 'Water type attacks', NULL, 1999, FALSE, FALSE);

-- ================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ================================================

-- Composite indexes cho reporting
CREATE INDEX idx_inventory_summary ON inventory(is_active, quantity_in_stock, date_added);
CREATE INDEX idx_inventory_profit ON inventory(selling_price, purchase_price);
CREATE INDEX idx_master_set_rarity ON pokemon_cards_master(set_id, rarity, release_year);