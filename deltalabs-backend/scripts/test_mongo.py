import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings

async def test_conn():
    settings = get_settings()
    print(f"Connecting to: {settings.mongodb_uri.split('@')[-1]}")
    client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
    try:
        await client.admin.command('ping')
        print("Ping successful!")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
