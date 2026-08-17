import { useMemo, useState } from "react";
import "./tdm-program-workspace.css";

type ReadinessItem = {
  id: string;
  label: string;
  description: string;
  weight: number;
};

type Campaign = {
  id: number;
  goal: string;
  audience: string;
  channels: string[];
  status: "Draft" | "Ready for review";
};

type IncentiveRule = {
  id: number;
  action: string;
  credits: number;
  cap: number;
  status: "Draft" | "Approved";
};

const READINESS_ITEMS: ReadinessItem[] = [
  { id: "baseline", label: "Commute baseline connected", description: "Verified or institution-supplied commute records are available for analysis.", weight: 20 },
  { id: "owner", label: "Program owner assigned", description: "An institutional owner is responsible for review, decisions and follow-up.", weight: 10 },
  { id: "parking", label: "Parking pressure measured", description: "Parking difficulty, occupancy or other pressure signals are documented with provenance.", weight: 15 },
  { id: "goal", label: "TDM goal selected", description: "The institution has selected a measurable problem such as parking, drive-alone reduction or EV participation.", weight: 10 },
  { id: "intervention", label: "Intervention selected for review", description: "At least one evidence-backed intervention has been selected for administrative review.", weight: 15 },
  { id: "campaign", label: "Employee campaign prepared", description: "A targeted campaign has an audience, channel and review status.", weight: 10 },
  { id: "incentive", label: "Incentive rules defined", description: "If incentives are used, budget, eligibility, caps and approval rules are documented.", weight: 10 },
  { id: "measurement", label: "Measurement plan defined", description: "The program has before/after measures and a review date.", weight: 10 },
];

const GOALS = [
  "Reduce parking pressure",
  "Reduce drive-alone commuting",
  "Increase EV / hybrid participation",
  "Measure workplace charging interest",
  "Recruit planned-route participants",
  "Promote transit and multimodal options",
  "Evaluate Access Point candidates",
];

const CHANNELS = ["Email", "QR / poster", "Intranet", "Manager toolkit"];

const DEFAULT_INCENTIVES: IncentiveRule[] = [
  { id: 1, action: "Complete commute baseline", credits: 5, cap: 1, status: "Draft" },
  { id: 2, action: "Register a recurring planned route", credits: 10, cap: 1, status: "Draft" },
  { id: 3, action: "Complete follow-up program survey", credits: 5, cap: 1, status: "Draft" },
];

