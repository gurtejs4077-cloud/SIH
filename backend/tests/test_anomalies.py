import pytest
from app.analytics.anomaly_detector import classify_anomaly_status, classify_spike_type

def test_anomaly_status_classification():
    # NORMAL: <= 15%
    assert classify_anomaly_status(0.0) == "NORMAL"
    assert classify_anomaly_status(14.9) == "NORMAL"
    assert classify_anomaly_status(-10.0) == "NORMAL"

    # ELEVATED: 15% to 35%
    assert classify_anomaly_status(15.1) == "ELEVATED"
    assert classify_anomaly_status(34.9) == "ELEVATED"

    # UNUSUALLY HIGH: 35% to 60%
    assert classify_anomaly_status(35.1) == "UNUSUALLY HIGH"
    assert classify_anomaly_status(59.9) == "UNUSUALLY HIGH"

    # EXTREME: > 60%
    assert classify_anomaly_status(60.1) == "EXTREME"
    assert classify_anomaly_status(120.0) == "EXTREME"

def test_temporary_spike_detection():
    # Sequence: 5000, 5100, 8900, 5200, 5000
    baseline = 5000.0
    prices = [5000.0, 5100.0, 8900.0, 5200.0, 5000.0]
    result = classify_spike_type(prices, baseline)
    assert result["classification"] == "TEMPORARY SPIKE"
    assert result["is_persistent"] is False
    assert "Transient surge detected" in result["reason"]

def test_persistent_increase_detection():
    # Sequence: 5000, 5500, 6000, 6400, 6800, 7100
    baseline = 5000.0
    prices = [5000.0, 5500.0, 6000.0, 6400.0, 6800.0, 7100.0]
    result = classify_spike_type(prices, baseline)
    assert result["classification"] == "PERSISTENT INCREASE"
    assert result["is_persistent"] is True
    assert "consecutive observations" in result["reason"]
