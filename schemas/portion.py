from pydantic import BaseModel, ConfigDict
from typing import Optional

class PortionCreate(BaseModel):
    name: str  # např. "krajíc", "kousek"
    weight_grams: int

# Při úpravě jídla: s id = úprava existující porce, bez id = nová porce
class PortionUpdate(PortionCreate):
    id: Optional[int] = None

class PortionResponse(BaseModel):
    id: int
    name: str
    weight_grams: int
    
    model_config = ConfigDict(from_attributes=True)
