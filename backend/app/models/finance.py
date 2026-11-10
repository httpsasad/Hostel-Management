import enum
from sqlalchemy import Column, String, Integer, Numeric, Boolean, ForeignKey, Enum, Date, Text
from sqlalchemy.orm import relationship
from app.core.database import BaseModel

class InvoiceStatus(str, enum.Enum):
    PENDING = "PENDING"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"

class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    BANK_TRANSFER = "BANK_TRANSFER"
    ONLINE_GATEWAY = "ONLINE_GATEWAY"
    CHEQUE = "CHEQUE"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

class Invoice(BaseModel):
    __tablename__ = "invoices"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    hostel_id = Column(String(36), ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    
    invoice_number = Column(String(100), unique=True, index=True, nullable=False)
    billing_period_start = Column(Date, nullable=False)
    billing_period_end = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    
    total_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    paid_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.PENDING, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(BaseModel):
    __tablename__ = "invoice_items"
    
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(String(255), nullable=False) # e.g. "Room Rent - Nov 2026", "Mess Fee", "Security Deposit"
    amount = Column(Numeric(10, 2), nullable=False)

    invoice = relationship("Invoice", back_populates="items")

class Payment(BaseModel):
    __tablename__ = "payments"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    hostel_id = Column(String(36), ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False, index=True)
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    
    receipt_number = Column(String(100), unique=True, index=True, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.CASH, nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.COMPLETED, nullable=False)
    transaction_reference = Column(String(255), nullable=True)
    payment_date = Column(Date, nullable=False)
    collected_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
