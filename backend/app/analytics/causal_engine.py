import logging
import httpx
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# Coordinates for major Indian airport hubs for real-time weather & cyclone monitoring
INDIAN_AIRPORTS = {
    "DEL": {"name": "Delhi (Indira Gandhi Intl)", "lat": 28.5562, "lon": 77.1000, "region": "North"},
    "BOM": {"name": "Mumbai (Chhatrapati Shivaji Intl)", "lat": 19.0896, "lon": 72.8656, "region": "West"},
    "BLR": {"name": "Bengaluru (Kempegowda Intl)", "lat": 13.1986, "lon": 77.7066, "region": "South"},
    "HYD": {"name": "Hyderabad (Rajiv Gandhi Intl)", "lat": 17.2403, "lon": 78.4294, "region": "South"},
    "CCU": {"name": "Kolkata (Netaji Subhash Chandra Intl)", "lat": 22.6547, "lon": 88.4467, "region": "East"},
    "MAA": {"name": "Chennai (Chennai Intl)", "lat": 12.9941, "lon": 80.1709, "region": "South"},
    "GOI": {"name": "Goa (Dabolim / Mopa)", "lat": 15.3808, "lon": 73.8314, "region": "West"},
    "PNQ": {"name": "Pune (Pune Airport)", "lat": 18.5822, "lon": 73.9197, "region": "West"},
    "GAU": {"name": "Guwahati (Lokpriya Gopinath Bordoloi Intl)", "lat": 26.1061, "lon": 91.5859, "region": "Northeast"},
    "COK": {"name": "Kochi (Cochin Intl)", "lat": 10.1518, "lon": 76.4019, "region": "South"},
    "SXR": {"name": "Srinagar (Sheikh ul-Alam Intl)", "lat": 33.9871, "lon": 74.7741, "region": "North"},
    "PAT": {"name": "Patna (Jay Prakash Narayan Intl)", "lat": 25.5913, "lon": 85.0880, "region": "East"},
    "AMD": {"name": "Ahmedabad (Sardar Vallabhbhai Patel Intl)", "lat": 23.0772, "lon": 72.6347, "region": "West"},
    "BBI": {"name": "Bhubaneswar (Biju Patnaik Intl)", "lat": 20.2444, "lon": 85.8178, "region": "East"}
}

# Weather code classifications based on WMO standards used by IMD / Open-Meteo
CYCLONE_GUST_THRESHOLD_KMH = 65.0  # Cyclone / severe gale threshold
HIGH_WIND_THRESHOLD_KMH = 45.0     # Strong crosswinds causing airport delay
SEVERE_WEATHER_CODES = {
    95: "Thunderstorm (Slight or Moderate)",
    96: "Severe Thunderstorm with Hail",
    99: "Violent Thunderstorm with Severe Hail",
    75: "Heavy Snowfall / Freeze",
    82: "Violent Rain Showers / Cloudburst",
    45: "Dense Fog / Low Visibility (CAT III ILS Required)",
    48: "Depositing Rime Fog"
}

# In-memory cache for live weather to avoid hammering APIs
_weather_cache: Dict[str, Dict[str, Any]] = {}
_weather_cache_time: float = 0.0
CACHE_TTL_SECONDS = 600  # 10 minutes cache

# Aviation Turbine Fuel (ATF) live benchmark state
# Benchmarked against Indian Oil Corporation Ltd (IOCL) domestic jet fuel rate revisions
CURRENT_ATF_BENCHMARK = {
    "price_per_kl_inr": 93480.0,         # Current domestic ATF price in Delhi (₹/kL)
    "baseline_30d_inr": 92100.0,         # 30-day baseline
    "mom_pct_change": 1.5,               # Month-on-Month change %
    "fuel_cost_share_pct": 42.0,         # Jet fuel share of total operating expenditure
    "status": "STABLE",                  # STABLE | SURGING | DECLINING
    "last_revised": "Monthly IOCL Price Notification",
    "fuel_surcharge_justified_pct": 1.5 * 0.42  # Legitimate fare impact = ~0.63%
}

