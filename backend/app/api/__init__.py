from fastapi import APIRouter
from app.api.routes import router as routes_router
from app.api.fares import router as fares_router
from app.api.airlines import router as airlines_router
from app.api.analytics import router as analytics_router
from app.api.index import router as index_router
from app.api.sources import router as sources_router
from app.api.collection import router as collection_router
from app.api.cpi import router as cpi_router
from app.api.whatsapp import router as whatsapp_router

api_router = APIRouter()

api_router.include_router(routes_router)
api_router.include_router(fares_router)
api_router.include_router(airlines_router)
api_router.include_router(analytics_router)
api_router.include_router(index_router)
api_router.include_router(sources_router)
api_router.include_router(collection_router)
api_router.include_router(cpi_router)
api_router.include_router(whatsapp_router, prefix="/whatsapp", tags=["WhatsApp Intelligence"])

