import io
import json
from pathlib import Path
import pandas as pd

def parse_import(filename: str, content: bytes):
    suffix = Path(filename).suffix.lower()
    if suffix == ".csv":
        df = pd.read_csv(io.BytesIO(content))
        return df.where(pd.notnull(df), None).to_dict(orient="records")
    if suffix == ".xlsx":
        df = pd.read_excel(io.BytesIO(content))
        return df.where(pd.notnull(df), None).to_dict(orient="records")
    if suffix in {".geojson", ".json"}:
        data = json.loads(content.decode("utf-8"))
        if data.get("type") == "FeatureCollection":
            return data.get("features", [])
        if data.get("type") == "Feature":
            return [data]
        raise ValueError("JSON must be a GeoJSON Feature or FeatureCollection")
    raise ValueError("Unsupported file type")
