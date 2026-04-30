from mcp.server.fastmcp import FastMCP
import json
import uuid

# Initialize FastMCP server for Marketplace Indexing
mcp = FastMCP("MarketplaceIndexer")

# Mock Database for items
MOCK_DB = []

@mcp.tool()
def index_marketplace_item(image_url: str, description: str, price: float, tags: list[str]) -> str:
    """
    Validates metadata and indexes a new artisan marketplace item.
    
    Args:
        image_url: URL or local path where the image is stored.
        description: Description of the marketplace item.
        price: Price of the item (must be non-negative).
        tags: List of descriptive tags for the item.
        
    Returns:
        JSON string containing the indexed item details and status.
    """
    # Validation logic
    if price < 0:
        return json.dumps({
            "status": "error",
            "message": "Price cannot be negative."
        })
        
    if not description or not description.strip():
        return json.dumps({
            "status": "error",
            "message": "Description cannot be empty."
        })

    item_id = str(uuid.uuid4())
    item = {
        "id": item_id,
        "image_url": image_url,
        "description": description.strip(),
        "price": price,
        "tags": tags,
        "status": "indexed"
    }
    
    # Save to mock database
    MOCK_DB.append(item)
    
    result = {
        "status": "success",
        "message": "Item successfully indexed.",
        "item": item
    }
    
    return json.dumps(result, indent=2)

if __name__ == "__main__":
    mcp.run()
