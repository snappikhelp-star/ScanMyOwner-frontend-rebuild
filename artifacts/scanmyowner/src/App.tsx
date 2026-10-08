import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ArrowRight, Bike, CarFront, Check, CircleHelp,
  Clock3, Heart, KeyRound, LockKeyhole, Menu, MessageCircle, Package,
  Plus, Search, ShieldCheck, Smartphone, Sparkles,
  X, Zap,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const logo = '/brand/scanmyowner-logo.webp';
const cardImage = '/brand/qr-contact-card.jpg';
const heroBannerImage = '/brand/campaign-vehicle-safe.webp';
const parkingCampaignImage = '/brand/campaign-no-parking.webp';
const privacyCampaignImage = '/brand/campaign-private-vehicle.webp';
const footerCampaignImage = '/brand/campaign-scan-owner.webp';
const navItems = [
  { text: 'How it works', href: '/how-it-works' },
  { text: 'Features', href: '/#features' },
  { text: 'Pricing', href: '/pricing' },
  { text: 'FAQ', href: '/faq' },
];

function Meta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, [title, description]);
  return null;
}

function Brand({ footer = false }: { footer?: boolean }) {
  return <Link href="/" className="brand" data-testid={footer ? 'link-footer-brand' : 'link-brand-home'}>
    <img src={logo} alt="ScanMyOwner logo" data-testid="img-brand-logo" />
    <span className="brand-word"><span>SCAN</span><strong>MYOWNER</strong><i aria-hidden="true" /><small>SMART QR CONTACT</small></span>
  </Link>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  useEffect(() => setOpen(false), [location]);
  return <header className="header">
    <div className="container nav">
      <Brand />
      <nav className="navlinks" aria-label="Main navigation">
        {navItems.map((item) => <Link href={item.href} key={item.text} data-testid={`nav-${item.text.toLowerCase().replaceAll(' ', '-')}`}>{item.text}</Link>)}
      </nav>
      <div className="nav-actions">
        <Link className="text-link" href="/login" data-testid="nav-login">Login</Link>
        <Link className="btn btn-primary btn-small" href="/vehicle" data-testid="nav-get-tag">Get your tag <ArrowRight size={15} /></Link>
      </div>
      <button className="menu-button" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open} onClick={() => setOpen(!open)} data-testid="button-mobile-menu">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
    </div>
    <div className={`mobile-menu${open ? ' open' : ''}`}>
      {navItems.map((item) => <Link href={item.href} key={item.text} data-testid={`mobile-${item.text.toLowerCase().replaceAll(' ', '-')}`}>{item.text}</Link>)}
      <Link href="/login" data-testid="mobile-login">Login</Link>
      <Link href="/vehicle" data-testid="mobile-get-tag">Get your tag <ArrowRight size={14} /></Link>
    </div>
  </header>;
}

function Footer() {
  return <footer className="footer">
    <div className="container">
      <div className="footer-campaign">
        <div className="footer-campaign-copy">
          <span className="footer-campaign-label">A smarter way to stay connected</span>
          <h2>Your vehicle. Your privacy. One simple scan.</h2>
          <p>Give people a better way to reach you when it matters.</p>
          <Link className="btn btn-orange" href="/vehicle" data-testid="footer-campaign-cta">Get your QR tag <ArrowRight size={15} /></Link>
        </div>
        <img src={footerCampaignImage} alt="ScanMyOwner QR tag on a vehicle with ways to contact the owner" loading="lazy" />
      </div>
      <div className="footer-main">
        <div><Brand footer /><p className="footer-desc">Scan. Connect. Stay Private.</p></div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/how-it-works">How it works</Link><Link href="/#features">Features</Link>
          <Link href="/pricing">Pricing</Link><Link href="/faq">FAQ</Link><Link href="/contact">Contact</Link>
          <Link href="/faq#privacy">Privacy</Link><Link href="/contact">Terms</Link>
        </nav>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} ScanMyOwner</span><span>Made for everyday peace of mind.</span></div>
    </div>
  </footer>;
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="site"><Header />{children}<Footer /></div>;
}

