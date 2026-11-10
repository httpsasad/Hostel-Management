import uuid
from datetime import date, datetime
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_tenant_context, require_roles, TenantContext
from app.models.tenant import UserRole
from app.models.student import Student
from app.models.finance import Invoice, InvoiceItem, Payment, InvoiceStatus, PaymentMethod, PaymentStatus

router = APIRouter(prefix="/finance", tags=["Finance & Invoicing"])

class InvoiceItemCreate(BaseModel):
    description: str
    amount: float

class InvoiceCreate(BaseModel):
    hostel_id: str
    student_id: str
    billing_period_start: date
    billing_period_end: date
    due_date: date
    notes: Optional[str] = None
    items: List[InvoiceItemCreate]

class PaymentRecordCreate(BaseModel):
    hostel_id: str
    invoice_id: str
    amount: float
    payment_method: PaymentMethod = PaymentMethod.CASH
    transaction_reference: Optional[str] = None
    payment_date: Optional[date] = None

class InvoiceItemResponse(BaseModel):
    id: str
    description: str
    amount: float

    class Config:
        from_attributes = True

class PaymentResponse(BaseModel):
    id: str
    receipt_number: str
    amount: float
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    transaction_reference: Optional[str]
    payment_date: date

    class Config:
        from_attributes = True

class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    student_id: str
    student_name: str
    admission_number: str
    billing_period_start: date
    billing_period_end: date
    due_date: date
    total_amount: float
    paid_amount: float
    balance_due: float
    status: InvoiceStatus
    notes: Optional[str]
    items: List[InvoiceItemResponse] = []
    payments: List[PaymentResponse] = []

    class Config:
        from_attributes = True

class FinanceOverviewStats(BaseModel):
    total_billed: float
    total_collected: float
    total_outstanding: float
    total_overdue: float
    collection_rate: float
    total_invoices_count: int
    paid_invoices_count: int
    pending_invoices_count: int

@router.get("/invoices", response_model=List[InvoiceResponse])
def list_invoices(
    hostel_id: Optional[str] = None,
    status_filter: Optional[InvoiceStatus] = None,
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db)
):
    query = db.query(Invoice).filter(Invoice.organization_id == ctx.organization_id)
    target_hostel = hostel_id or ctx.hostel_id
    if target_hostel:
        query = query.filter(Invoice.hostel_id == target_hostel)
    if status_filter:
        query = query.filter(Invoice.status == status_filter)
        
    invoices = query.order_by(Invoice.created_at.desc()).all()
    results = []
    for inv in invoices:
        student = db.query(Student).filter(Student.id == inv.student_id).first()
        student_name = student.user.full_name if student and student.user else "Student"
        admission_num = student.admission_number if student else "N/A"
        
        balance = float(inv.total_amount) - float(inv.paid_amount)
        results.append(InvoiceResponse(
            id=inv.id,
            invoice_number=inv.invoice_number,
            student_id=inv.student_id,
            student_name=student_name,
            admission_number=admission_num,
            billing_period_start=inv.billing_period_start,
            billing_period_end=inv.billing_period_end,
            due_date=inv.due_date,
            total_amount=float(inv.total_amount),
            paid_amount=float(inv.paid_amount),
            balance_due=max(0.0, balance),
            status=inv.status,
            notes=inv.notes,
            items=[InvoiceItemResponse(id=it.id, description=it.description, amount=float(it.amount)) for it in inv.items],
            payments=[PaymentResponse(
                id=p.id,
                receipt_number=p.receipt_number,
                amount=float(p.amount),
                payment_method=p.payment_method,
                payment_status=p.payment_status,
                transaction_reference=p.transaction_reference,
                payment_date=p.payment_date
            ) for p in inv.payments]
        ))
    return results