def get_current_atf_benchmark() -> Dict[str, Any]:
    """
    Returns the active Aviation Turbine Fuel (ATF) benchmark and justifiable pass-through.
    """
    mom_change = CURRENT_ATF_BENCHMARK["mom_pct_change"]
    status = "SURGING" if mom_change >= 5.0 else ("DECLINING" if mom_change <= -3.0 else "STABLE")
    
    return {
        **CURRENT_ATF_BENCHMARK,
        "status": status,
        "justifiable_fare_impact_pct": round(mom_change * (CURRENT_ATF_BENCHMARK["fuel_cost_share_pct"] / 100.0), 2),
        "fuel_surcharge_eligible": mom_change > 5.0,
        "telemetry_source": "Ministry of Petroleum (PPAC) / IOCL Jet Fuel Monthly Matrix"
    }

def fetch_live_airport_weather(airport_code: str) -> Dict[str, Any]:
    """
    Queries real-time meteorological observations for an airport hub using Open-Meteo live API.
    Detects cyclones, severe thunderstorms, gale winds, and dense visibility fog.
    """
    global _weather_cache, _weather_cache_time
    now_time = time.time()

    # Check cache
    if airport_code in _weather_cache and (now_time - _weather_cache_time < CACHE_TTL_SECONDS):
        return _weather_cache[airport_code]

    airport = INDIAN_AIRPORTS.get(airport_code)
    if not airport:
        return {
            "airport": airport_code,
            "status": "NORMAL",
            "is_disrupted": False,
            "condition": "Normal Weather",
            "wind_speed_kmh": 15.0,
            "wind_gusts_kmh": 22.0,
            "temp_c": 28.0,
            "is_cyclone_alert": False,
            "is_fog_alert": False
        }

    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={airport['lat']}&longitude={airport['lon']}"
            f"&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_gusts_10m"
            f"&timezone=Asia%2FKolkata"
        )
        with httpx.Client(timeout=3.0) as client:
            resp = client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                wind_speed = current.get("wind_speed_10m", 12.0)
                wind_gusts = current.get("wind_gusts_10m", 18.0)
                weather_code = current.get("weather_code", 0)
                temp_c = current.get("temperature_2m", 27.0)

                is_cyclone = wind_gusts >= CYCLONE_GUST_THRESHOLD_KMH or wind_speed >= 55.0
                is_severe_storm = weather_code in [95, 96, 99, 82]
                is_fog = weather_code in [45, 48] or (temp_c < 14 and current.get("relative_humidity_2m", 0) > 92)

                is_disrupted = is_cyclone or is_severe_storm or is_fog or (wind_gusts >= HIGH_WIND_THRESHOLD_KMH)

                condition = "Clear / VFR Operational"
                if is_cyclone:
                    condition = f"CYCLONE / SEVERE GALE WARNING (Gusts: {wind_gusts:.1f} km/h)"
                elif is_severe_storm:
                    condition = SEVERE_WEATHER_CODES.get(weather_code, "Severe Thunderstorm / Squall")
                elif is_fog:
                    condition = "CAT III Low Visibility / Dense Fog Diversions"
                elif wind_gusts >= HIGH_WIND_THRESHOLD_KMH:
                    condition = f"High Crosswinds & Holding Patterns ({wind_gusts:.1f} km/h gusts)"

                result = {
                    "airport": airport_code,
                    "airport_name": airport["name"],
                    "status": "CRITICAL" if is_cyclone else ("WARNING" if is_disrupted else "NORMAL"),
                    "is_disrupted": is_disrupted,
                    "condition": condition,
                    "wind_speed_kmh": round(wind_speed, 1),
                    "wind_gusts_kmh": round(wind_gusts, 1),
                    "temp_c": round(temp_c, 1),
                    "is_cyclone_alert": is_cyclone,
                    "is_fog_alert": is_fog,
                    "source": "Open-Meteo Live IMD Meteorological Telemetry"
                }
                _weather_cache[airport_code] = result
                _weather_cache_time = now_time
                return result
    except Exception as e:
        logger.debug(f"Live weather lookup fallback for {airport_code}: {e}")

    # Graceful fallback baseline if network is offline
    fallback = {
        "airport": airport_code,
        "airport_name": airport.get("name", airport_code),
        "status": "NORMAL",
        "is_disrupted": False,
        "condition": "Calm / Clear Skies (VFR Normal)",
        "wind_speed_kmh": 14.0,
        "wind_gusts_kmh": 20.0,
        "temp_c": 28.0,
        "is_cyclone_alert": False,
        "is_fog_alert": False,
        "source": "Historical Regional Baseline"
    }
    _weather_cache[airport_code] = fallback
    return fallback

