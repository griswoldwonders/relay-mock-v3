import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import L, { type Map as LeafletMap, type TileLayer } from "leaflet";
import { Cross2Icon, LayersIcon, SewingPinIcon } from "@radix-ui/react-icons";
import { useKeyboard } from "./mobile";
import PrototypePhase1 from "./PrototypePhase1";
import "leaflet/dist/leaflet.css";
import "./prototype.css";

type MapFilter = "all" | "access" | "transit" | "institution";
type MapTag = Exclude<MapFilter, "all">;
type TileStatus = "loading" | "ready" | "fallback" | "error";

type CorridorPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tags: MapTag[];
  label: string;
  status: string;
  detail: string;
};

const CORRIDOR_POINTS: CorridorPoint[] = [
  {
    id: "glendale-transit-center",
    name: "Glendale Transportation Center",
    lat: 34.1236,
    lng: -118.2587,
    tags: ["access", "transit"],
    label: "Transit + Access Point candidate",
    status: "Candidate · administrative review required",
    detail: "Regional rail and bus anchor near the west end of the Pasadena–Eagle Rock–Glendale research corridor.",
  },
  {
    id: "eagle-rock-plaza",
    name: "Eagle Rock Plaza public edge",
    lat: 34.1399,
    lng: -118.2248,
    tags: ["access"],
    label: "Access Point candidate",
    status: "Candidate · site suitability review required",
    detail: "Public-facing corridor anchor used in the prototype to study low-detour meeting-point compatibility.",
  },
  {
    id: "memorial-park",
    name: "Memorial Park Station",
    lat: 34.1477,
    lng: -118.1479,
    tags: ["access", "transit"],
    label: "Metro A Line + Access Point candidate",
    status: "Transit anchor · designation not implied",
    detail: "Central Pasadena transit anchor that can support multimodal match previews and approximate-zone coordination.",
  },
  {
    id: "del-mar",
    name: "Del Mar Station",
    lat: 34.1419,
    lng: -118.1481,
    tags: ["access", "transit"],
    label: "Metro A Line + Access Point candidate",
    status: "Transit anchor · designation not implied",
    detail: "South Old Pasadena transit anchor for commuter-option previews that combine planned routes, walking, and rail.",
  },
  {
    id: "pasadena-city-college",
    name: "Pasadena City College",
    lat: 34.1444,
    lng: -118.1182,
    tags: ["institution"],
    label: "Institution destination anchor",
    status: "Program context · campus rules apply",
    detail: "Prototype destination anchor for the controlled PCC commuter-program demonstration.",
  },
  {
    id: "caltech",
    name: "Caltech",
    lat: 34.1377,
    lng: -118.1253,
    tags: ["institution"],
    label: "Institution anchor",
    status: "Research anchor · no partnership implied",
    detail: "Institutional anchor included for corridor research and future employer/campus TDM analysis.",
  },
  {
    id: "huntington-hospital",
    name: "Huntington Hospital",
    lat: 34.1336,
    lng: -118.1527,
    tags: ["institution"],
    label: "Healthcare anchor",
    status: "Research anchor · no pickup approval implied",
    detail: "Healthcare destination anchor relevant to shift-based commute demand and parking-pressure analysis.",
  },
  {
    id: "glendale-community-college",
    name: "Glendale Community College",
    lat: 34.1667,
    lng: -118.228,
    tags: ["institution"],
    label: "Institution anchor",
    status: "Research anchor · no partnership implied",
    detail: "Campus anchor used to visualize institutionally relevant commute demand around the Glendale side of the corridor.",
  },
];

const CORRIDOR_LINE: [number, number][] = [
  [34.1236, -118.2587],
  [34.1399, -118.2248],
  [34.1462, -118.196],
  [34.1477, -118.1479],
  [34.1444, -118.1182],
];

const FILTERS: { id: MapFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "access", label: "Access Points" },
  { id: "transit", label: "Transit" },
  { id: "institution", label: "Institutions" },
];

const MARKER_COLORS: Record<MapTag, string> = {
  access: "#6555d8",
  transit: "#2674b8",
  institution: "#2f7a52",
};

