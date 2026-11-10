import enum
from sqlalchemy import Column, String, Boolean, ForeignKey, Enum, Date, Text
from sqlalchemy.orm import relationship
from app.core.database import BaseModel

class StudentStatus(str, enum.Enum):
    PENDING_ADMISSION = "PENDING_ADMISSION"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    ALUMNI = "ALUMNI"
    CHECKED_OUT = "CHECKED_OUT"

class ApplicationStatus(str, enum.Enum):
    PENDING = "PENDING"
    REVIEWING = "REVIEWING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Student(BaseModel):
    __tablename__ = "students"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    hostel_id = Column(String(36), ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    admission_number = Column(String(100), unique=True, index=True, nullable=False)
    registration_date = Column(Date, nullable=False)
    national_id = Column(String(100), nullable=True) # CNIC / Passport / SSN
    college_university = Column(String(255), nullable=True)
    course_department = Column(String(255), nullable=True)
    blood_group = Column(String(10), nullable=True)
    status = Column(Enum(StudentStatus), default=StudentStatus.ACTIVE, nullable=False)
    
    # Emergency contact
    emergency_contact_name = Column(String(255), nullable=False)
    emergency_contact_phone = Column(String(50), nullable=False)
    emergency_contact_relation = Column(String(100), nullable=False)
    
    # Relationships
    user = relationship("User")
    guardians = relationship("Guardian", back_populates="student", cascade="all, delete-orphan")
    allocations = relationship("Allocation", back_populates="student", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="student", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="student", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="student", cascade="all, delete-orphan")

class Guardian(BaseModel):
    __tablename__ = "guardians"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Optional portal login
    
    name = Column(String(255), nullable=False)
    relation = Column(String(100), nullable=False) # Father, Mother, Brother, etc.
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    is_primary = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    student = relationship("Student", back_populates="guardians")

class AdmissionApplication(BaseModel):
    __tablename__ = "admission_applications"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    hostel_id = Column(String(36), ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False, index=True)
    
    applicant_name = Column(String(255), nullable=False)
    applicant_email = Column(String(255), nullable=False)
    applicant_phone = Column(String(50), nullable=False)
    institution = Column(String(255), nullable=True)
    preferred_room_type_id = Column(String(36), ForeignKey("room_types.id", ondelete="SET NULL"), nullable=True)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING, nullable=False)
    review_notes = Column(Text, nullable=True)
