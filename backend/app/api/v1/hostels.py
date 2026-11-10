from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_tenant_context, require_roles, TenantContext
from app.models.tenant import Hostel, UserRole
from app.models.accommodation import Building, Room, Bed, BedStatus
from app.models.student import Student, StudentStatus

router = APIRouter(prefix="/hostels", tags=["Hostels & Branches"])

class HostelCreate(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None

class HostelResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    code: str
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class HostelStatsResponse(BaseModel):
    hostel_id: str
    hostel_name: str
    total_buildings: int
    total_rooms: int
    total_beds: int
    occupied_beds: int
    available_beds: int
    occupancy_rate: float
    active_students: int

@router.get("", response_model=List[HostelResponse])
def list_hostels(
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db)
):
    query = db.query(Hostel).filter(Hostel.organization_id == ctx.organization_id)
    if ctx.hostel_id and ctx.role in [UserRole.WARDEN, UserRole.SECURITY_GUARD]:
        query = query.filter(Hostel.id == ctx.hostel_id)
    return query.all()

@router.post("", response_model=HostelResponse, status_code=status.HTTP_201_CREATED)
def create_hostel(
    data: HostelCreate,
    ctx: TenantContext = Depends(require_roles([UserRole.HOSTEL_OWNER])),
    db: Session = Depends(get_db)
):
    existing = db.query(Hostel).filter(
        Hostel.organization_id == ctx.organization_id,
        Hostel.code == data.code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A hostel branch with this code already exists.")
        
    hostel = Hostel(
        organization_id=ctx.organization_id,
        name=data.name,
        code=data.code,
        address=data.address,
        city=data.city,
        phone=data.phone
    )
    db.add(hostel)
    db.commit()
    db.refresh(hostel)
    return hostel

@router.get("/{hostel_id}/stats", response_model=HostelStatsResponse)
def get_hostel_statistics(
    hostel_id: str,
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db)
):
    hostel = db.query(Hostel).filter(
        Hostel.id == hostel_id,
        Hostel.organization_id == ctx.organization_id
    ).first()
    if not hostel:
        raise HTTPException(status_code=404, detail="Hostel not found.")
        
    buildings_count = db.query(Building).filter(Building.hostel_id == hostel_id).count()
    rooms_count = db.query(Room).filter(Room.hostel_id == hostel_id).count()
    
    total_beds = db.query(Bed).filter(Bed.hostel_id == hostel_id, Bed.is_active == True).count()
    occupied_beds = db.query(Bed).filter(Bed.hostel_id == hostel_id, Bed.status == BedStatus.OCCUPIED).count()
    available_beds = total_beds - occupied_beds
    
    occupancy_rate = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0.0
    active_students = db.query(Student).filter(Student.hostel_id == hostel_id, Student.status == StudentStatus.ACTIVE).count()
    
    return HostelStatsResponse(
        hostel_id=hostel.id,
        hostel_name=hostel.name,
        total_buildings=buildings_count,
        total_rooms=rooms_count,
        total_beds=total_beds,
        occupied_beds=occupied_beds,
        available_beds=available_beds,
        occupancy_rate=occupancy_rate,
        active_students=active_students
    )
