from datetime import datetime, timezone
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_tenant_context, require_roles, TenantContext
from app.models.tenant import UserRole
from app.models.student import Student
from app.models.operations import GateLog, GateEventType, Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus, LeaveRequest, LeaveStatus

router = APIRouter(prefix="/operations", tags=["Daily Operations (Gate, Complaints, Leaves)"])

class GateLogCreate(BaseModel):
    hostel_id: str
    student_admission_number: str
    event_type: GateEventType
    remarks: Optional[str] = None

class GateLogResponse(BaseModel):
    id: str
    event_type: GateEventType
    student_name: str
    admission_number: str
    timestamp: datetime
    remarks: Optional[str] = None

class ComplaintCreate(BaseModel):
    hostel_id: str
    student_id: Optional[str] = None
    title: str
    category: ComplaintCategory
    priority: ComplaintPriority = ComplaintPriority.MEDIUM
    description: str

class ComplaintResponse(BaseModel):
    id: str
    title: str
    category: ComplaintCategory
    priority: ComplaintPriority
    status: ComplaintStatus
    description: str
    student_name: str
    created_at: datetime

    class Config:
        from_attributes = True

class LeaveRequestCreate(BaseModel):
    hostel_id: str
    student_id: Optional[str] = None
    reason: str
    destination: str
    departure_date: datetime
    expected_return: datetime

class LeaveRequestResponse(BaseModel):
    id: str
    student_id: str
    student_name: str
    admission_number: str
    room_number: Optional[str]
    reason: str
    destination: str
    departure_date: datetime
    expected_return: datetime
    status: LeaveStatus
    warden_remarks: Optional[str]
    outpass_token: str

class GatePassVerifyRequest(BaseModel):
    hostel_id: str
    pass_token_or_admission: str
    event_type: GateEventType
    remarks: Optional[str] = None

class GatePassVerifyResponse(BaseModel):
    verified: bool
    student_name: str
    admission_number: str
    event_type: GateEventType
    timestamp: datetime
    message: str

