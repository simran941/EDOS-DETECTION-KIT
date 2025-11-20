"""
Cloud Resources Management API - Clean Version
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models.database import UserProfile, UserResource, CloudProvider, ResourceType
from ..api.supabase_auth import get_current_user
import random

router = APIRouter()


class ResourceCreate(BaseModel):
    name: str
    resource_type_id: str
    cloud_provider_id: str
    region: str
    instance_type: Optional[str] = "t3.medium"
    os_type: Optional[str] = "ubuntu"
    tags: Optional[dict] = {}


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    instance_type: Optional[str] = None
    tags: Optional[dict] = None
    status: Optional[str] = None


@router.get("/providers")
async def get_cloud_providers(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get available cloud providers"""
    providers = db.query(CloudProvider).all()
    return [
        {"id": str(p.id), "name": p.name, "display_name": p.display_name}
        for p in providers
    ]


@router.get("/types")
async def get_resource_types(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get available resource types"""
    types = db.query(ResourceType).all()
    return [
        {
            "id": str(t.id),
            "name": t.name,
            "display_name": t.display_name,
            "category": t.category,
        }
        for t in types
    ]


@router.get("/")
async def get_resources(
    search: Optional[str] = Query(
        None, description="Search resources by name, type, or OS"
    ),
    status: Optional[str] = Query(None, description="Filter by status"),
    health: Optional[str] = Query(None, description="Filter by health status"),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all cloud resources with optional filtering from database"""
    try:
        # Query user's resources
        query = db.query(UserResource).filter(UserResource.user_id == current_user.id)

        # Apply filters
        if search:
            query = query.filter(UserResource.name.contains(search))
        if status:
            query = query.filter(UserResource.status == status)

        resources = query.all()

        # Convert to response format
        result = []
        for resource in resources:
            # Generate mock metrics for now (could be from separate metrics table)
            result.append(
                {
                    "id": str(resource.id),
                    "name": resource.name,
                    "type": (
                        resource.resource_type.name
                        if resource.resource_type
                        else "Unknown"
                    ),
                    "os": resource.os_type or "ubuntu",
                    "status": resource.status,
                    "health": "healthy" if resource.status == "active" else "warning",
                    "cpu": random.randint(20, 80),  # Mock CPU usage
                    "memory": random.randint(30, 90),  # Mock memory usage
                    "disk": random.randint(40, 85),  # Mock disk usage
                    "region": resource.region,
                    "uptime": "45d 12h",  # Mock uptime
                    "instance_size": resource.instance_type or "t3.medium",
                    "created_at": resource.created_at.isoformat(),
                }
            )

        return result

    except Exception as e:
        print(f"Error fetching resources: {e}")
        return []


@router.post("/")
async def create_resource(
    resource: ResourceCreate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new cloud resource"""
    try:
        # Check if cloud provider exists
        cloud_provider = (
            db.query(CloudProvider)
            .filter(CloudProvider.id == resource.cloud_provider_id)
            .first()
        )

        if not cloud_provider:
            raise HTTPException(status_code=404, detail="Cloud provider not found")

        # Check if resource type exists
        resource_type = (
            db.query(ResourceType)
            .filter(ResourceType.id == resource.resource_type_id)
            .first()
        )

        if not resource_type:
            raise HTTPException(status_code=404, detail="Resource type not found")

        # Create new resource
        new_resource = UserResource(
            user_id=current_user.id,
            resource_type_id=resource.resource_type_id,
            resource_id=f"{resource.name}-{uuid.uuid4().hex[:8]}",  # Generate unique resource ID
            name=resource.name,
            region=resource.region,
            instance_type=resource.instance_type,
            os_type=resource.os_type,
            status="active",
            tags=resource.tags or {},
        )

        db.add(new_resource)
        db.commit()
        db.refresh(new_resource)

        return {
            "id": new_resource.id,
            "name": new_resource.name,
            "status": new_resource.status,
            "message": "Resource created successfully",
        }

    except Exception as e:
        db.rollback()
        print(f"Error creating resource: {e}")
        raise HTTPException(status_code=500, detail="Failed to create resource")


@router.get("/{resource_id}")
async def get_resource(
    resource_id: str,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific resource"""
    resource = (
        db.query(UserResource)
        .filter(UserResource.id == resource_id, UserResource.user_id == current_user.id)
        .first()
    )

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    return {
        "id": str(resource.id),
        "name": resource.name,
        "type": resource.resource_type.name if resource.resource_type else "Unknown",
        "status": resource.status,
        "region": resource.region,
        "instance_type": resource.instance_type,
        "os_type": resource.os_type,
        "tags": resource.tags,
        "created_at": resource.created_at.isoformat(),
    }


@router.put("/{resource_id}")
async def update_resource(
    resource_id: str,
    resource_data: ResourceUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a resource"""
    resource = (
        db.query(UserResource)
        .filter(UserResource.id == resource_id, UserResource.user_id == current_user.id)
        .first()
    )

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Update fields
    if resource_data.name:
        resource.name = resource_data.name
    if resource_data.instance_type:
        resource.instance_type = resource_data.instance_type
    if resource_data.tags is not None:
        resource.tags = resource_data.tags
    if resource_data.status:
        resource.status = resource_data.status

    db.commit()
    return {"message": "Resource updated successfully"}


@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: str,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a resource"""
    resource = (
        db.query(UserResource)
        .filter(UserResource.id == resource_id, UserResource.user_id == current_user.id)
        .first()
    )

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    db.delete(resource)
    db.commit()
    return {"message": "Resource deleted successfully"}


@router.get("/stats/summary")
async def get_resource_stats(
    current_user: UserProfile = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get resource statistics"""
    total = (
        db.query(UserResource).filter(UserResource.user_id == current_user.id).count()
    )
    running = (
        db.query(UserResource)
        .filter(
            UserResource.user_id == current_user.id, UserResource.status == "active"
        )
        .count()
    )

    return {
        "total_resources": total,
        "running_resources": running,
        "stopped_resources": total - running,
        "resource_types": {},  # Could be populated with type counts
    }
