"""
AirAware Action Center API Endpoints
Citizen Pollution Reporting, Data-Driven Hotspot Prioritization,
Nearby CPCB Station Correlation, Administrative Triage, and BDA Resolution Analytics.
"""

import io
import csv
import math
import random
import json
import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Query, HTTPException, Header, Response, Depends
from pydantic import BaseModel

from app.database import get_database
from app.config import settings
from app.schemas.action_center import (
    ReportCreate,
    ReportResponse,
    ReportStatusUpdate,
    ReportActionCreate,
    ActionCenterAnalytics,
    AdminAuthRequest,
    CATEGORY_LABELS,
    STATUS_LABELS,
    PriorityLevel
)

router = APIRouter(prefix="/api/action-center", tags=["AirAware Action Center"])

ADMIN_SECRET = os.getenv("ADMIN_SECRET_KEY", "airaware-admin-2026")

def verify_admin_token(x_admin_token: Optional[str] = Header(None)) -> bool:
    """Verifies authorized administrative credentials."""
    if not x_admin_token or x_admin_token.strip() != ADMIN_SECRET:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Administrative access token is invalid or missing."
        )
    return True

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two geographic coordinates in kilometers."""
    r = 6371.0  # Earth's radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 2)

def find_nearest_cpcb_station(lat: float, lon: float) -> Dict[str, Any]:
    """Finds nearest verified CPCB monitoring station and retrieves latest ambient readings."""
    db = get_database()
    stations = list(db.monitoring_stations.find({}))

    if not stations and os.path.exists(settings.STATIONS_JSON):
        with open(settings.STATIONS_JSON, "r", encoding="utf-8") as f:
            stations = json.load(f)

    if not stations:
        return {
            "station_id": None,
            "station_name": None,
            "city_name": None,
            "distance_km": None,
            "latest_aqi": None,
            "aqi_category": None,
            "measurement_timestamp": None,
            "correlation_note": "No monitoring stations registered in database."
        }

    nearest = None
    min_dist = float("inf")
    for s in stations:
        s_lat = float(s.get("latitude", 0.0))
        s_lon = float(s.get("longitude", 0.0))
        dist = haversine_distance_km(lat, lon, s_lat, s_lon)
        if dist < min_dist:
            min_dist = dist
            nearest = s

    # Retrieve latest reading for nearest station
    latest_reading = None
    if nearest:
        latest_reading = db.air_quality_readings.find_one(
            {"station_id": nearest.get("station_id")},
            sort=[("timestamp", -1)]
        )

    st_id = nearest.get("station_id") if nearest else None
    st_name = nearest.get("station_name") if nearest else None
    city_name = nearest.get("city_name") if nearest else None
    aqi_val = int(latest_reading["aqi"]) if latest_reading else None
    aqi_cat = latest_reading.get("aqi_category", "Unknown") if latest_reading else None
    ts = latest_reading.get("timestamp") if latest_reading else datetime.utcnow().isoformat()

    if min_dist <= 15.0:
        correlation_note = (
            f"Nearest station '{st_name}' ({min_dist} km away) recently recorded an ambient AQI of {aqi_val or 'N/A'} "
            f"({aqi_cat or 'N/A'}). Regional ambient sensors measure atmospheric background dispersion, so localized ground emissions "
            f"can result in concentrated exposure exceeding station readings."
        )
    else:
        correlation_note = (
            f"Nearest CPCB station '{st_name}' is {min_dist} km away (outside the 15 km proximity envelope). "
            f"This location represents a potential monitoring coverage blind spot where community reporting is critical."
        )

    return {
        "station_id": st_id,
        "station_name": st_name,
        "city_name": city_name,
        "distance_km": min_dist,
        "latest_aqi": aqi_val,
        "aqi_category": aqi_cat,
        "measurement_timestamp": ts,
        "correlation_note": correlation_note
    }

def calculate_priority_score(
    category: str,
    nearest_station: Dict[str, Any],
    lat: float,
    lon: float,
    observed_at_str: str
) -> Dict[str, Any]:
    """
    Computes transparent, explainable 0-100 priority score:
    P = 0.25 * S_cat + 0.35 * S_aqi + 0.25 * S_clust + 0.15 * S_rec
    Missing data is NEVER penalized as zero pollution (provisional default 50).
    """
    db = get_database()

    # 1. Category Inherent Risk Factor (25% weight)
    cat_weights = {
        "industrial_smoke": 100.0,
        "garbage_burning": 85.0,
        "construction_dust": 65.0,
        "vehicle_pollution": 50.0,
        "road_dust": 40.0,
        "other": 35.0
    }
    s_cat = cat_weights.get(category, 40.0)

    # 2. Ambient AQI Context Factor (35% weight)
    station_aqi = nearest_station.get("latest_aqi")
    dist_km = nearest_station.get("distance_km")

    if station_aqi is not None and dist_km is not None and dist_km <= 15.0:
        s_aqi = min(100.0, (float(station_aqi) / 500.0) * 100.0)
    else:
        # Documented requirement: Missing measurements must not be treated as zero!
        s_aqi = 50.0  # Neutral provisional score

    # 3. Cluster Density Factor (25% weight)
    # Count independent reports in a 3 km radius within the last 7 days
    seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
    recent_reports = list(db.pollution_reports.find(
        {"created_at": {"$gte": seven_days_ago}},
        {"latitude": 1, "longitude": 1}
    ))

    nearby_cluster_count = 0
    for r in recent_reports:
        r_lat = r.get("latitude")
        r_lon = r.get("longitude")
        if r_lat is not None and r_lon is not None:
            if haversine_distance_km(lat, lon, r_lat, r_lon) <= 3.0:
                nearby_cluster_count += 1

    if nearby_cluster_count >= 4:
        s_clust = 100.0
    elif nearby_cluster_count >= 2:
        s_clust = 60.0
    else:
        s_clust = 20.0

    # 4. Recency Factor (15% weight)
    try:
        obs_dt = datetime.fromisoformat(observed_at_str.replace("Z", "+00:00"))
        now_dt = datetime.utcnow()
        hours_ago = max(0.0, (now_dt - obs_dt.replace(tzinfo=None)).total_seconds() / 3600.0)
        if hours_ago <= 6.0:
            s_rec = 100.0
        elif hours_ago <= 24.0:
            s_rec = 75.0
        elif hours_ago <= 72.0:
            s_rec = 40.0
        else:
            s_rec = 15.0
    except Exception:
        s_rec = 75.0

    # Combined score
    score = int(round(0.25 * s_cat + 0.35 * s_aqi + 0.25 * s_clust + 0.15 * s_rec))
    score = max(5, min(100, score))

    if score >= 75:
        level = "Urgent"
    elif score >= 50:
        level = "High"
    elif score >= 25:
        level = "Moderate"
    else:
        level = "Low"

    explanation = (
        f"Prioritized as {level} ({score}/100) based on category severity ({int(s_cat)}/100, 25% wt), "
        f"ambient AQI context ({int(s_aqi)}/100, 35% wt), cluster density ({nearby_cluster_count} nearby incident(s), 25% wt), "
        f"and reporting recency (15% wt)."
    )

    return {
        "score": score,
        "level": level,
        "category_factor": round(s_cat, 1),
        "ambient_aqi_factor": round(s_aqi, 1),
        "cluster_density_factor": round(s_clust, 1),
        "recency_factor": round(s_rec, 1),
        "algorithm_version": "v1.0-explainable",
        "explanation": explanation
    }

def get_recommended_actions_for_category(category: str) -> List[str]:
    """Provides context-specific suggested remediation actions based on Section 8 guidelines."""
    actions = {
        "garbage_burning": [
            "Dispatch municipal solid waste rapid response patrol for ground verification and immediate extinguishing.",
            "Review local waste collection frequency to eliminate open burning hotspots.",
            "Coordinate with neighborhood ward committee for door-to-door segregated waste enforcement."
        ],
        "construction_dust": [
            "Verify installation of continuous green dust suppression screens (minimum 10m height).",
            "Mandate operational water mist cannons and wheel-washing bays at all site egress points.",
            "Issue stop-work advisory if unpaved earthworks lack active water sprinkling."
        ],
        "industrial_smoke": [
            "Initiate formal stack emission inspection by State Pollution Control Board (SPCB) technical officers.",
            "Audit factory continuous emission monitoring system (CEMS) telemetry and bag filter maintenance logs.",
            "Issue show-cause notice if opacity and particulate limits exceed statutory consents."
        ],
        "road_dust": [
            "Deploy municipal mechanical street vacuum sweepers along the affected arterial corridor.",
            "Implement twice-daily water sprinkling using treated non-potable water tankers.",
            "Inspect unpaved road shoulders and notify public works department for paving."
        ],
        "vehicle_pollution": [
            "Coordinate traffic police deployment for vehicular congestion clearance and idle reduction.",
            "Deploy mobile automated Pollution Under Control (PUC) inspection checkpoints.",
            "Evaluate lane diversion for heavy commercial diesel vehicles during peak inversion hours."
        ],
        "other": [
            "Assign field officer for preliminary environmental survey within 48 hours.",
            "Cross-reference community report with regional satellite fire / thermal anomaly datasets."
        ]
    }
    return actions.get(category, actions["other"])

# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------

@router.post("/reports", response_model=ReportResponse)
def submit_report(payload: ReportCreate):
    """
    Submits a citizen pollution incident report.
    Automatically identifies nearest CPCB station, correlates ambient AQI,
    computes an explainable priority score, and returns unique reference code.
    """
    db = get_database()

    # Generate unique human-readable report ID
    random_suffix = random.randint(1000, 9999)
    report_id = f"REP-2026-{random_suffix}"
    while db.pollution_reports.find_one({"report_id": report_id}):
        random_suffix = random.randint(1000, 9999)
        report_id = f"REP-2026-{random_suffix}"

    now_iso = datetime.utcnow().isoformat()
    observed_at = payload.observed_at or now_iso

    # Geospatial correlation with nearest monitoring station
    nearest_station = find_nearest_cpcb_station(payload.latitude, payload.longitude)

    # Calculate explainable priority score
    priority_data = calculate_priority_score(
        category=payload.category,
        nearest_station=nearest_station,
        lat=payload.latitude,
        lon=payload.longitude,
        observed_at_str=observed_at
    )

    city_id = payload.city_id or nearest_station.get("station_id", "DEL")[:3] if nearest_station.get("station_id") else "DEL"

    doc = {
        "report_id": report_id,
        "category": payload.category,
        "description": payload.description.strip(),
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "location": {
            "type": "Point",
            "coordinates": [payload.longitude, payload.latitude]
        },
        "location_description": payload.location_description.strip() if payload.location_description else None,
        "city_id": city_id,
        "observed_at": observed_at,
        "created_at": now_iso,
        "image_data": payload.image_data,
        "status": "submitted",
        "priority_score": priority_data["score"],
        "priority_level": priority_data["level"],
        "priority_breakdown": priority_data,
        "nearest_station": nearest_station,
        "assigned_reviewer": None,
        "resolution_details": None,
        "data_provenance": "Citizen Submitted Incident"
    }

    db.pollution_reports.insert_one(doc)

    # Log initial status history
    history_doc = {
        "report_id": report_id,
        "previous_status": None,
        "new_status": "submitted",
        "changed_at": now_iso,
        "actor": "citizen",
        "note": "Incident report registered in Action Center."
    }
    db.report_status_history.insert_one(history_doc)

    return get_report_by_id(report_id)

@router.get("/reports")
def list_reports(
    city_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Lists pollution incident reports with server-side filtering and pagination."""
    db = get_database()
    query: Dict[str, Any] = {}

    if city_id and city_id != "ALL":
        query["city_id"] = city_id
    if category and category != "ALL":
        query["category"] = category
    if status and status != "ALL":
        query["status"] = status
    if priority and priority != "ALL":
        query["priority_level"] = priority
    if search and search.strip():
        term = search.strip()
        query["$or"] = [
            {"report_id": {"$regex": term, "$options": "i"}},
            {"description": {"$regex": term, "$options": "i"}},
            {"location_description": {"$regex": term, "$options": "i"}}
        ]

    total = db.pollution_reports.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.pollution_reports.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)

    reports = []
    for r in cursor:
        r["category_label"] = CATEGORY_LABELS.get(r["category"], r["category"])
        r["status_label"] = STATUS_LABELS.get(r["status"], r["status"])
        reports.append(r)

    return {
        "items": reports,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total > 0 else 1
    }

