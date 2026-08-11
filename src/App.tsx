import { WebRuntime } from "./WebRuntime";
import InstitutionalSaasGateway from "./InstitutionalSaasGateway";
import PccEvidenceDashboard from "./PccEvidenceDashboard";
import PccEvidenceWorkbench from "./PccEvidenceWorkbench";

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const preview = params.get("view");

  if (preview === "pcc-evidence") {
    return <PccEvidenceDashboard />;
  }

  if (preview === "pcc-evidence-workbench") {
    return <PccEvidenceWorkbench />;
  }

  return (
    <WebRuntime>
      <InstitutionalSaasGateway />
    </WebRuntime>
  );
}
