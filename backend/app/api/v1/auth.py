import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.core.dependencies import get_current_user
from app.models.tenant import User, Organization, Membership, Hostel, UserRole
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse, UserMembershipResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_organization_and_owner(data: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
        
    # Generate unique slug for organization
    base_slug = slugify(data.organization_name)
    slug = base_slug
    counter = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
        
    # Create Organization
    org = Organization(
        name=data.organization_name,
        slug=slug,
        subscription_plan="starter"
    )
    db.add(org)
    db.flush() # obtain org.id
    
    # Create Default Main Hostel Branch
    default_hostel = Hostel(
        organization_id=org.id,
        name=f"{data.organization_name} - Main Branch",
        code="MAIN-01",
        city="Default City"
    )
    db.add(default_hostel)
    db.flush()
    
    # Create User
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        phone=data.phone,
        is_active=True
    )
    db.add(user)
    db.flush() # obtain user.id
    
    # Create Membership as HOSTEL_OWNER
    membership = Membership(
        user_id=user.id,
        organization_id=org.id,
        hostel_id=default_hostel.id,
        role=UserRole.HOSTEL_OWNER,
        is_active=True
    )
    db.add(membership)
    db.commit()
    
    # Generate Tokens
    access_token = create_access_token(
        subject=user.id,
        extra_claims={
            "org_id": org.id,
            "role": UserRole.HOSTEL_OWNER.value,
            "email": user.email
        }
    )
    refresh_token = create_refresh_token(subject=user.id)
    
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated."
        )
        
    # Get primary membership
    primary_membership = db.query(Membership).filter(
        Membership.user_id == user.id,
        Membership.is_active == True
    ).first()
    
    org_id = primary_membership.organization_id if primary_membership else None
    role = primary_membership.role.value if primary_membership else "USER"
    
    access_token = create_access_token(
        subject=user.id,
        extra_claims={
            "org_id": org_id,
            "role": role,
            "email": user.email
        }
    )
    refresh_token = create_refresh_token(subject=user.id)
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    memberships = []
    for m in current_user.memberships:
        if m.is_active and m.organization:
            memberships.append(UserMembershipResponse(
                organization_id=m.organization_id,
                organization_name=m.organization.name,
                hostel_id=m.hostel_id,
                role=m.role
            ))
            
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        is_active=current_user.is_active,
        is_superadmin=current_user.is_superadmin,
        memberships=memberships
    )