export default function Prototype() {
  const keyboard = useKeyboard();
  const [mapOpen, setMapOpen] = useState(false);
  const [filter, setFilter] = useState<MapFilter>("all");
  const [selectedPoint, setSelectedPoint] = useState<CorridorPoint | null>(null);
  const [tileStatus, setTileStatus] = useState<TileStatus>("loading");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);

  const visiblePoints = useMemo(
    () => filter === "all" ? CORRIDOR_POINTS : CORRIDOR_POINTS.filter((point) => point.tags.includes(filter)),
    [filter],
  );

  useEffect(() => {
    const mapTab = rootRef.current?.querySelector<HTMLButtonElement>(".bottom-nav button:nth-child(4)");
    if (!mapTab) return;

    const previousLabel = mapTab.getAttribute("aria-label");
    mapTab.setAttribute("aria-label", "Map");

    return () => {
      if (previousLabel) mapTab.setAttribute("aria-label", previousLabel);
      else mapTab.removeAttribute("aria-label");
    };
  }, []);

  useEffect(() => {
    if (!mapOpen || !mapNodeRef.current) return;

    leafletMapRef.current?.remove();
    setTileStatus("loading");

    const map = L.map(mapNodeRef.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 10,
      maxZoom: 19,
      preferCanvas: true,
    });

    let activeTileLayer: TileLayer | null = null;
    let tileLoadCompleted = false;
    let fallbackStarted = false;
    let primaryErrors = 0;

    const markReady = () => {
      tileLoadCompleted = true;
      setTileStatus("ready");
    };

    const activateFallback = () => {
      if (fallbackStarted || tileLoadCompleted) return;
      fallbackStarted = true;
      setTileStatus("fallback");

      if (activeTileLayer && map.hasLayer(activeTileLayer)) {
        map.removeLayer(activeTileLayer);
      }

      const fallbackLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 20,
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        updateWhenIdle: true,
        keepBuffer: 2,
      });

      let fallbackErrors = 0;
      fallbackLayer.once("load", markReady);
      fallbackLayer.on("tileerror", () => {
        fallbackErrors += 1;
        if (fallbackErrors >= 3) setTileStatus("error");
      });

      activeTileLayer = fallbackLayer;
      fallbackLayer.addTo(map);
    };

    // Netlify proxies this same-origin path to the public Esri World Street Map tile service.
    // Same-origin delivery avoids the browser/network failures seen with direct third-party tile requests.
    const primaryLayer = L.tileLayer("/map-tiles/{z}/{x}/{y}", {
      maxZoom: 19,
      attribution: "Tiles &copy; Esri",
      updateWhenIdle: true,
      keepBuffer: 2,
    });

    primaryLayer.once("load", markReady);
    primaryLayer.on("tileerror", () => {
      primaryErrors += 1;
      if (primaryErrors >= 2) activateFallback();
    });

    activeTileLayer = primaryLayer;
    primaryLayer.addTo(map);

    const fallbackTimer = window.setTimeout(() => {
      if (!tileLoadCompleted) activateFallback();
    }, 5000);

    L.control.zoom({ position: "topright" }).addTo(map);

    const corridor = L.polyline(CORRIDOR_LINE, {
      color: "#6555d8",
      weight: 4,
      opacity: 0.65,
      dashArray: "8 8",
      lineCap: "round",
    }).addTo(map);

    corridor.bindTooltip("Modeled research corridor · not a guaranteed route", {
      sticky: true,
      direction: "top",
    });

    visiblePoints.forEach((point) => {
      const primaryTag = filter === "all" ? point.tags[0] : filter;
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 8,
        weight: 2,
        color: "#ffffff",
        fillColor: MARKER_COLORS[primaryTag],
        fillOpacity: 0.96,
        bubblingMouseEvents: false,
      }).addTo(map);

      marker.bindTooltip(point.name, {
        direction: "top",
        offset: [0, -8],
      });

      marker.on("click", () => setSelectedPoint(point));
    });

    const bounds = L.latLngBounds(CORRIDOR_LINE);
    visiblePoints.forEach((point) => bounds.extend([point.lat, point.lng]));
    map.fitBounds(bounds, { padding: [26, 26], maxZoom: 13 });
    map.on("click", () => setSelectedPoint(null));

    const resizeTimer = window.setTimeout(() => map.invalidateSize(true), 120);
    const secondResizeTimer = window.setTimeout(() => map.invalidateSize(true), 450);
    leafletMapRef.current = map;

    return () => {
      window.clearTimeout(resizeTimer);
      window.clearTimeout(secondResizeTimer);
      window.clearTimeout(fallbackTimer);
      map.remove();
      if (leafletMapRef.current === map) leafletMapRef.current = null;
    };
  }, [mapOpen, visiblePoints, filter]);

  useEffect(() => {
    if (selectedPoint && !visiblePoints.some((point) => point.id === selectedPoint.id)) {
      setSelectedPoint(null);
    }
  }, [selectedPoint, visiblePoints]);

  function openMap() {
    keyboard.hide();
    setSelectedPoint(CORRIDOR_POINTS[0]);
    setTileStatus("loading");
    setMapOpen(true);
  }

  function closeMap() {
    setMapOpen(false);
    setSelectedPoint(null);
  }

  function handleRootClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const mapTab = target.closest(".bottom-nav button:nth-child(4)");
    if (!mapTab) return;

    event.preventDefault();
    event.stopPropagation();
    openMap();
  }

  return (
    <div ref={rootRef} className="relay-prototype-root" onClickCapture={handleRootClickCapture} data-map-open={mapOpen ? "true" : "false"}>
      <style>{`
        .relay-prototype-root .bottom-nav button:nth-child(3) { order: 4; }
        .relay-prototype-root .bottom-nav button:nth-child(4) { order: 3; }
        .relay-prototype-root .bottom-nav button:nth-child(4) svg { display: none; }
        .relay-prototype-root .bottom-nav button:nth-child(4)::before {
          content: "⌖";
          font-size: 18px;
          line-height: 18px;
          font-weight: 700;
        }
        .relay-prototype-root .bottom-nav button:nth-child(4) span {
          position: relative;
          color: transparent;
        }
        .relay-prototype-root .bottom-nav button:nth-child(4) span::after {
          position: absolute;
          inset: 0;
          color: #8a909b;
          content: "Map";
          font-size: 8px;
          font-weight: 700;
        }
        .relay-prototype-root .bottom-nav button:nth-child(4).active {
          background: transparent;
          color: #8a909b;
        }
        .relay-prototype-root .bottom-nav button:nth-child(4).active span::after {
          color: #8a909b;
        }
        .relay-map-tile-status {
          position: absolute;
          z-index: 520;
          top: 12px;
          left: 12px;
          max-width: calc(100% - 86px);
          padding: 8px 10px;
          border: 1px solid rgba(216, 220, 227, 0.95);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.94);
          color: #4c5360;
          box-shadow: 0 8px 24px rgba(31, 36, 48, 0.1);
          font-size: 10px;
          font-weight: 700;
          line-height: 1.3;
          backdrop-filter: blur(12px);
          pointer-events: none;
        }
        .relay-map-tile-status.error {
          color: #8a3d33;
          background: rgba(255, 246, 244, 0.96);
          border-color: #efd2cd;
        }
      `}</style>

      <PrototypePhase1 />

      {mapOpen && (
        <section className="relay-map-overlay" aria-label="Interactive Relay Rider corridor map" role="region">
          <header className="relay-map-header">
            <div>
              <span className="relay-map-kicker">PRIMARY MAP · LIVE BASEMAP</span>
              <h2>Pasadena–Eagle Rock–Glendale</h2>
              <p>Explore corridor demand context, research anchors, transit connections, and candidate Access Points.</p>
            </div>
            <button className="relay-map-close" onClick={closeMap} aria-label="Return from corridor map"><Cross2Icon /></button>
          </header>

          <div className="relay-map-filters" aria-label="Map layer filters">
            <LayersIcon />
            {FILTERS.map((item) => (
              <button
                key={item.id}
                className={filter === item.id ? "active" : ""}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relay-map-frame">
            <div ref={mapNodeRef} className="relay-map-canvas" />

            {tileStatus !== "ready" && (
              <div className={`relay-map-tile-status ${tileStatus === "error" ? "error" : ""}`} aria-live="polite">
                {tileStatus === "loading" && "Loading street basemap…"}
                {tileStatus === "fallback" && "Primary basemap unavailable — switching map source…"}
                {tileStatus === "error" && "Basemap could not load. Corridor markers remain available while the map source reconnects."}
              </div>
            )}

            <div className="relay-map-legend" aria-label="Map legend">
              <span><i className="access" />Access Point candidate</span>
              <span><i className="transit" />Transit</span>
              <span><i className="institution" />Institution</span>
            </div>

            {selectedPoint && (
              <article className="relay-map-detail">
                <div className="relay-map-detail-icon"><SewingPinIcon /></div>
                <div>
                  <small>{selectedPoint.label}</small>
                  <strong>{selectedPoint.name}</strong>
                  <p>{selectedPoint.detail}</p>
                  <span>{selectedPoint.status}</span>
                </div>
              </article>
            )}
          </div>

          <p className="relay-map-footnote">
            Candidate Access Points and corridor anchors are for research and match-preview context only. A map pin does not mean a location is institutionally approved, reserved, or guaranteed suitable for pickup/dropoff activity.
          </p>
        </section>
      )}
    </div>
  );
}
