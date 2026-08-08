import type { PropsWithChildren } from "react";
import Prototype from "./Prototype";
import { MobileDeviceProvider } from "./mobile/Device";
import { KeyboardProvider } from "./mobile/Keyboard";

/**
 * Browser-native application runtime.
 *
 * The default product URL opens directly into the Relay Rider participant app.
 * Institutional authentication remains available only when explicitly requested
 * with ?admin=1 or when an organization invitation token is present.
 *
 * Relay Rider still reuses the existing device and keyboard contexts because
 * several mature prototype components depend on those hooks, but it no longer
 * renders PhoneFrame, device chrome, a simulated cursor, status bars, home
 * indicators, or the simulated keyboard dock.
 */
export function WebRuntime({ children }: PropsWithChildren) {
  const params = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
  const institutionalAccessRequested = params?.get("admin") === "1" || params?.has("invite") === true;

  return (
    <MobileDeviceProvider>
      <KeyboardProvider>
        <div className="web-runtime" data-runtime="web">
          {institutionalAccessRequested ? children : <Prototype />}
        </div>
      </KeyboardProvider>
    </MobileDeviceProvider>
  );
}
