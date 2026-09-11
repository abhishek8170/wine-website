import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

function Contact() {
  const [contact, setContact] = useState(null);
  const [loadingContact, setLoadingContact] = useState(true);
  const [contactError, setContactError] = useState("");

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [submitStatus, setSubmitStatus] = useState({
    type: "",
    message: "",
  });

  // =========================================================
  // LOAD CONTACT SETTINGS
  // =========================================================

  useEffect(() => {
    const loadContact = async () => {
      try {
        setLoadingContact(true);
        setContactError("");

        const response = await fetch(`${API_BASE_URL}/contact`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load contact information."
          );
        }

        setContact(data.contact);
      } catch (error) {
        console.error("Contact page error:", error);

        setContactError(
          "We couldn't load our contact information right now."
        );
      } finally {
        setLoadingContact(false);
      }
    };

    loadContact();
  }, []);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    if (submitStatus.message) {
      setSubmitStatus({
        type: "",
        message: "",
      });
    }
  };

  // =========================================================
  // VALIDATION
  // =========================================================

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Please enter your name.";
    }

    if (!form.email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (
      form.phone.trim() &&
      !/^[+()\d\s-]{7,20}$/.test(form.phone.trim())
    ) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    if (!form.subject.trim()) {
      newErrors.subject = "Please enter a subject.";
    }

    if (!form.message.trim()) {
      newErrors.message = "Please enter your message.";
    } else if (form.message.trim().length < 10) {
      newErrors.message = "Please enter at least 10 characters.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =========================================================
  // SUBMIT FORM
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      setSubmitStatus({
        type: "",
        message: "",
      });

      const response = await fetch(`${API_BASE_URL}/contact/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to send your message."
        );
      }

      setSubmitStatus({
        type: "success",
        message:
          "Thank you for contacting VINEORA. Your message has been received.",
      });

      setForm(initialForm);
      setErrors({});
    } catch (error) {
      console.error("Contact form error:", error);

      setSubmitStatus({
        type: "error",
        message:
          error.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // FORMAT MULTI-LINE CONTENT
  // =========================================================

  const renderMultilineText = (text) => {
    if (!text) return null;

    return text.split("\n").map((line, index) => (
      <span key={`${line}-${index}`} className="block">
        {line}
      </span>
    ));
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loadingContact) {
    return (
      <main className="min-h-screen bg-[#f5ecdc] text-[#351716]">
        <section className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-pulse rounded-full border border-[#c9a45c]" />

            <p className="mt-5 text-xs uppercase tracking-[0.3em] text-[#8b6a43]">
              Loading VINEORA
            </p>
          </div>
        </section>
      </main>
    );
  }

  // =========================================================
  // CONTACT API ERROR
  // =========================================================

  if (contactError || !contact) {
    return (
      <main className="min-h-screen bg-[#f5ecdc] text-[#351716]">
        <section className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="max-w-lg text-center">

            <p className="text-xs uppercase tracking-[0.3em] text-[#a88342]">
              Contact VINEORA
            </p>

            <h1 className="mt-5 font-serif text-4xl sm:text-5xl">
              We&apos;ll be back shortly.
            </h1>

            <p className="mt-5 text-sm leading-7 text-[#6c514a]">
              {contactError ||
                "Our contact information is currently unavailable."}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-8 bg-[#4a2020] px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#f7eee1] transition hover:bg-[#351716]"
            >
              Try again
            </button>

          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5ecdc] text-[#351716]">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden bg-[#3a1718] px-6 pb-20 pt-28 sm:px-10 sm:pb-24 sm:pt-32 lg:px-16 lg:pb-28 lg:pt-36">

        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border border-[#c9a45c]/20" />

        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border border-[#c9a45c]/10" />

        <div className="pointer-events-none absolute bottom-[-180px] left-[-120px] h-80 w-80 rounded-full border border-[#c9a45c]/10" />

        <div className="relative mx-auto max-w-7xl">

          <div className="max-w-4xl">

            <p className="mb-5 text-xs font-medium uppercase tracking-[0.35em] text-[#c9a45c]">
              {contact.section_label}
            </p>

            <h1 className="font-serif text-5xl leading-[0.95] tracking-tight text-[#f7eee1] sm:text-6xl lg:text-8xl">
              {contact.heading}

              <span className="block text-[#c9a45c]">
                {contact.highlighted_heading}
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-[#e8d9c4] sm:text-lg">
              {contact.description}
            </p>

          </div>

        </div>
      </section>


      {/* =====================================================
          MAIN CONTACT AREA
      ===================================================== */}

      <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-28">

        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">

          {/* =================================================
              LEFT INFORMATION
          ================================================= */}

          <div>

            <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-[#a88342]">
              Contact VINEORA
            </p>

            <h2 className="font-serif text-4xl leading-tight text-[#351716] sm:text-5xl">
              We&apos;re here to help.
            </h2>

            <div className="mt-6 h-px w-16 bg-[#c9a45c]" />

            <p className="mt-7 max-w-md text-base leading-8 text-[#6c514a]">
              {contact.form_description}
            </p>


            {/* ---------------------------------------------
                INFORMATION
            --------------------------------------------- */}

            <div className="mt-12 space-y-8">

              {/* Email */}
              <div className="flex gap-5">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#c9a45c]/40 bg-[#f9f1e5] text-[#a88342]">
                  <span className="text-lg">✉</span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#a88342]">
                    {contact.email_label}
                  </p>

                  <a
                    href={`mailto:${contact.email}`}
                    className="mt-2 block break-all text-base text-[#351716] transition hover:text-[#8b1e2d]"
                  >
                    {contact.email}
                  </a>
                </div>

              </div>


              {/* Phone */}
              <div className="flex gap-5">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#c9a45c]/40 bg-[#f9f1e5] text-[#a88342]">
                  <span className="text-lg">☎</span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#a88342]">
                    {contact.phone_label}
                  </p>

                  <a
                    href={`tel:${contact.phone}`}
                    className="mt-2 block text-base text-[#351716] transition hover:text-[#8b1e2d]"
                  >
                    {contact.phone}
                  </a>
                </div>

              </div>


              {/* Address */}
              <div className="flex gap-5">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#c9a45c]/40 bg-[#f9f1e5] text-[#a88342]">
                  <span className="text-lg">⌖</span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#a88342]">
                    {contact.address_label}
                  </p>

                  <div className="mt-2 text-base leading-7 text-[#351716]">
                    {renderMultilineText(contact.address)}
                  </div>
                </div>

              </div>


              {/* Business hours */}
              <div className="flex gap-5">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#c9a45c]/40 bg-[#f9f1e5] text-[#a88342]">
                  <span className="text-lg">◷</span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#a88342]">
                    {contact.business_hours_label}
                  </p>

                  <div className="mt-2 text-base leading-7 text-[#351716]">
                    {renderMultilineText(contact.business_hours)}
                  </div>
                </div>

              </div>

            </div>


            {/* ---------------------------------------------
                SUPPORT NOTE
            --------------------------------------------- */}

            <div className="mt-12 border-l-2 border-[#c9a45c] bg-[#eee2d0] px-6 py-5">

              <p className="text-sm leading-7 text-[#5f4741]">
                {contact.support_note}
              </p>

            </div>

          </div>


          {/* =================================================
              CONTACT FORM
          ================================================= */}

          <div>

            <div className="border border-[#5b332e]/15 bg-[#fbf5ec] p-6 shadow-[0_20px_60px_rgba(53,23,22,0.08)] sm:p-9 lg:p-12">

              {/* Form heading */}
              <div className="mb-9">

                <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#a88342]">
                  {contact.form_label}
                </p>

                <h2 className="mt-3 font-serif text-3xl text-[#351716] sm:text-4xl">
                  {contact.form_heading}
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-[#725b53]">
                  {contact.form_description}
                </p>

              </div>


              {/* Success */}
              {submitStatus.type === "success" && (
                <div className="mb-8 border border-[#8a6b43]/30 bg-[#eee3d0] px-5 py-4">

                  <p className="text-sm font-medium leading-6 text-[#5b432d]">
                    {submitStatus.message}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#755d52]">
                    Our team will get back to you as soon as possible.
                  </p>

                </div>
              )}


              {/* Error */}
              {submitStatus.type === "error" && (
                <div className="mb-8 border border-[#9a3d3d]/30 bg-[#f4e1df] px-5 py-4">

                  <p className="text-sm font-medium leading-6 text-[#8a3030]">
                    {submitStatus.message}
                  </p>

                </div>
              )}


              <form
                onSubmit={handleSubmit}
                noValidate
              >

                {/* Name + Email */}
                <div className="grid gap-6 sm:grid-cols-2">

                  <div>

                    <label
                      htmlFor="name"
                      className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5b332e]"
                    >
                      Full name *
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      autoComplete="name"
                      className={`w-full border bg-[#fffaf2] px-4 py-3.5 text-sm text-[#351716] outline-none transition placeholder:text-[#9a8178] ${
                        errors.name
                          ? "border-[#9a3d3d]"
                          : "border-[#5b332e]/20 focus:border-[#a88342]"
                      }`}
                    />

                    {errors.name && (
                      <p className="mt-2 text-xs text-[#9a3d3d]">
                        {errors.name}
                      </p>
                    )}

                  </div>


                  <div>

                    <label
                      htmlFor="email"
                      className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5b332e]"
                    >
                      Email address *
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={`w-full border bg-[#fffaf2] px-4 py-3.5 text-sm text-[#351716] outline-none transition placeholder:text-[#9a8178] ${
                        errors.email
                          ? "border-[#9a3d3d]"
                          : "border-[#5b332e]/20 focus:border-[#a88342]"
                      }`}
                    />

                    {errors.email && (
                      <p className="mt-2 text-xs text-[#9a3d3d]">
                        {errors.email}
                      </p>
                    )}

                  </div>

                </div>


                {/* Phone + Subject */}
                <div className="mt-6 grid gap-6 sm:grid-cols-2">

                  <div>

                    <label
                      htmlFor="phone"
                      className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5b332e]"
                    >
                      Phone
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91"
                      autoComplete="tel"
                      className={`w-full border bg-[#fffaf2] px-4 py-3.5 text-sm text-[#351716] outline-none transition placeholder:text-[#9a8178] ${
                        errors.phone
                          ? "border-[#9a3d3d]"
                          : "border-[#5b332e]/20 focus:border-[#a88342]"
                      }`}
                    />

                    {errors.phone && (
                      <p className="mt-2 text-xs text-[#9a3d3d]">
                        {errors.phone}
                      </p>
                    )}

                  </div>


                  <div>

                    <label
                      htmlFor="subject"
                      className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5b332e]"
                    >
                      Subject *
                    </label>

                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="How can we help?"
                      className={`w-full border bg-[#fffaf2] px-4 py-3.5 text-sm text-[#351716] outline-none transition placeholder:text-[#9a8178] ${
                        errors.subject
                          ? "border-[#9a3d3d]"
                          : "border-[#5b332e]/20 focus:border-[#a88342]"
                      }`}
                    />

                    {errors.subject && (
                      <p className="mt-2 text-xs text-[#9a3d3d]">
                        {errors.subject}
                      </p>
                    )}

                  </div>

                </div>


                {/* Message */}
                <div className="mt-6">

                  <label
                    htmlFor="message"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5b332e]"
                  >
                    Message *
                  </label>

                  <textarea
                    id="message"
                    name="message"
                    rows="7"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    className={`w-full resize-none border bg-[#fffaf2] px-4 py-3.5 text-sm leading-7 text-[#351716] outline-none transition placeholder:text-[#9a8178] ${
                      errors.message
                        ? "border-[#9a3d3d]"
                        : "border-[#5b332e]/20 focus:border-[#a88342]"
                    }`}
                  />

                  {errors.message && (
                    <p className="mt-2 text-xs text-[#9a3d3d]">
                      {errors.message}
                    </p>
                  )}

                </div>


                {/* Submit */}
                <div className="mt-8 flex flex-col gap-5 border-t border-[#5b332e]/10 pt-7 sm:flex-row sm:items-center sm:justify-between">

                  <p className="max-w-sm text-xs leading-5 text-[#806960]">
                    By submitting this form, you agree to be contacted by
                    the VINEORA team regarding your enquiry.
                  </p>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-3 bg-[#4a2020] px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#f7eee1] transition hover:bg-[#351716] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Sending..." : "Send message"}

                    {!submitting && (
                      <span className="text-base transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    )}
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          BOTTOM CTA
      ===================================================== */}

      <section className="bg-[#351716] px-6 py-16 sm:px-10 sm:py-20 lg:px-16">

        <div className="mx-auto flex max-w-7xl flex-col gap-7 md:flex-row md:items-center md:justify-between">

          <div>

            <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#c9a45c]">
              {contact.cta_label}
            </p>

            <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight text-[#f7eee1] sm:text-4xl">
              Exceptional wines deserve exceptional moments.
            </h2>

          </div>


          <Link
            to={contact.cta_url || "/shop"}
            className="inline-flex w-fit items-center gap-3 border border-[#c9a45c]/60 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#f7eee1] transition hover:bg-[#c9a45c] hover:text-[#351716]"
          >
            {contact.cta_text || "Explore wines"}

            <span>→</span>
          </Link>

        </div>

      </section>

    </main>
  );
}

export default Contact;