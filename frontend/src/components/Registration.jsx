 import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { registerCompany } from "../services/api";
import MapComponent from "./MapComponent";
import "./RegistrationPage.css";
import { RedirectToSignIn } from "@clerk/clerk-react";

const RegistrationPage = () => {
  const navigate = useNavigate();
  const { isSignedIn, user, isLoaded } = useUser();

  const [formData, setFormData] = useState({
    firstName: "",
    companyName: "",
    openingHours: "09:00",
    closingHours: "17:00",
    address: "",
    latitude: "",
    longitude: "",
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [submitStatus, setSubmitStatus] = useState({ message: "", type: "" });
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [hasInitialLocation, setHasInitialLocation] = useState(false);

  // Geocode address with debounce
  useEffect(() => {
    if (!formData.address.trim() || formData.address.length < 3) {
      setFormData((prev) => ({ ...prev, latitude: "", longitude: "" }));
      setHasInitialLocation(false);
      return;
    }

    const geocodeTimer = setTimeout(async () => {
      await geocodeAddress(formData.address);
    }, 1000);

    return () => clearTimeout(geocodeTimer);
  }, [formData.address]);

  const geocodeAddress = async (address) => {
    if (isGeocodingAddress) return;
    setIsGeocodingAddress(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}&limit=1`
      );

      if (!response.ok) throw new Error("Geocoding service unavailable");

      const data = await response.json();

      if (data?.length > 0) {
        const { lat, lon } = data[0];
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
        }));
        setHasInitialLocation(true);
      } else {
        throw new Error("Address not found");
      }
    } catch (error) {
      console.error("Geocoding error:", error.message);
      setFormData((prev) => ({ ...prev, latitude: "", longitude: "" }));
      setHasInitialLocation(false);

      if (error.message !== "Address not found") {
        setSubmitStatus({
          message:
            "Map service is currently unavailable. Please try again later.",
          type: "error",
        });
      }
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleLocationSelect = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
    setHasInitialLocation(true);
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    const requiredFields = [
      { name: "firstName", message: "Please enter your first name" },
      { name: "companyName", message: "Please enter company name" },
      { name: "openingHours", message: "Please enter opening hours" },
      { name: "closingHours", message: "Please enter closing hours" },
      { name: "address", message: "Please enter business address" },
    ];

    requiredFields.forEach(({ name, message }) => {
      if (!formData[name].trim()) newErrors[name] = message;
    });

    // Business hours validation
    if (formData.openingHours && formData.closingHours) {
      const opening = new Date(`2000-01-01T${formData.openingHours}`);
      const closing = new Date(`2000-01-01T${formData.closingHours}`);

      if (closing <= opening) {
        newErrors.closingHours = "Closing time must be after opening time";
      }
    }

    // Location validation
    if (!formData.latitude || !formData.longitude) {
      newErrors.location = "Please select a valid location on the map";
    }

    // Terms validation
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must agree to the terms and conditions";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ message: "", type: "" });

    try {
      const registrationData = {
        ...formData,
        userId: user.id,
        email: user.primaryEmailAddress.emailAddress,
        coordinates: {
          lat: parseFloat(formData.latitude),
          lng: parseFloat(formData.longitude),
        },
      };

      await registerCompany(registrationData);

      setSubmitStatus({
        message: "Company registered successfully! Redirecting to dashboard...",
        type: "success",
      });

      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error) {
      console.error("Registration error:", error);

      let errorMessage = "Registration failed. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSubmitStatus({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="registration-container">
      <div className="registration-card">
        <div className="user-header">
          <div className="user-info">
            <span>Signed in as: </span>
            <strong>{user.primaryEmailAddress.emailAddress}</strong>
          </div>
        </div>

        <h1>Register Your Company</h1>

        {submitStatus.message && (
          <div className={`status-message ${submitStatus.type}`}>
            {submitStatus.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="registration-form" noValidate>
          <div className="form-grid">
            {/* First Name */}
            <div className="form-group">
              <label htmlFor="firstName">
                Your First Name <span className="required">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={errors.firstName ? "error" : ""}
                placeholder="Enter your first name"
                aria-invalid={!!errors.firstName}
                aria-describedby={
                  errors.firstName ? "firstName-error" : undefined
                }
              />
              {errors.firstName && (
                <span id="firstName-error" className="error-message">
                  {errors.firstName}
                </span>
              )}
            </div>

            {/* Company Name */}
            <div className="form-group">
              <label htmlFor="companyName">
                Company Name <span className="required">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className={errors.companyName ? "error" : ""}
                placeholder="Enter company name"
                aria-invalid={!!errors.companyName}
                aria-describedby={
                  errors.companyName ? "companyName-error" : undefined
                }
              />
              {errors.companyName && (
                <span id="companyName-error" className="error-message">
                  {errors.companyName}
                </span>
              )}
            </div>

            {/* Business Hours */}
            <div className="form-group">
              <label htmlFor="openingHours">
                Opening Hours <span className="required">*</span>
              </label>
              <input
                id="openingHours"
                type="time"
                name="openingHours"
                value={formData.openingHours}
                onChange={handleInputChange}
                className={errors.openingHours ? "error" : ""}
                aria-invalid={!!errors.openingHours}
                aria-describedby={
                  errors.openingHours ? "openingHours-error" : undefined
                }
              />
              {errors.openingHours && (
                <span id="openingHours-error" className="error-message">
                  {errors.openingHours}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="closingHours">
                Closing Hours <span className="required">*</span>
              </label>
              <input
                id="closingHours"
                type="time"
                name="closingHours"
                value={formData.closingHours}
                onChange={handleInputChange}
                className={errors.closingHours ? "error" : ""}
                aria-invalid={!!errors.closingHours}
                aria-describedby={
                  errors.closingHours ? "closingHours-error" : undefined
                }
              />
              {errors.closingHours && (
                <span id="closingHours-error" className="error-message">
                  {errors.closingHours}
                </span>
              )}
            </div>

            {/* Address */}
            <div className="form-group full-width">
              <label htmlFor="address">
                Business Address <span className="required">*</span>
              </label>
              <input
                id="address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={errors.address ? "error" : ""}
                placeholder="Enter full business address"
                aria-invalid={!!errors.address}
                aria-describedby={errors.address ? "address-error" : undefined}
              />
              {errors.address && (
                <span id="address-error" className="error-message">
                  {errors.address}
                </span>
              )}
              {isGeocodingAddress && (
                <span className="geocoding-status">
                  Locating your address on the map...
                </span>
              )}
            </div>

            {/* Map */}
            <div className="form-group full-width">
              <label>
                Business Location{" "}
                {hasInitialLocation && (
                  <span className="instruction">(Drag marker to adjust)</span>
                )}
              </label>
              <div className="map-container">
                <MapComponent
                  onLocationSelect={handleLocationSelect}
                  selectedLocation={
                    formData.latitude && formData.longitude
                      ? {
                          lat: parseFloat(formData.latitude),
                          lng: parseFloat(formData.longitude),
                        }
                      : null
                  }
                  isDraggable={true}
                  userAddress={formData.address.trim()}
                />
              </div>
              {errors.location && (
                <span className="error-message">{errors.location}</span>
              )}
              {formData.latitude && formData.longitude && (
                <div className="coordinates-display">
                  <strong>Coordinates:</strong>{" "}
                  {parseFloat(formData.latitude).toFixed(6)},{" "}
                  {parseFloat(formData.longitude).toFixed(6)}
                  {hasInitialLocation && (
                    <span className="location-found">
                      ✓ Location found from address
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="form-group full-width terms-group">
              <label className="terms-label">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  aria-invalid={!!errors.agreeTerms}
                  aria-describedby={
                    errors.agreeTerms ? "agreeTerms-error" : undefined
                  }
                />
                <span>
                  I agree to the{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer">
                    terms and conditions
                  </a>{" "}
                  <span className="required">*</span>
                </span>
              </label>
              {errors.agreeTerms && (
                <span id="agreeTerms-error" className="error-message">
                  {errors.agreeTerms}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <div className="form-group full-width">
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" aria-hidden="true"></span>
                    Registering...
                  </>
                ) : (
                  "Register Company"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationPage;
