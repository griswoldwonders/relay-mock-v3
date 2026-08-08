import { useEffect, useMemo, useState } from "react";
import { WebRuntime } from "./WebRuntime";
import InstitutionalSaasGateway from "./InstitutionalSaasGateway";
import Prototype from "./Prototype";

type ProductMode = "admin" | "app";
type ProductIntent = "map" | "participant" | null;

export default function App() {
  const adminRequested = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("admin") === "1" || params.has("invite");
  }, []);

  const [mode, setMode] = useState<ProductMode>(adminRequested ? "admin" : "app");
  const [productIntent, setProductIntent] = useState<ProductIntent>(null);

  useEffect(() => {
    if (mode !== "app" || !productIntent) return;
    const timer = window.setTimeout(() => {
      if (productIntent === "map") {
        const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((item) => item.textContent?.trim() === "Open mobility map");
        button?.click();
      } else {
        document.querySelector<HTMLButtonElement>(".participant-switch")?.click();
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, [mode, productIntent]);

  return (
    <WebRuntime>
      {mode === "admin" ? (
        <InstitutionalSaasGateway
          onOpenMap={() => {
            setProductIntent("map");
            setMode("app");
          }}
          onOpenParticipant={() => {
            setProductIntent("participant");
            setMode("app");
          }}
        />
      ) : (
        <Prototype />
      )}
    </WebRuntime>
  );
}
