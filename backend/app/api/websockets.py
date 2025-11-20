"""
WebSocket endpoints for real-time data streaming
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Optional
import json
import asyncio
import logging
from datetime import datetime

from ..api.supabase_auth import verify_token
from ..realtime_manager import get_realtime_manager
from ..services.data_generator import DataGenerator

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/alerts/{user_id}")
async def websocket_alerts(
    websocket: WebSocket, user_id: str, token: Optional[str] = Query(None)
):
    """WebSocket endpoint for real-time alerts"""

    # Verify authentication
    if not token:
        await websocket.close(code=4001, reason="Authentication required")
        return

    try:
        # Verify the token
        token_data = await verify_token_ws(token)
        if token_data["user_id"] != user_id:
            await websocket.close(code=4003, reason="User ID mismatch")
            return

    except Exception as e:
        await websocket.close(code=4001, reason="Invalid token")
        return

    realtime_manager = get_realtime_manager()
    data_generator = DataGenerator()

    try:
        # Connect to real-time manager
        await realtime_manager.connect(websocket, "alerts", user_id)
        logger.info(f"User {user_id} connected to alerts WebSocket")

        # Send initial alerts
        initial_alerts = data_generator.generate_alerts(count=5, user_id=user_id)
        await websocket.send_text(
            json.dumps(
                {
                    "type": "initial_alerts",
                    "data": initial_alerts,
                    "timestamp": datetime.now().isoformat(),
                }
            )
        )

        # Start streaming real-time alerts
        alert_task = asyncio.create_task(
            stream_alerts(websocket, user_id, data_generator)
        )

        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client (like resource selection)
                message = await websocket.receive_text()
                data = json.loads(message)

                if data.get("type") == "resource_selected":
                    # Update user's selected resource for targeted alerts
                    resource_id = data.get("resource_id")
                    logger.info(f"User {user_id} selected resource {resource_id}")

                    # Send resource-specific alerts
                    resource_alerts = data_generator.generate_resource_alerts(
                        resource_id=resource_id, user_id=user_id, count=3
                    )
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "resource_alerts",
                                "data": resource_alerts,
                                "resource_id": resource_id,
                                "timestamp": datetime.now().isoformat(),
                            }
                        )
                    )

            except WebSocketDisconnect:
                break

    except WebSocketDisconnect:
        logger.info(f"User {user_id} disconnected from alerts WebSocket")
    except Exception as e:
        logger.error(f"Error in alerts WebSocket for user {user_id}: {e}")
    finally:
        # Clean up
        await realtime_manager.disconnect(websocket, "alerts", user_id)
        if "alert_task" in locals():
            alert_task.cancel()


@router.websocket("/metrics/{user_id}")
async def websocket_metrics(
    websocket: WebSocket, user_id: str, token: Optional[str] = Query(None)
):
    """WebSocket endpoint for real-time metrics"""

    if not token:
        await websocket.close(code=4001, reason="Authentication required")
        return

    try:
        token_data = await verify_token_ws(token)
        if token_data["user_id"] != user_id:
            await websocket.close(code=4003, reason="User ID mismatch")
            return
    except:
        await websocket.close(code=4001, reason="Invalid token")
        return

    realtime_manager = get_realtime_manager()
    data_generator = DataGenerator()

    try:
        await realtime_manager.connect(websocket, "metrics", user_id)
        logger.info(f"User {user_id} connected to metrics WebSocket")

        # Stream real-time metrics
        while True:
            metrics = data_generator.generate_metrics(user_id=user_id)
            await websocket.send_text(
                json.dumps(
                    {
                        "type": "metrics_update",
                        "data": metrics,
                        "timestamp": datetime.now().isoformat(),
                    }
                )
            )

            await asyncio.sleep(5)  # Update every 5 seconds

    except WebSocketDisconnect:
        logger.info(f"User {user_id} disconnected from metrics WebSocket")
    finally:
        await realtime_manager.disconnect(websocket, "metrics", user_id)


@router.websocket("/network/{user_id}")
async def websocket_network(
    websocket: WebSocket, user_id: str, token: Optional[str] = Query(None)
):
    """WebSocket endpoint for real-time network data"""

    if not token:
        await websocket.close(code=4001, reason="Authentication required")
        return

    try:
        token_data = await verify_token_ws(token)
        if token_data["user_id"] != user_id:
            await websocket.close(code=4003, reason="User ID mismatch")
            return
    except:
        await websocket.close(code=4001, reason="Invalid token")
        return

    realtime_manager = get_realtime_manager()
    data_generator = DataGenerator()

    try:
        await realtime_manager.connect(websocket, "network", user_id)
        logger.info(f"User {user_id} connected to network WebSocket")

        # Stream real-time network data
        while True:
            network_data = data_generator.generate_network_activity(user_id=user_id)
            await websocket.send_text(
                json.dumps(
                    {
                        "type": "network_update",
                        "data": network_data,
                        "timestamp": datetime.now().isoformat(),
                    }
                )
            )

            await asyncio.sleep(2)  # Update every 2 seconds

    except WebSocketDisconnect:
        logger.info(f"User {user_id} disconnected from network WebSocket")
    finally:
        await realtime_manager.disconnect(websocket, "network", user_id)


async def verify_token_ws(token: str) -> dict:
    """Verify token for WebSocket connections"""
    import jwt
    import os

    SUPABASE_JWT_SECRET = os.getenv(
        "SUPABASE_JWT_SECRET", "your-jwt-secret-from-supabase"
    )

    payload = jwt.decode(
        token, SUPABASE_JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False}
    )

    return {
        "user_id": payload.get("sub"),
        "email": payload.get("email"),
        "role": payload.get("role"),
    }


async def stream_alerts(
    websocket: WebSocket, user_id: str, data_generator: DataGenerator
):
    """Background task to stream alerts to user"""
    try:
        while True:
            # Generate new alert for this user
            new_alert = data_generator.generate_single_alert(user_id=user_id)

            await websocket.send_text(
                json.dumps(
                    {
                        "type": "new_alert",
                        "data": new_alert,
                        "timestamp": datetime.now().isoformat(),
                    }
                )
            )

            # Random interval between 10-30 seconds
            import random

            await asyncio.sleep(random.randint(10, 30))

    except asyncio.CancelledError:
        logger.info(f"Alert streaming cancelled for user {user_id}")
    except Exception as e:
        logger.error(f"Error streaming alerts for user {user_id}: {e}")
