import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, Clock3, Copy, Download, ExternalLink, Image, LockKeyhole, Send } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteFooter, SiteHeader } from "@/components/pasko-layout";
import { DEFAULT_PRICES, packages, peso, STATUS_LABEL } from "@/lib/pasko-content";
import { getCustomerOrder, getSiteData, submitPaymentReference } from "@/lib/orders.functions";

export const Route = createFileRoute("/order/$reference")({
  validateSearch: (search: Record<string, unknown>) => ({ t: typeof search["t"] === "string" ? search["t"] : "" }),
  loaderDeps: ({ search }) => ({ token: search.t }),
  loader: ({ params, deps }) => getCustomerOrder({ data: { reference: params.reference, token: deps.token } }),
  head: () => ({ meta: [
    { title: "Your Order | Pasko Photo Magic" }, { name: "description", content: "View your secure Pasko Photo Magic order and payment instructions." },
    { name: "robots", content: "noindex" }, { property: "og:title", content: "Your Order | Pasko Photo Magic" },
    { property: "og:description", content: "Your Christmas portrait order." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: OrderPage,
});

function OrderPage() {
  const { reference } = Route.useParams();
  const { t } = Route.useSearch();
  const order = Route.useLoaderData();
  const paymentSettings = order?.paymentSettings;
  const submitPayment = useServerFn(submitPaymentReference);
  const [paymentReference, setPaymentReference] = useState(order?.paymentReference ?? "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (order && order.status !== "completed") {
      const interval = window.setInterval(() => window.location.reload(), 45_000);
      return () => window.clearInterval(interval);
    }
  }, [order?.status]);

  async function saveReference(event: FormEvent) {
    event.preventDefault();
    if (!t || paymentReference.trim().length < 4) return toast.error("Enter the payment reference number.");
    setSaving(true);
    try {
      await submitPayment({ data: { reference, token: t, paymentReference: paymentReference.trim() } });
      toast.success("Payment reference saved.");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The reference could not be saved.");
    } finally { setSaving(false); }
  }

  async function copyOrderReference() {
    try { await navigator.clipboard.writeText(reference); setCopied(true); toast.success("Order number copied."); }
    catch { toast.error("Select and copy the order number instead."); }
  }

  if (!order) return <div className="create-page"><SiteHeader /><main className="content-page"><section className="content-section"><h1 className="section-heading">Order not found</h1><p className="section-lede">This private order link is invalid. Use your order number and mobile number to find the order.</p><Button asChild><Link to="/track">Find my order</Link></Button></section></main><SiteFooter /></div>;

  const paymentInstructions = paymentSettings?.[order.paymentMethod] ?? "";
  const status = STATUS_LABEL[order.status] ?? "Order received";
  return <div className="create-page"><SiteHeader /><main className="content-page order-page">
    <Link to="/track" className="back-link"><ArrowLeft size={16} /> Track another order</Link>
    <div className="order-page-heading"><span className="status-icon"><CheckCircle2 /></span><div><p className="summary-label">Order status</p><h1>{status}</h1></div></div>
    <section className="order-detail-band">
      <div><span>Order number</span><strong>{order.reference}</strong></div>
      <Button type="button" size="icon" variant="ghost" aria-label={copied ? "Order number copied" : "Copy order number"} onClick={() => void copyOrderReference()}><Copy /></Button>
    </section>
    <div className="order-page-grid">
      <section>
        <h2 className="step-heading">Your package</h2>
        <div className="order-package-line"><span>{packages[order.pkg].name}</span><strong>{peso(order.amount)}</strong></div>
        <p className="upload-tip">{packages[order.pkg].details} · {order.fullName}</p>
        <h2 className="step-heading">Payment instructions</h2>
        {order.status === "pending_payment" ? <>
          <div className="preview-note"><LockKeyhole size={16} /> Transfer the exact amount of <strong>{peso(order.amount)}</strong> using the instructions below. The studio reviews your payment before preparing photos.</div>
          {paymentInstructions ? <div className="payment-instructions">{order.paymentMethod === "gcash" && <img className="payment-qr" src="/__l5e/assets-v1/gcash-qr.jpg" alt="GCash payment QR code" />}<p>{paymentInstructions}</p></div> : <p className="payment-unavailable">Payment details for this method are not confirmed yet. Please contact the studio and include your order number.</p>}
          <form className="payment-reference-form" onSubmit={saveReference}><label htmlFor="payment-reference">Payment reference number</label><div className="reference-input-row"><Input id="payment-reference" minLength={4} maxLength={60} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Enter your transfer reference" required /><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Submit reference"}<Send /></Button></div></form>
        </> : <div className="status-message"><Clock3 size={20} /><div><strong>{status}</strong><p>{order.paymentReference ? `Payment reference: ${order.paymentReference}` : "We'll update this page after your payment is reviewed."}</p></div></div>}
      </section>
      <aside className="order-photo-aside">
        <h2 className="step-heading"><Image size={19} /> Your photos</h2>
        {order.results.length ? <div className="result-grid">{order.results.map((url, index) => <a href={url} download key={url} aria-label={`Download Christmas portrait ${index + 1}`}><img src={url} alt={`Christmas portrait ${index + 1}`} /><span><Download size={14} /> Download</span></a>)}</div> : <div className="result-placeholder"><span className="upload-icon"><Clock3 /></span><strong>Your photos will appear here</strong><p>Five Christmas portraits are created after payment is confirmed.</p></div>}
        {order.originalUrl && <details className="original-photo-details"><summary>View uploaded photo</summary><a href={order.originalUrl} target="_blank" rel="noreferrer"><img src={order.originalUrl} alt="Uploaded original photo" /><span>Open original <ExternalLink size={14} /></span></a></details>}
        <p className="summary-privacy"><LockKeyhole size={12} className="inline-block align-middle" /> Private link · Photos deleted after 30 days</p>
      </aside>
    </div>
    <p className="order-help">Need help? <Link to="/contact">Contact the studio</Link> and share your order number.</p>
  </main><SiteFooter /></div>;
}