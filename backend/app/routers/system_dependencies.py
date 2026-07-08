from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.system_dependency import SystemDependencyCreate, SystemDependencyResponse, SystemDependencyUpdate
from app.services import system_dependency_service as svc

router = APIRouter(prefix="/system-dependencies", tags=["system-dependencies"])


@router.get("", response_model=list[SystemDependencyResponse])
async def list_dependencies(
    system_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await svc.list_dependencies(db, system_id=system_id)


@router.post("", response_model=SystemDependencyResponse, status_code=201)
async def create_dependency(data: SystemDependencyCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_dependency(db, data)


@router.put("/{dep_id}", response_model=SystemDependencyResponse)
async def update_dependency(dep_id: int, data: SystemDependencyUpdate, db: AsyncSession = Depends(get_db)):
    return await svc.update_dependency(db, dep_id, data)


@router.delete("/{dep_id}", status_code=204)
async def delete_dependency(dep_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_dependency(db, dep_id)
