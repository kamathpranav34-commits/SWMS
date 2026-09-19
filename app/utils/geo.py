from shapely.geometry import shape

def validate_geojson_geometry(geometry: dict):
    geom = shape(geometry)
    if geom.is_empty:
        raise ValueError("Geometry is empty")
    if not geom.is_valid:
        raise ValueError("Geometry is invalid")
    return geom
