import type { PropsWithChildren } from "react";
import { MobileDeviceProvider } from "./mobile/Device";
import { KeyboardProvider } from "./mobile/Keyboard";
import PccEvidenceDashboard from "./PccEvidenceDashboard";
import PccEvidenceWorkbench from "./PccEvidenceWorkbench";
import TdmProgramWorkspace from "./TdmProgramWorkspace";

/**
 * Browser-native admin runtime.
 *
 * Relay Rider's primary product surface is the authenticated institutional
 * TDM administration and operations workspace. Research evidence previews
 * and focused partner-facing demonstrations, including the program-operations
 * layer, are routed here so the protected App/mobile runtime entrypoint stays intact.
 */
export function WebRuntime({ children }: PropsWithChildren) {
  const view = new URLSearchParams(window.location.search).get("view");

  if (view === "pcc-evidence") return <PccEvidenceDashboard />;
  if (view === "pcc-evidence-workbench") return <PccEvidenceWorkbench />;
  if (view === "tdm-programs") return <TdmProgramWorkspace />;

  return (
    <MobileDeviceProvider>
      <KeyboardProvider>
        <div className="web-runtime" data-runtime="web" data-surface="admin">
          {children}
        </div>
      </KeyboardProvider>
    </MobileDeviceProvider>
  );
}
