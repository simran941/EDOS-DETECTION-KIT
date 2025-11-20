"""
Supabase client and utilities for real-time database operations
"""

from typing import Optional, Dict, Any, List
import asyncio

try:
    from supabase import create_client, Client

    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None

try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker

    SQLALCHEMY_ASYNC_AVAILABLE = True
except ImportError:
    SQLALCHEMY_ASYNC_AVAILABLE = False

from .core.config import settings


class SupabaseClient:
    """Supabase client wrapper for real-time operations"""

    def __init__(self):
        self.client = None
        self.async_engine = None
        self.async_session = None

        if settings.use_supabase and SUPABASE_AVAILABLE:
            self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            if SQLALCHEMY_ASYNC_AVAILABLE:
                self._setup_async_db()

    def _setup_async_db(self):
        """Setup async PostgreSQL connection for Supabase"""
        if settings.use_supabase:
            # Convert postgresql:// to postgresql+asyncpg://
            async_url = settings.effective_database_url.replace(
                "postgresql://", "postgresql+asyncpg://"
            )

            self.async_engine = create_async_engine(
                async_url, echo=True, pool_pre_ping=True, pool_recycle=3600
            )

            self.async_session = sessionmaker(
                self.async_engine, class_=AsyncSession, expire_on_commit=False
            )

    async def get_async_session(self):
        """Get async database session"""
        if self.async_session:
            async with self.async_session() as session:
                yield session

    def subscribe_to_table(self, table: str, callback, event: str = "*"):
        """
        Subscribe to real-time changes on a table

        Args:
            table: Table name to subscribe to
            callback: Function to call when changes occur
            event: Event type ('*', 'INSERT', 'UPDATE', 'DELETE')
        """
        if not self.client:
            return None

        def handle_change(payload):
            """Handle real-time changes"""
            asyncio.create_task(callback(payload))

        return self.client.table(table).on(event, handle_change).subscribe()

    async def insert_data(self, table: str, data: Dict[Any, Any]) -> Dict[Any, Any]:
        """Insert data into a table"""
        if not self.client:
            raise Exception("Supabase client not configured")

        result = self.client.table(table).insert(data).execute()
        return result.data[0] if result.data else {}

    async def update_data(
        self, table: str, data: Dict[Any, Any], match: Dict[Any, Any]
    ) -> List[Dict[Any, Any]]:
        """Update data in a table"""
        if not self.client:
            raise Exception("Supabase client not configured")

        query = self.client.table(table).update(data)
        for key, value in match.items():
            query = query.eq(key, value)

        result = query.execute()
        return result.data

    async def select_data(
        self, table: str, columns: str = "*", **filters
    ) -> List[Dict[Any, Any]]:
        """Select data from a table"""
        if not self.client:
            raise Exception("Supabase client not configured")

        query = self.client.table(table).select(columns)
        for key, value in filters.items():
            query = query.eq(key, value)

        result = query.execute()
        return result.data

    async def delete_data(self, table: str, **match) -> List[Dict[Any, Any]]:
        """Delete data from a table"""
        if not self.client:
            raise Exception("Supabase client not configured")

        query = self.client.table(table).delete()
        for key, value in match.items():
            query = query.eq(key, value)

        result = query.execute()
        return result.data

    def get_realtime_url(self) -> str:
        """Get the WebSocket URL for real-time subscriptions"""
        if not settings.SUPABASE_URL:
            return ""

        ws_url = settings.SUPABASE_URL.replace("https://", "wss://")
        return f"{ws_url}/realtime/v1/websocket"


# Global Supabase client instance
supabase_client = SupabaseClient()


async def get_database_session():
    """
    Get database session - returns Supabase async session if configured,
    otherwise falls back to SQLite
    """
    if settings.use_supabase:
        async for session in supabase_client.get_async_session():
            yield session
    else:
        # Fallback to existing SQLite session
        from .database import get_db

        yield next(get_db())


def get_supabase_client() -> SupabaseClient:
    """Get the global Supabase client instance"""
    return supabase_client