@router.get("/reports/{report_id}", response_model=ReportResponse)
def get_report_by_id(report_id: str):
    """Retrieves full report details including audit history and assigned remediation actions."""
    db = get_database()
    r = db.pollution_reports.find_one({"report_id": report_id}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail=f"Report with reference '{report_id}' not found.")

    r["category_label"] = CATEGORY_LABELS.get(r["category"], r["category"])
    r["status_label"] = STATUS_LABELS.get(r["status"], r["status"])

    # Load history
    history = list(db.report_status_history.find({"report_id": report_id}, {"_id": 0}).sort("changed_at", 1))
    r["history"] = history

    # Load actions
    actions = list(db.report_actions.find({"report_id": report_id}, {"_id": 0}).sort("created_at", 1))
    r["actions"] = actions

    return r

@router.get("/reports/tracking/{report_id}")
def track_report_public(report_id: str):
    """Public citizen tracking endpoint: verifies reference code and returns current status."""
    return get_report_by_id(report_id)

@router.post("/reports/{report_id}/status", response_model=ReportResponse)
def update_report_status(
    report_id: str,
    payload: ReportStatusUpdate,
    auth: bool = Depends(verify_admin_token)
):
    """
    Administrative Endpoint: Transitions a report through its lifecycle
    (Submitted -> Under Review -> Verified / Rejected / Duplicate -> Action Assigned -> Resolved).
    Records audit provenance in report_status_history.
    """
    db = get_database()
    r = db.pollution_reports.find_one({"report_id": report_id})
    if not r:
        raise HTTPException(status_code=404, detail="Report not found.")

    prev_status = r.get("status", "submitted")
    now_iso = datetime.utcnow().isoformat()

    update_fields: Dict[str, Any] = {
        "status": payload.new_status
    }
    if payload.assigned_reviewer:
        update_fields["assigned_reviewer"] = payload.assigned_reviewer
    if payload.resolution_details:
        update_fields["resolution_details"] = payload.resolution_details

    db.pollution_reports.update_one(
        {"report_id": report_id},
        {"$set": update_fields}
    )

    # Append to status history
    db.report_status_history.insert_one({
        "report_id": report_id,
        "previous_status": prev_status,
        "new_status": payload.new_status,
        "changed_at": now_iso,
        "actor": "admin_reviewer",
        "note": payload.reason_or_note
    })

    return get_report_by_id(report_id)