function Eyebrow({ children }: { children: ReactNode }) { return <div className="eyebrow">{children}</div>; }

function SearchLookup() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  function submit(e: FormEvent) {
    e.preventDefault();
    setSearched(true);
  }
  return <div className="search-wrap">
    <form className="lookup" onSubmit={submit} role="search">
      <img className="lookup-logo" src={logo} alt="" />
      <Search size={16} color="#66816d" />
      <input aria-label="Search a vehicle or tag" value={query} onChange={(e) => { setQuery(e.target.value); setSearched(false); }} placeholder="Try a sample tag or vehicle number" data-testid="input-vehicle-search" />
      <button className="btn btn-primary" type="submit" data-testid="button-search-owner">Search</button>
    </form>
    {searched && <div className="search-results" role="status" data-testid="status-search-result">
      {query.trim() ? <>This is a demo search. <Link className="route-link" href="/t/demo123">See how a scanned tag works <ArrowRight size={12} /></Link></> : 'Enter a vehicle number or tag ID to try the sample lookup.'}
    </div>}
  </div>;
}

const trustLabels = ['PRIVATE CONTACT', 'UNIQUE QR', 'NO APP REQUIRED', 'EASY ACTIVATION'];
function TrustStrip() {
  const icons = [ShieldCheck, LockKeyhole, Smartphone, Zap];
  return <div className="trust-strip"><div className="container strip-items">
    {trustLabels.map((label, i) => { const Icon = icons[i]; return <div className="strip-item" key={label} data-testid={`trust-${i}`}><span className="strip-icon"><Icon size={17} strokeWidth={1.8} /><i /></span>{label}</div>; })}
  </div></div>;
}

const situations = [
  { title: 'NO PARKING', text: 'Please move your vehicle.', Icon: CarFront },
  { title: 'LIGHTS ON', text: 'Your headlights are still on.', Icon: Zap },
  { title: 'EMERGENCY', text: 'Someone needs your attention.', Icon: MessageCircle },
  { title: 'KEY LOST', text: 'Your keys were found.', Icon: KeyRound },
];
function ProblemSection() {
  return <section className="section problem-section" id="situations"><div className="container">
    <div className="section-head"><Eyebrow>When it matters</Eyebrow><h2>Sometimes your vehicle needs you.</h2><p>Wrong parking. Lights left on. An emergency. A lost key. A simple message can save time.</p></div>
    <div className="situation-grid">{situations.map(({ title, text, Icon }, i) => <article className={`situation${i === 0 ? ' situation-primary' : ` situation-small situation-small-${i}`}`} key={title} data-testid={`card-situation-${i}`}>
      <div className="icon-tile"><Icon size={20} /></div>{i === 0 && <span className="situation-kicker">A little message can help</span>}<h3>{title}</h3><p>{text}</p>
      {i === 0 && <div className="parking-callout"><span className="parking-symbol">P</span><span><strong>Need to move?</strong><small>Send a private contact request.</small></span><ArrowRight size={17} /></div>}
    </article>)}</div>
  </div></section>;
}

function HowSteps() {
  const steps = [['01', 'SCAN', 'Someone scans your ScanMyOwner QR tag.'], ['02', 'CHOOSE', 'They choose why they need to contact you.'], ['03', 'CONNECT', 'You receive the request and respond privately.']];
  return <section className="section steps-section" id="how"><div className="container">
    <div className="section-head"><Eyebrow>Easy by design</Eyebrow><h2>From scan to contact in seconds.</h2><p>No app to install. No phone number on display. Just a more thoughtful way to connect.</p></div>
    <div className="steps-grid">{steps.map(([number, title, desc], i) => <article className={`step step-${i + 1}`} key={number} data-testid={`step-${number}`}>
      <div className="step-visual" aria-hidden="true">
        {i === 0 && <div className="step-qr"><img src={cardImage} alt="" /></div>}
        {i === 1 && <div className="step-mini-phone"><strong>How can we help?</strong><span><CarFront size={14} />No parking</span><span><Zap size={14} />Lights on</span><span><MessageCircle size={14} />Emergency</span></div>}
        {i === 2 && <div className="step-message"><span><LockKeyhole size={18} /></span><div><strong>Private connection</strong><small>Contact request delivered</small></div><Check size={17} /></div>}
      </div>
      <div className="step-number">{number}</div><h3>{title}</h3><p>{desc}</p>
    </article>)}</div>
  </div></section>;
}

