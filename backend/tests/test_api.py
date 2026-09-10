import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "data_provider_mode" in data

def test_routes_endpoint():
    response = client.get("/api/routes")
    assert response.status_code == 200
    routes = response.json()
    assert len(routes) >= 10
    codes = [r["code"] for r in routes]
    assert "DEL-BOM" in codes
    assert "DEL-BLR" in codes

def test_route_detail_endpoint():
    response = client.get("/api/routes/DEL-BOM")
    assert response.status_code == 200
    detail = response.json()
    assert detail["code"] == "DEL-BOM"
    assert detail["origin"] == "DEL"
    assert detail["destination"] == "BOM"
    assert "current_fare" in detail
    assert "baseline_30d" in detail
    assert "spike_analysis" in detail
    assert len(detail["airline_stats"]) > 0

def test_anomalies_endpoint():
    response = client.get("/api/analytics/anomalies")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) > 0
    # Confirm status is one of the approved categories
    statuses = {item["status"] for item in data["items"]}
    valid_statuses = {"NORMAL", "ELEVATED", "UNUSUALLY HIGH", "EXTREME"}
    assert statuses.issubset(valid_statuses)

def test_index_current_endpoint():
    response = client.get("/api/index/current")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert data["summary"]["current_index"] > 0
    assert len(data["routes"]) > 0
    assert len(data["airlines"]) > 0

def test_booking_window_endpoint():
    response = client.get("/api/analytics/booking-window?route=DEL-BOM")
    assert response.status_code == 200
    data = response.json()
    assert len(data["windows"]) == 5 # T+1, T+7, T+15, T+30, T+45
    labels = [w["label"] for w in data["windows"]]
    assert labels == ["T+1", "T+7", "T+15", "T+30", "T+45"]

def test_export_csv_endpoint():
    response = client.get("/api/fares/export?route=DEL-BOM&limit=100")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    content = response.text
    assert "timestamp,source,airline,flight_number" in content
    assert "DEL" in content
    assert "BOM" in content

def test_sources_endpoint():
    response = client.get("/api/sources")
    assert response.status_code == 200
    sources = response.json()
    assert len(sources) >= 3
