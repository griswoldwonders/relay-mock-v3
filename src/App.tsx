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
          <button className="saas-return-button" onClick={() => setProductIntent(null)}>SaaS Foundation</button>
          <Prototype />
        </>
      ) : (
        <InstitutionalSaasGateway onOpenMap={() => setProductIntent("map")} onOpenParticipant={() => setProductIntent("participant")} />
      )}
    </WebRuntime>
  );
}
