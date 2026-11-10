import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, Enum, DateTime, Date, Text
from sqlalchemy.orm import relationship
from app.core.database import BaseModel

class GateEventType(str, enum.Enum):
    CHECK_OUT = "CHECK_OUT"
    CHECK_IN = "CHECK_IN"

class LeaveStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"

class ComplaintCategory(str, enum.Enum):
    ELECTRICAL = "ELECTRICAL"
    PLUMBING = "PLUMBING"
    CLEANLINESS = "CLEANLINESS"
    FURNITURE = "FURNITURE"
    MESS_FOOD = "MESS_FOOD"
    WIFI_INTERNET = "WIFI_INTERNET"
    SECURITY = "SECURITY"
    OTHER = "OTHER"

class ComplaintPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EMERGENCY = "EMERGENCY"

class ComplaintStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class GateLog(BaseModel):
    __tablename__ = "gate_logs"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    hostel_id = Column(String(36), ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    
    event_type = Column(Enum(GateEventType), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    verified_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Guard user
    qr_token = Column(String(255), nullable=True)
    remarks = Column(String(500), nullable=True)

class LeaveRequest(BaseModel):
    __tablename__ = "leave_requests"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    hostel_id = Column(String(36), ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    
    reason = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    departure_date = Column(DateTime, nullable=False)
    expected_return = Column(DateTime, nullable=False)
    actual_return = Column(DateTime, nullable=True)
    
    status = Column(Enum(LeaveStatus), default=LeaveStatus.PENDING, nullable=False)
    reviewed_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    warden_remarks = Column(String(500), nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="leave_requests")

class Complaint(BaseModel):
    __tablename__ = "complaints"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    hostel_id = Column(String(36), ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    category = Column(Enum(ComplaintCategory), default=ComplaintCategory.OTHER, nullable=False)
    priority = Column(Enum(ComplaintPriority), default=ComplaintPriority.MEDIUM, nullable=False)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.OPEN, nullable=False)
    description = Column(Text, nullable=False)
    
    assigned_to_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="complaints")
