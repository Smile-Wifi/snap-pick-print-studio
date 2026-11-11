import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageFrame } from "@/components/pasko-pages";
import { normalizePhMobile } from "@/lib/pasko-content";
import { trackOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/track")({
  head: () => ({ meta: [
    { title: "Track Your Order | Pasko Photo Magic" },
    { name: "description", content: "Find a Pasko Photo Magic order with its order number and mobile number." },
    { property: "og:title", content: "Track Your Order | Pasko Photo Magic" },
    { property: "og:description", content: "Check the status of your Christmas photo order." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: TrackPage,
});

function TrackPage() {
  const [reference, setReference] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const lookup = useServerFn(trackOrder);
  const navigate = useNavigate();
  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalizedMobile = normalizePhMobile(mobile);
    if (!normalizedMobile) return toast.error("Enter the Philippine mobile number used for the order.");
    setBusy(true);
    try {
      const order = await lookup({ data: { reference: reference.trim().toUpperCase(), mobile: normalizedMobile } });
      if (!order) return toast.error("No order matched those details.");
      await navigate({ to: "/order/$reference", params: { reference: order.reference }, search: { t: order.token } });
    } catch (error) { toast.error(error instanceof Error ? error.message : "We couldn't find your order."); }
    finally { setBusy(false); }
  }
  return <PageFrame><section className="content-section track-page"><p className="page-eyebrow">Your memories, just a moment away</p><h1 className="section-heading">Track your order</h1>
    <p className="section-lede">Enter the order number and mobile number used at checkout.</p>
    <form className="track-form" onSubmit={submit}><div><Label htmlFor="order-reference">Order number</Label><Input id="order-reference" autoCapitalize="characters" maxLength={40} required value={reference} onChange={(event) => setReference(event.target.value)} placeholder="XM-260101-ABC123" /></div><div><Label htmlFor="order-mobile">Mobile number</Label><Input id="order-mobile" inputMode="tel" autoComplete="tel" required value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="0917 123 4567" /></div><Button type="submit" disabled={busy}>{busy ? "Looking…" : "Find my order"}<Search /></Button></form>
    <p className="track-security">Your order number and mobile number are only used to find your private order link.</p>
  </section></PageFrame>;
}