const reasons = [
  { label: 'No Parking', Icon: CarFront }, { label: 'Lights On', Icon: Zap },
  { label: 'Emergency', Icon: MessageCircle }, { label: 'Key Lost', Icon: KeyRound },
  { label: 'Vehicle Issue', Icon: CircleHelp }, { label: 'Other', Icon: Plus },
];
function PhoneDemo() {
  const [selected, setSelected] = useState('');
  return <section className="section phone-section"><div className="container phone-layout">
    <div className="phone">
      <div className="phone-inner">
        <div className="phone-top"><span>9:41</span><span>● ● ●</span></div>
        <div className="phone-brand"><img src={logo} alt="" />ScanMyOwner</div>
        <h3>How can we help?</h3><div className="phone-sub">Choose a reason to reach the owner</div>
        <div className="reason-list">{reasons.map(({ label, Icon }) => <button className={`reason${selected === label ? ' selected' : ''}`} onClick={() => setSelected(label)} key={label} data-testid={`demo-reason-${label.toLowerCase().replaceAll(' ', '-')}`}><span className="reason-icon"><Icon size={15} /></span>{label}<ArrowRight size={13} style={{ marginLeft: 'auto' }} /></button>)}</div>
        <div className="phone-footer"><LockKeyhole size={11} /> Your number stays private</div>
      </div>
      <p className="demo-note" data-testid="status-phone-demo">{selected ? `${selected} selected — this is a product preview.` : 'Interactive product preview'}</p>
    </div>
    <div className="phone-copy"><Eyebrow>A better kind of contact</Eyebrow><h2>One scan.<br />The right message.</h2><p>A quick message can solve a small problem before it becomes a big one. The scanner chooses a reason and your contact details stay yours.</p>
      <ul className="benefits">{['No number printed on your vehicle.', 'Anyone can scan with a phone camera.', 'Choose a reason before reaching out.', 'Contact stays private.'].map((b) => <li key={b}><span className="benefit-check"><Check size={14} /></span>{b}</li>)}</ul>
    </div>
  </div></section>;
}

function PrivacySection() {
  return <section className="section privacy-section" id="privacy"><div className="container privacy-layout">
    <div><Eyebrow>Privacy, built in</Eyebrow><h2>Your number stays private.</h2><p>Your QR tag connects people to you without putting your personal number on display. A simpler way to be reachable, on your terms.</p>
      <div className="privacy-points"><span><LockKeyhole size={14} />Private contact</span><span><MessageCircle size={14} />Simple communication</span><span><ShieldCheck size={14} />Less personal information exposed</span></div>
    </div>
    <img className="privacy-campaign-image" src={privacyCampaignImage} alt="ScanMyOwner privacy campaign showing a connected vehicle and the message “Your Number Private. Your Vehicle Connected.”" loading="lazy" />
  </div></section>;
}

