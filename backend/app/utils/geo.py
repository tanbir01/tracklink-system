import math

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees) in meters.
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371000  # Radius of earth in meters
    return c * r

def is_inside_geofence(device_lat: float, device_lon: float, fence_lat: float, fence_lon: float, radius_meters: float) -> bool:
    """
    Check if a device location is within a geofence radius.
    """
    distance = haversine_distance(device_lat, device_lon, fence_lat, fence_lon)
    return distance <= radius_meters
