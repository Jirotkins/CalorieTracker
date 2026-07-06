from pydantic import BaseModel, ConfigDict

class PortionCreate(BaseModel):
    name: str  # např. "krajíc", "kousek"
    weight_grams: int

class PortionResponse(BaseModel):
    id: int
    name: str
    weight_grams: int
    
    model_config = ConfigDict(from_attributes=True)
