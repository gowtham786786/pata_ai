import httpx
from typing import List, Dict, Any
from .geo_utils import calculate_haversine_distance

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

async def _execute_overpass_query(query: str, lat: float, lon: float) -> List[Dict[str, Any]]:
    results = []
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(OVERPASS_URL, data={'data': query}, timeout=8.0)
            
        if response.status_code == 200:
            data = response.json()
            elements = data.get('elements', [])
            
            for el in elements:
                name = el.get('tags', {}).get('name', 'Unknown')
                element_type = el.get('tags', {}).get('amenity') or el.get('tags', {}).get('shop') or el.get('tags', {}).get('building') or 'landmark'
                
                # For ways/relations, Overpass returns 'center' coords
                el_lat = el.get('lat') or (el.get('center', {}).get('lat'))
                el_lon = el.get('lon') or (el.get('center', {}).get('lon'))
                
                if el_lat and el_lon:
                    distance = calculate_haversine_distance(lat, lon, el_lat, el_lon)
                    results.append({
                        "name": name,
                        "distance_meters": distance,
                        "type": element_type,
                        "lat": el_lat,
                        "lon": el_lon
                    })
                    
            # Sort by closest first
            results.sort(key=lambda x: x['distance_meters'])
            return results

    except httpx.TimeoutException:
        print("Overpass API timeout")
    except Exception as e:
        print(f"Overpass API error: {e}")

    return []

async def search_nearby_landmarks(lat: float, lon: float, keyword: str, radius_meters: int = 2000) -> List[Dict[str, Any]]:
    """
    Searches for a landmark near a given coordinate using the OpenStreetMap Overpass API.
    Returns a list of matches ranked by distance.
    """
    if not keyword:
        return []

    # Clean the keyword for basic regex matching in Overpass
    clean_keyword = keyword.replace('"', '').replace("'", "")
    
    # Overpass QL Query: Search for nodes, ways, or relations containing the keyword in their name
    query = f"""
    [out:json][timeout:5];
    (
      node["name"~"(?i){clean_keyword}"](around:{radius_meters},{lat},{lon});
      way["name"~"(?i){clean_keyword}"](around:{radius_meters},{lat},{lon});
      relation["name"~"(?i){clean_keyword}"](around:{radius_meters},{lat},{lon});
    );
    out center;
    """

    return await _execute_overpass_query(query, lat, lon)

async def search_generic_pois(lat: float, lon: float, radius_meters: int = 1000) -> List[Dict[str, Any]]:
    """
    Fetches generic points of interest (hospitals, banks, schools, etc.) as fallbacks.
    """
    query = f"""
    [out:json][timeout:5];
    (
      node["amenity"~"bank|hospital|school|place_of_worship|police|post_office"](around:{radius_meters},{lat},{lon});
      way["amenity"~"bank|hospital|school|place_of_worship|police|post_office"](around:{radius_meters},{lat},{lon});
    );
    out center limit 10;
    """
    return await _execute_overpass_query(query, lat, lon)