const vehicleTypes = ['CAR', 'BIKE', 'SCOOTER', 'SUV', 'VAN', 'OTHER'];
const brands = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Kia', 'Honda', 'Volkswagen', 'Skoda', 'MG', 'Renault', 'Nissan', 'Jeep', 'BMW', 'Mercedes-Benz', 'Audi'];
const colors = [
  { name: 'White', hex: '#fdfdfb' }, { name: 'Black', hex: '#303634' }, { name: 'Silver', hex: '#b8c0bc' },
  { name: 'Grey', hex: '#747d79' }, { name: 'Blue', hex: '#49769a' }, { name: 'Red', hex: '#bf5146' },
  { name: 'Green', hex: '#4b7f58' }, { name: 'Yellow', hex: '#e4c64e' }, { name: 'Orange', hex: '#e58239' }, { name: 'Brown', hex: '#856b55' },
];
function VehicleConfigurator() {
  const [type, setType] = useState('CAR');
  const [brand, setBrand] = useState('Maruti Suzuki');
  const [model, setModel] = useState('');
  const [color, setColor] = useState(colors[0]);
  const isCar = type === 'CAR' || type === 'SUV' || type === 'VAN';
  const label = model.trim() || (type === 'CAR' ? 'Your vehicle' : `Your ${type.toLowerCase()}`);
  return <section className="section vehicle-section" id="vehicle"><div className="container">
    <div className="section-head"><Eyebrow>Make it yours</Eyebrow><h2>Make your tag feel like yours.</h2><p>Choose your vehicle and a color to see a simple preview. This is a frontend demo — no vehicle details are saved.</p></div>
    <div className="vehicle-layout">
      <div className="config-panel">
        <strong style={{ fontSize: 13, color: '#304336' }}>Your vehicle</strong>
        <div className="type-tabs" role="group" aria-label="Vehicle type">{vehicleTypes.map((v) => <button type="button" className={`type-tab${type === v ? ' active' : ''}`} onClick={() => setType(v)} key={v} aria-pressed={type === v} data-testid={`vehicle-type-${v.toLowerCase()}`}>{v}</button>)}</div>
        <div className="fields">
          {isCar && <div className="field"><label htmlFor="vehicle-brand">Brand</label><select id="vehicle-brand" value={brand} onChange={(e) => setBrand(e.target.value)} data-testid="select-vehicle-brand">{brands.map((b) => <option key={b}>{b}</option>)}</select></div>}
          <div className="field"><label htmlFor="vehicle-model">Model</label><input id="vehicle-model" value={model} placeholder="e.g. Swift" onChange={(e) => setModel(e.target.value)} data-testid="input-vehicle-model" /></div>
          <div className="field" style={{ gridColumn: '1 / -1', marginTop: 5 }}><label>Color</label><div className="color-row">{colors.map((c) => <button type="button" className={`color-choice${color.name === c.name ? ' active' : ''}`} key={c.name} style={{ background: c.hex }} title={c.name} aria-label={`Select ${c.name}`} aria-pressed={color.name === c.name} onClick={() => setColor(c)} data-testid={`vehicle-color-${c.name.toLowerCase()}`} />)}</div><div className="color-label" data-testid="text-selected-color">{color.name}</div></div>
        </div>
      </div>
      <div className="vehicle-preview" style={{ ['--car-color' as string]: color.hex }} data-testid="vehicle-preview">
        <div className="vehicle-tag"><img src={cardImage} alt="ScanMyOwner QR contact card" /></div>
        <div className="preview-car"><span className="wheel left" /><span className="wheel right" /></div>
        <div className="vehicle-preview-label" data-testid="text-vehicle-summary">{isCar ? `${brand} · ` : ''}{label} · {color.name}</div>
      </div>
    </div>
  </div></section>;
}

