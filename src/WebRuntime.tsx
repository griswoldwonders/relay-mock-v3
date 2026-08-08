import type { PropsWithChildren } from "react";
import { MobileDeviceProvider } from "./mobile/Device";
import { KeyboardProvider } from "./mobile/Keyboard";

/**
 * Browser-native admin runtime.
 *
 * Relay Rider now exposes one product surface: the authenticated institutional
 * TDM administration and operations workspace. Participant and public demo
 * routing have been removed from the application runtime.
 */
export function WebRuntime({ children }: PropsWithChildren) {
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
