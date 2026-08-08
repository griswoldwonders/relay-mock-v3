import type { PropsWithChildren } from "react";
import { MobileDeviceProvider } from "./mobile/Device";
import { KeyboardProvider } from "./mobile/Keyboard";

/**
 * Browser-native application runtime.
 *
 * Relay Rider still reuses the existing device and keyboard contexts because
 * several mature prototype components depend on those hooks, but it no longer
 * renders PhoneFrame, device chrome, a simulated cursor, status bars, home
 * indicators, or the simulated keyboard dock.
 */
export function WebRuntime({ children }: PropsWithChildren) {
  return (
    <MobileDeviceProvider>
      <KeyboardProvider>
        <div className="web-runtime" data-runtime="web">
          {children}
        </div>
      </KeyboardProvider>
    </MobileDeviceProvider>
  );
}
