from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Đường dẫn đến file chứng chỉ CA
SSL_CA = os.getenv("MYSQL_SSL_CA")  # sửa lại đường dẫn cho đúng
# MYSQL_SSL_CERT = os.getenv("MYSQL_SSL_CERT")
# MYSQL_SSL_KEY = os.getenv("MYSQL_SSL_KEY")
# Cấu hình kết nối với SSL
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "ssl": {
            "ca": SSL_CA,
            # "cert": MYSQL_SSL_CERT,
            # "key": MYSQL_SSL_KEY,
            "check_hostname": False
        }
    }
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()