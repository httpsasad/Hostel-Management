from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_tenant_context, require_roles, TenantContext
from app.models.tenant import UserRole
from app.models.accommodation import Building, Floor, Room, Bed, BedStatus

router = APIRouter(prefix="/accommodation", tags=["Accommodation & Bed Inventory"])

class BuildingCreate(BaseModel):
    hostel_id: str
    name: str
    code: str

class RoomCreate(BaseModel):
    hostel_id: str
    floor_id: str
    room_number: str
    capacity: int = 2

class BedCreate(BaseModel):
    room_id: str
    bed_number: str

class BedItemResponse(BaseModel):
    id: str
    bed_number: str
    status: BedStatus
    is_active: bool

    class Config:
        from_attributes = True

class RoomItemResponse(BaseModel):
    id: str
    room_number: str
    capacity: int
    beds: List[BedItemResponse] = []

    class Config:
        from_attributes = True

class BuildingResponse(BaseModel):
    id: str
    hostel_id: str
    name: str
    code: str

    class Config:
        from_attributes = True

@router.get("/buildings", response_model=List[BuildingResponse])
def list_buildings(
    hostel_id: Optional[str] = None,
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db)
):
    query = db.query(Building).filter(Building.organization_id == ctx.organization_id)
    target_hostel = hostel_id or ctx.hostel_id
    if target_hostel:
        query = query.filter(Building.hostel_id == target_hostel)
    return query.all()

@router.post("/buildings", response_model=BuildingResponse, status_code=status.HTTP_201_CREATED)
def create_building(
    data: BuildingCreate,
    ctx: TenantContext = Depends(require_roles([UserRole.HOSTEL_OWNER, UserRole.WARDEN])),
    db: Session = Depends(get_db)
):
    building = Building(
        organization_id=ctx.organization_id,
        hostel_id=data.hostel_id,
        name=data.name,
        code=data.code
    )
    db.add(building)
    db.flush()
    
    # Auto-create Ground Floor
    gf = Floor(
        organization_id=ctx.organization_id,
        hostel_id=data.hostel_id,
        building_id=building.id,
        floor_number=0,
        name="Ground Floor"
    )
    db.add(gf)
    db.commit()
    db.refresh(building)
    return building

@router.get("/rooms", response_model=List[RoomItemResponse])
def list_rooms(
    hostel_id: Optional[str] = None,
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db)
):
    query = db.query(Room).filter(Room.organization_id == ctx.organization_id)
    target_hostel = hostel_id or ctx.hostel_id
    if target_hostel:
        query = query.filter(Room.hostel_id == target_hostel)
    return query.all()

@router.post("/rooms", response_model=RoomItemResponse, status_code=status.HTTP_201_CREATED)
def create_room_with_beds(
    data: RoomCreate,
    ctx: TenantContext = Depends(require_roles([UserRole.HOSTEL_OWNER, UserRole.WARDEN])),
    db: Session = Depends(get_db)
):
    existing = db.query(Room).filter(
        Room.hostel_id == data.hostel_id,
        Room.room_number == data.room_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Room {data.room_number} already exists.")
        
    room = Room(
        organization_id=ctx.organization_id,
        hostel_id=data.hostel_id,
        floor_id=data.floor_id,
        room_number=data.room_number,
        capacity=data.capacity
    )
    db.add(room)
    db.flush()
    
    # Automatically generate default beds (e.g., Bed-1, Bed-2 according to capacity)
    for i in range(1, data.capacity + 1):
        bed = Bed(
            organization_id=ctx.organization_id,
            hostel_id=data.hostel_id,
            room_id=room.id,
            bed_number=f"B{i}",
            status=BedStatus.AVAILABLE
        )
        db.add(bed)
        
    db.commit()
    db.refresh(room)
    return room

@router.get("/beds/available", response_model=List[BedItemResponse])
def list_available_beds(
    hostel_id: Optional[str] = None,
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db)
):
    query = db.query(Bed).filter(
        Bed.organization_id == ctx.organization_id,
        Bed.status == BedStatus.AVAILABLE,
        Bed.is_active == True
    )
    target_hostel = hostel_id or ctx.hostel_id
    if target_hostel:
        query = query.filter(Bed.hostel_id == target_hostel)
    return query.all()
