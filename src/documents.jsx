function formatDate(value = new Date()) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DocumentField({ label, children }) {
  return <div className="document-field"><span>{label}</span><strong>{children || "Not provided"}</strong></div>;
}

function DocumentHeader({ title, application }) {
  return <header className="document-header">
    <div className="document-brand">PAWCARE <span>·</span> COMMUNITY ANIMAL CARE</div>
    <p className="document-draft">PawCare document · Prepared for your records</p>
    <h1>{title}</h1>
    <p>Prepared {formatDate()} · Application {application.id.slice(0, 8).toUpperCase()}</p>
  </header>;
}

function DocumentSection({ title, children }) {
  return <section className="document-section"><h2>{title}</h2>{children}</section>;
}

export function AdoptionApplicationDocument({ application }) {
  const pet = application.pets || {};
  return <article className="print-document">
    <DocumentHeader title="Adoption application" application={application} />
    <DocumentSection title="Applicant">
      <div className="document-grid">
        <DocumentField label="Full name">{application.full_name}</DocumentField>
        <DocumentField label="Age">{application.age}</DocumentField>
        <DocumentField label="Email">{application.email}</DocumentField>
        <DocumentField label="Phone">{application.phone}</DocumentField>
        <DocumentField label="Occupation">{application.occupation}</DocumentField>
        <DocumentField label="Residence">{application.residence}</DocumentField>
        <DocumentField label="Address">{application.address}</DocumentField>
      </div>
    </DocumentSection>
    <DocumentSection title="Animal">
      <div className="document-grid">
        <DocumentField label="Name">{pet.name}</DocumentField>
        <DocumentField label="Type and breed">{[pet.type, pet.breed].filter(Boolean).join(" · ")}</DocumentField>
        <DocumentField label="Age">{pet.age}</DocumentField>
        <DocumentField label="Location">{pet.location}</DocumentField>
      </div>
    </DocumentSection>
    <DocumentSection title="Home and care">
      <div className="document-grid">
        <DocumentField label="Pet experience">{application.experience}</DocumentField>
        <DocumentField label="Pets currently at home">{application.current_pets}</DocumentField>
        <DocumentField label="Reason for adopting">{application.reason}</DocumentField>
        <DocumentField label="Preferred house-check time">{application.visit_preference || "To be arranged with PawCare"}</DocumentField>
      </div>
    </DocumentSection>
    <DocumentSection title="Acknowledgements">
      <p>Applicant has requested a house-check visit at a mutually agreed time and acknowledged the ongoing care responsibilities involved in welcoming an animal.</p>
      <div className="document-grid">
        <DocumentField label="House-check consent">{application.house_check_consent ? "Confirmed" : "Not confirmed"}</DocumentField>
        <DocumentField label="Care commitment">{application.care_commitments ? "Confirmed" : "Not confirmed"}</DocumentField>
      </div>
      <div className="document-signature"><span>Typed acknowledgement</span><strong>{application.signature_name}</strong><small>Recorded {formatDate(application.created_at)}</small></div>
    </DocumentSection>
    <p className="document-notice">Use this application summary to coordinate next steps with PawCare and the responsible animal-welfare organization.</p>
  </article>;
}

export function HouseCheckDocument({ application }) {
  const pet = application.pets || {};
  return <article className="print-document">
    <DocumentHeader title="House-check visit request" application={application} />
    <DocumentSection title="Request details">
      <div className="document-grid">
        <DocumentField label="Applicant">{application.full_name}</DocumentField>
        <DocumentField label="Phone">{application.phone}</DocumentField>
        <DocumentField label="Email">{application.email}</DocumentField>
        <DocumentField label="Address">{application.address}</DocumentField>
        <DocumentField label="Animal">{[pet.name, pet.type, pet.breed].filter(Boolean).join(" · ")}</DocumentField>
        <DocumentField label="Preferred availability">{application.visit_preference || "Contact applicant to arrange"}</DocumentField>
      </div>
    </DocumentSection>
    <DocumentSection title="Consent acknowledgement">
      <p>The applicant has asked PawCare to contact them about a home-suitability visit related to this adoption application. Any visit must be separately arranged and confirmed with the applicant. This form does not authorize an unannounced visit.</p>
      <div className="document-signature"><span>Typed acknowledgement</span><strong>{application.signature_name}</strong><small>Consent recorded {formatDate(application.created_at)}</small></div>
    </DocumentSection>
    <p className="document-notice">Please confirm the visit date and time directly with the applicant before arranging a home visit.</p>
  </article>;
}

export function AdoptionCertificateDocument({ application }) {
  const pet = application.pets || {};
  return <article className="print-document certificate-document">
    <DocumentHeader title="Adoption record" application={application} />
    <DocumentSection title="Demo approval record">
      <p>This record shows that PawCare marked the following application as approved in the prototype.</p>
      <div className="document-grid">
        <DocumentField label="Adopter">{application.full_name}</DocumentField>
        <DocumentField label="Animal">{pet.name}</DocumentField>
        <DocumentField label="Type and breed">{[pet.type, pet.breed].filter(Boolean).join(" · ")}</DocumentField>
        <DocumentField label="Application received">{formatDate(application.created_at)}</DocumentField>
        <DocumentField label="Reviewed">{application.reviewed_at ? formatDate(application.reviewed_at) : "Review date not recorded"}</DocumentField>
      </div>
      <div className="document-signature"><span>Responsible organization representative</span><strong>Signature to be completed by the organization</strong></div>
    </DocumentSection>
    <p className="document-notice">This is PawCare's adoption record. The responsible animal-welfare organization can provide any separate certificate required for its process.</p>
  </article>;
}
