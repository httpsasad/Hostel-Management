from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_tenant_context, require_roles, TenantContext
from app.core.security import get_password_hash
from app.models.tenant import User, Membership, UserRole
from app.models.accommodation import Bed, BedStatus, Allocation, AllocationStatus
from app.models.student import Student, StudentStatus, Guardian

router = APIRouter(prefix="/students", tags=["Students & Admissions"])

class StudentAdmitRequest(BaseModel):
    hostel_id: str
    full_name: str
    email: EmailStr
    phone: str
    admission_number: str
    national_id: Optional[str] = None
    college_university: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact_name: str
    emergency_contact_phone: str
    emergency_contact_relation: str
    bed_id: Optional[str] = None # Optional initial bed allocation

class StudentResponse(BaseModel):
    id: str
    admission_number: str
    full_name: str
    email: str
    phone: Optional[str]
    status: StudentStatus
    hostel_id: str
    bed_number: Optional[str] = None
    room_number: Optional[str] = None

class BedAllocationRequest(BaseModel):
    student_id: str
    bed_id: str
    start_date: date
    end_date: Optional[date] = None

@router.get("", response_model=List[StudentResponse])
def list_students(
    hostel_id: Optional[str] = None,
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db)
):
    query = db.query(Student).filter(Student.organization_id == ctx.organization_id)
    target_hostel = hostel_id or ctx.hostel_id
    if target_hostel:
        query = query.filter(Student.hostel_id == target_hostel)
        
    students = query.all()
    results = []
    for s in students:
        bed_num = None
        room_num = None
        active_alloc = db.query(Allocation).filter(
            Allocation.student_id == s.id,
            Allocation.status == AllocationStatus.ACTIVE
        ).first()
        if active_alloc and active_alloc.bed:
            bed_num = active_alloc.bed.bed_number
            if active_alloc.bed.room:
                room_num = active_alloc.bed.room.room_number
                
        results.append(StudentResponse(
            id=s.id,
            admission_number=s.admission_number,
            full_name=s.user.full_name if s.user else "Unknown",
            email=s.user.email if s.user else "",
            phone=s.user.phone if s.user else None,
            status=s.status,
            hostel_id=s.hostel_id,
            bed_number=bed_num,
            room_number=room_num
        ))
    return results

@router.post("/admit", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def admit_student(
    data: StudentAdmitRequest,
    ctx: TenantContext = Depends(require_roles([UserRole.HOSTEL_OWNER, UserRole.WARDEN])),
    db: Session = Depends(get_db)
):
    # Check if admission number exists in org
    existing_admission = db.query(Student).filter(
        Student.organization_id == ctx.organization_id,
        Student.admission_number == data.admission_number
    ).first()
    if existing_admission:
        raise HTTPException(status_code=400, detail="Admission number already registered.")
        
    # Check if user account already exists, else create one
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        temp_pwd = f"Hostel@{data.admission_number[-4:] if len(data.admission_number)>=4 else '2026'}"
        user = User(
            email=data.email,
            hashed_password=get_password_hash(temp_pwd),
            full_name=data.full_name,
            phone=data.phone,
            is_active=True
        )
        db.add(user)
        db.flush()
        
    # Add Student Role Membership
    membership = Membership(
        user_id=user.id,
        organization_id=ctx.organization_id,
        hostel_id=data.hostel_id,
        role=UserRole.STUDENT
    )
    db.add(membership)
    
    # Create Student Record
    student = Student(
        organization_id=ctx.organization_id,
        hostel_id=data.hostel_id,
        user_id=user.id,
        admission_number=data.admission_number,
        registration_date=date.today(),
        national_id=data.national_id,
        college_university=data.college_university,
        blood_group=data.blood_group,
        status=StudentStatus.ACTIVE,
        emergency_contact_name=data.emergency_contact_name,
        emergency_contact_phone=data.emergency_contact_phone,
        emergency_contact_relation=data.emergency_contact_relation
    )
    db.add(student)
    db.flush()
    
    bed_num = None
    room_num = None
    
    # Allocate bed if provided
    if data.bed_id:
        bed = db.query(Bed).filter(
            Bed.id == data.bed_id,
            Bed.hostel_id == data.hostel_id,
            Bed.status == BedStatus.AVAILABLE
        ).with_for_update().first()
        
        if not bed:
            raise HTTPException(status_code=400, detail="Selected bed is not available.")
            
        allocation = Allocation(
            organization_id=ctx.organization_id,
            hostel_id=data.hostel_id,
            bed_id=bed.id,
            student_id=student.id,
            start_date=date.today(),
            status=AllocationStatus.ACTIVE
        )
        bed.status = BedStatus.OCCUPIED
        db.add(allocation)
        bed_num = bed.bed_number
        if bed.room:
            room_num = bed.room.room_number
            
    db.commit()
    return StudentResponse(
        id=student.id,
        admission_number=student.admission_number,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        status=student.status,
        hostel_id=student.hostel_id,
        bed_number=bed_num,
        room_number=room_num
    )
