import { useEffect, useState } from "react";
import "../styles/AgeVerification.css";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

const MINIMUM_AGE = 21;

function AgeVerification() {
  const { settings, loading } = useSiteSettings();

  const [showPopup, setShowPopup] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState("");

  const brandName =
    settings?.brand_name || "VineWinbe";

  const verificationEnabled =
    settings?.age_verification_enabled !== false;

  const verificationMessage =
    settings?.age_verification_message ||
    "You must be of legal drinking age to enter this website.";

  const verificationMethod =
    settings?.age_verification_method || "birthdate";

  const redirectUrl =
    settings?.age_verification_redirect_url || "";

  useEffect(() => {
    if (loading) {
      return;
    }

    // If age verification is disabled from Admin Settings,
    // allow the customer to enter directly.
    if (!verificationEnabled) {
      setShowPopup(false);
      return;
    }

    const ageVerified =
      localStorage.getItem("ageVerified");

    if (ageVerified !== "true") {
      setShowPopup(true);
    }
  }, [loading, verificationEnabled]);

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(
      `${birthDate}T00:00:00`
    );

    let age =
      today.getFullYear() -
      birth.getFullYear();

    const monthDifference =
      today.getMonth() -
      birth.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 &&
        today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  const handleVerify = (event) => {
    event.preventDefault();

    setError("");

    if (!dateOfBirth) {
      setError(
        "Please enter your date of birth."
      );
      return;
    }

    const birthDate = new Date(
      `${dateOfBirth}T00:00:00`
    );

    const today = new Date();

    if (Number.isNaN(birthDate.getTime())) {
      setError(
        "Please enter a valid date of birth."
      );
      return;
    }

    if (birthDate > today) {
      setError(
        "Date of birth cannot be in the future."
      );
      return;
    }

    const age = calculateAge(dateOfBirth);

    if (age >= MINIMUM_AGE) {
      localStorage.setItem(
        "ageVerified",
        "true"
      );

      setShowPopup(false);
      setError("");
    } else {
      setError(
        `You must be at least ${MINIMUM_AGE} years old to enter this website.`
      );
    }
  };

  const handleExit = () => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }

    window.history.back();
  };

  if (loading || !showPopup) {
    return null;
  }

  /*
   * Currently the database supports the method setting,
   * while the existing customer UI uses birthdate verification.
   *
   * Keep birthdate as the active method until another
   * verification UI is implemented.
   */
  if (verificationMethod !== "birthdate") {
    // Safe fallback: still use the existing DOB verification
    // rather than allowing entry without verification.
  }

  return (
    <div className="age-overlay">
      <div className="age-modal">

        <div className="age-logo">
          {brandName}
        </div>

        <p className="age-label">
          WELCOME TO {brandName}
        </p>

        <h1>
          Verify Your Age
        </h1>

        <p className="age-description">
          {verificationMessage}
        </p>

        <form onSubmit={handleVerify}>

          <label htmlFor="dateOfBirth">
            Date of Birth
          </label>

          <input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(event) => {
              setDateOfBirth(
                event.target.value
              );
              setError("");
            }}
            max={
              new Date()
                .toISOString()
                .split("T")[0]
            }
          />

          {error && (
            <p className="age-error">
              {error}
            </p>
          )}

          <div className="age-buttons">

            <button type="submit">
              VERIFY MY AGE
            </button>

            <button
              type="button"
              className="age-no-button"
              onClick={handleExit}
            >
              EXIT
            </button>

          </div>

        </form>

        <p className="responsibility-text">
          Please enjoy responsibly.
        </p>

      </div>
    </div>
  );
}

export default AgeVerification;