@router.post("/gate-log", response_model=GateLogResponse, status_code=status.HTTP_201_CREATED)
def record_gate_log(
    data: GateLogCreate,
    ctx: TenantContext = Depends(require_roles([UserRole.SECURITY_GUARD, UserRole.WARDEN, UserRole.HOSTEL_OWNER])),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.organization_id == ctx.organization_id,
        Student.admission_number == data.student_admission_number
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student with this admission number not found.")
        
    log = GateLog(
        organization_id=ctx.organization_id,
        hostel_id=data.hostel_id,
        student_id=student.id,
        event_type=data.event_type,
        verified_by_id=ctx.user.id,
        remarks=data.remarks
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    
    return GateLogResponse(
        id=log.id,
        event_type=log.event_type,
        student_name=student.user.full_name if student.user else "Student",
        admission_number=student.admission_number,
        timestamp=log.timestamp,
        remarks=log.remarks
    )

@router.post("/gate-pass/verify", response_model=GatePassVerifyResponse)
def verify_gate_pass(
    data: GatePassVerifyRequest,
    ctx: TenantContext = Depends(require_roles([UserRole.SECURITY_GUARD, UserRole.WARDEN, UserRole.HOSTEL_OWNER])),
    db: Session = Depends(get_db)
):
    # Lookup by admission number or pass token prefix
    token_query = data.pass_token_or_admission.strip()
    student = db.query(Student).filter(
        Student.organization_id == ctx.organization_id,
        Student.admission_number == token_query
    ).first()
    
    leave_req = None
    if not student and token_query.startswith("PASS-"):
        leave_id = token_query.replace("PASS-", "")
        leave_req = db.query(LeaveRequest).filter(
            LeaveRequest.organization_id == ctx.organization_id,
            LeaveRequest.id.startswith(leave_id)
        ).first()
        if leave_req:
            student = leave_req.student

    if not student:
        raise HTTPException(status_code=404, detail="Invalid QR Code or student admission number.")

    # Record verified gate log
    remarks = data.remarks or ("QR Outpass Verified" if leave_req else "Station Check-in")
    log = GateLog(
        organization_id=ctx.organization_id,
        hostel_id=data.hostel_id,
        student_id=student.id,
        event_type=data.event_type,
        verified_by_id=ctx.user.id,
        qr_token=token_query,
        remarks=remarks
    )
    db.add(log)
    
    # If checking out on approved leave, update leave actual return or departure
    if leave_req and data.event_type == GateEventType.CHECK_IN:
        leave_req.status = LeaveStatus.COMPLETED
        leave_req.actual_return = datetime.now(timezone.utc)
        
    db.commit()
    
    student_name = student.user.full_name if student.user else "Student"
    return GatePassVerifyResponse(
        verified=True,
        student_name=student_name,
        admission_number=student.admission_number,
        event_type=data.event_type,
        timestamp=log.timestamp,
        message=f"Access Granted: {data.event_type.value} verified successfully."
    )

@router.get("/gate-logs", response_model=List[GateLogResponse])
def get_recent_gate_logs(
    hostel_id: Optional[str] = None,
    limit: int = 50,
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db)
):
    target_hostel = hostel_id or ctx.hostel_id
    query = db.query(GateLog).filter(GateLog.organization_id == ctx.organization_id)
    if target_hostel:
        query = query.filter(GateLog.hostel_id == target_hostel)
        
    logs = query.order_by(GateLog.timestamp.desc()).limit(limit).all()
    results = []
    for l in logs:
        student = db.query(Student).filter(Student.id == l.student_id).first()
        results.append(GateLogResponse(
            id=l.id,
            event_type=l.event_type,
            student_name=student.user.full_name if student and student.user else "Student",
            admission_number=student.admission_number if student else "N/A",
            timestamp=l.timestamp,
            remarks=l.remarks
        ))
    return results

@router.get("/leave-requests", response_model=List[LeaveRequestResponse])
def list_leave_requests(
    hostel_id: Optional[str] = None,
    status_filter: Optional[LeaveStatus] = None,
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db)
):
    query = db.query(LeaveRequest).filter(LeaveRequest.organization_id == ctx.organization_id)
    target_hostel = hostel_id or ctx.hostel_id
    if target_hostel:
        query = query.filter(LeaveRequest.hostel_id == target_hostel)
    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter)
        
    requests = query.order_by(LeaveRequest.created_at.desc()).all()
    results = []
    for req in requests:
        student = req.student
        student_name = student.user.full_name if student and student.user else "Student"
        admission_num = student.admission_number if student else "N/A"
        
        # Bed/Room info
        room_num = None
        if student and student.allocations:
            active_alloc = [a for a in student.allocations if a.status.value == "ACTIVE"]
            if active_alloc and active_alloc[0].bed and active_alloc[0].bed.room:
                room_num = active_alloc[0].bed.room.room_number

        token = f"PASS-{req.id[:8].upper()}"
        results.append(LeaveRequestResponse(
            id=req.id,
            student_id=req.student_id,
            student_name=student_name,
            admission_number=admission_num,
            room_number=room_num,
            reason=req.reason,
            destination=req.destination,
            departure_date=req.departure_date,
            expected_return=req.expected_return,
            status=req.status,
            warden_remarks=req.warden_remarks,
            outpass_token=token
        ))
    return results

