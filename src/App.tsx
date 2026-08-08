import { useEffect, useState } from "react";
import { WebRuntime } from "./WebRuntime";
import InstitutionalSaasGateway from "./InstitutionalSaasGateway";
import Prototype from "./Prototype";

type ProductIntent = "map" | "participant" | null;

export default function App() {
  const [productIntent, setProductIntent] = useState<ProductIntent>(null);

  useEffect(() => {
    if (!productIntent) return;
    const timer = window.setTimeout(() => {
      if (productIntent === "map") {
        const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((item) => item.textContent?.trim() === "Open mobility map");
        button?.click();
      } else {
        document.querySelector<HTMLButtonElement>(".participant-switch")?.click();
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, [productIntent]);

  return (
    <WebRuntime>
      {productIntent ? (
        <>
          <button
            onClick={() => setProductIntent(null)}
            style={{ position: "fixed", zIndex: 9999, top: 12, left: 12, minHeight: 36, padding: "0 12px", border: "1px solid #303743", borderRadius: 10, background: "#0f1319", color: "#f3f5f7", fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,.18)" }}
          >
            SaaS Foundation
          </button>
          <Prototype />
        </>
      ) : (
        <InstitutionalSaasGateway onOpenMap={() => setProductIntent("map")} onOpenParticipant={() => setProductIntent("participant")} />
      )}
    </WebRuntime>
  );
}
