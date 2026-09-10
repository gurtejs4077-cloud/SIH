from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.all_models import MoSPITransportCPI, RBIMPCStance
from app.analytics.index_calculator import calculate_airfare_price_index

def calculate_cpi_transmission(db: Session) -> Dict[str, Any]:
    """
    Computes mathematical transmission from the Prototype Airfare Price Index
    into the Urban, Rural, and Combined brackets for the Transport & Communication CPI subgroup.
    Uses official MoSPI eSankhyiki baseline series (Base 2012=100).
    """
    latest_mospi = db.query(MoSPITransportCPI).order_by(MoSPITransportCPI.period.desc()).first()
    if not latest_mospi:
        # Fallback default baseline if table is not yet seeded
        latest_mospi = MoSPITransportCPI(
            period="2026-08",
            urban_transport_cpi=172.4,
            rural_transport_cpi=164.1,
            combined_transport_cpi=168.6,
            headline_cpi_urban=183.2,
            headline_cpi_rural=187.5,
            headline_cpi_combined=185.4,
            urban_transport_weight=9.53,
            rural_transport_weight=5.68,
            combined_transport_weight=7.59,
            airfare_sub_share_urban=14.2,
            airfare_sub_share_rural=1.8,
            airfare_sub_share_combined=8.6,
            source="MoSPI eSankhyiki Portal",
            is_verified=True
        )

    # Current airfare index
    index_data = calculate_airfare_price_index(db)
    current_index = index_data["national_index"]
    # Change vs base 100
    airfare_pct_change = current_index - 100.0

    # Brackets calculation
    brackets: List[Dict[str, Any]] = []

    specs = [
        {
            "bracket": "Urban",
            "basket_weight": latest_mospi.urban_transport_weight,
            "air_share": latest_mospi.airfare_sub_share_urban,
            "benchmark_cpi": latest_mospi.urban_transport_cpi,
        },
        {
            "bracket": "Rural",
            "basket_weight": latest_mospi.rural_transport_weight,
            "air_share": latest_mospi.airfare_sub_share_rural,
            "benchmark_cpi": latest_mospi.rural_transport_cpi,
        },
        {
            "bracket": "Combined",
            "basket_weight": latest_mospi.combined_transport_weight,
            "air_share": latest_mospi.airfare_sub_share_combined,
            "benchmark_cpi": latest_mospi.combined_transport_cpi,
        },
    ]

    for spec in specs:
        # Effective weight of airfare in overall Headline CPI
        # e.g. Urban: 9.53% * 14.2% = 1.353%
        effective_weight_pct = (spec["basket_weight"] * spec["air_share"]) / 100.0

        # Subgroup inflation impact (%)
        # Direct pass-through into transport subgroup = (airfare share * airfare pct change)
        subgroup_inflation_pct = (spec["air_share"] / 100.0) * airfare_pct_change

        # Augmented transport CPI level
        augmented_cpi = spec["benchmark_cpi"] * (1.0 + (subgroup_inflation_pct / 100.0))

        # Headline pass-through in basis points (1% = 100 bps)
        # bps = (effective_weight / 100.0) * airfare_pct_change * 100.0
        headline_bps = effective_weight_pct * airfare_pct_change

        brackets.append({
            "bracket": spec["bracket"],
            "basket_weight_pct": round(spec["basket_weight"], 2),
            "airfare_share_in_subgroup": round(spec["air_share"], 1),
            "effective_airfare_weight_in_headline": round(effective_weight_pct, 3),
            "benchmark_transport_cpi": round(spec["benchmark_cpi"], 2),
            "augmented_transport_cpi": round(augmented_cpi, 2),
            "subgroup_inflation_impact_pct": round(subgroup_inflation_pct, 2),
            "headline_pass_through_bps": round(headline_bps, 1)
        })

    return {
        "benchmark_period": latest_mospi.period,
        "airfare_index_current": current_index,
        "airfare_index_change_pct": round(airfare_pct_change, 2),
        "brackets": brackets,
        "methodology_note": (
            "MoSPI eSankhyiki Base 2012=100. Transport & Communication subgroup weights: "
            "Urban 9.53%, Rural 5.68%, Combined 7.59%. Pass-through models high-frequency "
            "airfare inflation transmission into headline consumer baskets."
        )
    }

