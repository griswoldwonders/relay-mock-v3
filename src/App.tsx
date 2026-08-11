import { WebRuntime } from "./WebRuntime";
import InstitutionalSaasGateway from "./InstitutionalSaasGateway";
import PccEvidenceDashboard from "./PccEvidenceDashboard";

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const preview = params.get("view");

  if (preview === "pcc-evidence") {
    return <PccEvidenceDashboard />;
  }

  return (
    <WebRuntime>
      <InstitutionalSaasGateway />
    </WebRuntime>
  );
}