@router.post("/leave-requests", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
def submit_leave_request(
    data: LeaveRequestCreate,
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db)
):
    student_id = data.student_id
    if ctx.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == ctx.user.id).first()
        if not student:
            raise HTTPException(status_code=400, detail="Student profile not found.")
        student_id = student.id
    elif not student_id:
        raise HTTPException(status_code=400, detail="Student ID is required.")

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    leave = LeaveRequest(
        organization_id=ctx.organization_id,
        hostel_id=data.hostel_id,
        student_id=student_id,
        reason=data.reason,
        destination=data.destination,
        departure_date=data.departure_date,
        expected_return=data.expected_return,
        status=LeaveStatus.PENDING
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)

    token = f"PASS-{leave.id[:8].upper()}"
    student_name = student.user.full_name if student.user else "Student"
    return LeaveRequestResponse(
        id=leave.id,
        student_id=student.id,
        student_name=student_name,
        admission_number=student.admission_number,
        room_number="101",
        reason=leave.reason,
        destination=leave.destination,
        departure_date=leave.departure_date,
        expected_return=leave.expected_return,
        status=leave.status,
        warden_remarks=leave.warden_remarks,
        outpass_token=token
    )

@router.patch("/leave-requests/{leave_id}/approve", response_model=LeaveRequestResponse)
def approve_or_reject_leave(
    leave_id: str,
    action: str, # "APPROVE" or "REJECT"
    remarks: Optional[str] = None,
    ctx: TenantContext = Depends(require_roles([UserRole.WARDEN, UserRole.HOSTEL_OWNER])),
    db: Session = Depends(get_db)
):
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.organization_id == ctx.organization_id
    ).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found.")

    if action.upper() == "APPROVE":
        leave.status = LeaveStatus.APPROVED
    elif action.upper() == "REJECT":
        leave.status = LeaveStatus.REJECTED
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use APPROVE or REJECT.")

    leave.reviewed_by_id = ctx.user.id
    leave.warden_remarks = remarks
    db.commit()
    db.refresh(leave)

    student = leave.student
    student_name = student.user.full_name if student and student.user else "Student"
    return LeaveRequestResponse(
        id=leave.id,
        student_id=leave.student_id,
        student_name=student_name,
        admission_number=student.admission_number if student else "N/A",
        room_number="101",
        reason=leave.reason,
        destination=leave.destination,
        departure_date=leave.departure_date,
        expected_return=leave.expected_return,
        status=leave.status,
        warden_remarks=leave.warden_remarks,
        outpass_token=f"PASS-{leave.id[:8].upper()}"
    )

@router.get("/complaints", response_model=List[ComplaintResponse])
def list_complaints(
    hostel_id: Optional[str] = None,
    status_filter: Optional[ComplaintStatus] = None,
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint).filter(Complaint.organization_id == ctx.organization_id)
    target_hostel = hostel_id or ctx.hostel_id
    if target_hostel:
        query = query.filter(Complaint.hostel_id == target_hostel)
    if status_filter:
        query = query.filter(Complaint.status == status_filter)
        
    complaints = query.order_by(Complaint.created_at.desc()).all()
    results = []
    for c in complaints:
        student = db.query(Student).filter(Student.id == c.student_id).first()
        results.append(ComplaintResponse(
            id=c.id,
            title=c.title,
            category=c.category,
            priority=c.priority,
            status=c.status,
            description=c.description,
            student_name=student.user.full_name if student and student.user else "Student",
            created_at=c.created_at
        ))
    return results

@router.post("/complaints", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def file_complaint(
    data: ComplaintCreate,
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db)
):
    student_id = data.student_id
    if ctx.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == ctx.user.id).first()
        if not student:
            raise HTTPException(status_code=400, detail="Student profile not found.")
        student_id = student.id
    elif not student_id:
        raise HTTPException(status_code=400, detail="Student ID is required.")
        
    complaint = Complaint(
        organization_id=ctx.organization_id,
        hostel_id=data.hostel_id,
        student_id=student_id,
        title=data.title,
        category=data.category,
        priority=data.priority,
        description=data.description,
        status=ComplaintStatus.OPEN
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    
    student = db.query(Student).filter(Student.id == student_id).first()
    return ComplaintResponse(
        id=complaint.id,
        title=complaint.title,
        category=complaint.category,
        priority=complaint.priority,
        status=complaint.status,
        description=complaint.description,
        student_name=student.user.full_name if student and student.user else "Student",
        created_at=complaint.created_at
    )