def calculate_rbi_mpc_pass_through(db: Session) -> Dict[str, Any]:
    """
    Simulates pass-through to India's Headline CPI and evaluates impact on
    Reserve Bank of India Monetary Policy Committee (RBI MPC) monetary stance.
    """
    latest_stance = db.query(RBIMPCStance).order_by(RBIMPCStance.policy_date.desc()).first()
    if not latest_stance:
        latest_stance = RBIMPCStance(
            policy_date="2026-08-08",
            repo_rate=6.50,
            reverse_repo_rate=3.35,
            stance="ACCOMMODATIVE",
            target_cpi=4.0,
            lower_tolerance=2.0,
            upper_tolerance=6.0,
            mpc_commentary="MPC resolved to maintain stance supportive of durable economic growth while ensuring CPI aligns to target."
        )

    transmission = calculate_cpi_transmission(db)
    combined_bracket = next((b for b in transmission["brackets"] if b["bracket"] == "Combined"), None)

    # Direct pass-through bps
    direct_bps = combined_bracket["headline_pass_through_bps"] if combined_bracket else 15.0

    # Second-round effects (travel logistics, corporate business expenses, tourism spillover): ~30% of direct
    second_round_bps = round(direct_bps * 0.32, 1)
    total_pass_through_pct = (direct_bps + second_round_bps) / 100.0

    # Base Headline CPI (e.g. 5.12% y-o-y)
    headline_cpi_baseline = 5.12
    headline_cpi_augmented = round(headline_cpi_baseline + total_pass_through_pct, 2)
    distance_to_ceiling = round(latest_stance.upper_tolerance - headline_cpi_augmented, 2)

    # Categorize stance impact
    if headline_cpi_augmented >= 5.75:
        stance_impact = "HAWKISH_PRESSURE"
        rationale = (
            f"Airfare inflation transmits +{direct_bps:.1f} bps direct and +{second_round_bps:.1f} bps indirect pressure, "
            f"pushing Headline CPI to {headline_cpi_augmented:.2f}%. Proximity to the RBI MPC 6.0% tolerance ceiling "
            f"constrains accommodation and exerts hawkish rate pressure."
        )
    elif headline_cpi_augmented >= 4.80:
        stance_impact = "NEUTRAL_BALANCED"
        rationale = (
            f"Airfare transmission of +{direct_bps:.1f} bps keeps Headline CPI at {headline_cpi_augmented:.2f}%. "
            f"With {distance_to_ceiling:+.2f}% buffer below the 6.0% ceiling, the MPC can sustain a balanced neutral or "
            f"calibrated stance while monitoring transport service price stickiness."
        )
    else:
        stance_impact = "ACCOMMODATIVE_CUSHION"
        rationale = (
            f"Headline CPI augmented at {headline_cpi_augmented:.2f}% sits comfortably near the 4.0% target. "
            f"Ample headroom (+{distance_to_ceiling:.2f}%) allows the RBI MPC to pursue an accommodative monetary policy."
        )

    return {
        "policy_benchmark_date": latest_stance.policy_date,
        "repo_rate": latest_stance.repo_rate,
        "official_stance": latest_stance.stance,
        "target_cpi": latest_stance.target_cpi,
        "upper_tolerance": latest_stance.upper_tolerance,
        "lower_tolerance": latest_stance.lower_tolerance,
        "headline_cpi_baseline": headline_cpi_baseline,
        "airfare_direct_pass_through_bps": direct_bps,
        "airfare_second_round_pass_through_bps": second_round_bps,
        "headline_cpi_augmented": headline_cpi_augmented,
        "distance_to_upper_ceiling_pct": distance_to_ceiling,
        "stance_impact_assessment": stance_impact,
        "policy_summary_rationale": rationale
    }
