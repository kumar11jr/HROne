from pydantic import BaseModel
from typing import List

class ProductSize(BaseModel):
    size: str
    quantity: int

class Product(BaseModel):
    name: str
    price: float
    sizes: List[ProductSize]
