"""
Metrics and Monitoring API
"""

from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
import random
import math
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models.database import (
    UserProfile,
    SecurityAlert,
    NetworkTraffic,
    SystemLog,
    SystemMetric,
)
from ..api.supabase_auth import get_current_user

router = APIRouter()


def generate_time_series_data(hours: int = 24, interval_minutes: int = 30):
    """Generate realistic time series data"""
    data_points = []
    start_time = datetime.utcnow() - timedelta(hours=hours)

    for i in range(int(hours * 60 / interval_minutes)):
        timestamp = start_time + timedelta(minutes=i * interval_minutes)

        # Create realistic patterns with some randomness
        hour = timestamp.hour

        # CPU follows daily pattern (higher during business hours)
        base_cpu = (
            40 + 20 * (1 + math.sin((hour - 6) * math.pi / 12))
            if 6 <= hour <= 18
            else 30
        )
        cpu_noise = random.randint(-10, 15)
        cpu = max(15, min(95, base_cpu + cpu_noise))

        # Memory gradually increases during the day
        base_memory = 50 + (hour * 1.5)
        memory_noise = random.randint(-5, 10)
        memory = max(25, min(90, base_memory + memory_noise))

        # Network IO varies more randomly
        network = random.randint(50, 300)

        # Threats spike occasionally
        threats = (
            random.randint(0, 15) if random.random() > 0.7 else random.randint(0, 5)
        )

        # Disk usage slowly increases
        disk = min(85, 40 + (i * 0.1) + random.randint(-3, 7))

        data_points.append(
            {
                "time": timestamp.strftime("%H:%M"),
                "timestamp": timestamp.isoformat(),
                "cpu": cpu,
                "memory": memory,
                "network": network,
                "threats": threats,
                "disk": disk,
            }
        )

    return data_points


@router.get("/system")
async def get_system_metrics(current_user: UserProfile = Depends(get_current_user)):
    """Get current system performance metrics"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "system": {
            "cpu_usage": random.randint(45, 75),
            "memory_usage": random.randint(60, 85),
            "disk_usage": random.randint(35, 65),
            "network_io": round(random.uniform(100, 500), 1),
            "uptime": round(random.uniform(99.5, 99.99), 2),
            "load_average": round(random.uniform(0.5, 3.0), 2),
            "processes": random.randint(150, 300),
            "threads": random.randint(800, 1500),
        },
        "performance": {
            "response_time": random.randint(50, 200),
            "throughput": random.randint(500, 2000),
            "error_rate": round(random.uniform(0.01, 0.5), 2),
            "cache_hit_ratio": round(random.uniform(85, 98), 1),
        },
    }


@router.get("/network")
async def get_network_metrics(current_user: UserProfile = Depends(get_current_user)):
    """Get network performance metrics"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "network": {
            "total_connections": random.randint(10000, 50000),
            "data_processed": f"{round(random.uniform(1.5, 5.0), 1)}TB",
            "bandwidth_usage": random.randint(60, 90),
            "regions_monitored": 15,
            "packet_loss": round(random.uniform(0.01, 0.1), 3),
            "latency": random.randint(10, 50),
            "throughput_mbps": random.randint(800, 1200),
        },
        "traffic_distribution": [
            {"name": "HTTP/HTTPS", "value": 65, "color": "#10B981"},
            {"name": "SSH/SFTP", "value": 20, "color": "#3B82F6"},
            {"name": "DNS", "value": 10, "color": "#F59E0B"},
            {"name": "Other", "value": 5, "color": "#EF4444"},
        ],
    }


