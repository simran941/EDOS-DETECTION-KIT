"""
Network Traffic API for 3D Globe visualization
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any
from datetime import datetime, timedelta
import random
import uuid
from ..api.supabase_auth import get_current_user

router = APIRouter()

# Global locations for network traffic
LOCATIONS = [
    {"name": "New York", "lat": 40.7128, "lng": -74.0060, "country": "US"},
    {"name": "London", "lat": 51.5074, "lng": -0.1278, "country": "GB"},
    {"name": "Tokyo", "lat": 35.6762, "lng": 139.6503, "country": "JP"},
    {"name": "Beijing", "lat": 39.9042, "lng": 116.4074, "country": "CN"},
    {"name": "Moscow", "lat": 55.7558, "lng": 37.6176, "country": "RU"},
    {"name": "Sydney", "lat": -33.8688, "lng": 151.2093, "country": "AU"},
    {"name": "São Paulo", "lat": -23.5505, "lng": -46.6333, "country": "BR"},
    {"name": "Mumbai", "lat": 19.0760, "lng": 72.8777, "country": "IN"},
    {"name": "Berlin", "lat": 52.5200, "lng": 13.4050, "country": "DE"},
    {"name": "Dubai", "lat": 25.2048, "lng": 55.2708, "country": "AE"},
    {"name": "Singapore", "lat": 1.3521, "lng": 103.8198, "country": "SG"},
    {"name": "Toronto", "lat": 43.6532, "lng": -79.3832, "country": "CA"},
    {"name": "Paris", "lat": 48.8566, "lng": 2.3522, "country": "FR"},
    {"name": "Los Angeles", "lat": 34.0522, "lng": -118.2437, "country": "US"},
    {"name": "Seoul", "lat": 37.5665, "lng": 126.9780, "country": "KR"},
]

# Current network state
current_arcs = []
current_points = []


def generate_network_arc():
    """Generate a single network arc"""
    start_loc = random.choice(LOCATIONS)
    end_loc = random.choice(LOCATIONS)

    while start_loc == end_loc:
        end_loc = random.choice(LOCATIONS)

    is_attack = random.random() < 0.3  # 30% chance of attack

    attack_types = ["ddos", "brute_force", "malware", "sql_injection", "xss"]
    safe_types = ["api_request", "file_transfer", "database_query", "cdn_request"]

    return {
        "id": str(uuid.uuid4()),
        "startLat": start_loc["lat"],
        "startLng": start_loc["lng"],
        "endLat": end_loc["lat"],
        "endLng": end_loc["lng"],
        "isAttack": is_attack,
        "label": f"{random.choice(attack_types if is_attack else safe_types).replace('_', ' ').title()} - {start_loc['name']} → {end_loc['name']}",
        "color": "#ef4444" if is_attack else "#22c55e",
        "timestamp": datetime.utcnow().isoformat(),
        "attack_type": random.choice(attack_types) if is_attack else "normal",
        "data_size": (
            f"{random.randint(1, 500)}KB"
            if not is_attack
            else f"{random.randint(1, 50)}MB"
        ),
        "duration": random.randint(1, 120),
        "source_country": start_loc["country"],
        "dest_country": end_loc["country"],
    }


def generate_threat_point():
    """Generate a threat monitoring point"""
    loc = random.choice(LOCATIONS)
    is_threat = random.random() < 0.25  # 25% chance of being a threat source

    return {
        "lat": loc["lat"],
        "lng": loc["lng"],
        "label": f"{loc['name']} - {'Threat Source' if is_threat else 'Monitoring Station'}",
        "isAttack": is_threat,
        "color": "#ef4444" if is_threat else "#22c55e",
        "size": random.uniform(0.5, 1.2),
        "city": loc["name"],
        "country": loc["country"],
        "connections": random.randint(50, 500),
        "status": "threat" if is_threat else "monitoring",
        "threat_level": (
            random.choice(["HIGH", "MEDIUM", "LOW"]) if is_threat else "SAFE"
        ),
    }


# Initialize with some data
for _ in range(10):
    current_arcs.append(generate_network_arc())
for _ in range(len(LOCATIONS)):
    current_points.append(generate_threat_point())


@router.get("/traffic/real-time")
async def get_real_time_traffic(current_user=Depends(get_current_user)):
    """Get current real-time network traffic for 3D globe"""
    # Keep only recent arcs (last 30)
    global current_arcs
    current_arcs = current_arcs[-30:]

    return {
        "arcs": current_arcs,
        "points": current_points,
        "timestamp": datetime.utcnow().isoformat(),
        "total_connections": len(current_arcs),
        "active_threats": len([p for p in current_points if p["isAttack"]]),
        "monitoring_stations": len([p for p in current_points if not p["isAttack"]]),
    }


@router.get("/threats/locations")
async def get_threat_locations(current_user=Depends(get_current_user)):
    """Get all known threat source locations"""
    threat_locations = [p for p in current_points if p["isAttack"]]

    return {
        "threat_sources": threat_locations,
        "total_threats": len(threat_locations),
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/connections/active")
async def get_active_connections(current_user=Depends(get_current_user)):
    """Get currently active network connections"""
    # Filter to recent connections (last 5 minutes)
    cutoff = datetime.utcnow() - timedelta(minutes=5)

    active_connections = []
    for arc in current_arcs:
        arc_time = datetime.fromisoformat(arc["timestamp"].replace("Z", "+00:00"))
        if arc_time > cutoff:
            active_connections.append(arc)

    return {
        "active_connections": active_connections,
        "count": len(active_connections),
        "attack_connections": len([c for c in active_connections if c["isAttack"]]),
        "safe_connections": len([c for c in active_connections if not c["isAttack"]]),
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/stats")
async def get_network_stats(current_user=Depends(get_current_user)):
    """Get network statistics for dashboard"""
    total_connections = len(current_arcs)
    attack_connections = len([a for a in current_arcs if a["isAttack"]])
    safe_connections = total_connections - attack_connections

    # Calculate stats by country
    country_stats = {}
    for arc in current_arcs:
        source_country = arc["source_country"]
        dest_country = arc["dest_country"]

        if source_country not in country_stats:
            country_stats[source_country] = {"outgoing": 0, "incoming": 0, "attacks": 0}
        if dest_country not in country_stats:
            country_stats[dest_country] = {"outgoing": 0, "incoming": 0, "attacks": 0}

        country_stats[source_country]["outgoing"] += 1
        country_stats[dest_country]["incoming"] += 1

        if arc["isAttack"]:
            country_stats[source_country]["attacks"] += 1

    return {
        "total_connections": total_connections,
        "attack_connections": attack_connections,
        "safe_connections": safe_connections,
        "attack_percentage": (
            (attack_connections / total_connections * 100)
            if total_connections > 0
            else 0
        ),
        "monitored_regions": len(LOCATIONS),
        "active_threats": len([p for p in current_points if p["isAttack"]]),
        "monitoring_stations": len([p for p in current_points if not p["isAttack"]]),
        "country_statistics": country_stats,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/traffic")
async def add_network_traffic(
    traffic_data: dict, current_user=Depends(get_current_user)
):
    """Manually add network traffic (for testing)"""
    global current_arcs

    new_arc = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        **traffic_data,
    }

    current_arcs.append(new_arc)

    # Keep only last 100 arcs
    current_arcs = current_arcs[-100:]

    return {"status": "traffic_added", "id": new_arc["id"]}


@router.get("/locations")
async def get_all_locations():
    """Get all available monitoring locations"""
    return {
        "locations": LOCATIONS,
        "total_locations": len(LOCATIONS),
        "timestamp": datetime.utcnow().isoformat(),
    }
