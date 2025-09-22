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
    release_date DATE, 
    printed_total INT,
    total INT, 
	ptcgo_code VARCHAR(10), 
    image_symbol  VARCHAR(100),
    updated_at DATETIME
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
    rarity VARCHAR(30) NOT NULL,
    illustrator VARCHAR(50), -- Tên họa sĩ
    
    -- Reference image (1 ảnh đại diện)
    reference_image_url VARCHAR(100),
    
    -- Metadata
    flavorText TEXT,
    updated_at DATETIME,
    
    FOREIGN KEY (set_id) REFERENCES pokemon_sets(set_id),
    INDEX idx_name_en (name_en),
    INDEX idx_set_number (set_id, card_number),
    INDEX idx_rarity (rarity)
);

-- ================================================
-- MODULE 2: INVENTORY MANAGEMENT (Core Module)
-- ================================================

-- Bảng chính: INVENTORY (Kho hàng thực tế)
CREATE TABLE inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    master_card_id VARCHAR(20) NOT NULL,  -- Link đến master card
    
    -- Business Information
    total_quantity INT NOT NULL DEFAULT 0,
    quantity_sold INT DEFAULT 0,
    avg_purchase_price DECIMAL(12,2),  -- Giá nhập trung bình
    avg_selling_price DECIMAL(12,2),
    
    storage_location VARCHAR(100),  -- Vị trí chung (kệ, thùng)
    language ENUM('EN', 'JP') DEFAULT 'EN',
    is_active BOOLEAN DEFAULT TRUE,
    
    date_added DATE NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    notes TEXT,
    
    FOREIGN KEY (master_card_id) REFERENCES pokemon_cards_master(master_card_id),
    
    INDEX idx_master_card (master_card_id),
    INDEX idx_active (is_active),
    INDEX idx_location (storage_location)
);
CREATE TABLE detail_inventory (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NOT NULL,
    
    -- Tình trạng từng thẻ
    physical_condition_us ENUM('NearMint', 'LightlyPlayed', 'ModeratelyPlayed', 'HeavilyPlayed', 'Damaged') NOT NULL,
    physical_condition_jp ENUM('A', 'B', 'C', 'D') NOT NULL,
    
    is_graded BOOLEAN DEFAULT FALSE,
    grade_company VARCHAR(20),
    grade_score DECIMAL(3,1),
    
    -- Giá riêng của thẻ này (nếu khác giá chung)
    purchase_price DECIMAL(12,2),
    selling_price DECIMAL(12,2),
    
    -- Quản lý ảnh
    card_photos JSON,   -- Lưu mảng ["front.jpg", "back.jpg", ...]
    photo_count INT GENERATED ALWAYS AS (JSON_LENGTH(card_photos)) STORED,
    
    -- Metadata
    date_added DATE NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_sold BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    FOREIGN KEY (inventory_id) REFERENCES inventory(inventory_id),
    
    INDEX idx_inventory (inventory_id),
    INDEX idx_condition_us (physical_condition_us),
    INDEX idx_graded (is_graded, grade_company),
    INDEX idx_sold (is_sold)
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
    
    order_status ENUM('PENDING', 'COMPLETED', 'SHIPPED', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
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
-- SAMPLE DATA FOR TESTING
-- ================================================



INSERT INTO inventory (master_card_id, total_quantity, quantity_sold, avg_purchase_price, avg_selling_price, storage_location, language, is_active, date_added, notes) VALUES
('base1-11', 2, 0, 1500000, NULL, 'Shelf A1', 'EN', TRUE, '2024-06-01', 'Mint condition'),
('base1-12', 5, 1, 200000, 300000, 'Box B2', 'EN', TRUE, '2024-06-01', 'Some cards lightly played'),
('base1-13', 3, 0, 1200000, NULL, 'Shelf A2', 'EN', TRUE, '2024-06-02', 'Near mint'),
('base1-14', 4, 2, 1000000, 1500000, 'Box C1', 'EN', TRUE, '2024-06-03', 'Includes GX move cards'),
('base1-15', 6, 0, 800000, NULL, 'Shelf B1', 'EN', TRUE, '2024-06-04', 'Latest series cards');

INSERT INTO detail_inventory (inventory_id, physical_condition_us, physical_condition_jp, is_graded, grade_company, grade_score, purchase_price, selling_price, card_photos, date_added, is_sold, notes) VALUES
(1, 'NearMint', 'A', TRUE, 'PSA', 9.5, 1500000, NULL, JSON_ARRAY('charizard_front.jpg', 'charizard_back.jpg'), '2024-06-01', FALSE, 'Graded by PSA'),
(1, 'LightlyPlayed', 'B', FALSE, NULL, NULL, 1500000, NULL, JSON_ARRAY('charizard_lp_front.jpg', 'charizard_lp_back.jpg'), '2024-06-01', FALSE, 'Lightly played version'),
(2, 'NearMint', 'A', FALSE, NULL, NULL, 200000, 300000, JSON_ARRAY('pikachu_front.jpg', 'pikachu_back.jpg'), '2024-06-01', TRUE, 'Sold one card'),
(2, 'LightlyPlayed', 'B', FALSE, NULL, NULL, 200000, NULL, JSON_ARRAY('pikachu_lp_front.jpg', 'pikachu_lp_back.jpg'), '2024-06-01', FALSE, 'Lightly played version'),
(2, 'ModeratelyPlayed', 'C', FALSE, NULL, NULL, 200000, NULL, JSON_ARRAY('pikachu_mp_front.jpg', 'pikachu_mp_back.jpg'), '2024-06-01', FALSE, 'Moderately played version'),
(2, 'HeavilyPlayed', 'D', FALSE, NULL, NULL, 200000, NULL, JSON_ARRAY('pikachu_hp_front.jpg', 'pikachu_hp_back.jpg'), '2024-06-01', FALSE, 'Heavily played version'),
(2, 'Damaged', 'D', FALSE, NULL, NULL, 200000, NULL, JSON_ARRAY('pikachu_damaged_front.jpg', 'pikachu_damaged_back.jpg'), '2024-06-01', FALSE, 'Damaged version'),
(3, 'NearMint', 'A', TRUE, 'BGS', 9.0, 1200000, NULL, JSON_ARRAY('mewtwo_ex_front.jpg', 'mewtwo_ex_back.jpg'), '2024-06-02', FALSE, 'Graded by BGS'),
(3, 'LightlyPlayed', 'B', FALSE, NULL, NULL, 1200000, NULL, JSON_ARRAY('mewtwo_ex_lp_front.jpg', 'mewtwo_ex_lp_back.jpg'), '2024-06-02', FALSE, 'Lightly played version'),
(3, 'ModeratelyPlayed', 'C', FALSE, NULL, NULL, 1200000, NULL, JSON_ARRAY('mewtwo_ex_mp_front.jpg', 'mewtwo_ex_mp_back.jpg'), '2024-06-02', FALSE, 'Moderately played version'),
(4, 'NearMint', 'A', TRUE, 'PSA', 9.8, 1000000, 1500000, JSON_ARRAY('incineroar_gx_front.jpg', 'incineroar_gx_back.jpg'), '2024-06-03', TRUE, 'Sold two cards'),
(4, 'LightlyPlayed', 'B', FALSE, NULL, NULL, 1000000, NULL, JSON_ARRAY('incineroar_gx_lp_front.jpg', 'incineroar_gx_lp_back.jpg'), '2024-06-03', FALSE, 'Lightly played version'),
(4, 'ModeratelyPlayed', 'C', FALSE, NULL, NULL, 1000000, NULL, JSON_ARRAY('incineroar_gx_mp_front.jpg', 'incineroar_gx_mp_back.jpg'), '2024-06-03', FALSE, 'Moderately played version');

INSERT INTO market_prices (master_card_id, tcgplayer_nm_price, tcgplayer_lp_price, ebay_avg_price, pricecharting_price, cardrush_a_price, cardrush_b_price, snkrdunk_price, yahoo_auction_avg, usd_to_vnd_rate, jpy_to_vnd_rate, price_date, data_source) VALUES
('base1-004', 120.00, 100.00, 130.00, 125.00, NULL, NULL, NULL, NULL, 24000, NULL, '2024-06-01', 'Manual'),
('base1-025', 15.00, 12.00, 16.00, 15.50, NULL, NULL, NULL, NULL, 24000, NULL, '2024-06-01', 'Manual'),
('xy1-143', 60.00, 50.00, 65.00, 62.00, NULL, NULL, NULL, NULL, 24000, NULL, '2024-06-01', 'Manual'),
('sm1-001', 90.00, 80.00, 95.00, 92.00, NULL, NULL, NULL, NULL, 24000, NULL, '2024-06-01', 'Manual'),
('sv1-100', 85.00, 75.00, 88.00, 86.00, NULL, NULL, NULL, NULL, 24000, NULL, '2024-06-01', 'Manual');
INSERT INTO price_alerts (inventory_id, alert_type, purchase_price, current_market_price, price_difference, percentage_change, alert_message, alert_date, is_acknowledged) VALUES
(1, 'PROFIT_OPPORTUNITY', 1500000, 2880000, 1380000, 92.00, 'High profit potential on Charizard. Consider listing for sale.', '2024-06-02', FALSE),
(2, 'PRICE_DROP', 200000, 360000, 160000, 80.00, 'Pikachu market price has increased significantly. Review selling price.', '2024-06-02', FALSE);
INSERT INTO orders (order_date, customer_name, customer_contact, order_status, total_amount, shipping_address, payment_method, platform) VALUES
('2024-06-10', 'Nguyễn Văn A', '0912345678', 'COMPLETED', 3000000, 'Hà Nội', 'Credit Card', 'Website'),
('2024-06-11', 'Trần Thị B', '0987654321', 'PENDING', 500000, 'Hồ Chí Minh', 'Cash on Delivery', 'Facebook'),
('2024-06-12', 'Lê Văn C', '0901234567', 'SHIPPED', 1500000, 'Đà Nẵng', 'Bank Transfer', 'Shopee'),
('2024-06-13', 'Phạm Thị D', '0932123456', 'CANCELLED', 0, 'Cần Thơ', 'N/A', 'Instagram');
INSERT INTO order_details (order_id, inventory_id, quantity_ordered, unit_price, subtotal) VALUES
(1, 1, 1, 3000000, 3000000),
(2, 2, 1, 500000, 500000),
(3, 3, 1, 1500000, 1500000);    
-- ================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ================================================