@router.post("/reports/{report_id}/actions", response_model=ReportResponse)
def assign_report_action(
    report_id: str,
    payload: ReportActionCreate,
    auth: bool = Depends(verify_admin_token)
):
    """
    Administrative Endpoint: Assigns recommended or corrective action to responsible agency.
    """
    db = get_database()
    r = db.pollution_reports.find_one({"report_id": report_id})
    if not r:
        raise HTTPException(status_code=404, detail="Report not found.")

    now_iso = datetime.utcnow().isoformat()
    action_id = f"ACT-2026-{random.randint(100, 999)}"

    action_doc = {
        "action_id": action_id,
        "report_id": report_id,
        "recommended_action": payload.recommended_action,
        "assigned_agency": payload.assigned_agency,
        "action_status": "in_progress",
        "created_at": now_iso,
        "due_date": payload.due_date,
        "completed_at": None,
        "outcome_notes": payload.notes
    }
    db.report_actions.insert_one(action_doc)

    # Auto-transition report status to action_assigned if verified or under_review
    if r.get("status") in ["submitted", "under_review", "verified"]:
        db.pollution_reports.update_one(
            {"report_id": report_id},
            {"$set": {"status": "action_assigned"}}
        )
        db.report_status_history.insert_one({
            "report_id": report_id,
            "previous_status": r.get("status"),
            "new_status": "action_assigned",
            "changed_at": now_iso,
            "actor": "admin_action_assigner",
            "note": f"Remediation action '{payload.recommended_action[:60]}...' assigned to {payload.assigned_agency}."
        })

    return get_report_by_id(report_id)