const features = [
  { title: 'PRIVATE CONTACT', desc: "Your personal number doesn't need to be displayed publicly.", Icon: LockKeyhole, long: true },
  { title: 'QUICK CONTACT', desc: 'People can reach you without searching for your number.', Icon: Zap },
  { title: 'NO APP FOR SCANNER', desc: 'Scan with a normal phone camera.', Icon: Smartphone },
  { title: 'UNIQUE QR', desc: 'Every tag has its own identity.', Icon: ShieldCheck },
  { title: 'EASY ACTIVATION', desc: 'Connect your tag to your vehicle.', Icon: Check },
  { title: 'READY TO GROW', desc: 'One platform for vehicles and everyday belongings.', Icon: Sparkles },
];
function FeaturesBento() {
  return <section className="section features-section" id="features"><div className="container">
    <div className="section-head"><Eyebrow>Thoughtful by design</Eyebrow><h2>Small tag.<br />Big peace of mind.</h2><p>The little details are what make a simple idea feel right.</p></div>
    <div className="bento">{features.map(({ title, desc, Icon, long }) => <article className="feature" key={title} data-testid={`feature-${title.toLowerCase().replaceAll(' ', '-')}`}>
      {long && <div className="feature-art"><div className="feature-qr-product"><img src={cardImage} alt="ScanMyOwner QR contact card" /><span><i /> UNIQUE TAG ID</span></div></div>}
      <div><Icon className="feature-icon" size={21} /><h3>{title}</h3><p>{desc}</p></div>
    </article>)}</div>
  </div></section>;
}

function EverydayScanPromo() {
  return <section className="everyday-promo">
    <div className="container">
      <div className="everyday-promo-card">
        <div className="everyday-promo-copy">
          <Eyebrow>When something comes up</Eyebrow>
          <h2>No parking? Lights on? One quick scan.</h2>
          <p>Let someone reach you about your vehicle without putting your personal number on display.</p>
          <Link className="btn btn-primary" href="/how-it-works">See how it works <ArrowRight size={15} /></Link>
        </div>
        <img src={parkingCampaignImage} alt="ScanMyOwner campaign showing a windshield QR tag beside the message “No Parking? Lights On? Just Scan.”" loading="lazy" />
      </div>
    </div>
  </section>;
}

const categories = [
  { name: 'Car', Icon: CarFront }, { name: 'Bike', Icon: Bike }, { name: 'Scooter', Icon: Bike },
  { name: 'Keys', Icon: KeyRound }, { name: 'Luggage', Icon: Package }, { name: 'Pets', Icon: Heart }, { name: 'Helmet', Icon: ShieldCheck },
];
function ProductExpansion() {
  return <section className="expansion-section"><div className="container"><div className="expansion-panel">
    <Eyebrow>More than a car tag</Eyebrow><h2>More than just a car tag.</h2>
    <p>ScanMyOwner is growing into a smart-tag platform for the things and companions that are part of everyday life.</p>
    <div className="category-row">{categories.map(({ name, Icon }) => <div className="category" key={name} data-testid={`category-${name.toLowerCase()}`}><Icon size={17} />{name}</div>)}</div>
  </div></div></section>;
}

function PricingCards() {
  const plans = [{ name: 'BASIC', price: '₹399', smart: false }, { name: 'SMART', price: '₹499', smart: true }];
  return <section className="section pricing-section" id="pricing"><div className="container">
    <div className="section-head"><Eyebrow>Simple, upfront pricing</Eyebrow><h2>Start simple.</h2><p>Choose the tag that feels right. Checkout is a preview only at this stage.</p></div>
    <div className="pricing-grid">{plans.map((plan) => <article className={`price-card${plan.smart ? ' popular' : ''}`} key={plan.name} data-testid={`pricing-card-${plan.name.toLowerCase()}`}>
      {plan.smart && <span className="popular-label">MOST POPULAR</span>}
      <h3>{plan.name}</h3><div className="price" data-testid={`text-price-${plan.name.toLowerCase()}`}>{plan.price} <small>/ tag</small></div>
      <p>A ScanMyOwner QR contact tag for your vehicle.</p><Link href="/vehicle" className={`btn ${plan.smart ? 'btn-primary' : 'btn-outline'}`} data-testid={`button-choose-${plan.name.toLowerCase()}`}>Choose {plan.name.toLowerCase()} <ArrowRight size={15} /></Link>
    </article>)}</div>
    <p className="price-note">Demo pricing · No payment will be collected on this website.</p>
  </div></section>;
}

