import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Bell, Check, Clock3, KeyRound, LogOut, RefreshCw, Save, Search, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteFooter, SiteHeader } from "@/components/pasko-layout";
import { DEFAULT_PRICES, STATUS_LABEL, peso } from "@/lib/pasko-content";
import { staffGeneratePhoto, staffGetSettings, staffListOrders, staffPinLogin, staffReviewOrder, staffSaveSettings } from "@/lib/staff.functions";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [
    { title: "Staff Dashboard | Pasko Photo Magic" }, { name: "description", content: "Verify payments and manage Pasko Photo Magic orders." },
    { name: "robots", content: "noindex" }, { property: "og:title", content: "Staff Dashboard | Pasko Photo Magic" },
    { property: "og:description", content: "Payment verification and order management." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: StaffPage,
});

const TOKEN_KEY = "pasko-staff-token";
const statusFilter = ["all", "pending_verification", "pending_payment", "payment_verified", "processing", "completed", "rejected", "failed"] as const;

function StaffPage() {
  const [token, setToken] = useState<string | null>(() => (typeof window === "undefined" ? null : window.sessionStorage.getItem(TOKEN_KEY)));
  if (!token) return <PinGate onLogin={(value) => { window.sessionStorage.setItem(TOKEN_KEY, value); setToken(value); }} />;
  return <Dashboard token={token} onSignOut={() => { window.sessionStorage.removeItem(TOKEN_KEY); setToken(null); }} />;
}

function PinGate({ onLogin }: { onLogin: (token: string) => void }) {
  const login = useServerFn(staffPinLogin);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { token } = await login({ data: { pin } });
      onLogin(token);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed.");
    } finally { setBusy(false); }
  }

  return <div className="create-page"><SiteHeader /><main className="content-page auth-page">
    <section className="auth-form-section"><span className="auth-icon"><KeyRound /></span><p className="page-eyebrow">Staff only</p><h1>Staff sign in</h1><p>Enter the studio PIN to verify payments and manage orders.</p>
      <form className="details-fields" onSubmit={submit}><div><Label htmlFor="staff-pin">Studio PIN</Label><Input id="staff-pin" type="password" inputMode="numeric" autoComplete="off" minLength={4} maxLength={8} required value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} /></div><Button type="submit" disabled={busy}>{busy ? "Checking…" : "Sign in"}</Button></form>
      <Button variant="link" asChild><Link to="/">Back to the studio</Link></Button>
    </section>
  </main><SiteFooter /></div>;
}

