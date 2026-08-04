import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  BarChartIcon,
  CalendarIcon,
  CheckCircledIcon,
  ChevronRightIcon,
  DashboardIcon,
  LightningBoltIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PersonIcon,
  PlusIcon,
  RocketIcon,
  SewingPinIcon,
} from "@radix-ui/react-icons";
import { MobileScroll } from "./mobile";

type Tab = "home" | "plan" | "map" | "rewards" | "admin";
type MapLayer = "anchor" | "charging" | "transit";
type MobilityPoint = {
  id: string;
  name: string;
  type: MapLayer;
  lat: number;
  lng: number;
  detail: string;
  status: string;
  source: string;
};

const MOBILITY_POINTS: MobilityPoint[] = [
  { id: "pcc", name: "Pasadena City College", type: "anchor", lat: 34.1447, lng: -118.1181, detail: "Proposed campus-edge Relay Anchor", status: "Partner review", source: "Relay Rider proposal" },
  { id: "glendale-transit", name: "Glendale Transportation Center", type: "anchor", lat: 34.1234, lng: -118.2586, detail: "Regional rail and bus connection", status: "Site review", source: "Relay Rider proposal" },
  { id: "eagle-rock", name: "Eagle Rock Plaza", type: "anchor", lat: 34.1365, lng: -118.2078, detail: "Proposed midpoint public-edge anchor", status: "Permission required", source: "Relay Rider proposal" },
  { id: "memorial-anchor", name: "Memorial Park Relay Anchor", type: "anchor", lat: 34.1478, lng: -118.1471, detail: "Proposed transit-connected meeting point", status: "Public-site review", source: "Relay Rider proposal" },
  { id: "marengo", name: "Marengo Charging Plaza", type: "charging", lat: 34.1443, lng: -118.1452, detail: "155 E Green St · public DC fast charging", status: "Public charging", source: "Pasadena Water & Power" },
  { id: "arroyo", name: "Arroyo Charging Depot", type: "charging", lat: 34.1278, lng: -118.1504, detail: "64 E Glenarm St · 26 chargers", status: "Public charging", source: "Pasadena Water & Power" },
  { id: "delmar-charge", name: "Del Mar Garage Chargers", type: "charging", lat: 34.142, lng: -118.1483, detail: "202 S Raymond Ave · public charging", status: "Public charging", source: "Pasadena Water & Power" },
  { id: "shoppers", name: "Shopper's Lane Charging", type: "charging", lat: 34.14, lng: -118.1238, detail: "410 Shopper's Lane · fast charging", status: "Public charging", source: "Pasadena Water & Power" },
  { id: "victory", name: "Victory Park Chargers", type: "charging", lat: 34.1654, lng: -118.096, detail: "2575 Paloma St · public charging", status: "Public charging", source: "Pasadena Water & Power" },
  { id: "robinson", name: "Robinson Park Charging Depot", type: "charging", lat: 34.1641, lng: -118.1505, detail: "1081 N Fair Oaks Ave · Level 2 + DC fast", status: "Public charging", source: "Pasadena Water & Power" },
  { id: "fillmore", name: "Fillmore Station", type: "transit", lat: 34.1334, lng: -118.1485, detail: "Metro A Line station", status: "Transit station", source: "LA Metro" },
  { id: "delmar", name: "Del Mar Station", type: "transit", lat: 34.1427, lng: -118.1481, detail: "Metro A Line station", status: "Transit station", source: "LA Metro" },
  { id: "memorial", name: "Memorial Park Station", type: "transit", lat: 34.1478, lng: -118.1471, detail: "Metro A Line station", status: "Transit station", source: "LA Metro" },
  { id: "lake", name: "Lake Station", type: "transit", lat: 34.1517, lng: -118.1315, detail: "Metro A Line station", status: "Transit station", source: "LA Metro" },
  { id: "allen", name: "Allen Station", type: "transit", lat: 34.1524, lng: -118.1144, detail: "Metro A Line station", status: "Transit station", source: "LA Metro" },
];

const matches = [
  { name: "Marcus", vehicle: "Tesla Model 3", time: "8:10 AM", score: 94, tone: "lavender" },
  { name: "Jordan", vehicle: "Kia Niro EV", time: "8:25 AM", score: 88, tone: "yellow" },
];

const trips = [
  { day: "Today", route: "Glendale → PCC", detail: "EV relay · 11.8 mi", status: "Pending", tone: "peach" },
  { day: "Aug 1", route: "Eagle Rock → PCC", detail: "Verified · 8 credits", status: "Verified", tone: "mint" },
];

