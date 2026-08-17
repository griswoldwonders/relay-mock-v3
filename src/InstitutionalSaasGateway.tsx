import OperationalSaasWorkspace from "./OperationalSaasWorkspace";
import "./operational-scroll-fix.css";

/**
 * Default product surface for the Relay Rider demonstration environment.
 *
 * The prototype intentionally opens directly into an operational SaaS workspace
 * rather than presenting an authentication or organization-onboarding wall.
 * Synthetic and modeled values are labeled in the workspace. Production auth,
 * tenant isolation, and role enforcement remain backend concerns rather than
 * part of this partner-facing demonstration flow.
 */
export default function InstitutionalSaasGateway() {
  return (
    <>
      <a className="tdm-launcher" href="?view=tdm-programs">Programs & Incentives →</a>
      <OperationalSaasWorkspace />
    </>
  );
}
