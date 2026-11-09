import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Camera, Check, ImagePlus, LockKeyhole, Music2, ShieldCheck, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { howItWorks, packages, photoStyles, type PackageId } from "@/lib/pasko-content";
import ChristmasHero from "@/assets/pasko-christmas-studio.jpg.asset.json";
import { SiteHeader, SiteFooter } from "@/components/pasko-layout";

type Step = 1 | 2 | 3 | 4;
type PaymentChoice = "gcash" | "maya" | "bank";

export const Route = createFileRoute("/create")({
  validateSearch: (search: Record<string, unknown>) => ({
    pkg: search.pkg === "premium" ? "premium" : "basic",
  }),
  head: () => ({
    meta: [
      { title: "Create Your Christmas Photos | Pasko Photo Magic" },
      { name: "description", content: "Choose a Christmas package and upload one photo to start your Pasko Photo Magic order." },
      { property: "og:title", content: "Create Your Christmas Photos | Pasko Photo Magic" },
      { property: "og:description", content: "Choose a Christmas package and upload one photo to start your holiday portrait order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreatePage,
});

const stepNames = ["Upload photo", "Choose template", "Payment", "Generate 5 photos"];
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const fileSizeLimit = 10 * 1024 * 1024;

function CreatePage() {
  const { pkg } = Route.useSearch();
  const currentPackage = packages[pkg];
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [payment, setPayment] = useState<PaymentChoice>("gcash");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(photo);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  const selectPhoto = (file?: File) => {
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setError("Please choose a JPG, PNG or WEBP photo.");
      return;
    }
    if (file.size > fileSizeLimit) {
      setError("Your photo must be 10 MB or smaller.");
      return;
    }
    setError("");
    setPhoto(file);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectPhoto(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectPhoto(event.dataTransfer.files[0]);
  };

  const continueOrder = () => {
    if (step === 1 && photo) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
  };

  return (
    <div className="create-page">
      <SiteHeader />
      <main className="create-main">
        <div className="create-layout">
          <section aria-live="polite">
            <h1 className="create-title">Create your Christmas magic 🎄</h1>
            <p className="create-subtitle">One upload. Five magical Christmas photos!</p>
            <div className="steps-progress" aria-label={`Step ${step} of 4`}>
              {stepNames.map((name, index) => (
                <span key={name} className={index + 1 === step ? "is-current" : index + 1 < step ? "is-complete" : ""}>
                  {name}
                </span>
              ))}
            </div>

            {step === 1 && (
              <section aria-labelledby="upload-heading">
                <h2 className="step-heading" id="upload-heading"><span className="step-number">1</span> Upload your photo</h2>
                <div
                  className={`upload-zone${isDragging ? " is-dragging" : ""}`}
                  onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                >
                  {photo && photoPreview ? (
                    <div className="upload-content">
                      <img className="photo-preview" src={photoPreview} alt="Selected photo preview" />
                      <strong>{photo.name}</strong>
                      <p>{(photo.size / 1024 / 1024).toFixed(1)} MB · One photo selected</p>
                      <Button variant="outline" size="sm" onClick={() => { setPhoto(null); setError(""); }}><X /> Remove photo</Button>
                    </div>
                  ) : (
                    <div className="upload-content">
                      <span className="upload-icon"><Camera size={30} /></span>
                      <strong>Upload ONE photo</strong>
                      <p>Drag &amp; drop here, or choose below. JPG, PNG or WEBP · up to 10MB</p>
                      <div className="upload-actions">
                        <Button onClick={() => fileInput.current?.click()}><ImagePlus /> Choose photo</Button>
                        <Button variant="outline" onClick={() => cameraInput.current?.click()}><Camera /> Take a photo</Button>
                      </div>
                      <input ref={fileInput} className="file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} aria-label="Choose one photo" />
                      <input ref={cameraInput} className="file-input" type="file" accept="image/jpeg,image/png,image/webp" capture="user" onChange={onFileChange} aria-label="Take a photo" />
                    </div>
                  )}
                </div>
                {error && <p className="upload-error" role="alert">{error}</p>}
                <p className="upload-tip">Tip: a clear, front-facing photo gives the best results. Only one photo per order.</p>
              </section>
            )}

            {step === 2 && (
              <section aria-labelledby="template-heading">
                <h2 className="step-heading" id="template-heading"><span className="step-number">2</span> Choose your first template</h2>
                <div className="template-grid">
                  {photoStyles.map((style, index) => (
                    <button key={style.name} className="template-option" type="button" aria-pressed={selectedStyle === index} onClick={() => setSelectedStyle(index)}>
                      {style.name}<span>{style.detail}</span>
                    </button>
                  ))}
                </div>
                <img className="template-preview" src={ChristmasHero.url} alt="Illustrative Christmas photo transformations" />
                <p className="upload-tip">Your order includes all five Christmas styles.</p>
                <div className="step-buttons"><Button variant="outline" onClick={() => setStep(1)}><ArrowLeft /> Back</Button><Button onClick={continueOrder}>Continue to payment <ArrowRight /></Button></div>
              </section>
            )}

            {step === 3 && (
              <section aria-labelledby="payment-heading">
                <h2 className="step-heading" id="payment-heading"><span className="step-number">3</span> Choose a payment method</h2>
                <div className="payment-options">
                  {(["gcash", "maya", "bank"] as const).map((option) => (
                    <button key={option} className="payment-option" type="button" aria-pressed={payment === option} onClick={() => setPayment(option)}>
                      <span aria-hidden="true">{payment === option ? "◉" : "○"}</span>
                      {option === "gcash" ? "GCash" : option === "maya" ? "Maya" : "Bank transfer"}
                    </button>
                  ))}
                </div>
                <div className="preview-note">This is a visual recreation. Payment processing and photo generation are not connected, so no payment will be taken.</div>
                <div className="step-buttons"><Button variant="outline" onClick={() => setStep(2)}><ArrowLeft /> Back</Button><Button onClick={continueOrder}>Review order <ArrowRight /></Button></div>
              </section>
            )}

            {step === 4 && (
              <section className="step-complete" aria-labelledby="review-heading">
                <span className="step-complete-icon"><Check /></span>
                <h2 id="review-heading">Your order is ready to review</h2>
                <p>{photo?.name} · {photoStyles[selectedStyle].name} · {payment === "bank" ? "Bank transfer" : payment === "gcash" ? "GCash" : "Maya"}</p>
                <div className="preview-note">The original app requires payment verification before photos are generated. This recreation does not submit payment or upload your photo.</div>
                <div className="step-buttons"><Button variant="outline" onClick={() => setStep(3)}><ArrowLeft /> Back</Button><Button variant="secondary" onClick={() => { setStep(1); setPhoto(null); }}>Start over</Button></div>
              </section>
            )}
          </section>

          <aside className="order-summary" aria-label="Order summary">
            <p className="summary-label">Order summary</p>
            <div className="summary-item">
              <span className="summary-icon">{pkg === "premium" ? <Music2 /> : <Camera />}</span>
              <div><strong>{currentPackage.name}</strong><span>{currentPackage.summary} · {payment === "gcash" ? "GCash" : payment === "maya" ? "Maya" : "Bank transfer"}</span></div>
            </div>
            <div className="summary-total"><span>Total</span><strong>₱{currentPackage.price}</strong></div>
            {step === 1 ? (
              <Button className="summary-next" disabled={!photo} onClick={continueOrder}>Choose template <ArrowRight /></Button>
            ) : (
              <Button className="summary-next" variant="secondary" onClick={() => navigate({ to: "/", hash: "pricing" })}>Change package</Button>
            )}
            <p className="summary-privacy"><LockKeyhole size={12} className="inline-block align-middle" /> Private &amp; secure · Auto-deleted after 30 days</p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function HowItWorksList() {
  return <ol>{howItWorks.map((item, index) => <li key={item.title}>{index + 1}. <strong>{item.title}</strong> — {item.detail}</li>)}</ol>;
}