export default function Prototype() {
  const [tab, setTab] = useState<Tab>("home");
  const [searching, setSearching] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<MobilityPoint>(MOBILITY_POINTS[0]);
  const [activeLayers, setActiveLayers] = useState<MapLayer[]>(["anchor", "charging", "transit"]);
  const [credits, setCredits] = useState(16);
  const [logged, setLogged] = useState(false);

  const title = useMemo(
    () => ({ home: "Relay", plan: "My Plan", map: "Mobility Map", rewards: "Credits", admin: "Program" })[tab],
    [tab],
  );

  function findRelay() {
    setSearching(true);
    window.setTimeout(() => {
      setSearching(false);
      setTab("map");
    }, 650);
  }

  function logCommute() {
    if (logged) return;
    setLogged(true);
    setCredits((value) => value + 8);
  }

  function toggleLayer(layer: MapLayer) {
    setActiveLayers((current) =>
      current.includes(layer)
        ? current.length === 1
          ? current
          : current.filter((item) => item !== layer)
        : [...current, layer],
    );
  }

  return (
    <div className="relay-shell">
      <MobileScroll key={tab} className="app-screen relay-scroll">
        <main className="relay-content">
          <header className="page-heading">
            <div>
              <span className="kicker">EV COMMUTE NETWORK</span>
              <h1>{title}</h1>
            </div>
            <button className="profile-button" aria-label="Open profile">
              <PersonIcon />
            </button>
          </header>

          {tab === "home" && (
            <>
              <section className="hero-card">
                <div className="hero-row">
                  <span className="icon-tile"><RocketIcon /></span>
                  <div>
                    <strong>Plan a cleaner commute</strong>
                    <small>Pasadena · Glendale · Eagle Rock</small>
                  </div>
                </div>
                <div className="route-inputs">
                  <button><SewingPinIcon /> Glendale Transit</button>
                  <button><SewingPinIcon /> Pasadena City College</button>
                  <button className="schedule"><CalendarIcon /> Today · 8:00–9:00 AM</button>
                </div>
                <button className="primary-action" onClick={findRelay}>
                  <MagnifyingGlassIcon /> {searching ? "Scanning corridor…" : "Find an EV Relay"}
                </button>
              </section>

              <section className="credit-banner">
                <div>
                  <small>Institution-funded demo</small>
                  <strong>Earn EV commute credits</strong>
                  <p>Log a verified shared trip. Partner approval required.</p>
                </div>
                <span className="credit-orb"><LightningBoltIcon /></span>
              </section>

              <div className="section-title"><h2>Today</h2><button onClick={() => setTab("plan")}>See plan</button></div>
              <section className="today-card">
                <span className="mini-route"><SewingPinIcon /></span>
                <div><strong>Glendale → PCC</strong><p>8:10 AM · 2 seats · 94% match</p></div>
                <span className="status-dot">Ready</span>
              </section>

              <div className="metric-grid">
                <article className="metric lavender"><small>Available</small><strong>{credits}</strong><span>EV credits</span></article>
                <article className="metric yellow"><small>This month</small><strong>4</strong><span>solo trips avoided</span></article>
                <article className="metric mint"><small>Impact</small><strong>26.4</strong><span>shared miles</span></article>
                <article className="metric peach"><small>Estimate</small><strong>20.9</strong><span>lb CO₂ avoided</span></article>
              </div>
            </>
          )}

          {tab === "plan" && (
            <>
              <section className="white-card identity-card">
                <div className="card-top"><span className="icon-tile mint-tile"><CheckCircledIcon /></span><div><strong>PCC affiliation verified</strong><small>Institution demo profile</small></div></div>
                <div className="privacy-row"><LockClosedIcon /><span>Approximate origin + approved anchors only</span></div>
              </section>
              <h2 className="standalone-title">Weekly goal</h2>
              <section className="goal-card">
                <div className="goal-head"><div><strong>2 EV relays</strong><small>per week</small></div><b>1 / 2</b></div>
                <div className="progress-track"><i /></div>
                <p>One more verified relay unlocks your weekly goal.</p>
              </section>
              <h2 className="standalone-title">Recommended actions</h2>
              <button className="action-row" onClick={() => setTab("map")}><span className="icon-tile lavender-tile"><SewingPinIcon /></span><div><strong>Open corridor mobility map</strong><small>Anchors, charging and Metro stations</small></div><ChevronRightIcon /></button>
              <button className="action-row" onClick={() => setTab("rewards")}><span className="icon-tile yellow-tile"><LightningBoltIcon /></span><div><strong>Review eligible programs</strong><small>Credits, parking and mode-shift offers</small></div><ChevronRightIcon /></button>
              <section className="plan-note"><strong>Current mode</strong><span>Solo gasoline vehicle</span><strong>Target</strong><span>EV relay 2 days per week</span></section>
            </>
          )}

          {tab === "map" && (
            <>
              <section className="map-intro">
                <div>
                  <small>PASADENA · GLENDALE · EAGLE ROCK</small>
                  <strong>Corridor infrastructure</strong>
                </div>
                <span>{MOBILITY_POINTS.filter((point) => activeLayers.includes(point.type)).length} points</span>
              </section>
              <div className="map-filters" aria-label="Map filters">
                <button className={activeLayers.includes("anchor") ? "active anchor-filter" : ""} onClick={() => toggleLayer("anchor")}><SewingPinIcon /> Anchors</button>
                <button className={activeLayers.includes("charging") ? "active charging-filter" : ""} onClick={() => toggleLayer("charging")}><LightningBoltIcon /> Charging</button>
                <button className={activeLayers.includes("transit") ? "active transit-filter" : ""} onClick={() => toggleLayer("transit")}><RocketIcon /> Metro</button>
              </div>
              <MobilityMap activeLayers={activeLayers} selectedPoint={selectedPoint} onSelect={setSelectedPoint} />
              <section className={`map-detail ${selectedPoint.type}`}>
                <span className="map-detail-icon">{selectedPoint.type === "charging" ? <LightningBoltIcon /> : selectedPoint.type === "transit" ? <RocketIcon /> : <SewingPinIcon />}</span>
                <div>
                  <small>{selectedPoint.status}</small>
                  <strong>{selectedPoint.name}</strong>
                  <p>{selectedPoint.detail}</p>
                  <em>Source: {selectedPoint.source}</em>
                </div>
              </section>
              <div className="section-title"><h2>Compatible relays</h2><span>2 found</span></div>
              <div className="match-list">
                {matches.map((match, index) => (
                  <button key={match.name} className={`match-card ${match.tone} ${selectedMatch === index ? "selected" : ""}`} onClick={() => setSelectedMatch(index)}>
                    <div className="avatar"><PersonIcon /></div>
                    <div className="match-copy"><small>{match.time}</small><strong>{match.name}</strong><span>{match.vehicle} · verified EV</span></div>
                    <b>{match.score}%</b>
                  </button>
                ))}
              </div>
              <section className="white-card breakdown-card compact-breakdown">
                <div className="section-title"><h2>Why this match</h2><span>Explainable</span></div>
                <div className="score-line"><span>Schedule overlap</span><i><b style={{ width: "96%" }} /></i><strong>96</strong></div>
                <div className="score-line"><span>Safe anchor fit</span><i><b style={{ width: "94%" }} /></i><strong>94</strong></div>
                <div className="score-line"><span>Detour fit</span><i><b style={{ width: "89%" }} /></i><strong>89</strong></div>
                <div className="score-line"><span>EV confidence</span><i><b style={{ width: "97%" }} /></i><strong>97</strong></div>
              </section>
              <button className="primary-action sticky-action" onClick={() => setTab("plan")}><CheckCircledIcon /> Save route + anchor preview</button>
            </>
          )}

          {tab === "rewards" && (
            <>
              <section className="balance-card"><small>Available demo credits</small><strong>{credits}</strong><p>Not cash or charging value until a sponsor approves funding and redemption.</p></section>
              <div className="program-grid">
                <article className="program lavender"><LightningBoltIcon /><strong>EV Relay Credit</strong><span>8 credits</span><small>Eligible</small></article>
                <article className="program yellow"><SewingPinIcon /><strong>Preferred Parking</strong><span>1 parking day</span><small>Partner review</small></article>
                <article className="program mint"><RocketIcon /><strong>Mode Shift</strong><span>5 points</span><small>Eligible</small></article>
                <article className="program peach"><BarChartIcon /><strong>Rule 2202</strong><span>Reporting signal</span><small>Needs review</small></article>
              </div>
              <div className="section-title"><h2>Trip ledger</h2><span>Auditable</span></div>
              {trips.map((trip) => <article className={`trip-card ${trip.tone}`} key={trip.day}><span className="mini-route"><RocketIcon /></span><div><small>{trip.day}</small><strong>{trip.route}</strong><p>{trip.detail}</p></div><b>{trip.status}</b></article>)}
              <button className={`primary-action ${logged ? "success-action" : ""}`} onClick={logCommute}><PlusIcon /> {logged ? "Commute logged · pending review" : "Log planned EV commute"}</button>
            </>
          )}

          {tab === "admin" && (
            <>
              <section className="admin-overview"><small>PCC DEMONSTRATION</small><strong>Program pulse</strong><p>Planning data · partner validation required</p></section>
              <div className="metric-grid admin-metrics">
                <article className="metric lavender"><small>Supply</small><strong>12</strong><span>posted routes</span></article>
                <article className="metric yellow"><small>Demand</small><strong>19</strong><span>open signals</span></article>
                <article className="metric mint"><small>Outcome</small><strong>7</strong><span>verified trips</span></article>
                <article className="metric peach"><small>Budget</small><strong>56</strong><span>credit liability</span></article>
              </div>
              <h2 className="standalone-title">Review queue</h2>
              {["Trip evidence rules", "Safe Anchor permissions", "EV credit sponsor", "Rule 2202 field export"].map((item, index) => <button className="review-row" key={item}><span>{index + 1}</span><div><strong>{item}</strong><small>{index < 2 ? "Action needed" : "Needs review"}</small></div><ChevronRightIcon /></button>)}
              <section className="white-card compliance-card"><div className="card-top"><span className="icon-tile peach-tile"><LockClosedIcon /></span><div><strong>Planning mode</strong><small>No payment or live ride activation</small></div></div></section>
            </>
          )}
        </main>
      </MobileScroll>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")} aria-label="Home"><DashboardIcon /></button>
        <button className={tab === "plan" ? "active" : ""} onClick={() => setTab("plan")} aria-label="Plan"><CalendarIcon /></button>
        <button className={tab === "map" ? "active center" : "center"} onClick={() => setTab("map")} aria-label="Map"><SewingPinIcon /></button>
        <button className={tab === "rewards" ? "active" : ""} onClick={() => setTab("rewards")} aria-label="Credits"><LightningBoltIcon /></button>
        <button className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")} aria-label="Program"><BarChartIcon /></button>
      </nav>
    </div>
  );
}

