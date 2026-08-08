import { useEffect, type PropsWithChildren } from "react";
import ControlCenter from "./ControlCenter";
import Prototype from "./Prototype";
import { MobileDeviceProvider } from "./mobile/Device";
import { KeyboardProvider } from "./mobile/Keyboard";

function navigateSurface(surface: "participant" | "map" | "admin") {
  const url = new URL(window.location.href);
  url.search = "";
  if (surface === "participant") url.searchParams.set("participant", "1");
  if (surface === "map") url.searchParams.set("map", "1");
  if (surface === "admin") url.searchParams.set("admin", "1");
  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
}

function PrototypeSurface({ openMap = false }: { openMap?: boolean }) {
  useEffect(() => {
    if (!openMap) return;
    const timer = window.setTimeout(() => {
      const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((item) => item.textContent?.trim() === "Open mobility map");
      button?.click();
    }, 100);
    return () => window.clearTimeout(timer);
  }, [openMap]);

  return <Prototype />;
}

/**
 * Browser-native application runtime.
 *
 * The normal Relay Rider URL opens the institutional Mobility Control Center.
 * The participant experience is available with ?participant=1, the public map
 * surface with ?map=1, and authenticated institutional operations with ?admin=1
 * or a one-time invitation token.
 *
 * Relay Rider still reuses the existing device and keyboard contexts because
 * several mature prototype components depend on those hooks, but it no longer
 * renders PhoneFrame, device chrome, a simulated cursor, status bars, home
 * indicators, or the simulated keyboard dock.
 */
export function WebRuntime({ children }: PropsWithChildren) {
  const params = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
  const institutionalAccessRequested = params?.get("admin") === "1" || params?.has("invite") === true;
  const participantRequested = params?.get("participant") === "1";
  const mapRequested = params?.get("map") === "1";

  let content = <ControlCenter onOpenParticipant={() => navigateSurface("participant")} onOpenMap={() => navigateSurface("map")} onOpenAdmin={() => navigateSurface("admin")} />;
  if (institutionalAccessRequested) content = <>{children}</>;
  else if (participantRequested || mapRequested) content = <PrototypeSurface openMap={mapRequested} />;

  return (
    <MobileDeviceProvider>
      <KeyboardProvider>
        <div className="web-runtime" data-runtime="web">
          {content}
        </div>
      </KeyboardProvider>
    </MobileDeviceProvider>
  );
}
