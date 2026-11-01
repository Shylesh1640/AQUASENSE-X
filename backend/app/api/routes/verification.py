"""Output verification routes."""
from fastapi import APIRouter, Request

router = APIRouter(prefix="/verification", tags=["Verification"])

@router.get("/latest")
async def get_latest_verification(request: Request):
    """Get latest output verification result."""
    verification_service = request.app.state.services['verification']
    result = verification_service.get_latest_verification()
    return result.dict()

@router.get("/history")
async def get_verification_history(request: Request):
    """Get verification history."""
    verification_service = request.app.state.services['verification']

    # Return latest verification (in full implementation, query from DB)
    result = verification_service.get_latest_verification()
    return [result.dict()]
