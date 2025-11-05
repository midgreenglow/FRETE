import './App.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { auth, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, sendPasswordResetEmail, RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from 'firebase/auth';

const WHATSAPP_NUMBER = '9593250147';
const WHATSAPP_TEXT = encodeURIComponent(
  'Hi Frete! I want to book a Fretor visit to check quality and place a custom apparel order.'
);
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_TEXT}`;

function App() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({ name: '', phone: '' });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [quantityOpen, setQuantityOpen] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [confirmed, setConfirmed] = useState(false);
  const followupRef = useRef(null);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authErr, setAuthErr] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const recaptchaRef = useRef(null);
  const confirmationRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const doLogin = async () => {
    try {
      setAuthErr('');
      await signInWithEmailAndPassword(auth, authEmail, authPass);
      setAuthOpen(false);
    } catch (e) { setAuthErr(e.message || 'Login failed'); }
  };
  const doSignup = async () => {
    try {
      setAuthErr('');
      if (!phoneVerified) { setAuthErr('Please verify your phone with OTP first'); return; }
      await createUserWithEmailAndPassword(auth, authEmail, authPass);
      if (auth.currentUser && authPhone) {
        try { await updateProfile(auth.currentUser, { displayName: authPhone }); } catch (_) {}
      }
      setAuthOpen(false);
    } catch (e) { setAuthErr(e.message || 'Sign up failed'); }
  };
  const doGoogle = async () => {
    try { await signInWithPopup(auth, googleProvider); setAuthOpen(false); } catch (e) { setAuthErr(e.message || 'Google sign-in failed'); }
  };
  const doReset = async () => {
    try { await sendPasswordResetEmail(auth, authEmail); setAuthErr('Reset email sent'); } catch (e) { setAuthErr(e.message || 'Could not send reset email'); }
  };

  const ensureRecaptcha = () => {
    if (window.recaptchaVerifier) return window.recaptchaVerifier;
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
    return window.recaptchaVerifier;
  };
  const sendOtp = async () => {
    try {
      setAuthErr('');
      const verifier = ensureRecaptcha();
      const phoneE164 = authPhone.startsWith('+') ? authPhone : `+${authPhone}`;
      confirmationRef.current = await signInWithPhoneNumber(auth, phoneE164, verifier);
      setOtpSent(true);
    } catch (e) { setAuthErr(e.message || 'Failed to send OTP'); }
  };
  const verifyOtp = async () => {
    try {
      setAuthErr('');
      await confirmationRef.current.confirm(otpCode);
      setPhoneVerified(true);
    } catch (e) { setAuthErr(e.message || 'Invalid OTP'); }
  };

  const validate = () => {
    const next = { name: '', phone: '' };
    if (!name.trim()) next.name = 'Please enter your name';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) next.phone = 'Enter a valid phone number';
    setErrors(next);
    return !next.name && !next.phone;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const composed = encodeURIComponent(
      `Enquiry via Frete website\nName: ${name}\nPhone: ${phone}\nMessage: ${message || '(no message)'}\n`
    );
    const link = `https://wa.me/${WHATSAPP_NUMBER}?text=${composed}`;
    window.open(link, '_blank');
  };

  const buildWhatsAppLink = (category, gender, qty) => {
    const parts = [];
    if (category) parts.push(`Category: ${category.title}`);
    if (gender) parts.push(`For: ${gender}`);
    if (qty && Number(qty) > 0) parts.push(`Quantity: ${qty}`);
    const composed = encodeURIComponent(`Hi Frete! ${parts.join(' | ')}\n`);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${composed}`;
  };

  return (
    <div className="frete-app">
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <span className="brand-mark">F</span>
            <span className="brand-name">Frete</span>
          </div>
          <nav className="nav">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#gallery">Gallery</a>
            <a href="#booking">Booking</a>
            <a href="#contact">Contact</a>
            {user ? <a href="#orders">My Orders</a> : null}
            <a href={WHATSAPP_LINK} className="btn btn-outline" target="_blank" rel="noreferrer">WhatsApp</a>
            {user ? (
              <button className="btn btn-secondary" onClick={() => signOut(auth)}>Sign out</button>
            ) : (
              <button className="btn btn-primary" onClick={() => setAuthOpen(true)}>Sign in</button>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-copy">
              <h1>Custom apparel, delivered with trust</h1>
              <p>
                Frete makes ordering custom t‑shirts, varsity jackets, jerseys, and your own
                styles simple and trustworthy. A Fretor visits you in person to showcase
                real fabric and print quality. Get your marketplace set up in about 10 minutes
                after booking.
              </p>
              <div className="actions">
                <a href={WHATSAPP_LINK} className="btn btn-primary" target="_blank" rel="noreferrer">Book a Fretor</a>
                <a href="#how-it-works" className="btn btn-secondary">See how it works</a>
              </div>
              <div className="trust-badges">
                <span>In‑person quality check</span>
                <span>Fast setup</span>
                <span>Custom styles</span>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <img src="/images/freetiqmainimage.png" alt="Frete custom apparel" className="hero-image" />
            </div>
          </div>
        </section>

        {user ? (
          <section id="orders" className="section">
            <div className="container">
              <h2>My Orders</h2>
              <p className="muted">Signed in as {user.email || 'user'}. Order history will appear here.</p>
              <div className="grid orders-grid">
                {[1,2,3].map((n) => (
                  <div className="card" key={n}>
                    <h3>Order #{1000 + n}</h3>
                    <p className="muted">Status: Processing</p>
                    <p className="muted">Items: Sample entry</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section id="picker" className="section">
          <div className="container">
            <h2>What are you looking for?</h2>
            <p className="muted">Pick a category to get started</p>
            <CategoryPicker
              onPick={(cat) => {
                setSelectedCategory(cat);
                setSelectedGender(null);
                setTimeout(() => {
                  if (followupRef.current) {
                    followupRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 50);
              }}
              selectedCategory={selectedCategory}
            />
            {selectedCategory ? (
              <div className="followup" ref={followupRef}>
                <div className="sheet">
                  <div className="sheet-head">
                    <div className="Sel">{selectedCategory.title}</div>
                    <button className="icon-btn" onClick={() => { setSelectedCategory(null); setSelectedGender(null); }} aria-label="Close">✕</button>
                  </div>
                  <div className="sheet-body">
                    <div className="muted">Who will be rocking this fit?</div>
                    <div className="gender-row">
                      {['Male','Female','Unisex'].map(g => (
                        <button key={g} className={selectedGender === g ? 'chip active' : 'chip'} onClick={() => { setSelectedGender(g); setQuantityOpen(true); }}>{g}</button>
                      ))}
                    </div>
                    <div className="actions">
                      <a className="btn btn-primary" href={buildWhatsAppLink(selectedCategory, selectedGender)} target="_blank" rel="noreferrer">Continue on WhatsApp</a>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section id="gallery" className="section">
          <div className="container">
            <h2>Gallery</h2>
            <p className="muted">Sample custom pieces we can make. Images are placeholders for now.</p>
            <Gallery />
          </div>
        </section>

        <section id="testimonials" className="section alt">
          <div className="container">
            <h2>What customers say</h2>
            <div className="grid testimonials-grid">
              <figure className="t-card">
                <blockquote>"Quality was exactly as promised. Our college fest tees were a hit!"</blockquote>
                <figcaption>— Ananya, IIT KGP Fest Team</figcaption>
              </figure>
              <figure className="t-card">
                <blockquote>"Fretor visit built trust. We confirmed sizing and fabric in minutes."</blockquote>
                <figcaption>— Rahul, Corporate HR</figcaption>
              </figure>
              <figure className="t-card">
                <blockquote>"Fast turnaround and clean embroidery on our varsity jackets."</blockquote>
                <figcaption>— Meera, Sports Captain</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section id="size-fit" className="section">
          <div className="container">
            <h2>Size & Fit</h2>
            <div className="grid size-grid">
              <div className="card">
                <h3>Classic Crew Tee</h3>
                <div className="size-table">
                  <div className="row head"><span>Size</span><span>Chest (in)</span><span>Length (in)</span></div>
                  {[
                    ['S','38','26'],['M','40','27'],['L','42','28'],['XL','44','29'],['XXL','46','30']
                  ].map((r) => (
                    <div className="row" key={r[0]}><span>{r[0]}</span><span>{r[1]}</span><span>{r[2]}</span></div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3>Smart Polo</h3>
                <p className="muted">Regular fit. Go one size up for relaxed fit.</p>
              </div>
              <div className="card">
                <h3>Cozy Hoodie</h3>
                <p className="muted">Oversized option available on request.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="options" className="section alt">
          <div className="container">
            <h2>Fabric & Print options</h2>
            <div className="grid options-grid">
              <div className="card">
                <h3>Fabric</h3>
                <ul>
                  <li>100% Cotton (180–240 GSM)</li>
                  <li>Cotton Rich (60/40)</li>
                  <li>Performance Blend</li>
                </ul>
              </div>
              <div className="card">
                <h3>Print</h3>
                <ul>
                  <li>DTF (vibrant, versatile)</li>
                  <li>Screen (bulk friendly)</li>
                  <li>Embroidery (premium)</li>
                </ul>
              </div>
              <div className="card">
                <h3>Add‑ons</h3>
                <ul>
                  <li>Custom labels & tags</li>
                  <li>Individual packing</li>
                  <li>Rapid delivery</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="timeline" className="section">
          <div className="container">
            <h2>Your journey with Frete</h2>
            <ol className="steps wide">
              <li><span className="step-num">1</span><div><h4>Book</h4><p>Pick a time. Fretor confirms on WhatsApp.</p></div></li>
              <li><span className="step-num">2</span><div><h4>See Quality</h4><p>Feel fabrics, finalize prints and sizes.</p></div></li>
              <li><span className="step-num">3</span><div><h4>Approve</h4><p>Transparent quote and production timeline.</p></div></li>
              <li><span className="step-num">4</span><div><h4>Produce</h4><p>We craft and quality‑check your order.</p></div></li>
              <li><span className="step-num">5</span><div><h4>Deliver</h4><p>On‑time delivery to your doorstep.</p></div></li>
            </ol>
          </div>
        </section>

        <section id="faq" className="section alt">
          <div className="container">
            <h2>FAQ</h2>
            <div className="faq">
              {[
                {q:'Is there a minimum order quantity?', a:'No strict MOQ for tees; pricing improves with quantity.'},
                {q:'How long does production take?', a:'Typically 5–10 business days after design approval.'},
                {q:'Can I see samples first?', a:'Yes — your Fretor brings fabric and print samples.'},
              ].map((f, i) => (<details key={i}><summary>{f.q}</summary><p className="muted">{f.a}</p></details>))}
            </div>
          </div>
        </section>

        <section id="booking" className="section alt">
          <div className="container booking">
            <h2>Book a Fretor visit</h2>
            <p className="muted">Scheduling is coming soon. For now, message us on WhatsApp to pick a time.</p>
            <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-row">
                <label htmlFor="booking-date">Preferred date</label>
                <input id="booking-date" type="date" disabled />
              </div>
              <div className="form-row">
                <label htmlFor="booking-time">Preferred time</label>
                <input id="booking-time" type="time" disabled />
              </div>
              <div className="actions">
                <a href={WHATSAPP_LINK} className="btn btn-primary" target="_blank" rel="noreferrer">Pick a slot on WhatsApp</a>
              </div>
            </form>
          </div>
        </section>

        {confirmed ? (
          <section className="section">
            <div className="container">
              <div className="confirm card">
                <h2>Booking confirmed</h2>
                <p className="muted">Your Fretor is on the way to showcase fabric and print quality and finalize your custom design at your doorstep. Track the live location below.</p>
              </div>
            </div>
          </section>
        ) : null}

        {confirmed ? (
          <section id="tracker" className="section">
            <div className="container">
              <h2>Live Fretor location</h2>
              <p className="muted">Approximate location updates every few seconds.</p>
              <TrackerMap />
            </div>
          </section>
        ) : null}

        <section id="contact" className="section">
          <div className="container contact">
            <h2>Contact us</h2>
            <p className="muted">Have a custom idea? Book a Fretor or send us a message.</p>
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!errors.name}
                  aria-describedby="name-error"
                />
                {errors.name ? <div id="name-error" className="error">{errors.name}</div> : null}
              </div>
              <div className="form-row">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={!!errors.phone}
                  aria-describedby="phone-error"
                />
                {errors.phone ? <div id="phone-error" className="error">{errors.phone}</div> : null}
              </div>
              <div className="form-row">
                <label htmlFor="message">Message (optional)</label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Tell us what you want to make"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <div className="actions">
                <button type="submit" className="btn btn-primary">Send on WhatsApp</button>
                <a href={WHATSAPP_LINK} className="btn btn-secondary" target="_blank" rel="noreferrer">Just chat</a>
              </div>
            </form>
          </div>
        </section>

        <section id="features" className="section">
          <div className="container">
            <h2>Why choose Frete</h2>
            <div className="grid features-grid">
              <div className="card">
                <h3>Fretor visit</h3>
                <p>We come to you with samples so you can feel fabric quality and inspect prints before ordering.</p>
              </div>
              <div className="card">
                <h3>Fully customizable</h3>
                <p>Choose your category, style, colors, sizes, and prints. We make it yours.</p>
              </div>
              <div className="card">
                <h3>Fast marketplace setup</h3>
                <p>Launch your group order or storefront in about 10 minutes after booking.</p>
              </div>
              <div className="card">
                <h3>Transparent pricing</h3>
                <p>Clear quotes with no surprises. Approve after you see and touch the quality.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section alt">
          <div className="container">
            <h2>How it works</h2>
            <ol className="steps">
              <li>
                <span className="step-num">1</span>
                <div>
                  <h4>Book your Fretor</h4>
                  <p>Tap “Book a Fretor” and pick a time. We confirm on WhatsApp.</p>
                </div>
              </li>
              <li>
                <span className="step-num">2</span>
                <div>
                  <h4>See quality in person</h4>
                  <p>We visit with fabric and print samples so you can check quality and finalize specs.</p>
                </div>
              </li>
              <li>
                <span className="step-num">3</span>
                <div>
                  <h4>Launch and collect orders</h4>
                  <p>We set up your order page in ~10 minutes and start collecting sizes and payments.</p>
                </div>
              </li>
            </ol>
            <div className="center">
              <a href={WHATSAPP_LINK} className="btn btn-primary" target="_blank" rel="noreferrer">Book a Fretor</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="brand small">
            <span className="brand-mark">F</span>
            <span className="brand-name">Frete</span>
          </div>
          <div className="footer-cta">
            <a href={WHATSAPP_LINK} className="btn btn-outline" target="_blank" rel="noreferrer">Chat on WhatsApp</a>
          </div>
        </div>
      </footer>

      {quantityOpen ? (
        <QuantityModal
          defaultQuantity={quantity}
          onClose={() => setQuantityOpen(false)}
          onConfirm={(q) => {
            setQuantity(q);
            setQuantityOpen(false);
            setConfirmed(true);
            // Optionally notify via WhatsApp silently in new tab
            const link = buildWhatsAppLink(selectedCategory, selectedGender, q);
            window.open(link, '_blank');
            // Scroll to tracker
            const section = document.getElementById('tracker');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      ) : null}

      {authOpen ? (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-panel">
            <div className="modal-head">
              <h3>{authMode === 'login' ? 'Sign in' : 'Create account'}</h3>
              <button className="icon-btn" onClick={() => setAuthOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="modal-body">
              {authMode === 'signup' ? (
                <div className="form-row"><label>Phone (with country code)</label><input type="tel" placeholder="e.g. +91XXXXXXXXXX" value={authPhone} onChange={(e)=>setAuthPhone(e.target.value)} /></div>
              ) : null}
              <div className="form-row"><label>Email</label><input type="email" value={authEmail} onChange={(e)=>setAuthEmail(e.target.value)} /></div>
              <div className="form-row"><label>Password</label><input type="password" value={authPass} onChange={(e)=>setAuthPass(e.target.value)} /></div>
              {authErr ? <div className="error">{authErr}</div> : null}
              <div className="actions">
                {authMode === 'login' ? (
                  <>
                    <button className="btn btn-primary" onClick={doLogin}>Sign in</button>
                    <button className="btn btn-secondary" onClick={doGoogle}>Continue with Google</button>
                    <button className="btn btn-outline" onClick={() => setAuthMode('signup')}>Create account</button>
                    <button className="btn btn-outline" onClick={doReset}>Forgot password</button>
                  </>
                ) : (
                  <>
                    {!phoneVerified ? (
                      <>
                        {!otpSent ? (
                          <button className="btn btn-secondary" onClick={sendOtp}>Send OTP</button>
                        ) : (
                          <>
                            <div className="form-row"><label>Enter OTP</label><input type="text" value={otpCode} onChange={(e)=>setOtpCode(e.target.value)} /></div>
                            <button className="btn btn-secondary" onClick={verifyOtp}>Verify OTP</button>
                          </>
                        )}
                      </>
                    ) : null}
                    <button className="btn btn-primary" onClick={doSignup} disabled={!phoneVerified}>Sign up</button>
                    <button className="btn btn-outline" onClick={() => setAuthMode('login')}>Have an account? Sign in</button>
                  </>
                )}
              </div>
              <div id="recaptcha-container" ref={recaptchaRef} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;

function Gallery() {
  const items = useMemo(() => ([
    { id: 't1', title: 'Minimal Custom Tee', type: 'tshirt', img: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1200&auto=format&fit=crop' },
    { id: 't2', title: 'Bold Print Tee', type: 'tshirt', img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop' },
    { id: 'v1', title: 'Classic Varsity Jacket', type: 'varsity', img: 'https://images.unsplash.com/photo-1541534401786-2077eed87a6f?q=80&w=1200&auto=format&fit=crop' },
    { id: 'j1', title: 'Team Jersey', type: 'jersey', img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop' },
    { id: 'c1', title: 'Custom Hoodie', type: 'custom', img: 'https://images.unsplash.com/photo-1503342452485-86ff0a2c5ec7?q=80&w=1200&auto=format&fit=crop' },
    { id: 'c2', title: 'Special Edition', type: 'custom', img: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=1200&auto=format&fit=crop' },
  ]), []);

  const [filter, setFilter] = useState('all');
  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.type === filter)),
    [filter, items]
  );

  return (
    <div className="gallery">
      <div className="filters">
        {['all', 'tshirt', 'varsity', 'jersey', 'custom'].map((f) => (
          <button key={f} className={f === filter ? 'chip active' : 'chip'} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div className="grid gallery-grid">
        {visible.map((it) => (
          <figure key={it.id} className="gallery-card">
            <img src={it.img} alt={it.title} loading="lazy" />
            <figcaption>
              <div className="title">{it.title}</div>
              <div className="type">{it.type}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function QuantityModal({ defaultQuantity = 10, onClose, onConfirm }) {
  const [q, setQ] = useState(defaultQuantity);
  const dialogRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="qty-title" ref={dialogRef}>
      <div className="modal-panel">
        <div className="modal-head">
          <h3 id="qty-title">How many pieces do you need?</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <p className="muted">Tell us your estimated quantity. You can adjust later after our Fretor visit.</p>
          <div className="qty-row">
            <button className="chip" onClick={() => setQ((n) => Math.max(1, n - 5))}>-5</button>
            <input type="number" min={1} value={q} onChange={(e) => setQ(Math.max(1, Number(e.target.value) || 1))} />
            <button className="chip" onClick={() => setQ((n) => n + 5)}>+5</button>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onConfirm(q)}>Confirm request</button>
        </div>
      </div>
    </div>
  );
}

function TrackerMap() {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    let cleanup = () => {};
    let tries = 0;
    const init = () => {
      const L = window.L;
      if (!L || !mapEl.current) {
        if (tries++ < 40) setTimeout(init, 100);
        return;
      }
      if (mapRef.current) return; // prevent double init in Strict Mode
      // Kharagpur, West Bengal
      const start = [22.3460, 87.2310];
      mapRef.current = L.map(mapEl.current).setView(start, 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapRef.current);
      markerRef.current = L.marker(start).addTo(mapRef.current).bindPopup('Fretor');
      const id = setInterval(() => {
        const lat = start[0] + (Math.random() - 0.5) * 0.01; // smaller, smoother steps
        const lng = start[1] + (Math.random() - 0.5) * 0.01;
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
      }, 3000);
      cleanup = () => {
        clearInterval(id);
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        markerRef.current = null;
      };
    };
    init();
    return () => cleanup();
  }, []);

  return <div id="map" ref={mapEl} className="map"></div>;
}

function CategoryPicker({ onPick, selectedCategory }) {
  const categories = [
    { id: 'round', title: 'Classic Crew Tee', img: '/images/round.jpg' },
    { id: 'polo', title: 'Smart Polo', img: '/images/polo.jpg' },
    { id: 'varsity', title: 'Varsity Jacket', img: '/images/varsity.jpg' },
    { id: 'hoodie', title: 'Cozy Hoodie', img: '/images/hoodie.jpg' },
    { id: 'jersey', title: 'Team Jersey', img: '/images/jersey.jpg' },
    { id: 'custom', title: 'Design Your Own', img: '/images/your%20own%20category.jpg' },
  ];

  return (
    <div className="grid picker-grid">
      {categories.map((c) => (
        <button
          key={c.id}
          className={selectedCategory?.id === c.id ? 'picker-card active' : 'picker-card'}
          onClick={() => onPick(c)}
        >
          <span className="badge">{c.title}</span>
          <img
            src={c.img}
            alt={c.title}
            loading="lazy"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://picsum.photos/seed/${c.id}/1200/900`; }}
          />
        </button>
      ))}
    </div>
  );
}
