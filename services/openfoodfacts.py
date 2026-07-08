import urllib.request
import json
from typing import Dict, Any, Optional

def fetch_food_from_off(barcode: str) -> Optional[Dict[str, Any]]:
    """Dotáže se Open Food Facts API a vrátí potřebná makra, nebo None, pokud neexistuje."""
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    
    try:
        # Použití vlastní User-Agent pro prevenci blokace
        req = urllib.request.Request(url, headers={'User-Agent': 'CalorieTrackerApp - Python - V1.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            # Status 1 znamená, že to OFF našel
            if data.get("status") != 1:
                return None 
                
            product = data.get("product", {})
            nutriments = product.get("nutriments", {})
            
            # Vezme small verzi pro maximální rychlost stahování z frontendu
            photo_url = product.get("image_front_small_url") or product.get("image_front_url")
            
            return {
                "name": product.get("product_name_cs") or product.get("product_name") or "Neznámý název",
                "barcode": barcode,
                "photo_url": photo_url,
                "calories_per_100g": int(nutriments.get("energy-kcal_100g", 0)),
                "fat_per_100g": float(nutriments.get("fat_100g", 0)),
                "saturates_per_100g": float(nutriments.get("saturated-fat_100g", 0)),
                "carbs_per_100g": float(nutriments.get("carbohydrates_100g", 0)),
                "sugar_per_100g": float(nutriments.get("sugars_100g", 0)),
                "protein_per_100g": float(nutriments.get("proteins_100g", 0)),
                "salt_per_100g": float(nutriments.get("salt_100g", 0))
            }
            
    except Exception as e:
        print(f"Chyba při komunikaci s OFF: {e}")
        return None
