import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/pasko-layout";
import { howItWorks, packages, photoStyles } from "@/lib/pasko-content";
import ChristmasStudio from "@/assets/christmas-studio.jpg.asset.json";
import FiveScenes from "@/assets/pasko-five-scenes.webp.asset.json";
import HowItWorksImage from "@/assets/pasko-how-it-works.jpg.asset.json";
import PackageChoices from "@/assets/pasko-package-choices.jpeg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pasko Photo Magic | Christmas Portraits from Your Photo" },
      { name: "description", content: "Turn one favorite photo into five joyful Christmas portraits. Choose your Pasko Photo Magic package." },
      { property: "og:title", content: "Pasko Photo Magic | Christmas Portraits from Your Photo" },
      { property: "og:description", content: "Turn one favorite photo into five joyful Christmas portraits for your family." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="backdrop-page">
      <SiteHeader />
      <main className="home-content">
        <section className="hero-poster" aria-label="Pasko Photo Magic Christmas portraits">
          <img src={ChristmasStudio.url} alt="Pasko Photo Magic Christmas portrait studio" />
        </section>

        <section className="content-section" id="pricing" aria-labelledby="pricing-heading">
          <h1 className="section-heading" id="pricing-heading">Make this Christmas one to remember</h1>
          <p className="section-lede">One photo becomes five festive portraits, made for sharing with the people you love.</p>
          <img className="package-art" src={PackageChoices.url} alt="Pasko Photo Magic package choices" />
          <div className="package-grid">
            <article className="package-card">
              <h2>Basic Magic</h2>
              <p className="package-price">₱{packages.basic.price}</p>
              <p>{packages.basic.details}</p>
              <Button asChild>
                <Link to="/create" search={{ pkg: "basic" }}>Choose Basic <ArrowRight /></Link>
              </Button>
            </article>
            <article className="package-card package-card-premium">
              <h2>Magic with Music</h2>
              <p className="package-price">₱{packages.premium.price}</p>
              <p>{packages.premium.details}</p>
              <Button asChild>
                <Link to="/create" search={{ pkg: "premium" }}>Choose with Music <ArrowRight /></Link>
              </Button>
            </article>
          </div>
          <div className="feature-strip" aria-label="Package highlights">
            <div><strong>5 portraits</strong><span>Festive looks for your family</span></div>
            <div><strong>One upload</strong><span>Start with a favorite photo</span></div>
            <div><strong>Filipino spirit</strong><span>Inspired by Paskong Pinoy</span></div>
            <div><strong>From ₱99</strong><span>Pick the package that suits you</span></div>
          </div>
        </section>

        <section className="content-section" id="how-it-works" aria-labelledby="how-heading">
          <h2 className="section-heading" id="how-heading">Your Christmas magic, in four steps</h2>
          <p className="section-lede">From your camera roll to a collection of Christmas memories.</p>
          <img className="steps-art" src={HowItWorksImage.url} alt="How to create your Pasko Photo Magic portraits" />
          <ol className="process-list">
            {howItWorks.map((item, index) => (
              <li key={item.title}>
                <span className="process-number">{index + 1}</span>
                <div><strong>{item.title}</strong><p>{item.detail}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="content-section" id="sample-photos" aria-labelledby="samples-heading">
          <h2 className="section-heading" id="samples-heading">A little Pasko magic for everyone</h2>
          <p className="section-lede">Explore five festive portrait styles with Filipino Christmas warmth.</p>
          <img className="styles-art" src={FiveScenes.url} alt="Five Christmas portrait styles" />
          <div className="style-list">
            {photoStyles.map((style) => (
              <div className="style-item" key={style.name}>
                <Sparkles aria-hidden="true" size={17} />
                <div><strong>{style.name}</strong><span>{style.detail}</span></div>
                <Check aria-hidden="true" size={16} />
              </div>
            ))}
          </div>
        </section>

        <section className="content-section" id="faq" aria-labelledby="faq-heading">
          <h2 className="section-heading" id="faq-heading">A few helpful answers</h2>
          <div className="faq-list">
            <details><summary>What kind of photo should I upload?</summary><p>Choose one clear photo where the face is easy to see. JPG, PNG, and WEBP files up to 10 MB are accepted.</p></details>
            <details><summary>How many Christmas photos are included?</summary><p>Both packages include five Christmas portraits in the festive styles shown above.</p></details>
            <details><summary>Which package includes music?</summary><p>Magic with Music includes a slideshow with music. Basic Magic includes five photos without background music.</p></details>
            <details><summary>How do I pay?</summary><p>Choose GCash, Maya, or bank transfer when you create your order.</p></details>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}