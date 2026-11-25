import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { addPet, cancelCareBooking, createApplication, createCareBooking, createCareListing, deletePet, getAdminData, getApplicationDocument, getCareListings, getMyApplications, getMyCareBookings, getMyCareListings, getMyPetListings, getPet, getPets, getPublicImpactStats, respondToCareBooking, reviewApplication, reviewPetListing, setCareListingActive, submitPetListing, updatePet } from "./data.js";
import { EmptyState, ErrorState, Loading, Page } from "./components.jsx";
import { AdoptionApplicationDocument, AdoptionCertificateDocument, HouseCheckDocument } from "./documents.jsx";
import { filterPets, getPetLocations } from "./petFilters.js";

const steps = [
  ["01", "Find your companion", "Browse rescues and find a pet whose personality fits your home."],
  ["02", "Get to know them", "Learn about their story, health, and everything that makes them special."],
  ["03", "Apply to adopt", "Tell us a little about your home and why you would like to adopt."],
  ["04", "Meet your match", "Our team reviews your application and arranges a friendly meet-and-greet."],
];

function ImpactStats({ compact = false }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getPublicImpactStats()
      .then((result) => {
        if (active) setStats(result);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <div className={`impact-stats impact-stats-error${compact ? " impact-stats-compact" : ""}`} role="alert">
      <strong>Current PawCare totals are unavailable.</strong><span>{error}</span>
    </div>;
  }

  const figures = [
    ["listed", "Pets listed", "fa-paw"],
    ["available", compact ? "Available" : "Available for adoption", "fa-house"],
    ["adopted", "Adopted", "fa-heart"],
  ];

  return <section className={`impact-stats${compact ? " impact-stats-compact" : ""}`} aria-label="Current PawCare pet-record totals">
    <div className="impact-stats-heading"><span className="impact-live-indicator" aria-hidden="true" />PawCare pet records</div>
    <div className="impact-stats-grid" aria-live="polite">
      {figures.map(([key, label, icon]) => <div className="impact-stat" key={key}>
        <span className="impact-stat-icon"><i className={`fa-solid ${icon}`} aria-hidden="true" /></span>
        <strong>{loading ? "…" : stats[key].toLocaleString("en-IN")}</strong>
        <span>{label}</span>
      </div>)}
    </div>
    <p className="impact-stats-note">Counts are read from PawCare pet records when this page loads. We don’t track a separate all-time “saved” total.</p>
  </section>;
}

export function HomePage() {
  const [pets, setPets] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    getPets().then(setPets).catch((e) => setError(e.message));
  }, []);

  return <Page>
    <section className="hero"><div className="container hero-grid">
      <div className="hero-copy">
        <span className="eyebrow"><i className="fa-solid fa-heart" /> A little love changes everything</span>
        <h1>Find your new <span>best friend.</span></h1>
        <p>Rescued pets, ready for a second chance. Meet the companion who’s been waiting for you.</p>
        <div className="button-row"><Link className="button button-primary" to="/pets">Meet the pets <i className="fa-solid fa-arrow-right" /></Link><a className="button button-outline" href="#process">How adoption works</a></div>
        <div className="hero-proof"><span className="proof-icon"><i className="fa-solid fa-shield-heart" /></span><span><strong>Thoughtful, ethical adoption</strong><small>Every pet is cared for by our rescue team.</small></span></div>
      </div>
      <div className="hero-photo"><img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1100&q=85" alt="Two happy dogs enjoying time together" /><span className="hero-float-icon hero-float-paw" aria-hidden="true"><i className="fa-solid fa-paw" /></span><span className="hero-float-icon hero-float-heart" aria-hidden="true"><i className="fa-solid fa-heart" /></span><div className="photo-caption"><span>Good things start with a hello.</span><i className="fa-solid fa-heart" /></div></div>
    </div></section>
    <div className="impact-section container"><ImpactStats /></div>
    <section className="section container" id="pets">
      <div className="section-heading"><div><span className="eyebrow">Meet your match</span><h2>Friends looking for a family</h2><p>Real personalities. Happy beginnings. Maybe one of them is yours.</p></div><Link className="text-link" to="/pets">See all pets <i className="fa-solid fa-arrow-right" /></Link></div>
      {error && <ErrorState error={error} />}
      {pets.length === 0 && !error ? <Loading /> : <div className="pet-grid">{pets.filter((pet) => pet.status === "Available").slice(0, 3).map((pet) => <PetCard key={pet.id} pet={pet} />)}</div>}
    </section>
    <section className="process-section" id="process"><div className="container"><div className="section-heading"><div><span className="eyebrow">A good match, made with care</span><h2>Adoption should feel right.</h2><p>We’re here to help you and your new friend get off to a wonderful start.</p></div></div><div className="steps-grid">{steps.map(([number, title, description]) => <article className="step-card" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></div></section>
    <section className="resources-section" id="resources">
      <div className="container">
        <div className="resources-heading">
          <span className="eyebrow"><i className="fa-solid fa-book-open" /> Adoption resources</span>
          <h2>Good information makes for a better beginning.</h2>
          <p>Take time to understand an animal’s needs and make sure adoption is right for everyone in your home.</p>
        </div>
        <div className="readiness-card">
          <div className="readiness-title"><span className="readiness-icon"><i className="fa-solid fa-house" aria-hidden="true" /></span><div><h3>Before you apply</h3><p>A few practical things to consider:</p></div></div>
          <ul className="readiness-list">
            <li>Think about your household, daily routine, space, and the ongoing cost of care.</li>
            <li>Meet the animal and ask the rescue about temperament, known health history, and vaccinations.</li>
            <li>Plan for a patient settling-in period and continuing veterinary care.</li>
          </ul>
        </div>
        <div className="resource-grid">
          <article className="resource-card">
            <div className="resource-card-top"><span className="resource-icon"><i className="fa-solid fa-landmark" aria-hidden="true" /></span><span className="resource-type">Official reference</span></div>
            <h3>Animal Welfare Board of India</h3>
            <p>Learn about AWBI’s role as India’s statutory advisory body on animal-welfare laws and explore its official information.</p>
            <a className="resource-link" href="https://awbi.gov.in/view/index/introduction" target="_blank" rel="noopener noreferrer">Visit AWBI <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /></a>
          </article>
          <article className="resource-card">
            <div className="resource-card-top"><span className="resource-icon"><i className="fa-solid fa-hand-holding-heart" aria-hidden="true" /></span><span className="resource-type">Rescue organisation</span></div>
            <h3>Stray Animal Foundation India</h3>
            <p>Explore SAFI’s rescue and adoption work. Its local adoption information focuses on Hyderabad and the surrounding area; check its current eligibility and process.</p>
            <a className="resource-link" href="https://strayanimalfoundationindia.org/7-ways-to-adopt-a-pet-and-transform-lives/" target="_blank" rel="noopener noreferrer">Explore SAFI adoption <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /></a>
          </article>
          <article className="resource-card">
            <div className="resource-card-top"><span className="resource-icon"><i className="fa-regular fa-newspaper" aria-hidden="true" /></span><span className="resource-type">Independent article · 2019</span></div>
            <h3>The Better India: adopting a dog</h3>
            <p>A dog-focused guide covering lifestyle fit, meeting shelter animals, asking about medical history, and helping a new companion settle in. Confirm current procedures with the rescue.</p>
            <a className="resource-link" href="https://thebetterindia.com/205001/how-to-adopt-dog-army-india-pet-adoption-dog-shelter-process-procedure/" target="_blank" rel="noopener noreferrer">Read the guide <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /></a>
          </article>
        </div>
        <p className="resources-note">These are independent reference sources. Adoption procedures can vary by organisation and location, so confirm current details directly with the rescue caring for the animal.</p>
      </div>
    </section>
    <section className="about-section container" id="about"><div className="about-copy"><span className="eyebrow">A home for every heart</span><h2>Rescue is just the beginning.</h2><p>At PawCare, we believe the best relationships start with care and a little patience. Our Vijayawada rescue community looks after each animal and supports you through every step of adoption.</p><Link className="text-link" to="/pets">Find your new friend <i className="fa-solid fa-arrow-right" /></Link></div><div className="about-note"><i className="fa-solid fa-paw" /><strong>More than a new pet.</strong><p>A best friend, a familiar face at the door, and a little more joy in every day.</p></div></section>
  </Page>;
}

export function PetCard({ pet }) {
  return <article className="pet-card">
    <Link to={`/pets/${pet.id}`} className="pet-image"><img src={pet.image_url} alt={pet.name} loading="lazy" /><span className="pet-type">{pet.type}</span></Link>
    <div className="pet-card-body"><div className="pet-title-row"><h3>{pet.name}</h3><span className={`status status-${pet.status.toLowerCase()}`}>{pet.status}</span></div><p className="pet-breed">{pet.breed}</p><div className="pet-meta"><span><i className="fa-solid fa-cake-candles" /> {pet.age}</span><span><i className="fa-solid fa-location-dot" /> {pet.location}</span></div><Link className="text-link" to={`/pets/${pet.id}`}>Get to know {pet.name} <i className="fa-solid fa-arrow-right" /></Link></div>
  </article>;
}

export function PetsPage() {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getPets().then(setPets).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  const locations = useMemo(() => getPetLocations(pets), [pets]);
  const filtered = useMemo(
    () => filterPets(pets, { search, type, gender, location }),
    [pets, search, type, gender, location],
  );

  return <Page className="page-section container">
    <div className="section-heading"><div><span className="eyebrow">Meet the rescue crew</span><h1>Find your new best friend.</h1><p>Every animal has their own story. Yours could be next.</p></div><Link className="button button-primary" to={user ? "/list-pet" : "/login"}>List a pet for adoption <i className="fa-solid fa-arrow-right" aria-hidden="true" /></Link></div>
    <div className="filter-bar">
      <label className="search-field"><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, breed, or city" aria-label="Search pets" /></label>
      <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by animal type"><option value="">All animals</option><option>Dog</option><option>Cat</option><option>Rabbit</option><option>Other</option></select>
      <select value={gender} onChange={(e) => setGender(e.target.value)} aria-label="Filter by gender"><option value="">All genders</option><option>Male</option><option>Female</option></select>
      <select value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Filter by location"><option value="">All locations</option>{locations.map((city) => <option value={city} key={city}>{city}</option>)}</select>
      <button className="button button-outline button-small" onClick={() => { setSearch(""); setType(""); setGender(""); setLocation(""); }}>Reset</button>
    </div>
    {error && <ErrorState error={error} />}
    {loading ? <Loading /> : filtered.length ? <div className="pet-grid">{filtered.map((pet) => <PetCard key={pet.id} pet={pet} />)}</div> : <EmptyState>No pets match those filters yet. Try a different search.</EmptyState>}
  </Page>;
}

export function CarePage() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notificationWarning, setNotificationWarning] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [showListingForm, setShowListingForm] = useState(false);
  const [bookingListing, setBookingListing] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [listingForm, setListingForm] = useState({
    provider_name: "",
    contact_phone: "",
    contact_phone_public: false,
    service_type: "Boarding",
    location: "",
    rate_per_day: "",
    pet_types: ["Dog"],
    description: "",
    availability: "",
  });
  const [bookingForm, setBookingForm] = useState({
    pet_name: "",
    pet_type: "Dog",
    start_date: "",
    end_date: "",
    owner_phone: "",
    notes: "",
  });
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  async function fetchCareData() {
    const [activeListings, ownListings, ownBookings] = await Promise.all([
      getCareListings(),
      user?.id ? getMyCareListings(user.id) : Promise.resolve([]),
      user?.id ? getMyCareBookings(user.id) : Promise.resolve([]),
    ]);
    return { activeListings, ownListings, ownBookings };
  }

  async function refreshCareData() {
    const data = await fetchCareData();
    setListings(data.activeListings || []);
    setMyListings(data.ownListings || []);
    setBookings(data.ownBookings || []);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchCareData()
      .then((data) => {
        if (!active) return;
        setListings(data.activeListings || []);
        setMyListings(data.ownListings || []);
        setBookings(data.ownBookings || []);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    setListingForm((current) => ({
      ...current,
      provider_name: profile?.full_name || current.provider_name,
      contact_phone: profile?.phone || current.contact_phone,
    }));
    setBookingForm((current) => ({
      ...current,
      owner_phone: profile?.phone || current.owner_phone,
    }));
  }, [profile?.full_name, profile?.phone]);

  const ownListingIds = new Set(myListings.map((listing) => listing.id));
  const allListings = [
    ...myListings,
    ...listings.filter((listing) => !ownListingIds.has(listing.id)),
  ];
  const filteredListings = allListings.filter((listing) => {
    const matchesType = !serviceType || listing.service_type === serviceType;
    const matchesLocation = !locationSearch || listing.location.toLowerCase().includes(locationSearch.trim().toLowerCase());
    return matchesType && matchesLocation;
  });

  function updateListingForm(event) {
    const { name, value } = event.target;
    setListingForm((current) => ({ ...current, [name]: value }));
  }

  function toggleCarePetType(type, checked) {
    setListingForm((current) => ({
      ...current,
      pet_types: checked
        ? [...new Set([...current.pet_types, type])]
        : current.pet_types.filter((item) => item !== type),
    }));
  }

  async function submitListing(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setNotificationWarning("");
    setBusyAction("listing");
    try {
      const result = await createCareListing(listingForm);
      await refreshCareData();
      setNotificationWarning(result.notificationWarning);
      setSuccess("Your care service is now listed.");
      setShowListingForm(false);
      setListingForm((current) => ({
        ...current,
        service_type: "Boarding",
        location: "",
        rate_per_day: "",
        pet_types: ["Dog"],
        description: "",
        availability: "",
        contact_phone_public: false,
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyAction("");
    }
  }

  function startBooking(listing) {
    setBookingListing(listing);
    setBookingForm({
      pet_name: "",
      pet_type: listing.pet_types[0] || "Dog",
      start_date: today,
      end_date: today,
      owner_phone: profile?.phone || "",
      notes: "",
    });
    setError("");
    setSuccess("");
  }

  async function submitBooking(event) {
    event.preventDefault();
    if (!bookingListing) return;
    setError("");
    setSuccess("");
    setNotificationWarning("");
    setBusyAction(`booking-${bookingListing.id}`);
    try {
      const result = await createCareBooking({ ...bookingForm, listing_id: bookingListing.id });
      await refreshCareData();
      setNotificationWarning(result.notificationWarning);
      setBookingListing(null);
      setSuccess("Your care request was sent. You can track its status below.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyAction("");
    }
  }

  async function changeListingActive(listing) {
    setError("");
    setSuccess("");
    setNotificationWarning("");
    setBusyAction(`listing-${listing.id}`);
    try {
      const result = await setCareListingActive(listing.id, !listing.active);
      await refreshCareData();
      setNotificationWarning(result.notificationWarning);
      setSuccess(`Your care service is ${listing.active ? "paused" : "active"}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyAction("");
    }
  }

  async function changeBookingStatus(booking, status) {
    setError("");
    setSuccess("");
    setNotificationWarning("");
    setBusyAction(`request-${booking.id}`);
    try {
      const result = status === "Cancelled"
        ? await cancelCareBooking(booking.id)
        : await respondToCareBooking(booking.id, status);
      await refreshCareData();
      setNotificationWarning(result.notificationWarning);
      setSuccess(`Care request ${status.toLowerCase()}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyAction("");
    }
  }

  return <Page className="page-section container care-page">
    <div className="care-hero">
      <div>
        <span className="eyebrow">Help for your best friend</span>
        <h1>Pet care, while you're away.</h1>
        <p>Find local boarding, in-home sitting, and drop-in visits—or offer a caring hand to another pet family.</p>
      </div>
      {user
        ? <button className="button button-primary" type="button" onClick={() => setShowListingForm((show) => !show)}>{showListingForm ? "Close form" : "Offer pet care"} <i className={`fa-solid ${showListingForm ? "fa-xmark" : "fa-plus"}`} aria-hidden="true" /></button>
        : <Link className="button button-primary" to="/login">Sign in to offer care <i className="fa-solid fa-arrow-right" aria-hidden="true" /></Link>}
    </div>

    {error && <ErrorState error={error} />}
    {success && <div className="notice notice-success" role="status">{success}</div>}
    {notificationWarning && <div className="notice notice-info" role="status">{notificationWarning}</div>}

    {user && showListingForm && <form className="form-card care-form" onSubmit={submitListing}>
      <div className="care-section-heading"><div><span className="eyebrow">Become a caretaker</span><h2>Offer a care service</h2></div></div>
      <div className="form-grid">
        <label className="field"><span>Your name</span><input name="provider_name" value={listingForm.provider_name} onChange={updateListingForm} maxLength="100" required /></label>
        <label className="field"><span>Contact phone</span><input name="contact_phone" value={listingForm.contact_phone} onChange={updateListingForm} maxLength="40" type="tel" required /></label>
        <label className="field"><span>Care service</span><select name="service_type" value={listingForm.service_type} onChange={updateListingForm}><option>Boarding</option><option>In-home sitting</option><option>Drop-in visits</option></select></label>
        <label className="field"><span>City or neighborhood</span><input name="location" value={listingForm.location} onChange={updateListingForm} maxLength="100" placeholder="e.g. Vijayawada" required /></label>
        <label className="field"><span>Rate per day (₹)</span><input name="rate_per_day" type="number" min="0" max="100000" step="1" value={listingForm.rate_per_day} onChange={updateListingForm} required /></label>
        <label className="field"><span>Availability</span><input name="availability" value={listingForm.availability} onChange={updateListingForm} maxLength="300" placeholder="e.g. Weekends and holidays" required /></label>
        <fieldset className="field care-pet-types"><legend>Animals you can care for</legend>{["Dog", "Cat", "Rabbit", "Other"].map((type) => <label key={type}><input type="checkbox" checked={listingForm.pet_types.includes(type)} onChange={(event) => toggleCarePetType(type, event.target.checked)} /> {type}</label>)}</fieldset>
        <label className="field care-description"><span>Describe your care</span><textarea name="description" rows="4" value={listingForm.description} onChange={updateListingForm} maxLength="1200" placeholder="Tell families about your experience, home, and routine." required /></label>
      </div>
      <label className="care-consent"><input type="checkbox" checked={listingForm.contact_phone_public} onChange={(event) => setListingForm((current) => ({ ...current, contact_phone_public: event.target.checked }))} required /> I agree that my phone number will be visible to anyone viewing this public listing.</label>
      <div className="button-row"><button className="button button-primary" type="submit" disabled={busyAction === "listing"}>{busyAction === "listing" ? "Publishing…" : "Publish care service"}</button><button className="button button-outline" type="button" onClick={() => setShowListingForm(false)}>Cancel</button></div>
    </form>}

    <section className="care-listings-section">
      <div className="care-section-heading"><div><span className="eyebrow">Local support</span><h2>Find a caretaker</h2></div><span className="care-listing-count">{filteredListings.length} {filteredListings.length === 1 ? "service" : "services"}</span></div>
      <div className="care-filters">
        <label className="field"><span>Search by city</span><input value={locationSearch} onChange={(event) => setLocationSearch(event.target.value)} placeholder="Any location" /></label>
        <label className="field"><span>Care type</span><select value={serviceType} onChange={(event) => setServiceType(event.target.value)}><option value="">All services</option><option>Boarding</option><option>In-home sitting</option><option>Drop-in visits</option></select></label>
      </div>
      {loading ? <Loading /> : filteredListings.length ? <div className="care-listing-grid">{filteredListings.map((listing) => {
        const isOwner = user?.id === listing.provider_id;
        const bookingOpen = bookingListing?.id === listing.id;
        return <article className={`care-listing-card${listing.active ? "" : " care-listing-inactive"}`} key={listing.id}>
          <div className="care-listing-top"><span className="care-service-icon"><i className={`fa-solid ${listing.service_type === "Boarding" ? "fa-house" : listing.service_type === "In-home sitting" ? "fa-person-shelter" : "fa-clock"}`} aria-hidden="true" /></span><span className={`status ${listing.active ? "status-available" : "status-rejected"}`}>{listing.active ? listing.service_type : "Paused"}</span></div>
          <h3>{listing.provider_name}</h3>
          <p className="care-location"><i className="fa-solid fa-location-dot" aria-hidden="true" /> {listing.location}</p>
          <p className="care-description-text">{listing.description}</p>
          <div className="care-pills">{listing.pet_types.map((type) => <span key={type}>{type}</span>)}</div>
          <div className="care-listing-details"><span><strong>Availability</strong>{listing.availability}</span><span><strong>Rate</strong>{Number(listing.rate_per_day) === 0 ? "Free" : `₹${Number(listing.rate_per_day).toLocaleString("en-IN")}`} / day</span></div>
          {listing.contact_phone_public && listing.contact_phone
            ? <a className="care-contact" href={`tel:${listing.contact_phone}`}><i className="fa-solid fa-phone" aria-hidden="true" /> {listing.contact_phone}</a>
            : <span className="care-contact"><i className="fa-solid fa-comments" aria-hidden="true" /> Managed through PawCare requests</span>}
          {isOwner
            ? <button className="button button-outline button-small care-card-action" type="button" disabled={busyAction === `listing-${listing.id}`} onClick={() => changeListingActive(listing)}>{listing.active ? "Pause listing" : "Reactivate listing"}</button>
            : listing.active && (user
              ? <button className="button button-primary button-small care-card-action" type="button" onClick={() => startBooking(listing)}>Request care</button>
              : <Link className="button button-primary button-small care-card-action" to="/login">Sign in to request care</Link>)}
          {bookingOpen && <form className="care-booking-form" onSubmit={submitBooking}>
            <h4>Request care from {listing.provider_name}</h4>
            <label className="field"><span>Pet name</span><input value={bookingForm.pet_name} onChange={(event) => setBookingForm((current) => ({ ...current, pet_name: event.target.value }))} maxLength="100" required /></label>
            <label className="field"><span>Animal type</span><select value={bookingForm.pet_type} onChange={(event) => setBookingForm((current) => ({ ...current, pet_type: event.target.value }))}>{listing.pet_types.map((type) => <option key={type}>{type}</option>)}</select></label>
            <div className="care-date-row"><label className="field"><span>From</span><input type="date" min={today} value={bookingForm.start_date} onChange={(event) => setBookingForm((current) => ({ ...current, start_date: event.target.value }))} required /></label><label className="field"><span>Until</span><input type="date" min={bookingForm.start_date || today} value={bookingForm.end_date} onChange={(event) => setBookingForm((current) => ({ ...current, end_date: event.target.value }))} required /></label></div>
            <label className="field"><span>Your phone</span><input type="tel" value={bookingForm.owner_phone} onChange={(event) => setBookingForm((current) => ({ ...current, owner_phone: event.target.value }))} maxLength="40" required /></label>
            <label className="field"><span>Care instructions (optional)</span><textarea rows="3" value={bookingForm.notes} onChange={(event) => setBookingForm((current) => ({ ...current, notes: event.target.value }))} maxLength="1000" /></label>
            <div className="button-row"><button className="button button-primary button-small" type="submit" disabled={busyAction === `booking-${listing.id}`}>{busyAction === `booking-${listing.id}` ? "Sending…" : "Send request"}</button><button className="button button-outline button-small" type="button" onClick={() => setBookingListing(null)}>Close</button></div>
          </form>}
        </article>;
      })}</div> : <EmptyState>No care services match those filters yet. Try another location or check back later.</EmptyState>}
    </section>

    {user && <section className="care-requests-section">
      <div className="care-section-heading"><div><span className="eyebrow">Your activity</span><h2>Care requests</h2></div></div>
      {bookings.length ? <div className="care-request-list">{bookings.map((booking) => {
        const listing = booking.care_listings;
        const isProvider = user.id === listing?.provider_id;
        const isRequester = user.id === booking.owner_id;
        const canRespond = isProvider && booking.status === "Pending";
        const canCancel = isRequester && booking.status === "Pending";
        return <article className="care-request-card" key={booking.id}>
          <div className="care-request-main">
            <div className="care-request-title"><h3>{booking.pet_name} <span>· {booking.pet_type}</span></h3><span className={`status status-${booking.status.toLowerCase()}`}>{booking.status}</span></div>
            <p>{listing?.service_type || "Care service"} with {isProvider ? booking.owner_name : listing?.provider_name || "caretaker"} · {listing?.location || "Location unavailable"}</p>
            <p className="care-request-dates"><i className="fa-regular fa-calendar" aria-hidden="true" /> {booking.start_date} to {booking.end_date}</p>
            <p className="care-request-contact">{isProvider ? `Requester: ${booking.owner_phone}` : `Caretaker: ${listing?.contact_phone || "Managed through PawCare requests"}`}</p>
            {booking.notes && <p className="care-request-notes">Care instructions: {booking.notes}</p>}
          </div>
          {(canRespond || canCancel) && <div className="button-row care-request-actions">
            {canRespond && <>
              <button className="button button-primary button-small" type="button" disabled={busyAction === `request-${booking.id}`} onClick={() => changeBookingStatus(booking, "Accepted")}>Accept</button>
              <button className="button button-outline button-small" type="button" disabled={busyAction === `request-${booking.id}`} onClick={() => changeBookingStatus(booking, "Declined")}>Decline</button>
            </>}
            {canCancel && <button className="button button-outline button-small" type="button" disabled={busyAction === `request-${booking.id}`} onClick={() => changeBookingStatus(booking, "Cancelled")}>Cancel request</button>}
          </div>}
        </article>;
      })}</div> : <EmptyState>Your care requests and incoming bookings will appear here.</EmptyState>}
    </section>}
  </Page>;
}

export function PetListingPage() {
  return <AuthGate><PetListingForm /></AuthGate>;
}

function PetListingForm() {
  const photoInputRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    type: "Dog",
    breed: "",
    age: "",
    gender: "Female",
    location: "",
    image_url: "",
    description: "",
    vaccination: "",
    health: "",
    personality: "",
    owner_confirmed: false,
  });
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notificationWarning, setNotificationWarning] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSubmitted(false);
    setNotificationWarning("");
    try {
      const result = await submitPetListing(form, photoFile);
      setNotificationWarning(result.notificationWarning);
      setSubmitted(true);
      setPhotoFile(null);
      if (photoInputRef.current) photoInputRef.current.value = "";
      setForm({
        name: "",
        type: "Dog",
        breed: "",
        age: "",
        gender: "Female",
        location: "",
        image_url: "",
        description: "",
        vaccination: "",
        health: "",
        personality: "",
        owner_confirmed: false,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const change = (event) => {
    const { name, value, type, checked } = event.target;
    if (name === "image_url" && value) {
      setPhotoFile(null);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const choosePhoto = (event) => {
    const file = event.target.files?.[0] || null;
    setPhotoFile(file);
    if (file) setForm((current) => ({ ...current, image_url: "" }));
  };

  return <Page className="form-page container">
    <section className="form-card pet-listing-form">
      <span className="eyebrow">Community adoption listing</span>
      <h1>Help your pet find a home.</h1>
      <p>Share your pet’s details and location. PawCare reviews every community listing before it appears publicly.</p>
      {error && <ErrorState error={error} />}
      {submitted && <div className="notice notice-success" role="status">Your pet was submitted for review. You can track its status in <Link to="/account">your account</Link>.</div>}
      {notificationWarning && <div className="notice notice-info" role="status">{notificationWarning}</div>}
      <form className="form-grid" onSubmit={submit}>
        <label className="field"><span>Pet name</span><input name="name" value={form.name} onChange={change} maxLength="100" required /></label>
        <label className="field"><span>Breed</span><input name="breed" value={form.breed} onChange={change} maxLength="100" required /></label>
        <label className="field"><span>Animal type</span><select name="type" value={form.type} onChange={change} required><option>Dog</option><option>Cat</option><option>Rabbit</option><option>Other</option></select></label>
        <label className="field"><span>Age</span><input name="age" value={form.age} onChange={change} maxLength="40" placeholder="e.g. 2 years" required /></label>
        <label className="field"><span>Gender</span><select name="gender" value={form.gender} onChange={change} required><option>Female</option><option>Male</option></select></label>
        <label className="field"><span>City or location</span><input name="location" value={form.location} onChange={change} maxLength="100" placeholder="e.g. Vijayawada" required /></label>
        <div className="field field-full pet-photo-fields">
          <label className="field"><span>Upload a pet photo</span><input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} /><small className="field-help">JPG, PNG, or WebP up to 5 MB. Uploaded photos are publicly accessible.</small></label>
          {photoPreview && <img className="pet-upload-preview" src={photoPreview} alt="Preview of the selected pet photo" />}
          <label className="field"><span>Or use a photo URL</span><input name="image_url" type="url" value={form.image_url} onChange={change} placeholder="https://…" required={!photoFile} /></label>
        </div>
        <label className="field field-full"><span>Description</span><textarea name="description" value={form.description} onChange={change} rows="4" maxLength="2000" required /></label>
        <label className="field"><span>Vaccination</span><input name="vaccination" value={form.vaccination} onChange={change} maxLength="200" placeholder="Optional" /></label>
        <label className="field"><span>Health details</span><input name="health" value={form.health} onChange={change} maxLength="200" placeholder="Optional" /></label>
        <label className="field field-full"><span>Personality</span><input name="personality" value={form.personality} onChange={change} maxLength="200" placeholder="Optional" /></label>
        <label className="consent-field field-full"><input name="owner_confirmed" type="checkbox" checked={form.owner_confirmed} onChange={change} required /><span>I am this pet’s owner or authorized caretaker and have permission to arrange its adoption and share this photo publicly.</span></label>
        <p className="field-help field-full">Submitting a listing does not schedule an adoption or home visit. PawCare will review it and contact you if more information is needed.</p>
        <div className="field-full"><button className="button button-primary" disabled={busy}>{busy ? (photoFile ? "Uploading photo…" : "Submitting…") : "Submit for review"}</button></div>
      </form>
    </section>
  </Page>;
}

export function PetDetailsPage() {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    setLoading(true);
    setError("");
    setPet(null);
    getPet(id).then(setPet).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);
  if (error) return <Page className="page-section container"><ErrorState error={error} /></Page>;
  if (loading) return <Page className="page-section container"><Loading /></Page>;
  if (!pet) return <Page className="page-section container"><EmptyState>This pet could not be found.</EmptyState></Page>;
  return <Page className="page-section container"><Link className="text-link back-link" to="/pets"><i className="fa-solid fa-arrow-left" /> Back to all pets</Link><div className="detail-layout"><img className="detail-image" src={pet.image_url} alt={pet.name} /><div className="detail-copy"><span className={`status status-${pet.status.toLowerCase()}`}>{pet.status}</span><span className="eyebrow">{pet.type} · {pet.breed}</span><h1>Meet {pet.name}.</h1><p className="detail-description">{pet.description}</p><div className="detail-facts"><span><strong>Age</strong>{pet.age}</span><span><strong>Gender</strong>{pet.gender}</span><span><strong>Location</strong>{pet.location}</span><span><strong>Vaccination</strong>{pet.vaccination || "Ask our team"}</span><span><strong>Health</strong>{pet.health || "Ask our team"}</span><span><strong>Personality</strong>{pet.personality || "One of a kind"}</span></div>{pet.status === "Available" ? <Link className="button button-primary" to={`/apply?pet=${pet.id}`}>Apply to adopt {pet.name} <i className="fa-solid fa-arrow-right" /></Link> : <p className="notice notice-info">This pet is not currently accepting adoption applications.</p>}</div></div></Page>;
}

export function AuthPage({ mode, onGuest }) {
  const { user, loading, register, signIn, verifyOtp, resendSignupOtp, requestPasswordReset, completePasswordReset } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState("form");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeField, setActiveField] = useState("");
  const registering = mode === "register";
  const hasTyped = Boolean(fullName || phone || email || password || confirmPassword || code);
  useEffect(() => {
    if (stage !== "success") return undefined;
    const timeout = window.setTimeout(() => navigate("/", { replace: true }), 1800);
    return () => window.clearTimeout(timeout);
  }, [stage, navigate]);
  if (loading) return <Page className="auth-page"><Loading /></Page>;
  if (user && stage !== "success") return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (stage === "form") {
        if (registering && password !== confirmPassword) throw new Error("Your passwords do not match.");
        if (registering) {
          await register({ full_name: fullName, phone, email, password });
          setStage("verify-signup");
          setMessage(`We sent a six-digit verification code to ${email.trim()}.`);
        } else {
          await signIn(email, password);
          setStage("success");
        }
      } else if (stage === "request-reset") {
        await requestPasswordReset(email);
        setStage("verify-reset");
        setMessage("If an account exists for this address, a password reset code has been sent.");
      } else if (stage === "verify-signup") {
        await verifyOtp(email, code, "signup");
        setStage("success");
      } else {
        if (password !== confirmPassword) throw new Error("Your passwords do not match.");
        await verifyOtp(email, code, "recovery");
        await completePasswordReset(password);
        setStage("form");
        setPassword("");
        setConfirmPassword("");
        setCode("");
        setMessage("Your password has been updated. Sign in with your new password.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await resendSignupOtp(email);
      setMessage(`A new verification code was sent to ${email.trim()}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function continueAsGuest() {
    onGuest?.();
    navigate("/");
  }

  const stageHeading = {
    form: registering ? "Create your account" : "Welcome to PawCare",
    "verify-signup": "Verify your email",
    "request-reset": "Reset your password",
    "verify-reset": "Enter your reset code",
  }[stage];

  return <Page className="auth-page">
    <div className="auth-wildlife" aria-hidden="true"><span className="wildlife-paw wildlife-paw-one">🐾</span><span className="wildlife-paw wildlife-paw-two">🐾</span><span className="wildlife-cat">🐈</span><span className="wildlife-bird">🦜</span></div>
    <section className="auth-layout">
    <div className="auth-brand-side"><Link className="auth-brand" to="/"><span className="auth-logo-icon"><i className="fa-solid fa-paw" /></span><span>Paw<span>Care</span><small>PET ADOPTION COMMUNITY</small></span></Link>
      <span className="auth-kicker"><i className="fa-solid fa-heart" /> A fresh start for them. A best friend for you.</span>
      <h1>Give a pet a home.<br />Give a home a <span>friend.</span></h1>
      <p>Our Vijayawada rescue community brings dogs, cats, and rabbits together with the families who are ready to love them.</p>
      <div className="auth-promises"><div><i className="fa-solid fa-shield-heart" /><span><strong>Care comes first</strong><small>Every rescue gets thoughtful attention.</small></span></div><div><i className="fa-solid fa-house" /><span><strong>Adoption, with support</strong><small>We’re here to help you find your match.</small></span></div></div>
      <ImpactStats compact />
      <div className="auth-contact"><span><i className="fa-solid fa-location-dot" /> Vijayawada, Andhra Pradesh</span><a href="tel:+917981719930"><i className="fa-solid fa-phone" /> +91 79817 19930</a></div>
    </div>
    <div className="auth-form-side" onFocusCapture={(event) => { if (event.target instanceof HTMLInputElement) setActiveField(event.target.name || (event.target.type === "password" ? "password" : event.target.autocomplete || "watching")); }} onBlurCapture={(event) => { if (event.target instanceof HTMLInputElement && !(event.relatedTarget instanceof HTMLInputElement)) setActiveField(""); }}>
      {stage === "success" ? <div className="auth-success" role="status" aria-live="polite">
        <div className="success-pets" aria-hidden="true"><span>🐶</span><span>🐱</span><span>🦜</span></div>
        <span className="success-check"><i className="fa-solid fa-check" /></span>
        <span className="eyebrow">PawCare says hello</span>
        <h2>{registering ? "You’re officially in!" : "Welcome back!"}</h2>
        <p>{registering ? "Your account is ready. Your next chapter together starts now." : "You’re signed in. Let’s see who’s waiting to meet you."}</p>
        <span className="success-loading"><i /> Taking you to PawCare…</span>
      </div> : <>
      <AuthMascot mood={activeField} hasTyped={hasTyped} />
      <div className="auth-form-heading"><span className="eyebrow">Your next chapter starts here</span><h2>{stageHeading}</h2><p>{stage === "form" ? registering ? "A few details and you’re on your way." : "Sign in to manage your adoption journey." : "Follow the steps below to securely continue."}</p></div>
      {stage === "form" && <div className="auth-tabs"><Link className={!registering ? "active" : ""} to="/login">Sign in</Link><Link className={registering ? "active" : ""} to="/register">Register</Link></div>}
      {error && <ErrorState error={error} />}
      {message && <div className="notice notice-info" role="status">{message}</div>}
      <form className="form-stack" onSubmit={submit}>
        {stage === "form" && registering && <Field label="Full name" name="full_name" value={fullName} setValue={setFullName} required minLength={2} autoComplete="name" />}
        {stage === "form" && registering && <Field label="Phone number" name="phone" type="tel" value={phone} setValue={setPhone} required autoComplete="tel" />}
        {(stage === "form" || stage === "request-reset") && <Field label="Email address" name="email" type="email" value={email} setValue={setEmail} required autoComplete="email" />}
        {stage === "form" && <Field label="Password" name="password" type="password" value={password} setValue={setPassword} required minLength={8} autoComplete={registering ? "new-password" : "current-password"} />}
        {stage === "form" && registering && <Field label="Confirm password" name="confirm_password" type="password" value={confirmPassword} setValue={setConfirmPassword} required minLength={8} autoComplete="new-password" />}
        {(stage === "verify-signup" || stage === "verify-reset") && <Field label="Six-digit email code" name="code" type="text" value={code} setValue={setCode} required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} />}
        {stage === "verify-reset" && <Field label="New password" name="new_password" type="password" value={password} setValue={setPassword} required minLength={8} autoComplete="new-password" />}
        {stage === "verify-reset" && <Field label="Confirm new password" name="confirm_new_password" type="password" value={confirmPassword} setValue={setConfirmPassword} required minLength={8} autoComplete="new-password" />}
        <button className="button button-primary button-wide" disabled={busy}>{busy ? "Please wait…" : stage === "form" ? registering ? "Create account" : "Sign in and continue" : stage === "request-reset" ? "Send reset code" : stage === "verify-reset" ? "Verify code and update password" : "Verify email address"} <i className="fa-solid fa-arrow-right" /></button>
      </form>
      {stage === "form" && !registering && <button className="text-link auth-forgot-button" type="button" onClick={() => { setError(""); setMessage(""); setStage("request-reset"); }}>Forgot your password?</button>}
      {stage === "verify-signup" && <button className="text-link auth-resend-button" type="button" disabled={busy} onClick={resendCode}>Resend verification code</button>}
      {stage !== "form" && <button className="text-link auth-resend-button" type="button" onClick={() => { setError(""); setMessage(""); setStage("form"); }}>Back to sign in</button>}
      {stage === "form" && <div className="auth-guest"><span>Just looking around?</span><button className="text-link auth-guest-button" type="button" onClick={continueAsGuest}>Continue as a guest <i className="fa-solid fa-arrow-right" /></button></div>}
      </>}
    </div>
    </section>
  </Page>;
}

function AuthMascot({ mood, hasTyped }) {
  const isPassword = mood.includes("password");
  const expression = isPassword ? "secret" : mood ? "watching" : "rest";
  const image = mood ? "/german-shepherd-gaze.gif" : "/german-shepherd-gaze-still.png";
  return <div className={`auth-mascot auth-mascot-${expression}${hasTyped ? " has-typed" : ""}${mood ? " is-active" : ""}`} data-field={mood} aria-hidden="true">
    <img className="mascot-gif" src={image} alt="" />
    {isPassword && <span className="gaze-cover" aria-hidden="true">
      <svg viewBox="0 0 100 48" focusable="false">
        <g><ellipse cx="27" cy="29" rx="15" ry="11" /><circle cx="17" cy="15" r="6" /><circle cx="27" cy="11" r="6" /><circle cx="37" cy="16" r="6" /></g>
        <g><ellipse cx="73" cy="29" rx="15" ry="11" /><circle cx="63" cy="16" r="6" /><circle cx="73" cy="11" r="6" /><circle cx="83" cy="15" r="6" /></g>
      </svg>
    </span>}
  </div>;
}

function PawcareShepherd() {
  return <svg className="shepherd-pup" viewBox="0 0 140 150" focusable="false">
    <defs>
      <linearGradient id="pup-coat" x1=".2" x2=".8" y1="0" y2="1"><stop stopColor="#f2c878" /><stop offset=".58" stopColor="#d88e4d" /><stop offset="1" stopColor="#ae633b" /></linearGradient>
      <linearGradient id="pup-muzzle" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#f9e4bb" /><stop offset="1" stopColor="#e8b779" /></linearGradient>
    </defs>
    <ellipse cx="70" cy="140" rx="37" ry="5.5" fill="#70412e" opacity=".16" />
    <g className="shepherd-pup-head">
      <path d="M43 58 18 11q-4-7-8 1l2 47q3 20 29 29Z" fill="#3c3030" stroke="#5c382e" strokeWidth="2.5" />
      <path d="m36 57-16-33 2 31q2 13 16 21z" fill="#c77752" />
      <path d="M97 58 122 11q4-7 8 1l-2 47q-3 20-29 29Z" fill="#3c3030" stroke="#5c382e" strokeWidth="2.5" />
      <path d="m104 57 16-33-2 31q-2 13-16 21z" fill="#c77752" />
      <path d="M34 59Q35 25 70 19q35 6 36 40v35q-4 34-36 42-32-8-36-42z" fill="url(#pup-coat)" stroke="#75432e" strokeWidth="2.2" />
      <path d="M50 29q20-13 40 0l-4 39q-16 13-32 0z" fill="#343139" />
      <path d="M62 23q8-5 16 0l3 48-11 10-11-10z" fill="#232a32" />
      <path d="M41 63q9-5 18 0m22 0q9-5 18 0" fill="none" stroke="#4a3029" strokeLinecap="round" strokeWidth="3" />
      <g className="shepherd-pup-eyes">
        <ellipse cx="50" cy="74" rx="10" ry="11" fill="#fffaf0" stroke="#613e30" strokeWidth="1.8" /><ellipse cx="90" cy="74" rx="10" ry="11" fill="#fffaf0" stroke="#613e30" strokeWidth="1.8" />
        <g className="shepherd-pup-pupil-dots"><circle cx="50" cy="74" r="5.3" fill="#17212d" /><circle cx="90" cy="74" r="5.3" fill="#17212d" /><circle cx="52" cy="71.5" r="1.7" fill="#fff" /><circle cx="92" cy="71.5" r="1.7" fill="#fff" /></g>
      </g>
      <g className="shepherd-pup-blink"><ellipse cx="50" cy="74" rx="11" ry="12" fill="#d98d50" /><ellipse cx="90" cy="74" rx="11" ry="12" fill="#d98d50" /><path d="M41 74q9 5 18 0m22 0q9 5 18 0" fill="none" stroke="#4a3029" strokeLinecap="round" strokeWidth="2.5" /></g>
      <path d="M42 87q10-13 28-8 18-5 28 8v20q-4 23-28 25-24-2-28-25z" fill="url(#pup-muzzle)" />
      <ellipse cx="70" cy="89" rx="11" ry="7.5" fill="#18212a" /><ellipse cx="67" cy="86.5" rx="2.3" ry="1.5" fill="#fff" opacity=".75" />
      <path d="M70 96v5m0 0q-9 9-17 0m17 0q9 9 17 0" fill="none" stroke="#55342d" strokeLinecap="round" strokeWidth="2.3" />
      <path d="M64 107q6 4 12 0v7q-6 10-12 0z" fill="#ec7f7e" stroke="#b95a62" strokeWidth="1" />
      <path d="M47 113q23 14 46 0l2 9q-25 17-50 0z" fill="#2876d6" stroke="#1553a5" strokeWidth="1.5" /><circle cx="70" cy="124" r="4.5" fill="#ffd56f" stroke="#b87a1c" strokeWidth="1.3" />
      <g className="shepherd-pup-cover-paw shepherd-pup-cover-paw-left"><ellipse cx="49" cy="75" rx="14" ry="12" fill="#e2a267" stroke="#6d422f" strokeWidth="1.8" /><circle cx="43" cy="71" r="2.2" fill="#8c5138" /><circle cx="49" cy="69" r="2.2" fill="#8c5138" /><circle cx="55" cy="71" r="2.2" fill="#8c5138" /></g>
      <g className="shepherd-pup-cover-paw shepherd-pup-cover-paw-right"><ellipse cx="91" cy="75" rx="14" ry="12" fill="#e2a267" stroke="#6d422f" strokeWidth="1.8" /><circle cx="85" cy="71" r="2.2" fill="#8c5138" /><circle cx="91" cy="69" r="2.2" fill="#8c5138" /><circle cx="97" cy="71" r="2.2" fill="#8c5138" /></g>
    </g>
  </svg>;
}

function PawcareHusky() {
  return <svg className="husky-pup" viewBox="0 0 140 150" focusable="false">
    <defs>
      <linearGradient id="pawcare-husky-coat" x1=".15" x2=".85" y1="0" y2="1"><stop stopColor="#7895c7" /><stop offset="1" stopColor="#3e5f99" /></linearGradient>
      <linearGradient id="pawcare-husky-mask" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#ffffff" /><stop offset="1" stopColor="#deebfb" /></linearGradient>
    </defs>
    <ellipse cx="70" cy="139" rx="37" ry="5.5" fill="#36527f" opacity=".16" />
    <g className="husky-pup-head">
      <path d="M43 58 18 12q-4-7-8 1l3 47q4 19 29 25Z" fill="#344e7d" stroke="#294066" strokeWidth="2.3" /><path d="m36 56-16-31 3 30q2 12 15 19z" fill="#e7b6b9" />
      <path d="M97 58 122 12q4-7 8 1l-3 47q-4 19-29 25Z" fill="#344e7d" stroke="#294066" strokeWidth="2.3" /><path d="m104 56 16-31-3 30q-2 12-15 19z" fill="#e7b6b9" />
      <path d="M34 59Q35 25 70 19q35 6 36 40v34q-4 35-36 43-32-8-36-43z" fill="url(#pawcare-husky-coat)" stroke="#314a77" strokeWidth="2.2" />
      <path d="M48 34q22-15 44 0l-3 27q-9 9-19 10-10-1-19-10z" fill="#304971" />
      <path d="M60 27q10-6 20 0l4 43-14 9-14-9z" fill="#f7fbff" />
      <path d="M43 62q8-5 16-1m22 0q8-4 16 1" fill="none" stroke="#2c4168" strokeLinecap="round" strokeWidth="2.8" />
      <g className="husky-pup-eyes"><ellipse cx="50" cy="73" rx="10.5" ry="11.5" fill="#fff" stroke="#304971" strokeWidth="1.8" /><ellipse cx="90" cy="73" rx="10.5" ry="11.5" fill="#fff" stroke="#304971" strokeWidth="1.8" /><g className="husky-pup-pupil-dots"><circle cx="50" cy="73" r="5.4" fill="#1e2f4e" /><circle cx="90" cy="73" r="5.4" fill="#1e2f4e" /><circle cx="52" cy="70.5" r="1.75" fill="#fff" /><circle cx="92" cy="70.5" r="1.75" fill="#fff" /></g></g>
      <g className="husky-pup-blink"><ellipse cx="50" cy="73" rx="11.5" ry="12.5" fill="#eff5fe" /><ellipse cx="90" cy="73" rx="11.5" ry="12.5" fill="#eff5fe" /><path d="M41 73q9 5 18 0m22 0q9 5 18 0" fill="none" stroke="#304971" strokeLinecap="round" strokeWidth="2.4" /></g>
      <path d="M42 86q9-12 28-8 19-4 28 8v21q-5 23-28 25-23-2-28-25z" fill="url(#pawcare-husky-mask)" />
      <ellipse cx="70" cy="89" rx="11" ry="7.5" fill="#23344f" /><ellipse cx="67" cy="86.5" rx="2.3" ry="1.5" fill="#fff" opacity=".8" /><path d="M70 96v5m0 0q-9 8-17 0m17 0q9 8 17 0" fill="none" stroke="#415779" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M64 107q6 4 12 0v7q-6 10-12 0z" fill="#f58a93" stroke="#cb6470" strokeWidth="1" />
      <path d="M47 113q23 14 46 0l2 9q-25 17-50 0z" fill="#5f83c1" stroke="#3d5e99" strokeWidth="1.5" /><circle cx="70" cy="124" r="4.5" fill="#ffd77b" stroke="#b7832a" strokeWidth="1.3" />
      <g className="husky-pup-cover-paw husky-pup-cover-paw-left"><ellipse cx="49" cy="74" rx="14" ry="12" fill="#eff5fe" stroke="#526f9e" strokeWidth="1.7" /><circle cx="43" cy="70" r="2.2" fill="#5b79a8" /><circle cx="49" cy="68" r="2.2" fill="#5b79a8" /><circle cx="55" cy="70" r="2.2" fill="#5b79a8" /></g>
      <g className="husky-pup-cover-paw husky-pup-cover-paw-right"><ellipse cx="91" cy="74" rx="14" ry="12" fill="#eff5fe" stroke="#526f9e" strokeWidth="1.7" /><circle cx="85" cy="70" r="2.2" fill="#5b79a8" /><circle cx="91" cy="68" r="2.2" fill="#5b79a8" /><circle cx="97" cy="70" r="2.2" fill="#5b79a8" /></g>
    </g>
  </svg>;
}

function Field({ label, type = "text", value, setValue, ...props }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} onChange={(e) => setValue(e.target.value)} {...props} /></label>;
}

function AuthGate({ children, admin = false }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <Page className="page-section container"><Loading /></Page>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && profile?.role !== "admin") return <Page className="page-section container"><div className="notice notice-error">This page is for PawCare administrators. Your account does not have admin access.</div></Page>;
  return children;
}

export function ApplicationPage() {
  return <AuthGate><ApplicationForm /></AuthGate>;
}

function ApplicationForm() {
  const { user, profile } = useAuth();
  const [params] = useSearchParams();
  const [petId, setPetId] = useState(params.get("pet") || "");
  const [pets, setPets] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notificationWarning, setNotificationWarning] = useState("");
  const [submittedApplication, setSubmittedApplication] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    age: "",
    occupation: "",
    address: "",
    residence: "",
    experience: "",
    current_pets: "",
    reason: "",
    visit_preference: "",
    house_check_consent: false,
    care_commitments: false,
    signature_name: "",
  });

  useEffect(() => {
    getPets().then(setPets).catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    setForm((current) => ({
      ...current,
      full_name: current.full_name || profile?.full_name || "",
      phone: current.phone || profile?.phone || "",
    }));
  }, [profile?.full_name, profile?.phone]);
  const availablePets = pets.filter((pet) => pet.status === "Available");

  async function submit(event) {
    event.preventDefault();
    if (!petId) return setError("Please choose an available pet.");
    setBusy(true);
    setError("");
    setSuccess("");
    setNotificationWarning("");
    try {
      const application = await createApplication({ applicant_id: user.id, email: user.email, pet_id: petId, ...form, age: Number(form.age) });
      setSubmittedApplication(application);
      setNotificationWarning(application.notificationWarning);
      setSuccess("Your application has been submitted. Our team will be in touch soon.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  return <Page className="form-page container"><section className="form-card"><span className="eyebrow">A few details about you</span><h1>Start your adoption story.</h1><p>Tell us about your home so we can help find the right match.</p>
    {error && <ErrorState error={error} />}{success && <div className="notice notice-success">{success}</div>}{notificationWarning && <div className="notice notice-info" role="status">{notificationWarning}</div>}
    {submittedApplication && <div className="button-row field-full application-document-actions"><Link className="button button-primary" to={`/documents/${submittedApplication.id}/application`}>Print / save application PDF</Link><Link className="button button-outline" to={`/documents/${submittedApplication.id}/house-check`}>Print / save house-check form</Link></div>}
    <form className="form-grid" onSubmit={submit}>
      <label className="field"><span>Full name</span><input name="full_name" value={form.full_name} onChange={change} required autoComplete="name" /></label>
      <label className="field"><span>Email</span><input value={user.email || ""} readOnly /></label>
      <label className="field"><span>Phone number</span><input name="phone" type="tel" value={form.phone} onChange={change} required autoComplete="tel" /></label>
      <label className="field"><span>Age</span><input name="age" type="number" value={form.age} onChange={change} required min="18" max="120" /></label>
      <label className="field"><span>Occupation</span><input name="occupation" value={form.occupation} onChange={change} required /></label>
      <label className="field"><span>Pet you'd like to meet</span><select value={petId} onChange={(e) => setPetId(e.target.value)} required><option value="">Choose an available pet</option>{availablePets.map((pet) => <option value={pet.id} key={pet.id}>{pet.name} · {pet.breed}</option>)}</select></label>
      <label className="field field-full"><span>Residential address</span><input name="address" value={form.address} onChange={change} required autoComplete="street-address" /></label>
      <label className="field"><span>Type of residence</span><select name="residence" value={form.residence} onChange={change} required><option value="">Choose one</option><option>Independent house with garden</option><option>Apartment / flat</option><option>Gated villa</option></select></label>
      <label className="field"><span>Pet experience</span><select name="experience" value={form.experience} onChange={change} required><option value="">Choose one</option><option>Experienced pet owner</option><option>First-time pet owner</option></select></label>
      <label className="field"><span>Do you currently have pets?</span><select name="current_pets" value={form.current_pets} onChange={change} required><option value="">Choose one</option><option>No</option><option>Yes, dogs</option><option>Yes, cats</option><option>Yes, rabbits</option><option>Yes, other</option></select></label>
      <label className="field field-full"><span>What makes you want to adopt?</span><textarea name="reason" value={form.reason} onChange={change} rows="4" required /></label>
      <label className="field field-full"><span>Preferred days or times for a house-check conversation</span><input name="visit_preference" value={form.visit_preference} onChange={change} maxLength="200" placeholder="Optional; PawCare will contact you to arrange a mutually agreed time" /></label>
      <label className="consent-field field-full"><input name="house_check_consent" type="checkbox" checked={form.house_check_consent} onChange={(event) => setForm((current) => ({ ...current, house_check_consent: event.target.checked }))} required /><span>I agree that PawCare may contact me to arrange a home-suitability visit. No visit is scheduled or authorized until we agree on a time.</span></label>
      <label className="consent-field field-full"><input name="care_commitments" type="checkbox" checked={form.care_commitments} onChange={(event) => setForm((current) => ({ ...current, care_commitments: event.target.checked }))} required /><span>I understand that adopting an animal involves ongoing care, suitable housing, appropriate food, and veterinary attention.</span></label>
      <label className="field field-full"><span>Type your full name to acknowledge these statements</span><input name="signature_name" value={form.signature_name} onChange={change} required maxLength="100" autoComplete="name" /><small className="field-help">Your typed name records your acknowledgement of the statements above.</small></label>
      <div className="field-full"><button className="button button-primary" disabled={busy || submittedApplication || availablePets.length === 0}>{busy ? "Sending application…" : availablePets.length ? "Send adoption application" : "No available pets right now"}</button></div>
    </form>
  </section></Page>;
}

export function AccountPage() {
  return <AuthGate><AccountContent /></AuthGate>;
}

function AccountContent() {
  const { user, profile, updateProfile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [petListings, setPetListings] = useState([]);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "" });
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileNotificationWarning, setProfileNotificationWarning] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [petListingsLoading, setPetListingsLoading] = useState(true);
  const [petListingsError, setPetListingsError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getMyApplications(user.id)
      .then(setApplications)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user.id]);
  useEffect(() => {
    getMyPetListings(user.id)
      .then(setPetListings)
      .catch((e) => setPetListingsError(e.message))
      .finally(() => setPetListingsLoading(false));
  }, [user.id]);
  useEffect(() => {
    setProfileForm({ full_name: profile?.full_name || "", phone: profile?.phone || "" });
  }, [profile?.full_name, profile?.phone]);

  async function saveProfile(event) {
    event.preventDefault();
    setProfileBusy(true);
    setProfileError("");
    setProfileMessage("");
    setProfileNotificationWarning("");
    try {
      const result = await updateProfile(profileForm);
      setProfileNotificationWarning(result.notificationWarning);
      setProfileMessage("Your account details have been updated.");
    } catch (e) {
      setProfileError(e.message);
    } finally {
      setProfileBusy(false);
    }
  }

  return <Page className="page-section container"><div className="section-heading"><div><span className="eyebrow">Your PawCare account</span><h1>My account</h1><p>Track adoption applications, manage pet listings, and update your details.</p></div></div>
    <section className="account-applications" aria-labelledby="account-applications-heading">
      <h2 id="account-applications-heading">Your applications</h2>
      {error && <ErrorState error={error} />}
      {loading ? <Loading /> : applications.length ? <div className="account-list">{applications.map((application) => <article className="account-application" key={application.id}><img src={application.pets?.image_url} alt="" /><div><strong>{application.pets?.name || "Pet"}</strong><span>{application.pets?.type} · {application.pets?.breed}</span><small>Submitted {new Date(application.created_at).toLocaleDateString()}</small><div className="button-row application-document-actions"><Link className="button button-outline button-small" to={`/documents/${application.id}/application`}>Application</Link><Link className="button button-outline button-small" to={`/documents/${application.id}/house-check`}>House-check form</Link></div></div><span className={`status status-${application.status.toLowerCase()}`}>{application.status}</span></article>)}</div> : <EmptyState>You haven’t sent an adoption application yet. <Link className="text-link" to="/pets">Meet the pets <i className="fa-solid fa-arrow-right" /></Link></EmptyState>}
    </section>
    <section className="account-applications" aria-labelledby="account-pet-listings-heading">
      <div className="account-listings-heading"><h2 id="account-pet-listings-heading">My pet listings</h2><Link className="button button-outline button-small" to="/list-pet">List another pet</Link></div>
      {petListingsError && <ErrorState error={petListingsError} />}
      {petListingsLoading ? <Loading /> : petListings.length ? <div className="account-list">{petListings.map((pet) => <article className="account-application" key={pet.id}><div><strong>{pet.name}</strong><span>{pet.type} · {pet.breed} · {pet.location}</span><small>Submitted {new Date(pet.created_at).toLocaleDateString()}</small></div><span className={`status status-${pet.submission_status.toLowerCase()}`}>{pet.submission_status}</span></article>)}</div> : <EmptyState>You haven’t submitted a pet listing yet. <Link className="text-link" to="/list-pet">List a pet for adoption <i className="fa-solid fa-arrow-right" /></Link></EmptyState>}
    </section>
    <details className="admin-panel account-profile">
      <summary className="account-profile-summary">Update account details</summary>
      {profileError && <ErrorState error={profileError} />}
      {profileMessage && <div className="notice notice-success">{profileMessage}</div>}
      {profileNotificationWarning && <div className="notice notice-info" role="status">{profileNotificationWarning}</div>}
      <form className="form-grid" onSubmit={saveProfile}>
        <label className="field"><span>Full name</span><input value={profileForm.full_name} onChange={(event) => setProfileForm((current) => ({ ...current, full_name: event.target.value }))} required minLength="2" maxLength="100" /></label>
        <label className="field"><span>Email</span><input value={user.email} readOnly /></label>
        <label className="field"><span>Phone number</span><input type="tel" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} required maxLength="40" /></label>
        <div className="field-full"><button className="button button-primary" disabled={profileBusy}>{profileBusy ? "Saving…" : "Save account details"}</button></div>
      </form>
    </details>
  </Page>;
}

export function ApplicationDocumentPage() {
  return <AuthGate><PrintableApplicationDocument /></AuthGate>;
}

function PrintableApplicationDocument() {
  const { id, kind } = useParams();
  const { profile } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setApplication(null);
    getApplicationDocument(id)
      .then(setApplication)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (!["application", "house-check", "certificate"].includes(kind)) {
    return <Page className="page-section container"><ErrorState error="That document type is not available." /></Page>;
  }
  if (loading) return <Page className="page-section container"><Loading /></Page>;
  if (error) return <Page className="page-section container"><ErrorState error={error} /></Page>;
  if (kind === "certificate" && profile?.role !== "admin") {
    return <Page className="page-section container"><ErrorState error="Only administrators can create an adoption record." /></Page>;
  }
  if (kind === "certificate" && application.status !== "Approved") {
    return <Page className="page-section container"><ErrorState error="An adoption record is available only after an administrator approves the application." /></Page>;
  }

  const returnTo = profile?.role === "admin" ? "/admin" : "/account";
  return <Page className="document-page container">
    <div className="document-actions no-print">
      <Link className="button button-outline" to={returnTo}>Back to {profile?.role === "admin" ? "admin" : "applications"}</Link>
      <button className="button button-primary" onClick={() => window.print()}>Print / save as PDF</button>
    </div>
    {kind === "application" && <AdoptionApplicationDocument application={application} />}
    {kind === "house-check" && <HouseCheckDocument application={application} />}
    {kind === "certificate" && <AdoptionCertificateDocument application={application} />}
  </Page>;
}

export function AdminPage() {
  return <AuthGate admin><AdminDashboard /></AuthGate>;
}

function AdminDashboard() {
  const { user, updateUserRole, deleteUser } = useAuth();
  const [data, setData] = useState({ pets: [], applications: [], users: [] });
  const [error, setError] = useState("");
  const [notificationWarning, setNotificationWarning] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Dog", breed: "", age: "", gender: "Female", location: "Vijayawada", image_url: "", description: "", vaccination: "", health: "", personality: "" });

  async function reload() {
    try { setData(await getAdminData()); setError(""); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { reload(); }, []);

  async function perform(action) {
    setBusy(true);
    setError("");
    setNotificationWarning("");
    try {
      const result = await action();
      await reload();
      setNotificationWarning(result?.notificationWarning || "");
    }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function submitPet(event) {
    event.preventDefault();
    await perform(async () => {
      await addPet(form);
      setForm({ name: "", type: "Dog", breed: "", age: "", gender: "Female", location: "Vijayawada", image_url: "", description: "", vaccination: "", health: "", personality: "" });
    });
  }

  const available = data.pets.filter((pet) => pet.submission_status === "Approved" && pet.status === "Available").length;
  const adopted = data.pets.filter((pet) => pet.submission_status === "Approved" && pet.status === "Adopted").length;
  const pending = data.applications.filter((application) => application.status === "Pending").length;
  const pendingListings = data.pets.filter((pet) => pet.submitted_by && pet.submission_status === "Pending");
  const submitters = new Map(data.users.map((account) => [account.id, account]));
  return <Page className="page-section container admin-page"><div className="section-heading"><div><span className="eyebrow">PawCare team</span><h1>Admin dashboard</h1><p>Take care of the pet catalog and new adoption applications.</p></div></div>{error && <ErrorState error={error} />}{notificationWarning && <div className="notice notice-info" role="status">{notificationWarning}</div>}
    <div className="stats-grid"><Stat title="Total pets" value={data.pets.length} /><Stat title="Available" value={available} /><Stat title="Adopted" value={adopted} /><Stat title="Pending applications" value={pending} /><Stat title="Community listings to review" value={pendingListings.length} /></div>
    <section className="admin-panel"><h2>Community listings to review</h2><p className="admin-help">Listings stay private until approved. Check the details before publishing them.</p>{pendingListings.length ? <div className="table-scroll"><table><thead><tr><th>Pet</th><th>Submitted by</th><th>Location</th><th>Submitted</th><th>Review</th></tr></thead><tbody>{pendingListings.map((pet) => {
      const submitter = submitters.get(pet.submitted_by);
      return <tr key={pet.id}><td>{pet.name}<small>{pet.type} · {pet.breed} · {pet.age}</small><small>{pet.description}</small></td><td>{submitter?.full_name || "Account unavailable"}<small>{submitter?.email || ""}</small></td><td>{pet.location}</td><td>{new Date(pet.created_at).toLocaleDateString()}</td><td><div className="button-row"><button className="button button-primary button-small" disabled={busy} onClick={() => perform(() => reviewPetListing(pet.id, "Approved"))}>Approve</button><button className="button button-outline button-small button-danger" disabled={busy} onClick={() => perform(() => reviewPetListing(pet.id, "Rejected"))}>Reject</button></div></td></tr>;
    })}</tbody></table></div> : <p className="admin-help">No community listings are waiting for review.</p>}</section>
    <section className="admin-panel"><h2>Add a pet to the family</h2><form className="form-grid" onSubmit={submitPet}>{[["name","Name"],["breed","Breed"],["age","Age"],["location","City"],["image_url","Image URL"],["vaccination","Vaccination"],["health","Health"],["personality","Personality"]].map(([key,label]) => <label className={`field ${key === "image_url" ? "field-full" : ""}`} key={key}><span>{label}</span><input value={form[key]} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} required /></label>)}<label className="field"><span>Type</span><select value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value }))}><option>Dog</option><option>Cat</option><option>Rabbit</option><option>Other</option></select></label><label className="field"><span>Gender</span><select value={form.gender} onChange={(e) => setForm((current) => ({ ...current, gender: e.target.value }))}><option>Female</option><option>Male</option></select></label><label className="field field-full"><span>Description</span><textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} rows="2" required /></label><div className="field-full"><button className="button button-primary" disabled={busy}>Add pet</button></div></form></section>
    <section className="admin-panel"><h2>Pet catalog</h2><div className="table-scroll"><table><thead><tr><th>Pet</th><th>Type / breed</th><th>Age / gender</th><th>Status</th><th>Actions</th></tr></thead><tbody>{data.pets.map((pet) => <tr key={pet.id}><td>{pet.name}<small>{pet.location}</small></td><td>{pet.type}<small>{pet.breed}</small></td><td>{pet.age}<small>{pet.gender}</small></td><td><select value={pet.status} disabled={busy} onChange={(e) => perform(() => updatePet(pet.id, { status: e.target.value }))}><option>Available</option><option>Pending</option><option>Adopted</option></select></td><td><button className="button button-outline button-small button-danger" disabled={busy} onClick={() => { if (window.confirm(`Delete ${pet.name}'s profile?`)) perform(() => deletePet(pet.id)); }}>Delete</button></td></tr>)}</tbody></table></div></section>
    <section className="admin-panel"><h2>Adoption applications</h2><p className="admin-help">Review applications, contact applicants to arrange home visits, and print the related forms.</p><div className="table-scroll"><table><thead><tr><th>Pet</th><th>Applicant</th><th>Contact</th><th>House-check availability</th><th>Status</th><th>Review / documents</th></tr></thead><tbody>{data.applications.map((application) => <tr key={application.id}><td>{application.pets?.name || "Pet removed"}<small>{new Date(application.created_at).toLocaleDateString()}</small></td><td>{application.full_name}</td><td>{application.email}<small>{application.phone}</small></td><td>{application.visit_preference || "Not specified"}</td><td><span className={`status status-${application.status.toLowerCase()}`}>{application.status}</span></td><td><div className="button-row admin-document-actions">{application.status === "Pending" && <><button className="button button-primary button-small" disabled={busy} onClick={() => perform(() => reviewApplication(application.id, "Approved"))}>Approve</button><button className="button button-outline button-small button-danger" disabled={busy} onClick={() => perform(() => reviewApplication(application.id, "Rejected"))}>Decline</button></>}<Link className="button button-outline button-small" to={`/documents/${application.id}/application`}>Form</Link><Link className="button button-outline button-small" to={`/documents/${application.id}/house-check`}>Visit</Link>{application.status === "Approved" && <Link className="button button-outline button-small" to={`/documents/${application.id}/certificate`}>Adoption record</Link>}</div></td></tr>)}{data.applications.length === 0 && <tr><td colSpan="6">No applications received yet.</td></tr>}</tbody></table></div></section>
    <section className="admin-panel"><h2>Account management</h2><p className="admin-help">Promote adopters or remove accounts. Removing an account also removes its adoption applications.</p><div className="table-scroll"><table><thead><tr><th>Account</th><th>Contact</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead><tbody>{data.users.map((account) => <tr key={account.id}><td>{account.full_name}{account.id === user.id && <small>Signed-in account</small>}</td><td>{account.email}<small>{account.phone}</small></td><td><select aria-label={`Role for ${account.full_name}`} value={account.role} disabled={busy || account.id === user.id} onChange={(event) => perform(() => updateUserRole(account.id, event.target.value))}><option value="adopter">Adopter</option><option value="admin">Administrator</option></select></td><td>{account.created_at ? new Date(account.created_at).toLocaleDateString() : "—"}</td><td><button className="button button-outline button-small button-danger" disabled={busy || account.id === user.id} onClick={() => { if (window.confirm(`Delete ${account.full_name}'s account and their applications?`)) perform(() => deleteUser(account.id)); }}>Delete account</button></td></tr>)}{data.users.length === 0 && <tr><td colSpan="5">No accounts found.</td></tr>}</tbody></table></div></section>
  </Page>;
}

function Stat({ title, value }) {
  return <div className="stat-card"><span>{title}</span><strong>{value}</strong></div>;
}
