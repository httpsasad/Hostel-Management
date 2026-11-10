from typing import Optional, List
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.tenant import User, Membership, Organization, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise credentials_exception
    return user

class TenantContext:
    def __init__(self, organization_id: str, hostel_id: Optional[str], role: UserRole, user: User):
        self.organization_id = organization_id
        self.hostel_id = hostel_id
        self.role = role
        self.user = user

def get_tenant_context(
    current_user: User = Depends(get_current_user),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
    x_hostel_id: Optional[str] = Header(None, alias="X-Hostel-Id"),
    db: Session = Depends(get_db)
) -> TenantContext:
    """Validates that current_user has active membership in the requested organization"""
    if current_user.is_superadmin:
        # Super admin can inspect any org
        org_id = x_organization_id or (current_user.memberships[0].organization_id if current_user.memberships else "platform")
        return TenantContext(
            organization_id=org_id,
            hostel_id=x_hostel_id,
            role=UserRole.SUPER_ADMIN,
            user=current_user
        )
    
    # Non-superadmin: look for membership in requested or default org
    membership = None
    if x_organization_id:
        membership = db.query(Membership).filter(
            Membership.user_id == current_user.id,
            Membership.organization_id == x_organization_id,
            Membership.is_active == True
        ).first()
    else:
        # Pick first active membership
        membership = db.query(Membership).filter(
            Membership.user_id == current_user.id,
            Membership.is_active == True
        ).first()
        
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active membership found for this organization."
        )
        
    return TenantContext(
        organization_id=membership.organization_id,
        hostel_id=x_hostel_id or membership.hostel_id,
        role=membership.role,
        user=current_user
    )

def require_roles(allowed_roles: List[UserRole]):
    def role_checker(ctx: TenantContext = Depends(get_tenant_context)):
        if ctx.user.is_superadmin or ctx.role == UserRole.HOSTEL_OWNER:
            return ctx
        if ctx.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action requires one of the following roles: {[r.value for r in allowed_roles]}"
            )
        return ctx
    return role_checker
