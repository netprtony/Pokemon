# model.py
from sqlalchemy import (
    Column, String, Integer, Float, Date, DateTime, Text, Boolean,
    ForeignKey, Enum, DECIMAL, JSON, TIMESTAMP, func
)
from sqlalchemy.orm import declarative_base, relationship
import enum

Base = declarative_base()

# ============================================================
# ENUMS
# ============================================================

class SupertypeEnum(enum.Enum):
    Pokemon = "Pokemon"
    Trainer = "Trainer"
    Energy = "Energy"

class ConditionUSEnum(str, enum.Enum):
    NearMint = "Near Mint"
    LightlyPlayed = "Lightly Played"
    ModeratelyPlayed = "Moderately Played"
    HeavilyPlayed = "Heavily Played"
    Damaged = "Damaged"

class OrderStatusEnum(enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class AlertTypeEnum(enum.Enum):
    PROFIT_OPPORTUNITY = "PROFIT_OPPORTUNITY"
    PRICE_DROP = "PRICE_DROP"
    HIGH_DEMAND = "HIGH_DEMAND"
    OVERPRICED = "OVERPRICED"

# ============================================================
# MASTER DATA
# ============================================================

class PokemonSet(Base):
    __tablename__ = "pokemon_sets"

    set_id = Column(String(15), primary_key=True)
    set_name_en = Column(String(100), nullable=False)
    set_name_original = Column(String(100))
    series = Column(String(50))
    release_year = Column(Integer, nullable=False)
    total_cards = Column(Integer)
    set_symbol_url = Column(String(255))
    region = Column(String(5), default="EN")
    series_order = Column(Integer)
    created_at = Column(DateTime, default=func.now())

    cards = relationship("PokemonCardMaster", back_populates="set")

class PokemonCardMaster(Base):
    __tablename__ = "pokemon_cards_master"

    master_card_id = Column(String(20), primary_key=True)
    set_id = Column(String(15), ForeignKey("pokemon_sets.set_id"), nullable=False)
    card_number = Column(String(15), nullable=False
    )
    name_en = Column(String(100), nullable=False)
    name_original = Column(String(100))
    version_en = Column(String(100))
    version_original = Column(String(100))
    supertype = Column(Enum(SupertypeEnum), nullable=False)
    subtypes = Column(String(100))
    hp = Column(Integer)
    rarity = Column(String(30), nullable=False)
    illustrator = Column(String(100))
    spec = Column(Text)
    reference_image_url = Column(String(255))
    release_year = Column(Integer)
    is_promo = Column(Boolean, default=False)
    is_special_variant = Column(Boolean, default=False)

    set = relationship("PokemonSet", back_populates="cards")
    inventory_items = relationship("Inventory", back_populates="card")
    market_prices = relationship("MarketPrice", back_populates="card")

# ============================================================
# INVENTORY MANAGEMENT
# ============================================================

class Inventory(Base):
    __tablename__ = "inventory"

    inventory_id = Column(Integer, primary_key=True, autoincrement=True)
    master_card_id = Column(String(20), ForeignKey("pokemon_cards_master.master_card_id"), nullable=False)
    quantity_in_stock = Column(Integer, nullable=False, default=0)
    quantity_sold = Column(Integer, default=0)
    purchase_price = Column(DECIMAL(12, 2), nullable=False)
    selling_price = Column(DECIMAL(12, 2))
    storage_location = Column(String(100))
    physical_condition_us = Column(Enum(ConditionUSEnum), nullable=False)
    physical_condition_jp = Column(String(5), nullable=False)
    card_photos = Column(JSON)
    photo_count = Column(Integer, default=0)
    date_added = Column(Date, nullable=False)
    last_updated = Column(TIMESTAMP)
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    language = Column(String(5), default="EN")
    is_graded = Column(Boolean, default=False)
    grade_company = Column(String(20))
    grade_score = Column(DECIMAL(3, 1))

    card = relationship("PokemonCardMaster", back_populates="inventory_items")
    price_alerts = relationship("PriceAlert", back_populates="inventory_item")
    order_details = relationship("OrderDetail", back_populates="inventory_item")

# ============================================================
# MARKET ANALYSIS & PRICING
# ============================================================

class MarketPrice(Base):
    __tablename__ = "market_prices"

    price_id = Column(Integer, primary_key=True, autoincrement=True)
    master_card_id = Column(String(20), ForeignKey("pokemon_cards_master.master_card_id"), nullable=False)

    tcgplayer_nm_price = Column(DECIMAL(10, 2))
    tcgplayer_lp_price = Column(DECIMAL(10, 2))
    ebay_avg_price = Column(DECIMAL(10, 2))
    pricecharting_price = Column(DECIMAL(10, 2))
    cardrush_a_price = Column(DECIMAL(10, 2))
    cardrush_b_price = Column(DECIMAL(10, 2))
    snkrdunk_price = Column(DECIMAL(10, 2))
    yahoo_auction_avg = Column(DECIMAL(10, 2))
    usd_to_vnd_rate = Column(DECIMAL(10, 2))
    jpy_to_vnd_rate = Column(DECIMAL(6, 2))
    price_date = Column(Date, nullable=False)
    data_source = Column(String(50), default="Manual")

    card = relationship("PokemonCardMaster", back_populates="market_prices")

class PriceAlert(Base):
    __tablename__ = "price_alerts"

    alert_id = Column(Integer, primary_key=True, autoincrement=True)
    inventory_id = Column(Integer, ForeignKey("inventory.inventory_id"), nullable=False)
    alert_type = Column(Enum(AlertTypeEnum), nullable=False)
    purchase_price = Column(DECIMAL(12, 2))
    current_market_price = Column(DECIMAL(12, 2))
    price_difference = Column(DECIMAL(12, 2))
    percentage_change = Column(DECIMAL(6, 2))
    alert_message = Column(Text)
    alert_date = Column(Date, nullable=False)
    is_acknowledged = Column(Boolean, default=False)

    inventory_item = relationship("Inventory", back_populates="price_alerts")

# ============================================================
# ORDER MANAGEMENT
# ============================================================

class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True, autoincrement=True)
    order_date = Column(Date, nullable=False)
    customer_name = Column(String(100))
    customer_contact = Column(Text)
    order_status = Column(Enum(OrderStatusEnum), default=OrderStatusEnum.PENDING)
    total_amount = Column(DECIMAL(12, 2), default=0)
    shipping_address = Column(Text)
    payment_method = Column(String(50))
    platform = Column(String(50))
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)

    order_details = relationship("OrderDetail", back_populates="order")

class OrderDetail(Base):
    __tablename__ = "order_details"

    detail_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False)
    inventory_id = Column(Integer, ForeignKey("inventory.inventory_id"), nullable=False)
    quantity_ordered = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(12, 2), nullable=False)
    subtotal = Column(DECIMAL(12, 2), nullable=False)

    order = relationship("Order", back_populates="order_details")
    inventory_item = relationship("Inventory", back_populates="order_details")
