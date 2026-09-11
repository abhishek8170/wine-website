import { useEffect, useState } from "react";
import "../styles/AgeVerification.css";

const MINIMUM_AGE = 21;

function AgeVerification({ brandName = "VINEORA" }) {
  const [showPopup, setShowPopup] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("Age Verification loaded");
    const ageVerified = localStorage.getItem("ageVerified");

    if (ageVerified !== "true") {
      setShowPopup(true);
    }
  }, []);

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(`${birthDate}T00:00:00`);

    let age = today.getFullYear() - birth.getFullYear();

    const monthDifference = today.getMonth() - birth.getMonth();

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
      setError("Please enter your date of birth.");
      return;
    }

    const birthDate = new Date(`${dateOfBirth}T00:00:00`);
    const today = new Date();

    if (Number.isNaN(birthDate.getTime())) {
      setError("Please enter a valid date of birth.");
      return;
    }

    if (birthDate > today) {
      setError("Date of birth cannot be in the future.");
      return;
    }

    const age = calculateAge(dateOfBirth);

    if (age >= MINIMUM_AGE) {
      localStorage.setItem("ageVerified", "true");
      setShowPopup(false);
    } else {
      setError(
        `You must be at least ${MINIMUM_AGE} years old to enter this website.`
      );
    }
  };

  const handleExit = () => {
    window.history.back();
  };

  if (!showPopup) {
    return null;
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
          You must be of legal drinking age in your
          location to enter this website.
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
              setDateOfBirth(event.target.value);
              setError("");
            }}
            max={new Date().toISOString().split("T")[0]}
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