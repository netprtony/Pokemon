# model.py
from sqlalchemy import (
    Column, Computed, String, Integer, Float, Date, DateTime, Text, Boolean,
    ForeignKey, Enum, DECIMAL, JSON, TIMESTAMP, func
)
from sqlalchemy.orm import declarative_base, relationship
import enum

Base = declarative_base()

# ============================================================
# ENUMS
# ============================================================

class SupertypeEnum(str, enum.Enum):
    Pokemon = "Pokemon"
    Trainer = "Trainer"
    Energy = "Energy"

class ConditionUSEnum(str, enum.Enum):
    NearMint = "Near Mint"
    LightlyPlayed = "Lightly Played"
    ModeratelyPlayed = "Moderately Played"
    HeavilyPlayed = "Heavily Played"
    Damaged = "Damaged"

class OrderStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class AlertTypeEnum(str, enum.Enum):
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
    release_date = Column(Date)
    printed_total = Column(Integer)
    total = Column(Integer)
    ptcgo_code = Column(String(10))
    image_symbol = Column(String(100))
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    cards = relationship("PokemonCardMaster", back_populates="set")


class PokemonCardMaster(Base):
    __tablename__ = "pokemon_cards_master"

    master_card_id = Column(String(20), primary_key=True)
    set_id = Column(String(15), ForeignKey("pokemon_sets.set_id"), nullable=False)
    card_number = Column(String(15), nullable=False)
    name_en = Column(String(100), nullable=False)
    name_original = Column(String(100))
    version_en = Column(String(100))
    version_original = Column(String(100))
    supertype = Column(Enum(SupertypeEnum), nullable=False)
    subtypes = Column(String(100))
    rarity = Column(String(30), nullable=False)
    illustrator = Column(String(50))
    reference_image_url = Column(String(100))
    flavorText = Column(Text)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

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
    total_quantity = Column(Integer, nullable=False, default=0)
    quantity_sold = Column(Integer, default=0)
    avg_purchase_price = Column(DECIMAL(12, 2))
    avg_selling_price = Column(DECIMAL(12, 2))
    storage_location = Column(String(100))
    language = Column(String(5), default="EN")
    is_active = Column(Boolean, default=True)
    date_added = Column(Date, nullable=False, default=func.current_date())
    last_updated = Column(TIMESTAMP, default=func.now(), onupdate=func.now())
    notes = Column(Text)

    card = relationship("PokemonCardMaster", back_populates="inventory_items")
    details = relationship("DetailInventory", back_populates="inventory_item")
    price_alerts = relationship("PriceAlert", back_populates="inventory_item")
    order_details = relationship("OrderDetail", back_populates="inventory_item")


class DetailInventory(Base):
    __tablename__ = "detail_inventory"

    detail_id = Column(Integer, primary_key=True, autoincrement=True)
    inventory_id = Column(Integer, ForeignKey("inventory.inventory_id"), nullable=False)

    physical_condition_us = Column(Enum(ConditionUSEnum), nullable=False)
    physical_condition_jp = Column(String(5), nullable=False)
    is_graded = Column(Boolean, default=False)
    grade_company = Column(String(20))
    grade_score = Column(DECIMAL(3, 1))
    purchase_price = Column(DECIMAL(12, 2))
    selling_price = Column(DECIMAL(12, 2))
    card_photos = Column(JSON)
    photo_count = Column(Integer, Computed("JSON_LENGTH(card_photos)"), nullable=False)
    date_added = Column(Date, nullable=False, default=func.current_date())
    last_updated = Column(TIMESTAMP, default=func.now(), onupdate=func.now())
    is_sold = Column(Boolean, default=False)
    notes = Column(Text)

    inventory_item = relationship("Inventory", back_populates="details")


# ============================================================
# MARKET ANALYSIS & PRICING
# ============================================================

class MarketPrice(Base):
    __tablename__ = "market_prices"

    price_id = Column(Integer, primary_key=True, autoincrement=True)
    master_card_id = Column(String(20), ForeignKey("pokemon_cards_master.master_card_id"), nullable=False)

    tcgplayer_price = Column(DECIMAL(10, 2))
    ebay_avg_price = Column(DECIMAL(10, 2))
    pricecharting_price = Column(JSON)
    cardrush_a_price = Column(DECIMAL(10, 2))
    cardrush_b_price = Column(DECIMAL(10, 2))
    snkrdunk_price = Column(DECIMAL(10, 2))
    yahoo_auction_avg = Column(DECIMAL(10, 2))
    usd_to_vnd_rate = Column(DECIMAL(10, 2))
    jpy_to_vnd_rate = Column(DECIMAL(6, 2))
    price_date = Column(DateTime, nullable=False)
    data_source = Column(String(50), default="Manual")
    urls = Column(JSON)

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
    alert_date = Column(Date, nullable=False, default=func.current_date())
    is_acknowledged = Column(Boolean, default=False)

    inventory_item = relationship("Inventory", back_populates="price_alerts")


# ============================================================
# ORDER MANAGEMENT
# ============================================================

class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True, autoincrement=True)
    order_date = Column(Date, nullable=False, default=func.current_date())
    customer_name = Column(String(100))
    customer_contact = Column(Text)
    order_status = Column(Enum(OrderStatusEnum), default=OrderStatusEnum.PENDING)
    total_amount = Column(DECIMAL(12, 2), default=0)
    shipping_address = Column(Text)
    payment_method = Column(String(50))
    platform = Column(String(50))
    created_at = Column(TIMESTAMP, default=func.now())
    updated_at = Column(TIMESTAMP, default=func.now(), onupdate=func.now())

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
