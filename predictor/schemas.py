"""
Pydantic schemas for the prediction API.

Why: catches bad input *before* it reaches the ML model. Way cleaner than
the manual validation DRF was doing. Also auto-documents the contract.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional


TransportMode = Literal['AIR', 'SEA', 'ROAD', 'RAIL']
Intensity = Literal['LOW', 'MEDIUM', 'HIGH']
EOL = Literal['RECYCLED', 'INCINERATED', 'LANDFILL']
Country = Literal['CHINA', 'INDIA', 'USA', 'GERMANY', 'FRANCE',
                  'SWEDEN', 'AUSTRALIA', 'BRAZIL', 'JAPAN', 'UK']


class PredictRequest(BaseModel):
    """Single-product prediction request."""
    product_name: str = Field(default="Unknown Product", max_length=200)
    material: str = Field(..., max_length=50)
    weight_kg: float = Field(..., gt=0, le=1000)
    transport_mode: TransportMode
    transport_distance_km: float = Field(..., ge=0, le=50000)
    manufacturing_intensity: Intensity = 'MEDIUM'
    country: Country = 'USA'
    eol: EOL = 'LANDFILL'

    @field_validator('material')
    @classmethod
    def material_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('material cannot be empty')
        return v.strip()


class CompareRequest(BaseModel):
    """Compare multiple products in one shot."""
    products: list[PredictRequest] = Field(..., min_length=2, max_length=10)


class BoMDecomposeRequest(BaseModel):
    """Natural-language → bill of materials."""
    description: str = Field(..., min_length=3, max_length=500)
    country: Country = 'CHINA'
    eol: EOL = 'LANDFILL'
