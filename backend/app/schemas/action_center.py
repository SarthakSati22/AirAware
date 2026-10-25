"""
Pydantic Schemas for AirAware Action Center
Community Pollution Reporting, Hotspot Prioritization and Resolution Tracking.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

IncidentCategory = Literal[
    "garbage_burning",
    "construction_dust",
    "industrial_smoke",
    "vehicle_pollution",
    "road_dust",
    "other"
]

ReportStatus = Literal[
    "submitted",
    "under_review",
    "verified",
    "action_assigned",
    "resolved",
    "rejected",
    "duplicate"
]

PriorityLevel = Literal["Low", "Moderate", "High", "Urgent"]

CATEGORY_LABELS: Dict[str, str] = {
    "garbage_burning": "Garbage or Waste Burning",
    "construction_dust": "Construction Dust",
    "industrial_smoke": "Industrial Smoke / Fumes",
    "vehicle_pollution": "Vehicle-Related Pollution",
    "road_dust": "Road Dust",
    "other": "Other Suspected Pollution Source"
}

STATUS_LABELS: Dict[str, str] = {
    "submitted": "Submitted (Unverified)",
    "under_review": "Under Review",
    "verified": "Verified Incident",
    "action_assigned": "Action Assigned",
    "resolved": "Resolved & Closed",
    "rejected": "Rejected / Insufficient Evidence",
    "duplicate": "Duplicate Report"
}

class Coordinates(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

class ReportCreate(BaseModel):
    category: IncidentCategory
    description: str = Field(..., min_length=10, max_length=2000)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    location_description: Optional[str] = Field(None, max_length=250)
    city_id: Optional[str] = None
    observed_at: Optional[str] = None
    image_data: Optional[str] = None  # Base64 data URL or secure URI

class NearestStationInfo(BaseModel):
    station_id: Optional[str] = None
    station_name: Optional[str] = None
    city_name: Optional[str] = None
    distance_km: Optional[float] = None
    latest_aqi: Optional[int] = None
    aqi_category: Optional[str] = None
    measurement_timestamp: Optional[str] = None
    correlation_note: str

class PriorityBreakdown(BaseModel):
    score: int
    level: PriorityLevel
    category_factor: float
    ambient_aqi_factor: float
    cluster_density_factor: float
    recency_factor: float
    algorithm_version: str = "v1.0-explainable"
    explanation: str

class ReportStatusHistoryItem(BaseModel):
    previous_status: Optional[str] = None
    new_status: str
    changed_at: str
    actor: str
    note: Optional[str] = None

class ReportActionItem(BaseModel):
    action_id: str
    report_id: str
    recommended_action: str
    assigned_agency: str
    action_status: str
    created_at: str
    due_date: Optional[str] = None
    completed_at: Optional[str] = None
    outcome_notes: Optional[str] = None

class ReportResponse(BaseModel):
    report_id: str
    category: IncidentCategory
    category_label: str
    description: str
    latitude: float
    longitude: float
    location_description: Optional[str] = None
    city_id: Optional[str] = None
    observed_at: str
    created_at: str
    image_data: Optional[str] = None
    status: ReportStatus
    status_label: str
    priority_score: int
    priority_level: PriorityLevel
    priority_breakdown: PriorityBreakdown
    nearest_station: NearestStationInfo
    assigned_reviewer: Optional[str] = None
    resolution_details: Optional[str] = None
    history: List[ReportStatusHistoryItem] = []
    actions: List[ReportActionItem] = []

class ReportStatusUpdate(BaseModel):
    new_status: ReportStatus
    reason_or_note: str = Field(..., min_length=3, max_length=1000)
    assigned_reviewer: Optional[str] = None
    resolution_details: Optional[str] = None

class ReportActionCreate(BaseModel):
    recommended_action: str = Field(..., min_length=5, max_length=500)
    assigned_agency: str = Field(..., min_length=3, max_length=100)
    due_date: Optional[str] = None
    notes: Optional[str] = None

class AdminAuthRequest(BaseModel):
    admin_token: str

class ActionCenterAnalytics(BaseModel):
    total_reports: int
    status_breakdown: Dict[str, int]
    category_breakdown: Dict[str, int]
    priority_breakdown: Dict[str, int]
    average_resolution_time_hours: Optional[float] = None
    verification_rate_pct: float
    resolution_rate_pct: float
    hotspot_clusters: List[Dict[str, Any]]
    monitoring_blind_spots: List[Dict[str, Any]]
