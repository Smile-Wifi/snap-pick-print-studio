import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Check, CreditCard, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageFrame } from "@/components/pasko-pages";
import { peso } from "@/lib/pasko-content";
import { checkPaylinkPayment, claimPaylinkOrder, PAY_PACKAGES } from "@/lib/pay.functions";
import { FIXED_PAY_LINKS, type PaylinkPackage } from "@/lib/paylinks";

export const Route = createFileRoute("/checkout")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { pkg: "basic" | "premium"; paid?: boolean | undefined; requestId?: string | undefined } => ({
    pkg: search["pkg"] === "premium" ? ("premium" as const) : ("basic" as const),
    paid: search["paid"] === "true" || search["paid"] === true,
    requestId: typeof search["requestId"] === "string" ? search["requestId"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "PayLinks Checkout | Pasko Photo Magic" },
      {
        name: "description",
        content: "Pay securely for your fixed-price ₱99 or ₱149 Christmas photo package with PayLinks.",
      },
      { property: "og:title", content: "PayLinks Checkout | Pasko Photo Magic" },
      { property: "og:description", content: "Confirm your payment and create five private Christmas portraits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const check = useServerFn(checkPaylinkPayment);
  const claim = useServerFn(claimPaylinkOrder);
  const [pkgId, setPkgId] = useState<PaylinkPackage>(search.pkg);
  const [portrait, setPortrait] = useState<{ photo: string; template: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const autoChecked = useRef(false);
  const pkg = PAY_PACKAGES.find((p) => p.id === pkgId) ?? PAY_PACKAGES[0];
  const returning = search.paid && Boolean(search.requestId);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("pasko-checkout") ?? "null");

      if (saved?.photo) {
        setPortrait({
          photo: saved.photo,
          template: saved.template ?? "santa",
        });
      }

      if (returning) {
        const savedPackage = localStorage.getItem("pasko_package");

        if (savedPackage === "149") {
          setPkgId("premium");
        } else if (savedPackage === "99") {
          setPkgId("basic");
        } else {
          setMessage("Your package selection could not be recovered. Please contact support before proceeding.");
        }
      }
    } catch {
      setMessage("Your saved photo could not be opened. Please upload it again.");
    }

    setReady(true);
  }, [returning]);

  async function checkAgain() {
    if (!search.requestId) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await check({ data: { requestId: search.requestId, packageId: pkgId } });
      setConfirmed(result.paid);
      if (!result.paid) setMessage("Not confirmed yet");
    } catch {
      setMessage("Not confirmed yet");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!ready || !returning || autoChecked.current) return;
    autoChecked.current = true;
    void checkAgain();
  }, [ready, returning, pkgId]); // eslint-disable-line react-hooks/exhaustive-deps

  function pay(packageId: PaylinkPackage) {
    if (!portrait) {
      toast.error("Please upload your portrait first.");
      return;
    }
    try {
      localStorage.setItem("pasko_package", packageId === "premium" ? "149" : "99");
      if (!sessionStorage.getItem("pasko-paylink-token")) {
        sessionStorage.setItem(
          "pasko-paylink-token",
          crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, ""),
        );
      }
    } catch {
      toast.error("Your browser could not save the package. Please enable browser storage and try again.");
      return;
    }
    window.location.href = FIXED_PAY_LINKS[packageId];
  }

  async function generate() {
    if (!portrait || !search.requestId) return;
    setBusy(true);
    setMessage("");
    try {
      let token = sessionStorage.getItem("pasko-paylink-token");
      if (!token) {
        token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
        sessionStorage.setItem("pasko-paylink-token", token);
      }
      const order = await claim({
        data: {
          requestId: search.requestId,
          packageId: pkgId,
          token,
          photo: portrait.photo,
          template: portrait.template,
        },
      });
      sessionStorage.setItem("pasko-paylink-order", JSON.stringify(order));
      await navigate({ to: "/status/$code", params: { code: order.code }, search: { t: order.token } });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your order could not be created. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageFrame>
      <section className="content-section mx-auto max-w-[640px]">
        <p className="page-eyebrow">Christmas magic</p>
        <h1 className="section-heading">{returning ? "Your payment" : "Pay for your photos"}</h1>
        {portrait && (
          <div className="my-5 flex items-center gap-3 border-b pb-4">
            <img src={portrait.photo} alt="Your portrait" className="h-16 w-16 rounded object-cover" />
            <div>
              <strong>Your portrait is ready</strong>
              <p className="text-sm text-muted-foreground">Five festive styles · Private photos</p>
            </div>
          </div>
        )}
        {ready && !portrait && (
          <div className="my-5">
            <p>Upload your portrait to create your five Christmas photos.</p>
            <Button asChild className="mt-3">
              <Link
                to="/create"
                search={{ pkg: pkgId, ...(returning ? { paid: true, requestId: search.requestId } : {}) }}
              >
                Upload my photo
              </Link>
            </Button>
          </div>
        )}
        {returning ? (
          <div className="mt-6" aria-live="polite">
            <p className="mb-4 font-semibold">
              {pkg.name} · {peso(pkg.amount)}
            </p>
            {busy && (
              <p className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {confirmed ? "Preparing your private order…" : "Checking payment…"}
              </p>
            )}
            {confirmed && (
              <>
                <p className="flex items-center gap-2 font-semibold text-primary">
                  <Check className="h-5 w-5" />
                  Payment confirmed!
                </p>
                <Button className="mt-4 w-full" disabled={busy || !portrait} onClick={() => void generate()}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate all 5 photos
                </Button>
              </>
            )}
            {message && (
              <p role="status" className="mt-4">
                {message}
              </p>
            )}
            {!confirmed && (
              <Button variant="outline" className="mt-4 w-full" disabled={busy} onClick={() => void checkAgain()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Again
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {PAY_PACKAGES.map((p) => (
              <article
                key={p.id}
                className={`relative rounded-lg border-2 bg-card p-5 ${p.id === pkgId ? "border-primary" : "border-border"}`}
              >
                {p.id === "premium" && <p className="mb-2 text-xs font-bold text-primary">MOST POPULAR</p>}
                <h2 className="font-bold">{p.name}</h2>
                <p className="my-2 text-2xl font-bold">{peso(p.amount)}</p>
                <ul className="mb-5 space-y-2 text-sm">
                  <li>5 Christmas portraits</li>
                  <li>All 5 festive styles</li>
                  <li>High-quality downloads</li>
                  {p.id === "premium" && <li>30-second slideshow with Christmas music</li>}
                </ul>
                <Button className="w-full" disabled={!ready || !portrait} onClick={() => pay(p.id)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay {peso(p.amount)}
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageFrame>
  );
}
