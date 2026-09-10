import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_mospi_benchmarks_endpoint():
    response = client.get("/api/cpi/esankhyiki")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        row = data[0]
        assert "urban_transport_cpi" in row
        assert "rural_transport_cpi" in row
        assert "combined_transport_cpi" in row
        assert row["urban_transport_weight"] == 9.53
        assert row["rural_transport_weight"] == 5.68

def test_cpi_transmission_endpoint():
    response = client.get("/api/cpi/transmission")
    assert response.status_code == 200
    data = response.json()
    assert "brackets" in data
    assert len(data["brackets"]) == 3 # Urban, Rural, Combined

    urban = next(b for b in data["brackets"] if b["bracket"] == "Urban")
    rural = next(b for b in data["brackets"] if b["bracket"] == "Rural")

    # Urban has higher airfare share and higher headline pass-through bps than rural
    assert urban["airfare_share_in_subgroup"] > rural["airfare_share_in_subgroup"]
    assert urban["headline_pass_through_bps"] >= rural["headline_pass_through_bps"]

def test_rbi_mpc_impact_endpoint():
    response = client.get("/api/cpi/rbi-mpc-impact")
    assert response.status_code == 200
    data = response.json()
    assert "official_stance" in data
    assert "headline_cpi_baseline" in data
    assert "headline_cpi_augmented" in data
    assert "airfare_direct_pass_through_bps" in data
    assert data["target_cpi"] == 4.0
    assert data["upper_tolerance"] == 6.0
    assert data["stance_impact_assessment"] in [
        "ACCOMMODATIVE_CUSHION",
        "NEUTRAL_BALANCED",
        "HAWKISH_PRESSURE"
    ]