function Dashboard({ token, onSignOut }: { token: string; onSignOut: () => void }) {
  const fetchOrders = useServerFn(staffListOrders);
  const reviewOrder = useServerFn(staffReviewOrder);
  const generatePhoto = useServerFn(staffGeneratePhoto);
  const fetchSettings = useServerFn(staffGetSettings);
  const saveSettingsFn = useServerFn(staffSaveSettings);
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState<(typeof statusFilter)[number]>("pending_verification");
  const [workingId, setWorkingId] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prices, setPrices] = useState<{ basic: number; premium: number }>({ ...DEFAULT_PRICES });
  const [accounts, setAccounts] = useState({ gcash: "", maya: "", bank: "" });
  const [retentionDays, setRetentionDays] = useState(30);
  const knownPending = useRef<number | null>(null);

  const { data, refetch, isLoading, error } = useQuery({
    queryKey: ["staff-orders", searchText, status],
    queryFn: () => fetchOrders({ data: { token, search: searchText.trim() || undefined, status } }),
    refetchInterval: 15_000,
    retry: false,
  });

  useEffect(() => {
    if (error) {
      window.sessionStorage.removeItem(TOKEN_KEY);
      toast.error(error instanceof Error ? error.message : "Staff session expired.");
      onSignOut();
    }
  }, [error, onSignOut]);

  // Live alert: toast + badge when a new payment arrives while the dashboard is open.
  useEffect(() => {
    const pending = data?.stats.pendingVerification;
    if (pending === undefined) return;
    if (knownPending.current !== null && pending > knownPending.current) {
      toast.success(`New payment to verify (${pending} waiting).`, { icon: <Bell size={16} /> });
      if ("Notification" in window && Notification.permission === "granted") new Notification("Pasko Photo Magic", { body: `${pending} payment(s) waiting for verification.` });
    }
    knownPending.current = pending;
  }, [data?.stats.pendingVerification]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
  }, []);

  async function doWork(orderId: string, action: () => Promise<unknown>, success: string) {
    setWorkingId(orderId);
    try { await action(); toast.success(success); await refetch(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Action could not be completed."); }
    finally { setWorkingId(""); }
  }

  async function loadSettings() {
    try {
      const settings = await fetchSettings({ data: { token } });
      setPrices({ basic: settings.pricing.basic, premium: settings.pricing.premium });
      setAccounts({ gcash: settings.payment.gcash, maya: settings.payment.maya, bank: settings.payment.bank });
      setRetentionDays(settings.retentionDays);
      setSettingsOpen(true);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Settings unavailable."); }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    try {
      await saveSettingsFn({ data: { token, pricing: prices, payment: accounts, retentionDays } });
      toast.success("Studio settings saved.");
      setSettingsOpen(false);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Settings could not be saved."); }
  }

  const stats = data?.stats ?? { total: 0, pendingVerification: 0, waiting: 0, paid: 0, completed: 0 };
  return <div className="create-page"><SiteHeader /><main className="admin-page">
    <div className="admin-topline"><div><p className="page-eyebrow">JIS Company · Private studio</p><h1>Payments &amp; orders</h1></div><div className="admin-actions"><Button asChild variant="outline"><Link to="/image-generator"><Sparkles /> Image Generator</Link></Button><Button type="button" variant="outline" onClick={() => void loadSettings()}><Save /> Settings</Button><Button type="button" variant="ghost" size="icon" aria-label="Refresh orders" onClick={() => void refetch()}><RefreshCw /></Button><Button type="button" variant="outline" onClick={onSignOut}><LogOut /> Sign out</Button></div></div>
    <section className="admin-stats" aria-label="Order totals">
      <article><span>Waiting for verification</span><strong className="stat-amber">{stats.pendingVerification}</strong></article>
      <article><span>Awaiting payment</span><strong>{stats.waiting}</strong></article>
      <article><span>Verified sales</span><strong>{peso(stats.paid)}</strong></article>
      <article><span>Completed orders</span><strong>{stats.completed}</strong></article>
    </section>
    <section className="admin-section"><div className="admin-section-heading"><div><h2>Orders</h2><p>Compare the reference number and screenshot, then approve or reject.</p></div><div className="admin-filters"><label className="admin-search"><Search size={16} /><Input aria-label="Search orders" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Name, number, or reference" /></label><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value as (typeof statusFilter)[number])}>{statusFilter.map((value) => <option key={value} value={value}>{value === "all" ? "All statuses" : STATUS_LABEL[value]}{value === "pending_verification" && stats.pendingVerification ? ` (${stats.pendingVerification})` : ""}</option>)}</select></div></div>
      {isLoading ? <p className="admin-empty">Loading orders…</p> : data?.orders.length ? <div className="admin-order-list">{data.orders.map((order) => <article className="admin-order" key={order.id}>
        <div className="admin-order-main"><div className="admin-order-heading"><strong>{order.reference}</strong><span className={`status-pill status-${order.status}`}>{STATUS_LABEL[order.status] ?? order.status}</span></div><h3>{order.full_name}</h3><p>{order.mobile}{order.email ? ` · ${order.email}` : ""}</p><p>{order.package === "premium" ? "Magic with Music" : "Basic Magic"} · {peso(order.amount)} · {order.payment_method === "bank" ? "Bank transfer" : order.payment_method.toUpperCase()}</p><p>Payment reference: <strong>{order.payment_reference ?? "Not submitted"}</strong></p><p><Clock3 size={13} /> Submitted {new Date(order.created_at).toLocaleString()} · Expires {new Date(order.expires_at).toLocaleDateString()}</p>{order.admin_note && <p className="admin-note">{order.admin_note}</p>}</div>
        {order.screenshot_url && <a className="payment-proof-link" href={order.screenshot_url} target="_blank" rel="noreferrer"><img src={order.screenshot_url} alt="Payment screenshot" />View screenshot</a>}
        <div className="admin-order-actions">
          {(order.status === "pending_verification" || order.status === "pending_payment" || order.status === "rejected") && <>
            <Button type="button" size="sm" onClick={() => void doWork(order.id, () => reviewOrder({ data: { token, id: order.id, approved: true } }), "Payment approved.")} disabled={workingId === order.id}><Check /> Approve</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { const reason = window.prompt("Reason for rejection (optional):") ?? ""; void doWork(order.id, () => reviewOrder({ data: { token, id: order.id, approved: false, reason } }), "Payment rejected."); }} disabled={workingId === order.id}><X /> Reject</Button>
          </>}
          {order.status === "payment_verified" || order.status === "processing" || order.status === "failed" ? <div className="generation-buttons">{[0, 1, 2, 3, 4].map((index) => <Button type="button" key={index} size="sm" variant={order.result_paths[index] ? "secondary" : "outline"} aria-label={`${order.result_paths[index] ? "Regenerate" : "Create"} portrait ${index + 1} for ${order.reference}`} onClick={() => void doWork(order.id, () => generatePhoto({ data: { token, id: order.id, index } }), `Portrait ${index + 1} created.`)} disabled={workingId === order.id || !order.payment_verified_at}>{order.result_paths[index] ? <Check /> : <Sparkles />}{index + 1}</Button>)}</div> : null}
        </div>
      </article>)}</div> : <p className="admin-empty">No orders match this view.</p>}
    </section>
  </main><SiteFooter />
    {settingsOpen && <div className="settings-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}><section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title"><div className="settings-heading"><h2 id="settings-title">Studio settings</h2><Button type="button" variant="ghost" size="icon" aria-label="Close settings" onClick={() => setSettingsOpen(false)}><X /></Button></div><form className="details-fields" onSubmit={saveSettings}><div className="settings-columns"><div><Label htmlFor="basic-price">Basic Magic price (₱)</Label><Input id="basic-price" type="number" min={1} value={prices.basic} onChange={(event) => setPrices({ ...prices, basic: Number(event.target.value) })} required /></div><div><Label htmlFor="premium-price">Magic with Music price (₱)</Label><Input id="premium-price" type="number" min={1} value={prices.premium} onChange={(event) => setPrices({ ...prices, premium: Number(event.target.value) })} required /></div></div><div><Label htmlFor="gcash-details">GCash instructions</Label><Input id="gcash-details" maxLength={200} value={accounts.gcash} onChange={(event) => setAccounts({ ...accounts, gcash: event.target.value })} placeholder="Add verified account details" /></div><div><Label htmlFor="maya-details">Maya instructions</Label><Input id="maya-details" maxLength={200} value={accounts.maya} onChange={(event) => setAccounts({ ...accounts, maya: event.target.value })} placeholder="Add verified account details" /></div><div><Label htmlFor="bank-details">Bank transfer instructions</Label><Input id="bank-details" maxLength={200} value={accounts.bank} onChange={(event) => setAccounts({ ...accounts, bank: event.target.value })} placeholder="Add verified account details" /></div><div><Label htmlFor="photo-retention">Photo retention (days)</Label><Input id="photo-retention" type="number" min={1} max={365} value={retentionDays} onChange={(event) => setRetentionDays(Number(event.target.value))} required /></div><Button type="submit"><Save /> Save settings</Button></form></section></div>}
  </div>;
}