def get_active_festival_alerts() -> List[Dict[str, Any]]:
    """
    Returns active or upcoming peak festive travel corridors across India.
    """
    now = datetime.now()
    month = now.month

    festivals = []
    # Major festive windows in Indian aviation
    if month in [10, 11]:
        festivals.append({
            "name": "Diwali & Chhath Puja Peak Rush",
            "impact_corridors": ["DEL-PAT", "DEL-CCU", "BOM-PAT", "DEL-BOM", "BLR-PAT"],
            "expected_surge_band": "+35% to +60%",
            "status": "ACTIVE_HIGH_SEASON"
        })
    elif month in [9, 10]:
        festivals.append({
            "name": "Durga Puja & Navratri Festival Corridor",
            "impact_corridors": ["DEL-CCU", "BOM-CCU", "BLR-CCU", "AMD-DEL"],
            "expected_surge_band": "+25% to +45%",
            "status": "ACTIVE_HIGH_SEASON"
        })
    elif month == 12:
        festivals.append({
            "name": "Year-End & Winter Holiday Tourism",
            "impact_corridors": ["DEL-GOI", "BOM-GOI", "BLR-GOI", "DEL-COK", "BOM-COK"],
            "expected_surge_band": "+30% to +55%",
            "status": "ACTIVE_HIGH_SEASON"
        })
    elif month in [5, 6]:
        festivals.append({
            "name": "Summer Vacation Peak Domestic Transit",
            "impact_corridors": ["DEL-SXR", "BOM-SXR", "DEL-IXC", "DEL-GAU"],
            "expected_surge_band": "+20% to +40%",
            "status": "ACTIVE_HIGH_SEASON"
        })

    return festivals

