from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.all_models import MoSPITransportCPI
from app.schemas.all_schemas import (
    MoSPITransportCPIResponse,
    CPITransmissionResponse,
    RBIMPCPassThroughResponse,
)
from app.analytics.cpi_transmission import (
    calculate_cpi_transmission,
    calculate_rbi_mpc_pass_through,
)

router = APIRouter(prefix="/cpi", tags=["MoSPI eSankhyiki & RBI MPC"])

@router.get("/esankhyiki", response_model=List[MoSPITransportCPIResponse])
def get_mospi_benchmarks(db: Session = Depends(get_db)):
    """
    Get official benchmark series from MoSPI eSankhyiki for Transport & Communication subgroup
    partitioned across Urban, Rural, and Combined brackets (Base 2012=100).
    """
    records = db.query(MoSPITransportCPI).order_by(MoSPITransportCPI.period.desc()).all()
    return records

@router.get("/transmission", response_model=CPITransmissionResponse)
def get_cpi_transmission(db: Session = Depends(get_db)):
    """
    Calculate mathematical transmission from the Prototype Airfare Price Index into
    Urban, Rural, and Combined Transport CPI subgroups and overall Headline CPI basis points.
    """
    return calculate_cpi_transmission(db)

@router.get("/rbi-mpc-impact", response_model=RBIMPCPassThroughResponse)
def get_rbi_mpc_impact(db: Session = Depends(get_db)):
    """
    Calculate Headline CPI pass-through and assess impact on the Reserve Bank of India
    Monetary Policy Committee (RBI MPC) monetary stance (Accommodative vs Neutral vs Hawkish).
    """
    return calculate_rbi_mpc_pass_through(db)