@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    data: InvoiceCreate,
    ctx: TenantContext = Depends(require_roles([UserRole.HOSTEL_OWNER, UserRole.ACCOUNTANT, UserRole.WARDEN])),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.id == data.student_id,
        Student.organization_id == ctx.organization_id
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    # Generate unique invoice number: INV-YEAR-RANDOM
    inv_count = db.query(Invoice).filter(Invoice.organization_id == ctx.organization_id).count() + 1
    invoice_number = f"INV-{date.today().year}-{inv_count:04d}"
    
    total = sum(item.amount for item in data.items)
    
    invoice = Invoice(
        organization_id=ctx.organization_id,
        hostel_id=data.hostel_id,
        student_id=data.student_id,
        invoice_number=invoice_number,
        billing_period_start=data.billing_period_start,
        billing_period_end=data.billing_period_end,
        due_date=data.due_date,
        total_amount=Decimal(str(total)),
        paid_amount=Decimal("0.00"),
        status=InvoiceStatus.PENDING,
        notes=data.notes
    )
    db.add(invoice)
    db.flush()
    
    for it in data.items:
        db_item = InvoiceItem(
            invoice_id=invoice.id,
            description=it.description,
            amount=Decimal(str(it.amount))
        )
        db.add(db_item)
        
    db.commit()
    db.refresh(invoice)
    
    student_name = student.user.full_name if student.user else "Student"
    return InvoiceResponse(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        student_id=invoice.student_id,
        student_name=student_name,
        admission_number=student.admission_number,
        billing_period_start=invoice.billing_period_start,
        billing_period_end=invoice.billing_period_end,
        due_date=invoice.due_date,
        total_amount=float(invoice.total_amount),
        paid_amount=float(invoice.paid_amount),
        balance_due=float(invoice.total_amount),
        status=invoice.status,
        notes=invoice.notes,
        items=[InvoiceItemResponse(id=it.id, description=it.description, amount=float(it.amount)) for it in invoice.items],
        payments=[]
    )

@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(
    data: PaymentRecordCreate,
    ctx: TenantContext = Depends(require_roles([UserRole.HOSTEL_OWNER, UserRole.ACCOUNTANT, UserRole.WARDEN])),
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == data.invoice_id,
        Invoice.organization_id == ctx.organization_id
    ).with_for_update().first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")
        
    pay_count = db.query(Payment).filter(Payment.organization_id == ctx.organization_id).count() + 1
    receipt_number = f"RCP-{date.today().year}-{pay_count:05d}"
    
    pay_amount = Decimal(str(data.amount))
    payment = Payment(
        organization_id=ctx.organization_id,
        hostel_id=data.hostel_id,
        invoice_id=invoice.id,
        receipt_number=receipt_number,
        amount=pay_amount,
        payment_method=data.payment_method,
        payment_status=PaymentStatus.COMPLETED,
        transaction_reference=data.transaction_reference,
        payment_date=data.payment_date or date.today(),
        collected_by_id=ctx.user.id
    )
    db.add(payment)
    
    # Update Invoice Balance & Status
    new_paid = invoice.paid_amount + pay_amount
    invoice.paid_amount = new_paid
    if new_paid >= invoice.total_amount:
        invoice.status = InvoiceStatus.PAID
    elif new_paid > 0:
        invoice.status = InvoiceStatus.PARTIALLY_PAID
        
    db.commit()
    db.refresh(payment)
    
    return PaymentResponse(
        id=payment.id,
        receipt_number=payment.receipt_number,
        amount=float(payment.amount),
        payment_method=payment.payment_method,
        payment_status=payment.payment_status,
        transaction_reference=payment.transaction_reference,
        payment_date=payment.payment_date
    )

@router.get("/stats", response_model=FinanceOverviewStats)
def get_finance_stats(
    hostel_id: Optional[str] = None,
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db)
):
    query = db.query(Invoice).filter(Invoice.organization_id == ctx.organization_id)
    target_hostel = hostel_id or ctx.hostel_id
    if target_hostel:
        query = query.filter(Invoice.hostel_id == target_hostel)
        
    invoices = query.all()
    total_billed = sum(float(i.total_amount) for i in invoices)
    total_collected = sum(float(i.paid_amount) for i in invoices)
    total_outstanding = max(0.0, total_billed - total_collected)
    
    today = date.today()
    total_overdue = sum(
        float(i.total_amount) - float(i.paid_amount)
        for i in invoices
        if i.due_date < today and i.status != InvoiceStatus.PAID
    )
    
    collection_rate = round((total_collected / total_billed * 100), 1) if total_billed > 0 else 0.0
    paid_count = sum(1 for i in invoices if i.status == InvoiceStatus.PAID)
    pending_count = sum(1 for i in invoices if i.status != InvoiceStatus.PAID)
    
    return FinanceOverviewStats(
        total_billed=total_billed,
        total_collected=total_collected,
        total_outstanding=total_outstanding,
        total_overdue=total_overdue,
        collection_rate=collection_rate,
        total_invoices_count=len(invoices),
        paid_invoices_count=paid_count,
        pending_invoices_count=pending_count
    )
