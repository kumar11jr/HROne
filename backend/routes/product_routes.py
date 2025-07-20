from fastapi import APIRouter,Query
from database import db
from models.product_model import Product
from bson import ObjectId

router = APIRouter()

@router.post("/products",status_code=201)
async def create_product(product:Product):
    res = await db.products.insert_one(product.model_dump())
    return {"_id":str(res.inserted_id)}

@router.get("/products")
async def list_products(name: str = "", size: str = "", limit: int = 10, offset: int = 0):
    query = {}
    
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    
    if size:
        query["sizes"] = {"$elemMatch": {"size": size}}

    cursor = db.products.find(query).skip(offset).limit(limit)
    products = []
    async for doc in cursor:
        products.append({
            "id": str(doc["_id"]),
            "name": doc["name"],
            "price": doc["price"]
        })

    return {
        "data": products,
        "page": {
            "next": offset + limit,
            "limit": len(products),
            "previous": max(offset - limit, 0)
        }
    }


    