const faqData = [
  ['What happens when someone scans my QR?', 'They land on a simple ScanMyOwner page, choose a reason for getting in touch, and can send a contact request. No app is needed for the person scanning.'],
  ['Is my phone number visible?', 'Your personal number is not printed on the tag or shown on the public scan page. ScanMyOwner is designed to help keep your contact private.'],
  ['Does the scanner need an app?', 'No. A phone camera can scan the QR code and open the contact page in a browser.'],
  ['Can I change my vehicle later?', 'Vehicle details can be updated in a future product experience. This frontend preview does not save configuration changes.'],
  ['Can I use the tag on a bike?', 'Yes. ScanMyOwner is designed for cars, bikes, scooters and other vehicles.'],
  ['Can I use ScanMyOwner for other items?', 'That is where we are headed. The platform is planned to expand to keys, luggage, pets, helmets and more.'],
];
function FAQ({ limit }: { limit?: number }) {
  const [active, setActive] = useState<number | null>(limit ? 0 : null);
  const display = limit ? faqData.slice(0, limit) : faqData;
  return <div className="faq-list">{display.map(([question, answer], i) => <article className="faq-item" key={question} id={i === 1 ? 'privacy' : undefined}>
    <button className="faq-question" onClick={() => setActive(active === i ? null : i)} aria-expanded={active === i} aria-controls={`faq-answer-${limit ? 'home' : 'page'}-${i}`} data-testid={`button-faq-${i}`}><span>{question}</span><Plus size={18} /></button>
    <div className={`faq-answer${active === i ? ' open' : ''}`} id={`faq-answer-${limit ? 'home' : 'page'}-${i}`}><div><p>{answer}</p></div></div>
  </article>)}</div>;
}
function FAQSection({ full = false }: { full?: boolean }) {
  return <section className="section faq-section" id="faq"><div className="container">
    <div className="section-head"><Eyebrow>Good to know</Eyebrow><h2>Questions, answered.</h2><p>A few things people often want to know before getting started.</p></div>
    <FAQ limit={full ? undefined : 4} />
    {!full && <div style={{ textAlign: 'center', marginTop: 27 }}><Link className="btn btn-outline" href="/faq" data-testid="link-all-faqs">See all questions <ArrowRight size={15} /></Link></div>}
  </div></section>;
}

function FinalCTA() {
  return <section className="cta"><div className="container cta-inner"><div><h2>Your vehicle.<br />Your privacy.<br />One simple scan.</h2><p>Give people a better way to reach you when it matters.</p></div>
    <div className="cta-art"><img src={cardImage} alt="ScanMyOwner QR tag product card" /><Link className="btn btn-orange" href="/vehicle" data-testid="button-final-get-tag">Get your QR tag <ArrowRight size={15} /></Link></div>
  </div></section>;
}

function Hero() {
  return <section className="hero"><div className="container hero-grid">
    <div><Eyebrow>SMART QR CONTACT</Eyebrow><h1>Need to reach the owner?<br />Just <em>scan.</em></h1>
      <p className="hero-copy">One smart QR tag that lets people contact you when your vehicle needs your attention — without exposing your personal number.</p>
      <div className="hero-actions"><Link className="btn btn-primary" href="/vehicle" data-testid="button-hero-get-tag">Get your QR tag <ArrowRight size={16} /></Link><Link className="btn btn-outline" href="/how-it-works" data-testid="button-hero-how">How it works</Link></div>
      <div className="trust-points"><span><Check size={14} />Private contact</span><span><Check size={14} />No app needed</span><span><Check size={14} />Works with any phone</span></div>
      <SearchLookup />
    </div>
     <div className="hero-visual">
       <figure className="hero-campaign-banner" data-testid="hero-campaign-banner">
         <img src={heroBannerImage} alt="ScanMyOwner banner showing a dark SUV with a QR tag and the message “Your Vehicle Always Safe.”" />
       </figure>
     </div>
  </div></section>;
}

function Home() {
  return <><Meta title="ScanMyOwner — Scan. Connect. Stay Private." description="A smart QR contact tag for your vehicle. Let people reach you when it matters, without exposing your personal number." />
    <Shell><main><Hero /><TrustStrip /><ProblemSection /><EverydayScanPromo /><HowSteps /><PhoneDemo /><PrivacySection /><VehicleConfigurator /><FeaturesBento /><ProductExpansion /><PricingCards /><FAQSection /><FinalCTA /></main></Shell>
  </>;
}

