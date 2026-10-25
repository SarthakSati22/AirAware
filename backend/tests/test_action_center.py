"""
Unit & Integration Tests for AirAware Action Center
Tests the complete end-to-end citizen reporting, priority calculation,
geospatial station coupling, admin triage, action assignment, and BDA analytics.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

ADMIN_TOKEN = "airaware-admin-2026"

def test_action_center_list_reports():
    response = client.get("/api/action-center/reports")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1
    first = data["items"][0]
    assert "report_id" in first
    assert "category" in first
    assert "priority_score" in first
    assert "priority_level" in first

def test_citizen_submit_report():
    payload = {
        "category": "garbage_burning",
        "description": "Continuous plastic burning observed near Anand Vihar railway siding.",
        "latitude": 28.6500,
        "longitude": 77.3100,
        "location_description": "Anand Vihar Siding East",
        "city_id": "DEL"
    }
    response = client.post("/api/action-center/reports", json=payload)
    assert response.status_code == 200
    report = response.json()
    assert report["report_id"].startswith("REP-2026-")
    assert report["category"] == "garbage_burning"
    assert report["status"] == "submitted"
    assert 0 <= report["priority_score"] <= 100
    assert report["priority_level"] in ["Low", "Moderate", "High", "Urgent"]
    assert "nearest_station" in report
    assert report["nearest_station"]["distance_km"] is not None
    assert "priority_breakdown" in report
    assert report["priority_breakdown"]["algorithm_version"] == "v1.0-explainable"

def test_public_report_tracking():
    # First fetch list to get an ID
    list_res = client.get("/api/action-center/reports")
    first_id = list_res.json()["items"][0]["report_id"]

    response = client.get(f"/api/action-center/reports/tracking/{first_id}")
    assert response.status_code == 200
    report = response.json()
    assert report["report_id"] == first_id
    assert "history" in report
    assert len(report["history"]) >= 1

def test_admin_auth_verification():
    # Valid token
    res_valid = client.post("/api/action-center/admin/verify", json={"admin_token": ADMIN_TOKEN})
    assert res_valid.status_code == 200
    assert res_valid.json()["authenticated"] is True

    # Invalid token
    res_invalid = client.post("/api/action-center/admin/verify", json={"admin_token": "wrong-token"})
    assert res_invalid.status_code == 401

def test_admin_status_transition_and_audit():
    # Create report
    create_res = client.post("/api/action-center/reports", json={
        "category": "construction_dust",
        "description": "Uncovered sand piles causing heavy dust along road.",
        "latitude": 28.6139,
        "longitude": 77.2090
    })
    rep_id = create_res.json()["report_id"]

    # Unauthorized attempt
    unauth_res = client.post(
        f"/api/action-center/reports/{rep_id}/status",
        json={"new_status": "under_review", "reason_or_note": "Triage started."}
    )
    assert unauth_res.status_code == 401

    # Authorized transition
    auth_headers = {"X-Admin-Token": ADMIN_TOKEN}
    auth_res = client.post(
        f"/api/action-center/reports/{rep_id}/status",
        headers=auth_headers,
        json={"new_status": "under_review", "reason_or_note": "Field officer dispatched for inspection."}
    )
    assert auth_res.status_code == 200
    updated = auth_res.json()
    assert updated["status"] == "under_review"
    assert any(h["new_status"] == "under_review" for h in updated["history"])

def test_admin_assign_action():
    # Create report
    create_res = client.post("/api/action-center/reports", json={
        "category": "industrial_smoke",
        "description": "Chemical fumes from factory stack observed during morning.",
        "latitude": 19.0760,
        "longitude": 72.8777
    })
    rep_id = create_res.json()["report_id"]
    auth_headers = {"X-Admin-Token": ADMIN_TOKEN}

    action_payload = {
        "recommended_action": "Conduct unannounced stack emission audit and inspect flue scrubber.",
        "assigned_agency": "Maharashtra Pollution Control Board (MPCB)",
        "due_date": "2026-11-01",
        "notes": "High priority chemical plume report."
    }
    action_res = client.post(
        f"/api/action-center/reports/{rep_id}/actions",
        headers=auth_headers,
        json=action_payload
    )
    assert action_res.status_code == 200
    updated = action_res.json()
    assert updated["status"] == "action_assigned"
    assert len(updated["actions"]) >= 1
    assert updated["actions"][-1]["assigned_agency"] == "Maharashtra Pollution Control Board (MPCB)"

def test_action_center_analytics():
    response = client.get("/api/action-center/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "total_reports" in data
    assert data["total_reports"] >= 1
    assert "status_breakdown" in data
    assert "category_breakdown" in data
    assert "priority_breakdown" in data
    assert "verification_rate_pct" in data
    assert "resolution_rate_pct" in data
    assert "hotspot_clusters" in data
    assert "monitoring_blind_spots" in data

def test_action_center_csv_export():
    response = client.get("/api/action-center/export")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "report_id" in response.text