function MobilityMap({
  activeLayers,
  selectedPoint,
  onSelect,
}: {
  activeLayers: MapLayer[];
  selectedPoint: MobilityPoint;
  onSelect: (point: MobilityPoint) => void;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!elementRef.current || mapRef.current) return;

    const map = L.map(elementRef.current, {
      zoomControl: true,
      attributionControl: true,
      minZoom: 10,
      maxZoom: 19,
    }).setView([34.143, -118.168], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    window.setTimeout(() => map.invalidateSize(), 80);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;

    group.clearLayers();
    const visible = MOBILITY_POINTS.filter((point) => activeLayers.includes(point.type));
    const colors: Record<MapLayer, string> = {
      anchor: "#7657d6",
      charging: "#2d8b4e",
      transit: "#e28b20",
    };

    visible.forEach((point) => {
      const selected = selectedPoint.id === point.id;
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: selected ? 11 : 8,
        color: "#ffffff",
        weight: selected ? 4 : 3,
        fillColor: colors[point.type],
        fillOpacity: 1,
        className: `map-point ${point.type}-point point-${point.id}`,
      });
      marker.bindTooltip(point.name, { direction: "top", offset: [0, -8] });
      marker.on("click", () => {
        onSelect(point);
        map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 14), { duration: 0.45 });
      });
      marker.addTo(group);
    });

    const corridor = MOBILITY_POINTS.filter((point) =>
      ["glendale-transit", "eagle-rock", "memorial-anchor", "pcc"].includes(point.id),
    );
    L.polyline(corridor.map((point) => [point.lat, point.lng] as L.LatLngTuple), {
      color: "#7657d6",
      weight: 4,
      opacity: 0.72,
      dashArray: "7 8",
    }).addTo(group);
  }, [activeLayers, onSelect, selectedPoint]);

  return (
    <div className="map-frame" data-scroll-drag="ignore">
      <div ref={elementRef} className="mobility-map" aria-label="Interactive map of Relay Anchor Points, EV charging stations, and Metro stations" />
      <div className="map-legend" aria-hidden="true">
        <span><i className="anchor-dot" /> Anchor</span>
        <span><i className="charging-dot" /> Charging</span>
        <span><i className="transit-dot" /> Metro</span>
      </div>
    </div>
  );
}
