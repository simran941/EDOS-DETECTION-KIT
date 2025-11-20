"""
Settings Management API
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from datetime import datetime
from ..api.supabase_auth import get_current_user

router = APIRouter()

# Default settings configuration
DEFAULT_SETTINGS = {
    "security": {
        "auth_timeout": 30,
        "max_failed_logins": 5,
        "two_factor_auth": True,
        "auto_security_scans": True,
        "real_time_threat_detection": True,
        "password_complexity": True,
        "session_timeout": 60,
        "ip_whitelist": ["192.168.1.0/24", "10.0.0.0/8"],
    },
    "alerts": {
        "threshold_level": "medium",
        "email_notifications": True,
        "sms_notifications": False,
        "push_notifications": True,
        "alert_retention": 90,
        "auto_acknowledge": False,
        "escalation_timeout": 30,
        "notification_delay": 0,
    },
    "system": {
        "theme": "dark",
        "refresh_interval": 5,
        "auto_save": True,
        "performance_mode": "high",
        "logging_level": "info",
        "backup_retention": 30,
        "maintenance_window": "02:00-04:00",
    },
    "network": {
        "api_endpoint": "https://api.edos-security.com",
        "connection_timeout": 5000,
        "ssl_verification": True,
        "vpn_connection": True,
        "bandwidth_limit": 1000,
        "retry_attempts": 3,
        "keepalive_interval": 30,
    },
    "monitoring": {
        "metrics_retention": 365,
        "real_time_updates": True,
        "data_sampling_rate": 60,
        "alert_aggregation": True,
        "performance_tracking": True,
        "resource_monitoring": True,
    },
}

# Current settings (starts with defaults)
current_settings = DEFAULT_SETTINGS.copy()


@router.get("/")
async def get_all_settings(current_user: str = Depends(get_current_user)):
    """Get all system settings"""
    return {
        "settings": current_settings,
        "last_updated": datetime.utcnow().isoformat(),
        "updated_by": current_user,
    }


@router.get("/security")
async def get_security_settings(current_user: str = Depends(get_current_user)):
    """Get security settings"""
    return {
        "security": current_settings["security"],
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/alerts")
async def get_alert_settings(current_user: str = Depends(get_current_user)):
    """Get alert settings"""
    return {
        "alerts": current_settings["alerts"],
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/system")
async def get_system_settings(current_user: str = Depends(get_current_user)):
    """Get system settings"""
    return {
        "system": current_settings["system"],
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/network")
async def get_network_settings(current_user: str = Depends(get_current_user)):
    """Get network settings"""
    return {
        "network": current_settings["network"],
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.put("/")
async def update_all_settings(
    settings_data: Dict[str, Any], current_user: str = Depends(get_current_user)
):
    """Update all settings"""
    global current_settings

    # Validate and update settings
    for section, values in settings_data.items():
        if section in current_settings:
            if isinstance(values, dict):
                current_settings[section].update(values)
            else:
                current_settings[section] = values

    return {
        "status": "settings_updated",
        "settings": current_settings,
        "updated_by": current_user,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.put("/security")
async def update_security_settings(
    security_data: Dict[str, Any], current_user: str = Depends(get_current_user)
):
    """Update security settings"""
    global current_settings
    current_settings["security"].update(security_data)

    return {
        "status": "security_settings_updated",
        "security": current_settings["security"],
        "updated_by": current_user,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.put("/alerts")
async def update_alert_settings(
    alerts_data: Dict[str, Any], current_user: str = Depends(get_current_user)
):
    """Update alert settings"""
    global current_settings
    current_settings["alerts"].update(alerts_data)

    return {
        "status": "alert_settings_updated",
        "alerts": current_settings["alerts"],
        "updated_by": current_user,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.put("/system")
async def update_system_settings(
    system_data: Dict[str, Any], current_user: str = Depends(get_current_user)
):
    """Update system settings"""
    global current_settings
    current_settings["system"].update(system_data)

    return {
        "status": "system_settings_updated",
        "system": current_settings["system"],
        "updated_by": current_user,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.put("/network")
async def update_network_settings(
    network_data: Dict[str, Any], current_user: str = Depends(get_current_user)
):
    """Update network settings"""
    global current_settings
    current_settings["network"].update(network_data)

    return {
        "status": "network_settings_updated",
        "network": current_settings["network"],
        "updated_by": current_user,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/reset")
async def reset_settings_to_defaults(current_user: str = Depends(get_current_user)):
    """Reset all settings to default values"""
    global current_settings
    current_settings = DEFAULT_SETTINGS.copy()

    return {
        "status": "settings_reset_to_defaults",
        "settings": current_settings,
        "reset_by": current_user,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/reset/{section}")
async def reset_section_to_defaults(
    section: str, current_user: str = Depends(get_current_user)
):
    """Reset specific settings section to defaults"""
    global current_settings

    if section not in DEFAULT_SETTINGS:
        raise HTTPException(
            status_code=404, detail=f"Settings section '{section}' not found"
        )

    current_settings[section] = DEFAULT_SETTINGS[section].copy()

    return {
        "status": f"{section}_settings_reset_to_defaults",
        section: current_settings[section],
        "reset_by": current_user,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/schema")
async def get_settings_schema():
    """Get the settings schema/structure"""
    return {
        "schema": {
            "security": {
                "description": "Security and authentication settings",
                "fields": {
                    "auth_timeout": {
                        "type": "integer",
                        "min": 5,
                        "max": 120,
                        "description": "Authentication timeout in minutes",
                    },
                    "max_failed_logins": {
                        "type": "integer",
                        "min": 3,
                        "max": 10,
                        "description": "Maximum failed login attempts",
                    },
                    "two_factor_auth": {
                        "type": "boolean",
                        "description": "Enable two-factor authentication",
                    },
                    "auto_security_scans": {
                        "type": "boolean",
                        "description": "Enable automatic security scans",
                    },
                    "real_time_threat_detection": {
                        "type": "boolean",
                        "description": "Enable real-time threat detection",
                    },
                },
            },
            "alerts": {
                "description": "Alert and notification settings",
                "fields": {
                    "threshold_level": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "Alert threshold level",
                    },
                    "email_notifications": {
                        "type": "boolean",
                        "description": "Enable email notifications",
                    },
                    "sms_notifications": {
                        "type": "boolean",
                        "description": "Enable SMS notifications",
                    },
                    "alert_retention": {
                        "type": "integer",
                        "min": 7,
                        "max": 365,
                        "description": "Alert retention in days",
                    },
                },
            },
            "system": {
                "description": "System and interface settings",
                "fields": {
                    "theme": {
                        "type": "string",
                        "enum": ["light", "dark"],
                        "description": "UI theme",
                    },
                    "refresh_interval": {
                        "type": "integer",
                        "min": 1,
                        "max": 60,
                        "description": "Auto-refresh interval in seconds",
                    },
                    "performance_mode": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "Performance mode",
                    },
                },
            },
            "network": {
                "description": "Network and connectivity settings",
                "fields": {
                    "api_endpoint": {
                        "type": "string",
                        "description": "API endpoint URL",
                    },
                    "connection_timeout": {
                        "type": "integer",
                        "min": 1000,
                        "max": 30000,
                        "description": "Connection timeout in milliseconds",
                    },
                    "ssl_verification": {
                        "type": "boolean",
                        "description": "Enable SSL certificate verification",
                    },
                },
            },
        },
        "timestamp": datetime.utcnow().isoformat(),
    }
