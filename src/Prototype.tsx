import { useMemo, useState } from "react";
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

type Tab = "home" | "plan" | "match" | "rewards" | "admin";

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
  const [credits, setCredits] = useState(16);
  const [logged, setLogged] = useState(false);

  const title = useMemo(
    () => ({ home: "Relay", plan: "My Plan", match: "Matches", rewards: "Credits", admin: "Program" })[tab],
    [tab],
  );

  function findRelay() {
    setSearching(true);
    window.setTimeout(() => {
      setSearching(false);
      setTab("match");
    }, 650);
  }

  function logCommute() {
    if (logged) return;
    setLogged(true);
    setCredits((value) => value + 8);
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
              <button className="action-row" onClick={() => setTab("match")}><span className="icon-tile lavender-tile"><MagnifyingGlassIcon /></span><div><strong>Preview compatible relays</strong><small>Compare schedule, anchor and confidence</small></div><ChevronRightIcon /></button>
              <button className="action-row" onClick={() => setTab("rewards")}><span className="icon-tile yellow-tile"><LightningBoltIcon /></span><div><strong>Review eligible programs</strong><small>Credits, parking and mode-shift offers</small></div><ChevronRightIcon /></button>
              <section className="plan-note"><strong>Current mode</strong><span>Solo gasoline vehicle</span><strong>Target</strong><span>EV relay 2 days per week</span></section>
            </>
          )}

          {tab === "match" && (
            <>
              <section className="match-summary">
                <small>GLENDALE → PASADENA</small>
                <strong>2 strong matches</strong>
                <p>Exact addresses stay private until both participants approve.</p>
              </section>
              <div className="match-list">
                {matches.map((match, index) => (
                  <button key={match.name} className={`match-card ${match.tone} ${selectedMatch === index ? "selected" : ""}`} onClick={() => setSelectedMatch(index)}>
                    <div className="avatar"><PersonIcon /></div>
                    <div className="match-copy"><small>{match.time}</small><strong>{match.name}</strong><span>{match.vehicle} · verified EV</span></div>
                    <b>{match.score}%</b>
                  </button>
                ))}
              </div>
              <section className="white-card breakdown-card">
                <div className="section-title"><h2>Why this match</h2><span>Explainable</span></div>
                <div className="score-line"><span>Schedule overlap</span><i><b style={{ width: "96%" }} /></i><strong>96</strong></div>
                <div className="score-line"><span>Safe anchor fit</span><i><b style={{ width: "94%" }} /></i><strong>94</strong></div>
                <div className="score-line"><span>Detour fit</span><i><b style={{ width: "89%" }} /></i><strong>89</strong></div>
                <div className="score-line"><span>EV confidence</span><i><b style={{ width: "97%" }} /></i><strong>97</strong></div>
              </section>
              <button className="primary-action sticky-action" onClick={() => setTab("plan")}><CheckCircledIcon /> Save match preview</button>
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
        <button className={tab === "match" ? "active center" : "center"} onClick={() => setTab("match")} aria-label="Matches"><MagnifyingGlassIcon /></button>
        <button className={tab === "rewards" ? "active" : ""} onClick={() => setTab("rewards")} aria-label="Credits"><LightningBoltIcon /></button>
        <button className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")} aria-label="Program"><BarChartIcon /></button>
      </nav>
    </div>
  );
}