function PageHero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="page-hero"><div className="container"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{text}</p></div></div>;
}
function PricingPage() {
  return <><Meta title="Pricing | ScanMyOwner" description="Explore ScanMyOwner vehicle QR tag pricing. Simple frontend demo pricing for Basic and Smart tags." /><Shell><main><PageHero eyebrow="Simple, upfront pricing" title="A little more peace of mind." text="Choose a ScanMyOwner tag for your vehicle. These prices are a preview; checkout is not enabled yet." /><PricingCards /><FinalCTA /></main></Shell></>;
}
function HowPage() {
  return <><Meta title="How it works | ScanMyOwner" description="See how a ScanMyOwner smart QR tag helps someone reach a vehicle owner privately in three simple steps." /><Shell><main><PageHero eyebrow="A smarter way to connect" title="A scan can make all the difference." text="From a parked car to a quick solution, ScanMyOwner makes it easy to reach an owner without putting their personal number on display." /><HowSteps /><PhoneDemo /><PrivacySection /><FinalCTA /></main></Shell></>;
}
function FAQPage() {
  return <><Meta title="FAQs | ScanMyOwner" description="Answers to common questions about ScanMyOwner QR contact tags, privacy, scanning and vehicle setup." /><Shell><main><FAQSection full /><div className="container" style={{ textAlign: 'center', paddingBottom: 70 }}><p style={{ color: '#718076', fontSize: 13 }}>Still curious? <Link href="/contact" className="route-link">Talk to us</Link></p></div></main></Shell></>;
}
function ContactPage() {
  const [sent, setSent] = useState(false);
  function submit(e: FormEvent) { e.preventDefault(); setSent(true); }
  return <><Meta title="Contact | ScanMyOwner" description="Get in touch with the ScanMyOwner team. This contact form is a frontend-only demo." /><Shell><main><PageHero eyebrow="We're here to help" title="Say hello." text="Questions about ScanMyOwner? Send a note. This form is a frontend demo and will not send a message." /><div className="page-body"><div className="container contact-grid">
    <aside className="contact-aside"><h2>Let’s talk.</h2><p>We’d love to hear what you think, answer questions, or help you understand how the tag works.</p>
      <div className="contact-line"><MessageCircle size={17} /> General questions</div><div className="contact-line"><ShieldCheck size={17} /> Privacy and product info</div><div className="contact-line"><Clock3 size={17} /> Replies coming soon</div></aside>
    <div><div className="demo-banner">Frontend demo — submitting shows a local confirmation only.</div>
      {sent && <div className="form-success" role="status" data-testid="status-contact-sent">Thanks for reaching out. This demo has not sent your message.</div>}
      <form className="contact-form" onSubmit={submit} data-testid="form-contact">
        <label>Your name<input required autoComplete="name" placeholder="Name" data-testid="input-contact-name" /></label>
        <label>Email address<input required type="email" autoComplete="email" placeholder="you@example.com" data-testid="input-contact-email" /></label>
        <label>What would you like to ask?<textarea required placeholder="Write your message" data-testid="input-contact-message" /></label>
        <button className="btn btn-primary" type="submit" data-testid="button-contact-submit">Send message <ArrowRight size={15} /></button>
      </form>
    </div>
  </div></div></main></Shell></>;
}
function LoginPage() {
  const [submitted, setSubmitted] = useState(false);
  function submit(e: FormEvent) { e.preventDefault(); setSubmitted(true); }
  return <><Meta title="Login | ScanMyOwner" description="ScanMyOwner login screen preview. Account sign-in is not connected in this frontend demo." /><Shell><main><PageHero eyebrow="Your tags, together" title="Welcome back." text="Manage your ScanMyOwner tags from one simple place." /><div className="page-body"><div className="login-shell">
    <div className="login-logo"><img src={logo} alt="ScanMyOwner" /></div><h2>Sign in</h2><p>Account access is a frontend preview only.</p><div className="demo-banner">Demo only — authentication is not enabled.</div>
    {submitted && <div className="form-success" role="status" data-testid="status-login-demo">Sign-in is not connected yet. Your details were not sent or saved.</div>}
     <form className="login-form" onSubmit={submit} data-testid="form-login"><label>Email address<input required type="email" autoComplete="username" placeholder="you@example.com" data-testid="input-login-email" /></label><label>Password<input required type="password" autoComplete="current-password" placeholder="Your password" data-testid="input-login-password" /></label><button className="btn btn-primary" type="submit" data-testid="button-login-submit">Continue <ArrowRight size={15} /></button></form>
    <p style={{ marginTop: 18, marginBottom: 0 }}>New to ScanMyOwner? <Link className="route-link" href="/vehicle">Get your tag</Link></p>
  </div></div></main></Shell></>;
}