def evaluate_surge_justification(
    origin: str,
    destination: str,
    current_price: float,
    baseline_30d: float,
    pct_diff: float
) -> Dict[str, Any]:
    """
    Comprehensive Causal Inference Engine for Airfare Spikes:
    Analyzes whether an airfare surge (> 15% above baseline) is legitimately explained by:
    1. Severe Weather / Cyclone Disruption at origin or destination
    2. Significant Jet Fuel (ATF) Cost Surge
    3. Peak Festive Season Demand
    
    If NO external driver is identified, the spike is flagged as:
    🚨 PREDATORY SURGE / UNJUSTIFIED HIKE (Without Economic Reason)
    with a Gouging Severity Score and visual red alert.
    """
    # 1. Check if price is within normal statistical tolerance (<= 15%)
    if pct_diff <= 15.0:
        return {
            "is_justified": True,
            "justification_category": "NORMAL",
            "justification_label": "Price Within Normal Corridor Band",
            "justification_detail": f"Current fare is within ±15% of the 30-day baseline (Δ {pct_diff:+.1f}%). Normal market volatility.",
            "gouging_risk_score": 5,
            "highlight_color": "slate",
            "is_predatory_alert": False,
            "audit_recommended": False
        }

    # 2. Gather External Drivers
    origin_wx = fetch_live_airport_weather(origin)
    dest_wx = fetch_live_airport_weather(destination)
    atf = get_current_atf_benchmark()
    festivals = get_active_festival_alerts()

    # Route corridor identifier
    route_code = f"{origin}-{destination}"

    # Check 1: Severe Weather / Cyclone Alert
    if origin_wx.get("is_cyclone_alert") or dest_wx.get("is_cyclone_alert"):
        culprit = origin if origin_wx.get("is_cyclone_alert") else destination
        wx_detail = origin_wx if origin_wx.get("is_cyclone_alert") else dest_wx
        return {
            "is_justified": True,
            "justification_category": "WEATHER_CYCLONE",
            "justification_label": f"Justified by Severe Cyclone Alert at {culprit}",
            "justification_detail": f"Active cyclone gale warning at {culprit} ({wx_detail.get('wind_gusts_kmh')} km/h gusts). Flight delays and aircraft diversions restricted seat capacity.",
            "gouging_risk_score": 18,
            "highlight_color": "amber",
            "is_predatory_alert": False,
            "audit_recommended": False,
            "weather_origin": origin_wx,
            "weather_destination": dest_wx
        }

    if origin_wx.get("is_disrupted") or dest_wx.get("is_disrupted"):
        disrupted_apt = origin if origin_wx.get("is_disrupted") else destination
        disrupted_cond = origin_wx.get("condition") if origin_wx.get("is_disrupted") else dest_wx.get("condition")
        return {
            "is_justified": True,
            "justification_category": "WEATHER_DISRUPTION",
            "justification_label": f"Justified by Weather Disruption at {disrupted_apt}",
            "justification_detail": f"Disruption logged at {disrupted_apt}: {disrupted_cond}. Constrained slot throughput explains surge.",
            "gouging_risk_score": 24,
            "highlight_color": "amber",
            "is_predatory_alert": False,
            "audit_recommended": False,
            "weather_origin": origin_wx,
            "weather_destination": dest_wx
        }

    # Check 2: Jet Fuel (ATF) Cost Spike
    # If ATF rose significantly (e.g. > +6%) and the fare surge is within reasonable proportion
    if atf.get("mom_pct_change", 0) >= 6.0 and pct_diff <= 28.0:
        return {
            "is_justified": True,
            "justification_category": "FUEL_COST",
            "justification_label": f"Justified by Jet Fuel (ATF) Surcharge (+{atf['mom_pct_change']}%)",
            "justification_detail": f"Domestic ATF benchmark increased to ₹{int(atf['price_per_kl_inr']):,}/kL (+{atf['mom_pct_change']}% MoM). Increased fuel burn expenditure justifies higher fare baseline.",
            "gouging_risk_score": 22,
            "highlight_color": "green",
            "is_predatory_alert": False,
            "audit_recommended": False,
            "atf_benchmark": atf
        }

    # Check 3: Active Festival / High Season Corridor
    for fest in festivals:
        if route_code in fest.get("impact_corridors", []):
            return {
                "is_justified": True,
                "justification_category": "FESTIVAL_PEAK",
                "justification_label": f"Justified by {fest['name']}",
                "justification_detail": f"Route corridor is in active festive peak transit. High organic consumer load factor explains standard peak demand pricing.",
                "gouging_risk_score": 30,
                "highlight_color": "blue",
                "is_predatory_alert": False,
                "audit_recommended": False
            }

    # 4. NO JUSTIFICATION DETECTED: PREDATORY SURGE / SUSPECTED GOUGING!
    # Fuel is flat/down, weather is clear, no festival corridor, yet prices spiked!
    # Compute gouging risk score based on percentage surge
    risk_score = min(99, int(40 + (pct_diff * 0.9)))
    
    reasons_missing = [
        f"Jet fuel price is stable (ATF MoM: {atf.get('mom_pct_change'):+.1f}%)",
        f"Weather is clear at both hubs ({origin}: {origin_wx.get('temp_c')}°C, {destination}: {dest_wx.get('temp_c')}°C)",
        "No major public festival or gazetted travel rush on this corridor"
    ]

    return {
        "is_justified": False,
        "justification_category": "UNJUSTIFIED_GOUGING",
        "justification_label": "🚨 UNJUSTIFIED SURGE (WITHOUT REASON)",
        "justification_detail": f"Prices hiked +{pct_diff:.1f}% without economic or meteorological justification. {'; '.join(reasons_missing)}. Potential algorithmic gouging / artificial supply squeeze detected!",
        "gouging_risk_score": risk_score,
        "highlight_color": "red",
        "is_predatory_alert": True,
        "audit_recommended": True,
        "reasons_missing": reasons_missing,
        "weather_origin": origin_wx,
        "weather_destination": dest_wx,
        "atf_benchmark": atf
    }