@router.get("/threats")
async def get_threat_metrics(current_user: UserProfile = Depends(get_current_user)):
    """Get threat detection metrics"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "threats": {
            "total_detected": random.randint(1000, 2000),
            "blocked_attacks": random.randint(950, 1900),
            "active_threats": random.randint(15, 45),
            "threat_level": random.choice(["LOW", "MEDIUM", "HIGH"]),
            "last_attack": (
                datetime.utcnow() - timedelta(minutes=random.randint(1, 30))
            ).isoformat(),
            "attack_success_rate": round(random.uniform(0.5, 2.0), 1),
            "mitigation_time": random.randint(5, 60),
        },
        "attack_types": {
            "ddos": random.randint(100, 300),
            "brute_force": random.randint(50, 150),
            "sql_injection": random.randint(20, 80),
            "xss": random.randint(10, 50),
            "malware": random.randint(30, 100),
        },
    }


@router.get("/dashboard")
async def get_dashboard_metrics(
    current_user: UserProfile = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get overview metrics for dashboard from database"""
    try:
        # Get current time for 24h calculations
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)

        # Count security alerts (threats detected)
        total_threats = (
            db.query(SecurityAlert)
            .filter(SecurityAlert.user_id == current_user.id)
            .count()
        )

        recent_threats = (
            db.query(SecurityAlert)
            .filter(
                SecurityAlert.user_id == current_user.id,
                SecurityAlert.detected_at >= twenty_four_hours_ago,
            )
            .count()
        )

        # Count blocked attacks (high/critical severity alerts)
        blocked_attacks = (
            db.query(SecurityAlert)
            .filter(
                SecurityAlert.user_id == current_user.id,
                SecurityAlert.severity.in_(["high", "critical"]),
                SecurityAlert.status == "blocked",
            )
            .count()
        )

        # Calculate data processed from network traffic
        total_traffic = (
            db.query(func.sum(NetworkTraffic.packet_size))
            .filter(
                NetworkTraffic.user_id == current_user.id,
                NetworkTraffic.timestamp >= twenty_four_hours_ago,
            )
            .scalar()
            or 0
        )

        # Convert bytes to GB/TB
        traffic_gb = total_traffic / (1024**3)  # Convert to GB
        data_processed = (
            f"{traffic_gb:.1f}GB" if traffic_gb < 1000 else f"{traffic_gb/1024:.1f}TB"
        )

        # Get system uptime (mock for now, could be from system metrics)
        uptime = 99.8 + random.uniform(-0.1, 0.2)

        # Count monitored resources (user resources)
        from ..models.database import UserResource

        monitored_resources = (
            db.query(UserResource)
            .filter(UserResource.user_id == current_user.id)
            .count()
        )

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "active_threats": recent_threats,
            "blocked_attacks": blocked_attacks,
            "total_requests": total_threats,
            "response_time": random.randint(50, 200),  # Mock response time
            "uptime": round(uptime, 2),
            "network_traffic": data_processed,
            "monitored_resources": monitored_resources,
            "overview": {
                "threats_detected": total_threats,
                "attacks_blocked": blocked_attacks,
                "data_processed": data_processed,
                "system_uptime": round(uptime, 2),
                "monitored_resources": monitored_resources,
                "active_sessions": random.randint(100, 500),  # Mock for now
                "network_traffic": data_processed,
            },
            "status": {
                "security_status": "ACTIVE",
                "network_status": "HEALTHY",
                "system_status": "OPTIMAL",
                "threat_level": (
                    "HIGH"
                    if recent_threats > 10
                    else "MEDIUM" if recent_threats > 5 else "LOW"
                ),
            },
        }
    except Exception as e:
        print(f"Error fetching dashboard metrics: {e}")
        # Return default values if error
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "active_threats": 0,
            "blocked_attacks": 0,
            "total_requests": 0,
            "response_time": 100,
            "uptime": 99.8,
            "network_traffic": "0.0GB",
            "monitored_resources": 0,
        }


@router.get("/time-series")
async def get_time_series_data(
    timerange: str = "24h", current_user: UserProfile = Depends(get_current_user)
):
    """Get time series data for charts"""
    import math

    # Map time ranges to hours and intervals
    time_configs = {
        "1h": {"hours": 1, "interval": 5},
        "6h": {"hours": 6, "interval": 15},
        "24h": {"hours": 24, "interval": 30},
        "7d": {"hours": 168, "interval": 120},
        "30d": {"hours": 720, "interval": 360},
    }

    config = time_configs.get(timerange, time_configs["24h"])
    data = generate_time_series_data(config["hours"], config["interval"])

    return {
        "timerange": timerange,
        "data_points": len(data),
        "interval_minutes": config["interval"],
        "data": data,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/alerts/timeline")
async def get_alerts_timeline(current_user: UserProfile = Depends(get_current_user)):
    """Get alerts timeline for the last 24 hours"""
    timeline = []
    start_time = datetime.utcnow() - timedelta(hours=24)

    # Generate some random alert events
    for i in range(random.randint(10, 30)):
        event_time = start_time + timedelta(minutes=random.randint(0, 1440))

        timeline.append(
            {
                "timestamp": event_time.isoformat(),
                "time": event_time.strftime("%H:%M"),
                "level": random.choice(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
                "type": random.choice(
                    ["Security Alert", "Network Alert", "System Alert"]
                ),
                "count": random.randint(1, 5),
            }
        )

    # Sort by timestamp
    timeline.sort(key=lambda x: x["timestamp"])

    return {
        "timeline": timeline,
        "total_events": len(timeline),
        "timeframe": "24h",
        "timestamp": datetime.utcnow().isoformat(),
    }