function VehiclePage() {
  return <><Meta title="Choose your vehicle | ScanMyOwner" description="Configure a sample vehicle and preview how it could appear with a ScanMyOwner QR tag. Demo only." /><Shell><main><PageHero eyebrow="Your vehicle, your tag" title="Start with your vehicle." text="Choose a vehicle type, brand and color to explore the ScanMyOwner experience. This preview does not save any information." /><VehicleConfigurator /><div className="container" style={{ textAlign: 'center', paddingBottom: 72 }}><div className="demo-banner" style={{ maxWidth: 580, margin: '0 auto 18px' }}>Checkout is a demo only — no payment or order will be placed.</div><Link href="/pricing" className="btn btn-outline" data-testid="link-vehicle-pricing">View tag pricing <ArrowRight size={15} /></Link></div></main></Shell></>;
}

function TagPage() {
  const [selected, setSelected] = useState('');
  return <><Meta title="ScanMyOwner | Demo vehicle tag" description="Sample ScanMyOwner tag page showing how a scanner can choose a reason to contact a vehicle owner." /><div className="tag-page"><div className="container"><div className="tag-card">
    <div className="tag-header"><img src={logo} alt="ScanMyOwner logo" /><div><strong>ScanMyOwner</strong><span>Smart QR contact</span></div></div>
    <div className="tag-car"><div className="tag-car-icon"><CarFront size={28} /></div><div><strong>Vehicle owner</strong><span>Maruti Suzuki · White</span></div></div>
    <h1>How can we help?</h1><p>Choose a reason to get in touch with the owner.</p>
    <div className="tag-reasons">{reasons.map(({ label, Icon }) => <button className={`tag-reason${selected === label ? ' selected' : ''}`} onClick={() => setSelected(label)} key={label} data-testid={`tag-contact-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={16} />{label}<ArrowRight size={13} style={{ marginLeft: 'auto' }} /></button>)}</div>
    {selected && <div className="tag-selected" role="status" data-testid="status-tag-choice"><strong>{selected}</strong> — This is a sample tag preview. No contact request has been sent.</div>}
    <div className="tag-privacy"><LockKeyhole size={13} />The owner’s personal number is not shown.</div>
  </div><div style={{ textAlign: 'center', marginTop: 19 }}><Link href="/" className="route-link" data-testid="link-tag-home">About ScanMyOwner</Link></div></div></div></>;
}

function Router() {
  return <RoutedErrorBoundary><Switch>
    <Route path="/" component={Home} />
    <Route path="/pricing" component={PricingPage} />
    <Route path="/how-it-works" component={HowPage} />
    <Route path="/faq" component={FAQPage} />
    <Route path="/contact" component={ContactPage} />
    <Route path="/login" component={LoginPage} />
    <Route path="/vehicle" component={VehiclePage} />
    <Route path="/t/demo123" component={TagPage} />
    <Route component={NotFound} />
  </Switch></RoutedErrorBoundary>;
}
function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
