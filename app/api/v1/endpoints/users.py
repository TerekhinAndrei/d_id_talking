from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

router = APIRouter()


class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class User(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    success: bool
    data: List[User]
    total: int
    message: Optional[str] = None


class UserResponse(BaseModel):
    success: bool
    data: Optional[User] = None
    message: Optional[str] = None
    error: Optional[str] = None


# Mock database for demonstration
users_db = {}


@router.get("/", response_model=UserListResponse)
async def get_users(skip: int = 0, limit: int = 100):
    """
    Retrieve all users with pagination
    """
    try:
        users = list(users_db.values())
        paginated_users = users[skip : skip + limit]
        
        return UserListResponse(
            success=True,
            data=paginated_users,
            total=len(users),
            message=f"Retrieved {len(paginated_users)} users"
        )
    except Exception as e:
        return UserListResponse(
            success=False,
            data=[],
            total=0,
            error=f"Failed to retrieve users: {str(e)}"
        )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """
    Retrieve a specific user by ID
    """
    try:
        if user_id not in users_db:
            return UserResponse(
                success=False,
                error="User not found"
            )
        
        return UserResponse(
            success=True,
            data=users_db[user_id],
            message="User retrieved successfully"
        )
    except Exception as e:
        return UserResponse(
            success=False,
            error=f"Failed to retrieve user: {str(e)}"
        )


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """
    Create a new user
    """
    try:
        # Check if email already exists
        for existing_user in users_db.values():
            if existing_user["email"] == user.email:
                return UserResponse(
                    success=False,
                    error="Email already registered"
                )
        
        user_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        user_data = {
            "id": user_id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "created_at": now,
            "updated_at": now
        }
        
        users_db[user_id] = user_data
        
        return UserResponse(
            success=True,
            data=user_data,
            message="User created successfully"
        )
    except Exception as e:
        return UserResponse(
            success=False,
            error=f"Failed to create user: {str(e)}"
        )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserUpdate):
    """
    Update an existing user
    """
    try:
        if user_id not in users_db:
            return UserResponse(
                success=False,
                error="User not found"
            )
        
        user_data = users_db[user_id]
        
        # Update only provided fields
        if user_update.email is not None:
            user_data["email"] = user_update.email
        if user_update.full_name is not None:
            user_data["full_name"] = user_update.full_name
        if user_update.is_active is not None:
            user_data["is_active"] = user_update.is_active
        
        user_data["updated_at"] = datetime.utcnow()
        
        return UserResponse(
            success=True,
            data=user_data,
            message="User updated successfully"
        )
    except Exception as e:
        return UserResponse(
            success=False,
            error=f"Failed to update user: {str(e)}"
        )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str):
    """
    Delete a user
    """
    if user_id not in users_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    del users_db[user_id]
    return None 