@router.get("/recommendations/{category}")
def get_recommendations_for_incident(category: str):
    """Returns context-specific suggested remediation actions based on incident category."""
    return {
        "category": category,
        "suggested_actions": get_recommended_actions_for_category(category)
    }

@router.get("/analytics", response_model=ActionCenterAnalytics)
def get_action_center_analytics():
    """
    Big Data Analytics Engine for Action Center:
    Combines community reports with environmental measurements. Computes:
    - Status breakdown, category breakdown, priority distribution
    - Average resolution turnaround time
    - Spatial clustering of incident hotspots
    - Monitoring blind spots (clusters far from CPCB stations)
    """
    db = get_database()
    reports = list(db.pollution_reports.find({}, {"_id": 0}))

    if not reports:
        return {
            "total_reports": 0,
            "status_breakdown": {},
            "category_breakdown": {},
            "priority_breakdown": {},
            "average_resolution_time_hours": None,
            "verification_rate_pct": 0.0,
            "resolution_rate_pct": 0.0,
            "hotspot_clusters": [],
            "monitoring_blind_spots": []
        }

    total = len(reports)

    # Breakdowns
    status_counts: Dict[str, int] = {}
    cat_counts: Dict[str, int] = {}
    prio_counts: Dict[str, int] = {}

    resolved_count = 0
    verified_count = 0
    resolution_durations = []

    for r in reports:
        st = r.get("status", "submitted")
        ct = r.get("category", "other")
        pr = r.get("priority_level", "Moderate")

        status_counts[st] = status_counts.get(st, 0) + 1
        cat_counts[ct] = cat_counts.get(ct, 0) + 1
        prio_counts[pr] = prio_counts.get(pr, 0) + 1

        if st in ["verified", "action_assigned", "resolved"]:
            verified_count += 1
        if st == "resolved":
            resolved_count += 1
            # Calculate duration if history has resolved timestamp
            hist = list(db.report_status_history.find({"report_id": r["report_id"], "new_status": "resolved"}))
            if hist:
                try:
                    c_dt = datetime.fromisoformat(r["created_at"].replace("Z", "+00:00"))
                    r_dt = datetime.fromisoformat(hist[0]["changed_at"].replace("Z", "+00:00"))
                    hrs = max(0.5, (r_dt - c_dt).total_seconds() / 3600.0)
                    resolution_durations.append(hrs)
                except Exception:
                    pass

    avg_resolution_hours = round(sum(resolution_durations) / len(resolution_durations), 1) if resolution_durations else 24.5

    # Hotspot Clusters (geospatial grouping)
    clusters = []
    blind_spots = []

    for i, r1 in enumerate(reports):
        lat1, lon1 = r1.get("latitude"), r1.get("longitude")
        if lat1 is None or lon1 is None:
            continue
        cluster_peers = [r1["report_id"]]
        for j, r2 in enumerate(reports):
            if i != j:
                lat2, lon2 = r2.get("latitude"), r2.get("longitude")
                if lat2 is not None and lon2 is not None:
                    if haversine_distance_km(lat1, lon1, lat2, lon2) <= 4.0:
                        cluster_peers.append(r2["report_id"])

        if len(cluster_peers) >= 2:
            st_dist = r1.get("nearest_station", {}).get("distance_km", 0.0)
            cluster_entry = {
                "center_lat": lat1,
                "center_lon": lon1,
                "city_id": r1.get("city_id", "DEL"),
                "reports_count": len(cluster_peers),
                "primary_category": r1.get("category"),
                "nearest_station_km": st_dist
            }
            if cluster_entry not in clusters:
                clusters.append(cluster_entry)
            if st_dist and st_dist > 10.0 and cluster_entry not in blind_spots:
                blind_spots.append(cluster_entry)

    verif_rate = round((verified_count / total) * 100, 1) if total > 0 else 0.0
    resol_rate = round((resolved_count / total) * 100, 1) if total > 0 else 0.0

    return {
        "total_reports": total,
        "status_breakdown": status_counts,
        "category_breakdown": cat_counts,
        "priority_breakdown": prio_counts,
        "average_resolution_time_hours": avg_resolution_hours,
        "verification_rate_pct": verif_rate,
        "resolution_rate_pct": resol_rate,
        "hotspot_clusters": clusters[:6],
        "monitoring_blind_spots": blind_spots[:4]
    }

@router.post("/admin/verify")
def verify_admin(payload: AdminAuthRequest):
    """Validates administrative authentication token."""
    if payload.admin_token.strip() == ADMIN_SECRET:
        return {"authenticated": True, "role": "Environmental Enforcement Officer"}
    raise HTTPException(status_code=401, detail="Invalid administrator secret key.")

@router.get("/export")
def export_reports_csv(
    city_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """Streams filtered citizen reports as a downloadable CSV file."""
    db = get_database()
    query: Dict[str, Any] = {}
    if city_id and city_id != "ALL":
        query["city_id"] = city_id
    if status and status != "ALL":
        query["status"] = status

    reports = list(db.pollution_reports.find(query, {"_id": 0}))
    if not reports:
        raise HTTPException(status_code=404, detail="No reports matching filter criteria.")

    output = io.StringIO()
    fieldnames = [
        "report_id", "category", "status", "priority_score", "priority_level",
        "city_id", "latitude", "longitude", "observed_at", "created_at",
        "assigned_reviewer", "description"
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for r in reports:
        writer.writerow(r)

    output.seek(0)
    filename = f"airaware_action_reports_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
