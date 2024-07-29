from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Replace with your actual connection string
DATABASE_URI = 'postgresql://DataVistaInterns:Interns%402024@datavistapostgresql.postgres.database.azure.com/DataVista'

engine = create_engine(DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_connection():
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        print("Database connection successful!")
    except Exception as e:
        print(f"Error connecting to the database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_connection()