"""
Real-time WebSocket manager for live data streaming
Handles real-time subscriptions for alerts, metrics, and network data
"""

import json
import asyncio
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
import logging

logger = logging.getLogger(__name__)


class RealTimeManager:
    """Manages WebSocket connections and real-time data streaming"""

    def __init__(self):
        # Store active WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "alerts": set(),
            "metrics": set(),
            "network": set(),
            "logs": set(),
            "resources": set(),
            "general": set(),
        }

        # Store user-specific connections
        self.user_connections: Dict[str, Dict[str, Set[WebSocket]]] = {}

        # Background tasks for data streaming
        self.streaming_tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, topic: str, user_id: str = None):
        """Connect a WebSocket to a specific topic"""
        await websocket.accept()

        # Add to topic-based connections
        if topic in self.active_connections:
            self.active_connections[topic].add(websocket)
        else:
            self.active_connections[topic] = {websocket}

        # Add to user-specific connections if user_id provided
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = {}
            if topic not in self.user_connections[user_id]:
                self.user_connections[user_id][topic] = set()
            self.user_connections[user_id][topic].add(websocket)

        logger.info(f"Client connected to topic: {topic}, user: {user_id}")

        # Start streaming task for this topic if not already running
        if topic not in self.streaming_tasks or self.streaming_tasks[topic].done():
            self.streaming_tasks[topic] = asyncio.create_task(
                self._stream_topic_data(topic)
            )

    async def disconnect(self, websocket: WebSocket, topic: str, user_id: str = None):
        """Disconnect a WebSocket from a specific topic"""
        # Remove from topic-based connections
        if topic in self.active_connections:
            self.active_connections[topic].discard(websocket)

            # Cancel streaming task if no more connections for this topic
            if (
                not self.active_connections[topic]
                and topic in self.streaming_tasks
                and not self.streaming_tasks[topic].done()
            ):
                self.streaming_tasks[topic].cancel()

        # Remove from user-specific connections
        if user_id and user_id in self.user_connections:
            if topic in self.user_connections[user_id]:
                self.user_connections[user_id][topic].discard(websocket)

                # Clean up empty sets
                if not self.user_connections[user_id][topic]:
                    del self.user_connections[user_id][topic]

            # Clean up empty user entries
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        logger.info(f"Client disconnected from topic: {topic}, user: {user_id}")

    async def broadcast_to_topic(self, topic: str, data: Dict):
        """Broadcast data to all connections subscribed to a topic"""
        if topic not in self.active_connections:
            return

        message = json.dumps(data)
        disconnected_websockets = []

        for websocket in self.active_connections[topic].copy():
            try:
                await websocket.send_text(message)
            except WebSocketDisconnect:
                disconnected_websockets.append(websocket)
            except Exception as e:
                logger.error(f"Error sending message to WebSocket: {e}")
                disconnected_websockets.append(websocket)

        # Remove disconnected websockets
        for ws in disconnected_websockets:
            await self.disconnect(ws, topic)

    async def broadcast_to_user(self, user_id: str, topic: str, data: Dict):
        """Broadcast data to specific user's connections for a topic"""
        if (
            user_id not in self.user_connections
            or topic not in self.user_connections[user_id]
        ):
            return

        message = json.dumps(data)
        disconnected_websockets = []

        for websocket in self.user_connections[user_id][topic].copy():
            try:
                await websocket.send_text(message)
            except WebSocketDisconnect:
                disconnected_websockets.append(websocket)
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                disconnected_websockets.append(websocket)

        # Remove disconnected websockets
        for ws in disconnected_websockets:
            await self.disconnect(ws, topic, user_id)

    async def _stream_topic_data(self, topic: str):
        """Background task to continuously stream data for a topic"""
        try:
            while self.active_connections.get(topic):
                await asyncio.sleep(2)  # Stream interval

                # Generate sample data based on topic
                data = await self._generate_sample_data(topic)
                if data:
                    await self.broadcast_to_topic(topic, data)

        except asyncio.CancelledError:
            logger.info(f"Streaming task cancelled for topic: {topic}")
        except Exception as e:
            logger.error(f"Error in streaming task for topic {topic}: {e}")

    async def _generate_sample_data(self, topic: str) -> Dict:
        """Generate sample real-time data based on topic"""
        import random
        from datetime import datetime, timezone

        timestamp = datetime.now(timezone.utc).isoformat()

        if topic == "alerts":
            return {
                "type": "security_alert",
                "data": {
                    "id": random.randint(1000, 9999),
                    "severity": random.choice(["high", "medium", "low"]),
                    "alert_type": random.choice(
                        ["ddos", "unauthorized_access", "resource_abuse"]
                    ),
                    "message": "Real-time security alert detected",
                    "timestamp": timestamp,
                    "source_ip": f"192.168.1.{random.randint(1, 254)}",
                },
            }

        elif topic == "metrics":
            return {
                "type": "system_metrics",
                "data": {
                    "cpu_usage": random.uniform(10, 90),
                    "memory_usage": random.uniform(20, 80),
                    "network_throughput": random.uniform(100, 1000),
                    "active_connections": random.randint(50, 200),
                    "timestamp": timestamp,
                },
            }

        elif topic == "network":
            return {
                "type": "network_traffic",
                "data": {
                    "source_ip": f"10.0.{random.randint(1, 255)}.{random.randint(1, 254)}",
                    "destination_ip": f"10.0.{random.randint(1, 255)}.{random.randint(1, 254)}",
                    "protocol": random.choice(["TCP", "UDP", "HTTP", "HTTPS"]),
                    "bytes_transferred": random.randint(1024, 1024000),
                    "timestamp": timestamp,
                    "status": random.choice(["normal", "suspicious"]),
                },
            }

        elif topic == "resources":
            return {
                "type": "resource_status",
                "data": {
                    "resource_id": f"vm-{random.randint(1000, 9999)}",
                    "resource_type": random.choice(["vm", "container", "database"]),
                    "status": random.choice(["running", "stopped", "error"]),
                    "utilization": random.uniform(0, 100),
                    "timestamp": timestamp,
                },
            }

        return None

    def get_connection_stats(self) -> Dict:
        """Get statistics about active connections"""
        stats = {}
        for topic, connections in self.active_connections.items():
            stats[topic] = len(connections)
        return {
            "topic_connections": stats,
            "total_connections": sum(stats.values()),
            "active_topics": len([t for t, c in self.active_connections.items() if c]),
            "user_sessions": len(self.user_connections),
        }


# Global real-time manager instance
realtime_manager = RealTimeManager()


def get_realtime_manager() -> RealTimeManager:
    """Get the global real-time manager instance"""
    return realtime_manager
