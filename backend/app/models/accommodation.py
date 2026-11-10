import enum
from sqlalchemy import Column, String, Integer, Numeric, Boolean, ForeignKey, Enum, Date, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import BaseModel

class BedStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    MAINTENANCE = "MAINTENANCE"
    RESERVED = "RESERVED"

class AllocationStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    TRANSFERRED = "TRANSFERRED"
    CHECKED_OUT = "CHECKED_OUT"
    CANCELLED = "CANCELLED"

class Building(BaseModel):
    __tablename__ = "buildings"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    hostel_id = Column(String(36), ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)
    
    # Relationships
    hostel = relationship("Hostel", back_populates="buildings")
    floors = relationship("Floor", back_populates="building", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint("hostel_id", "code", name="uq_hostel_building_code"),
    )

class Floor(BaseModel):
    __tablename__ = "floors"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    hostel_id = Column(String(36), ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False, index=True)
    building_id = Column(String(36), ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False, index=True)
    floor_number = Column(Integer, nullable=False)
    name = Column(String(100), nullable=True) # e.g. "Ground Floor", "1st Floor"
    
    # Relationships
    building = relationship("Building", back_populates="floors")
    rooms = relationship("Room", back_populates="floor", cascade="all, delete-orphan")

class RoomType(BaseModel):
    __tablename__ = "room_types"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    hostel_id = Column(String(36), ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False) # e.g. "Deluxe Double", "Single AC", "3-Seater"
    capacity = Column(Integer, default=1, nullable=False)
    monthly_rate = Column(Numeric(10, 2), nullable=False)
    amenities = Column(String(500), nullable=True)

class Room(BaseModel):
    __tablename__ = "rooms"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    hostel_id = Column(String(36), ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False, index=True)
    floor_id = Column(String(36), ForeignKey("floors.id", ondelete="CASCADE"), nullable=False, index=True)
    room_type_id = Column(String(36), ForeignKey("room_types.id", ondelete="SET NULL"), nullable=True)
    
    room_number = Column(String(50), nullable=False)
    capacity = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    floor = relationship("Floor", back_populates="rooms")
    room_type = relationship("RoomType")
    beds = relationship("Bed", back_populates="room", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint("hostel_id", "room_number", name="uq_hostel_room_number"),
    )

class Bed(BaseModel):
    __tablename__ = "beds"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    hostel_id = Column(String(36), ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False, index=True)
    room_id = Column(String(36), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    
    bed_number = Column(String(50), nullable=False) # e.g. "B1", "Bed-A"
    status = Column(Enum(BedStatus), default=BedStatus.AVAILABLE, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    room = relationship("Room", back_populates="beds")
    allocations = relationship("Allocation", back_populates="bed", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint("room_id", "bed_number", name="uq_room_bed_number"),
    )

class Allocation(BaseModel):
    __tablename__ = "allocations"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    hostel_id = Column(String(36), ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False, index=True)
    bed_id = Column(String(36), ForeignKey("beds.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    actual_checkout_date = Column(Date, nullable=True)
    status = Column(Enum(AllocationStatus), default=AllocationStatus.ACTIVE, nullable=False)
    notes = Column(String(500), nullable=True)
    
    # Relationships
    bed = relationship("Bed", back_populates="allocations")
    student = relationship("Student", back_populates="allocations")
