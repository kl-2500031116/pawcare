import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import DogHead from "./DogHead.jsx";

export function Header() {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    const { error } = await signOut();
    if (error) window.alert(error.message);
  };

  return (
    <>
      <div className="utility-bar"><div className="container utility-inner">
        <span className="utility-location"><i className="fa-solid fa-location-dot" aria-hidden="true" /> Vijayawada, Andhra Pradesh</span>
        <div className="hours-ticker" role="group" aria-label="Working hours Monday to Saturday, 10:00 AM to 4:30 PM">
          <i className="fa-regular fa-clock" aria-hidden="true" />
          <div className="hours-ticker-window" aria-hidden="true"><div className="hours-ticker-track">
            <span>Working hours: Mon–Sat · 10:00 AM–4:30 PM</span>
            <span>Working hours: Mon–Sat · 10:00 AM–4:30 PM</span>
          </div></div>
        </div>
      </div></div>
      <header className="site-header">
        <nav className="container nav">
          <Link className="brand" to="/"><span className="brand-icon"><i className="fa-solid fa-paw" /></span><span>Paw<span>Care</span></span></Link>
          <button
            ref={menuButtonRef}
            className="nav-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-controls="primary-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <i className={`fa-solid ${menuOpen ? "fa-xmark" : "fa-bars"}`} aria-hidden="true" />
          </button>
          <div id="primary-navigation" className={`nav-content${menuOpen ? " is-open" : ""}`}>
            <div className="nav-links">
              <NavLink to="/" end>Home</NavLink>
              <NavLink to="/pets">Find a pet</NavLink>
              <NavLink to="/care">Pet care</NavLink>
              <a href="/#process" onClick={() => setMenuOpen(false)}>How it works</a>
              <a href="/#resources" onClick={() => setMenuOpen(false)}>Resources</a>
              <a href="/#about" onClick={() => setMenuOpen(false)}>About</a>
            </div>
            <div className="nav-actions">
              {user ? <>
                <Link className="button button-outline button-small" to="/list-pet">List a pet</Link>
                <Link className="button button-outline button-small" to="/account">My account</Link>
                {profile?.role === "admin" && <Link className="button button-outline button-small" to="/admin">Admin</Link>}
                <span className="user-name">{profile?.full_name || user.email}</span>
                <button className="button button-primary button-small" onClick={handleSignOut}>Sign out</button>
              </> : <Link className="button button-primary button-small" to="/login">Sign in</Link>}
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}

export function Footer() {
  return <footer className="footer"><div className="container footer-inner">
    <Link className="brand brand-light" to="/"><span className="brand-icon"><i className="fa-solid fa-paw" /></span><span>Paw<span>Care</span></span></Link>
    <p>Every animal deserves a safe, loving home.</p>
    <div className="klu-credit">
      <a href="https://www.kluniversity.in/" target="_blank" rel="noopener noreferrer" aria-label="KL University official website">
        <img src="/klu-logo.png" alt="KL University logo" loading="lazy" />
      </a>
      <span className="klu-credit-copy"><strong>A student project by KL University students</strong></span>
    </div>
    <small>© {new Date().getFullYear()} PawCare · Vijayawada, India</small>
  </div></footer>;
}

export function Page({ children, className = "" }) {
  return <main className={className}>{children}</main>;
}

export function Loading() {
  return <div className="loading-state" role="status" aria-live="polite"><DogHead /><span>Loading…</span></div>;
}

export function ErrorState({ error }) {
  return <div className="notice notice-error" role="alert">{error?.message || String(error)}</div>;
}

export function EmptyState({ children }) {
  return <div className="state-box">{children}</div>;
}
