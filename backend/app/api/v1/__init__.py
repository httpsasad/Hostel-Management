from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.hostels import router as hostels_router
from app.api.v1.rooms import router as rooms_router
from app.api.v1.students import router as students_router
from app.api.v1.operations import router as operations_router
from app.api.v1.finance import router as finance_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(hostels_router)
api_router.include_router(rooms_router)
api_router.include_router(students_router)
api_router.include_router(operations_router)
api_router.include_router(finance_router)
