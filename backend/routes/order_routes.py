from fastapi import APIRouter
from database import db
from models.order_model import Order
from models.product_model import Product
from bson import ObjectId

router = APIRouter()

@router.post("/orders", status_code=201)
async def create_order(order: Order):
    order_data = {
        "userId": order.userId,
        "items": [
            {
                "productId": ObjectId(item.productId),
                "qty": item.qty
            } for item in order.items
        ]
    }

    # Try to find existing order by userId
    existing_order = await db.orders.find_one({"userId": order.userId})

    if existing_order:
        # Append new items to the existing order
        await db.orders.update_one(
            {"_id": existing_order["_id"]},
            {"$push": {"items": {"$each": order_data["items"]}}}
        )
        return {
            "_id": str(existing_order["_id"])
        }
    else:
        # Insert new order document
        res = await db.orders.insert_one(order_data)
        return {
            "_id": str(res.inserted_id)
        }


@router.get("/orders/{userId}")
async def get_user_orders(userId: str, limit: int = 10, offset: int = 0):
    orders = []

    cursor = db.orders.find({"userId": userId}).skip(offset).limit(limit)

    async for order in cursor:
        enriched_items = []

        for item in order.get("items", []):
            product_id = item.get("productId")
            qty = item.get("qty")

            # Fetch product from products collection
            product = await db.products.find_one({"_id": ObjectId(product_id)})

            enriched_items.append({
                "productDetails": {
                    "name": product.get("name", "Unknown") if product else "Not found",
                    "id": str(product_id)
                },
                "qty": qty
            })

        # Optional: total price computation (if price exists)
        total = 0.0
        if product:
            total = sum(item["qty"] * product.get("price", 0) for item in order["items"])

        orders.append({
            "id": str(order["_id"]),
            "items": enriched_items,
            "total": total
        })

    return {
        "data": orders,
        "page": {
            "next": offset + limit,
            "limit": limit,
            "previous": max(0, offset - limit)
        }
    }
    
    
    
@router.get("/test-orders/{userId}")
async def test_orders(userId: str):
    orders = []

    cursor = db.orders.find({"userId": userId})  # Ensure field name matches your DB

    async for order in cursor:
        order["_id"] = str(order["_id"])
        enriched_items = []

        for item in order.get("items", []):
            product_id = item.get("productId")
            try:
                product = await db.products.find_one({"_id": ObjectId(product_id)})
            except:
                product = None

            # Add product details if found
            item["productId"] = str(product_id)
            item["productDetails"] = {
                "name": product.get("name", "Unknown") if product else "Not found",
                "price": product.get("price", 0) if product else 0,
                "sizes": product.get("sizes", []) if product else []
            }

            enriched_items.append(item)

        order["items"] = enriched_items
        orders.append(order)

    return {"orders": orders}

