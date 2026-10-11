import { ArrowRight, Check } from "lucide-react";
import "./_group.css";

const plans = [
  {
    id: "basic",
    name: "Basic",
    proposedPrice: "₹299",
    inclusions: [
      "One ScanMyOwner QR tag",
      "QR scan landing page",
      "Owner activation flow",
      "Visitor contact actions supported by the existing QR flow",
    ],
  },
  {
    id: "smart",
    name: "Smart",
    proposedPrice: "₹549",
    inclusions: [
      "One ScanMyOwner QR tag",
      "QR scan landing page",
      "Owner activation flow",
      "Visitor contact actions supported by the existing QR flow",
    ],
  },
];

export function Proposed() {
  return (
    <section className="section pricing-section" id="pricing">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">Package preview</div>
          <h2>Start with the essentials.</h2>
          <p>Basic and Smart are proposed packages. Checkout is not available.</p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={`price-card package-card package-card-${plan.id}`} key={plan.id}>
              <div className="package-card-heading">
                <span className="package-status">Proposed package</span>
                <h3>{plan.name}</h3>
                <div className="price">
                  <small className="proposed-label">Proposed price</small>
                  <span>{plan.proposedPrice}</span>
                </div>
              </div>
              <ul className="package-inclusions" aria-label={`${plan.name} inclusions`}>
                {plan.inclusions.map((inclusion) => (
                  <li key={inclusion}>
                    <Check size={15} aria-hidden="true" />
                    <span>{inclusion}</span>
                  </li>
                ))}
              </ul>
              <a className={`btn ${plan.id === "smart" ? "btn-primary" : "btn-outline"}`} href="/how-it-works">
                See how it works <ArrowRight size={15} />
              </a>
            </article>
          ))}
        </div>
        <p className="price-note">
          Proposed prices only — these are not confirmed public offers. Checkout is unavailable and no payment is collected on this website.
        </p>
      </div>
    </section>
  );
}
