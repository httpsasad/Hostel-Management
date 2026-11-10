import enum
from sqlalchemy import Column, String, Boolean, ForeignKey, Enum, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import BaseModel

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    HOSTEL_OWNER = "HOSTEL_OWNER"
    WARDEN = "WARDEN"
    ACCOUNTANT = "ACCOUNTANT"
    SECURITY_GUARD = "SECURITY_GUARD"
    MESS_MANAGER = "MESS_MANAGER"
    MAINTENANCE = "MAINTENANCE"
    STUDENT = "STUDENT"
    GUARDIAN = "GUARDIAN"

class Organization(BaseModel):
    """Tenant Root entity"""
    __tablename__ = "organizations"
    
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    subscription_plan = Column(String(50), default="starter", nullable=False)
    settings = Column(Text, nullable=True) # JSON config
    
    # Relationships
    hostels = relationship("Hostel", back_populates="organization", cascade="all, delete-orphan")
    memberships = relationship("Membership", back_populates="organization", cascade="all, delete-orphan")

class Hostel(BaseModel):
    """Hostel / Branch belonging to an Organization"""
    __tablename__ = "hostels"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    organization = relationship("Organization", back_populates="hostels")
    buildings = relationship("Building", back_populates="hostel", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_org_hostel_code"),
    )

class User(BaseModel):
    """Global User Identity"""
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superadmin = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")

class Membership(BaseModel):
    """Tenant-scoped user membership with assigned Role"""
    __tablename__ = "memberships"
    
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    hostel_id = Column(String(36), ForeignKey("hostels.id", ondelete="SET NULL"), nullable=True, index=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="memberships")
    organization = relationship("Organization", back_populates="memberships")
    hostel = relationship("Hostel")
    
    __table_args__ = (
        UniqueConstraint("user_id", "organization_id", "role", name="uq_user_org_role"),
    )
