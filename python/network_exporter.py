import sumolib
import xml.etree.ElementTree as ET
from .config import NET_FILE, ADDITIONAL_FILE

def get_network_geometry():
    """
    Exports full network topology, lane polylines, junction coordinates,
    bus stops, pedestrian crossings, and landmark polygons for the UI renderer.
    """
    net = sumolib.net.readNet(NET_FILE)
    bbox = net.getBBoxXY()

    # 1. Regular Edges and Lanes
    edges_data = []
    for e in net.getEdges():
        if e.isSpecial():
            continue
        lanes_data = []
        for l in e.getLanes():
            lanes_data.append({
                "id": l.getID(),
                "shape": [[round(pt[0], 2), round(pt[1], 2)] for pt in l.getShape()],
                "width": round(l.getWidth(), 2),
                "speed": round(l.getSpeed(), 2),
                "allow": list(l.getPermissions())
            })
        edges_data.append({
            "id": e.getID(),
            "type": e.getType(),
            "from": e.getFromNode().getID(),
            "to": e.getToNode().getID(),
            "lanes": lanes_data
        })

    # 2. Nodes / Junctions
    nodes_data = []
    for n in net.getNodes():
        nodes_data.append({
            "id": n.getID(),
            "x": round(n.getCoord()[0], 2),
            "y": round(n.getCoord()[1], 2),
            "type": n.getType(),
            "shape": [[round(pt[0], 2), round(pt[1], 2)] for pt in n.getShape()] if n.getShape() else []
        })

    # 3. Pedestrian Crossings (Parsed directly from network XML internal edges)
    crossings_data = []
    try:
        tree = ET.parse(NET_FILE)
        root = tree.getroot()
        for e in root.findall("edge"):
            func = e.get("function")
            if func == "crossing":
                for lane in e.findall("lane"):
                    raw_shape = lane.get("shape", "")
                    pts = []
                    for pair in raw_shape.strip().split():
                        if "," in pair:
                            x, y = pair.split(",")
                            pts.append([round(float(x), 2), round(float(y), 2)])
                    crossings_data.append({
                        "id": lane.get("id"),
                        "width": float(lane.get("width", 3.0)),
                        "shape": pts
                    })
    except Exception as ex:
        print(f"Warning extracting crossings: {ex}")

    # 4. Additionals: Bus Stops, Train Stops, Landmarks, Polygons
    bus_stops_data = []
    polygons_data = []
    try:
        tree = ET.parse(ADDITIONAL_FILE)
        root = tree.getroot()
        for bs in root.findall("busStop"):
            bus_stops_data.append({
                "id": bs.get("id"),
                "name": bs.get("name", bs.get("id")),
                "lane": bs.get("lane"),
                "startPos": float(bs.get("startPos", 0)),
                "endPos": float(bs.get("endPos", 0)),
                "lines": bs.get("lines", "").split()
            })
        for poly in root.findall("poly"):
            raw_shape = poly.get("shape", "")
            pts = []
            for pair in raw_shape.strip().split():
                if "," in pair:
                    x, y = pair.split(",")
                    pts.append([float(x), float(y)])
            
            raw_color = poly.get("color", "100,100,100,150").split(",")
            r = int(raw_color[0]) if len(raw_color) > 0 else 100
            g = int(raw_color[1]) if len(raw_color) > 1 else 100
            b = int(raw_color[2]) if len(raw_color) > 2 else 100
            a = float(raw_color[3]) / 255.0 if len(raw_color) > 3 else 0.5
            
            polygons_data.append({
                "id": poly.get("id"),
                "shape": pts,
                "color": f"rgba({r},{g},{b},{a})",
                "layer": int(poly.get("layer", 0))
            })
    except Exception as ex:
        print(f"Warning loading additionals geometry: {ex}")

    return {
        "bbox": {
            "min_x": round(bbox[0][0], 2),
            "min_y": round(bbox[0][1], 2),
            "max_x": round(bbox[1][0], 2),
            "max_y": round(bbox[1][1], 2)
        },
        "edges": edges_data,
        "nodes": nodes_data,
        "crossings": crossings_data,
        "bus_stops": bus_stops_data,
        "polygons": polygons_data
    }
