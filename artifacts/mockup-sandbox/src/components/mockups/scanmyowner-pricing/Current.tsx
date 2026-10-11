import { ArrowRight } from "lucide-react";
import "./_group.css";

const plans = [
  { name: "BASIC", price: "₹399", smart: false },
  { name: "SMART", price: "₹499", smart: true },
];

export function Current() {
  return (
    <section className="section pricing-section" id="pricing">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">Simple, upfront pricing</div>
          <h2>Start simple.</h2>
          <p>Choose the tag that feels right. Checkout is a preview only at this stage.</p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={`price-card${plan.smart ? " popular" : ""}`} key={plan.name}>
              {plan.smart && <span className="popular-label">MOST POPULAR</span>}
              <h3>{plan.name}</h3>
              <div className="price">
                {plan.price} <small>/ tag</small>
              </div>
              <p>A ScanMyOwner QR contact tag for your vehicle.</p>
              <a className={`btn ${plan.smart ? "btn-primary" : "btn-outline"}`} href="/how-it-works">
                See how it works <ArrowRight size={15} />
              </a>
            </article>
          ))}
        </div>
        <p className="price-note">Demo pricing · No payment will be collected on this website.</p>
      </div>
    </section>
  );
}