export default function TdmProgramWorkspace() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [goal, setGoal] = useState(GOALS[0]);
  const [audience, setAudience] = useState("Employees arriving 7:00–9:00 AM from Eagle Rock / Northeast LA");
  const [channels, setChannels] = useState<string[]>(["Email"]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [rules, setRules] = useState<IncentiveRule[]>(DEFAULT_INCENTIVES);
  const [budget, setBudget] = useState(500);

  const score = useMemo(
    () => READINESS_ITEMS.filter((item) => completed.has(item.id)).reduce((sum, item) => sum + item.weight, 0),
    [completed],
  );

  const nextItem = READINESS_ITEMS.find((item) => !completed.has(item.id));
  const approvedExposure = rules
    .filter((rule) => rule.status === "Approved")
    .reduce((sum, rule) => sum + rule.credits * rule.cap, 0);

  function toggleReadiness(id: string) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function loadDemo() {
    setCompleted(new Set(["baseline", "owner", "parking", "goal", "intervention"]));
    setGoal("Reduce parking pressure");
    setAudience("Synthetic cohort: employees arriving 7:00–9:00 AM from Eagle Rock / Northeast LA");
    setCampaigns([
      {
        id: Date.now(),
        goal: "Reduce parking pressure",
        audience: "Synthetic cohort: employees arriving 7:00–9:00 AM from Eagle Rock / Northeast LA",
        channels: ["Email", "QR / poster"],
        status: "Draft",
      },
    ]);
    setRules(DEFAULT_INCENTIVES);
    setDemoLoaded(true);
  }

  function toggleChannel(channel: string) {
    setChannels((current) =>
      current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel],
    );
  }

  function createCampaign() {
    const draft: Campaign = {
      id: Date.now(),
      goal,
      audience: audience.trim() || "Audience not specified",
      channels: channels.length ? channels : ["Channel not selected"],
      status: "Draft",
    };
    setCampaigns((current) => [draft, ...current]);
    setCompleted((current) => new Set(current).add("campaign"));
  }

  function toggleRule(id: number) {
    setRules((current) =>
      current.map((rule) =>
        rule.id === id ? { ...rule, status: rule.status === "Approved" ? "Draft" : "Approved" } : rule,
      ),
    );
    setCompleted((current) => new Set(current).add("incentive"));
  }

  return (
    <div className="tdm-program">
      <section className="tdm-program-hero">
        <div>
          <span className="tdm-kicker">PROGRAM OPERATIONS · DEMONSTRATION</span>
          <h2>Turn commute evidence into a managed TDM program.</h2>
          <p>
            This workspace adds the institutional operating layer between a commute finding and a measurable program:
            readiness, targeted employee campaigns, governed incentives and follow-up measurement.
          </p>
          <div className="tdm-hero-actions">
            <button className="tdm-primary" onClick={loadDemo}>Load synthetic Pasadena example</button>
            <span>{demoLoaded ? "Synthetic demonstration loaded" : "No employer program data loaded"}</span>
          </div>
        </div>
        <div className="tdm-spine-card">
          <small>OPERATING SPINE</small>
          <strong>Signal → Record → Score → Task → Program → Dashboard → Report</strong>
          <p>Campaigns and incentives are administrative interventions, not transportation activation.</p>
        </div>
      </section>

      <section className="tdm-grid two">
        <article className="tdm-panel readiness-panel">
          <header>
            <div>
              <small>PROGRAM READINESS</small>
              <h3>{completed.size ? `${score} / 100` : "Not scored"}</h3>
            </div>
            <span className="tdm-status">Scenario-based · not certification</span>
          </header>
          <div className="tdm-progress"><i style={{ width: `${score}%` }} /></div>
          <div className="tdm-readiness-list">
            {READINESS_ITEMS.map((item) => (
              <button key={item.id} className={completed.has(item.id) ? "complete" : ""} onClick={() => toggleReadiness(item.id)}>
                <span className="tdm-check">{completed.has(item.id) ? "✓" : "+"}</span>
                <span><strong>{item.label}</strong><small>{item.description}</small></span>
                <b>{item.weight} pts</b>
              </button>
            ))}
          </div>
          <div className="tdm-next-action">
            <small>NEXT ADMINISTRATIVE ACTION</small>
            <strong>{nextItem ? nextItem.label : "Program readiness inputs complete"}</strong>
            <p>{nextItem ? nextItem.description : "Move to scheduled measurement and program review."}</p>
          </div>
        </article>

        <article className="tdm-panel">
          <header><div><small>CAMPAIGN MANAGER</small><h3>Create a targeted employee campaign</h3></div><span className="tdm-status">Draft only</span></header>
          <label className="tdm-field"><span>Program goal</span><select value={goal} onChange={(event) => setGoal(event.target.value)}>{GOALS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="tdm-field"><span>Target cohort / audience</span><textarea value={audience} onChange={(event) => setAudience(event.target.value)} rows={3} /></label>
          <div className="tdm-field"><span>Distribution channels</span><div className="tdm-channel-list">{CHANNELS.map((channel) => <button key={channel} className={channels.includes(channel) ? "active" : ""} onClick={() => toggleChannel(channel)}>{channel}</button>)}</div></div>
          <div className="tdm-campaign-preview">
            <small>DRAFT MESSAGE FRAME</small>
            <strong>{goal}</strong>
            <p>Relay Rider is collecting institution-sponsored commute participation signals for this program. Participation does not guarantee transportation, route activation or incentive approval.</p>
          </div>
          <button className="tdm-primary wide" onClick={createCampaign}>Create draft campaign</button>
        </article>
      </section>

      <section className="tdm-grid two">
        <article className="tdm-panel">
          <header><div><small>CAMPAIGN QUEUE</small><h3>Institution-controlled outreach</h3></div><span className="tdm-status">{campaigns.length} draft{campaigns.length === 1 ? "" : "s"}</span></header>
          {campaigns.length === 0 ? (
            <div className="tdm-empty"><strong>No campaigns created.</strong><p>Create a draft from a selected TDM goal. Relay Rider does not automatically send or publish campaigns from this demonstration.</p></div>
          ) : (
            <div className="tdm-campaign-list">
              {campaigns.map((campaign) => (
                <article key={campaign.id}>
                  <div><strong>{campaign.goal}</strong><span>{campaign.audience}</span><small>{campaign.channels.join(" · ")}</small></div>
                  <b>{campaign.status}</b>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="tdm-panel">
          <header><div><small>MOBILITY INCENTIVE MANAGER</small><h3>Green Route Credit rules</h3></div><span className="tdm-status">Governed benefits</span></header>
          <div className="tdm-budget-row">
            <label><span>Scenario budget</span><div><b>$</b><input type="number" min="0" step="50" value={budget} onChange={(event) => setBudget(Number(event.target.value) || 0)} /></div></label>
            <div><span>Approved rule exposure</span><strong>{approvedExposure} credits</strong><small>Credits are program benefits, not cash, fares or wages.</small></div>
          </div>
          <div className="tdm-rule-list">
            {rules.map((rule) => (
              <article key={rule.id}>
                <div><strong>{rule.action}</strong><span>{rule.credits} credits · cap {rule.cap} per participant</span></div>
                <button className={rule.status === "Approved" ? "approved" : ""} onClick={() => toggleRule(rule.id)}>{rule.status}</button>
              </article>
            ))}
          </div>
          <p className="tdm-note">Approval here demonstrates an administrative rule state only. Redemption, tax treatment, eligibility, funding and partner terms require institution-specific program rules.</p>
        </article>
      </section>

      <section className="tdm-panel tdm-measurement">
        <header><div><small>MEASUREMENT PLAN</small><h3>Close the loop after an intervention</h3></div><span className="tdm-status">Outcome evidence</span></header>
        <div className="tdm-measure-grid">
          <div><strong>Baseline</strong><span>Drive-alone share, parking pressure, commute modes, corridor concentration</span></div>
          <div><strong>Program activity</strong><span>Campaign reach, participation signals, approved incentive actions, administrative tasks</span></div>
          <div><strong>Follow-up</strong><span>Repeat survey / import, parking signal change, participation change, unresolved gaps</span></div>
          <div><strong>Report</strong><span>Observed vs modeled results, confidence, recommended next institutional action</span></div>
        </div>
        <button className="tdm-secondary" onClick={() => setCompleted((current) => new Set(current).add("measurement"))}>Mark measurement plan defined</button>
      </section>

      <footer className="tdm-disclaimer">
        <strong>Product-state guardrail:</strong> This is a demonstration environment. Campaigns, readiness scores and Green Route Credit rules shown here are simulated administrative tools. They do not activate transportation, guarantee participation, approve payments, certify compliance or establish validated mobility outcomes.
      </footer>
    </div>
  );
}
