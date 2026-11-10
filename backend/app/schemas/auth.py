from typing import Optional, List
from pydantic import BaseModel, EmailStr
from app.models.tenant import UserRole

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    organization_name: str
    role: UserRole = UserRole.HOSTEL_OWNER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserMembershipResponse(BaseModel):
    organization_id: str
    organization_name: str
    hostel_id: Optional[str] = None
    role: UserRole

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    is_superadmin: bool
    memberships: List[UserMembershipResponse] = []

    class Config:
        from_attributes = True
