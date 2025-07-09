 import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { registerCompany } from "../services/api";
import MapComponent from "./MapComponent";
<<<<<<< HEAD
import "./RegistrationPage.css";
import { RedirectToSignIn } from "@clerk/clerk-react";
=======
import axios from "axios";
>>>>>>> c7cc7599aaa83831e9ad96deaea185ff250df4f7

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
<<<<<<< HEAD
  const [hasInitialLocation, setHasInitialLocation] = useState(false);
=======
  const [hasInitialLocation, setHasInitialLocation] = useState(false);     // Track if location was set from address
  const [loading, setLoading] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Step 1: Try to get the token from localStorage
    const token = localStorage.getItem("token");

    // Step 2: If no token is found (user is not authenticated)
    if (!token) {
      setShowAlert(true);                             // Show an alert to the user

      // Step 3: Check if the user was redirected from login(“If the user came to this page from the login page (using navigation state), then immediately redirect them back to /login.”)
      if (window.location.state && window.location.state.fromLogin) {
        navigate("/login");                         // Redirect to login page
      } else {

        // Step 4: Wait for 3 seconds, then navigate to signup
        const timer = setTimeout(() => {
          navigate("/signup");
        }, 3000);

        // Step 5: Cleanup function in case component unmounts before 3 seconds
        return () => clearTimeout(timer);
      }
    }
  }, [navigate]);
>>>>>>> c7cc7599aaa83831e9ad96deaea185ff250df4f7

  // Geocode address with debounce
  useEffect(() => {
<<<<<<< HEAD
    if (!formData.address.trim() || formData.address.length < 3) {
      setFormData((prev) => ({ ...prev, latitude: "", longitude: "" }));
      setHasInitialLocation(false);
      return;
=======
    if (formData.email && formData.email.includes("@")) {                //Check if Email Exists and Looks Valid
      const timeoutId = setTimeout(async () => {                         //Only triggers the check if the user stops typing for 500ms.(This sets a 500ms timer before making the API call. This technique is called debouncing, which prevents making an API request every keystroke.)
        try {
          const response = await axios.post(
            "http://localhost:5000/api/companies/check-email",
            { email: formData.email },
            {
              headers: {                                                //This is a standard format for sending authentication tokens in HTTP.
                Authorization: `Bearer ${localStorage.getItem("token")}`, //Bearer is the type of token. The backend expects it in this format.
              },
            }
          );
          setEmailStatus({
            message: response.data.message,
            isValid: response.data.available,
          });
          setEmailAvailable(response.data.available);
        } catch (error) {
          setEmailStatus({                                               //If the API call fails (e.g., network issue), show a generic error message and reset validity.
            message: "Error checking email",
            isValid: null,
          });
        }
      }, 500);

      return () => clearTimeout(timeoutId);                             //If the user types again before 500ms is up, cancel the previous API call attempt. This avoids multiple pending timeouts.
    } else {
      setEmailStatus({ message: "", isValid: null });                   //If the email is empty or invalid (no "@"), just reset the status.
>>>>>>> c7cc7599aaa83831e9ad96deaea185ff250df4f7
    }

<<<<<<< HEAD
    const geocodeTimer = setTimeout(async () => {
      await geocodeAddress(formData.address);
    }, 1000);

    return () => clearTimeout(geocodeTimer);
  }, [formData.address]);
=======
  // Geocode address when user types
  useEffect(() => {
    if (formData.address.trim() && formData.address.length > 2) {
      const timeoutId = setTimeout(async () => {
        await geocodeAddress(formData.address);                        // 1-second delay before triggering the geocodeAddress() function.
      }, 1000);

      return () => clearTimeout(timeoutId);                            //If the user types again before 1 second is up, cancel the previous geocoding request.
    } else {
      // Clear location when address is cleared
      if (!formData.address.trim()) {
        setFormData((prev) => ({
          ...prev,
          latitude: "",
          longitude: "",
        }));
        setHasInitialLocation(false);
      }
    }
  }, [formData.address]);                                                //Runs whenever formData.address changes
>>>>>>> c7cc7599aaa83831e9ad96deaea185ff250df4f7

  const geocodeAddress = async (address) => {
    if (isGeocodingAddress) return;
    setIsGeocodingAddress(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(   //This fetch call sends a GET request to the Nominatim API to convert a human-readable address (like "New Delhi, India") into latitude and longitude (aka geocoding).
          address
        )}&limit=1`                                                      //Limits response to a single most relevant result
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
<<<<<<< HEAD
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
=======
      const token = localStorage.getItem("token");                  //Retrieves the JWT token stored after user login/signup.
      if (!token) {
        navigate("/signup");
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/companies/register",            //Sends a POST request to the backend /api/companies/register endpoint 
        formData,                                                  //with the form data-The company registration data (name, email, address, etc.)
        {
          headers: {
            "Content-Type": "application/json",                    //Tells the server we're sending JSON.
            Authorization: `Bearer ${token}`,                      //Lets the backend verify the user.
          },
        }
      );

      if (response.status === 201) {
        // Registration successful
        setSubmitStatus({
          message:
            "Company registered successfully! Redirecting to company listing...",
          type: "success",
        });

        // Redirect to listing page after 2 seconds
        setTimeout(() => {
          navigate("/listing");
        }, 2000);
      }
>>>>>>> c7cc7599aaa83831e9ad96deaea185ff250df4f7
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

<<<<<<< HEAD
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
=======
  // Sign out function
  const handleSignOut = () => {
    localStorage.removeItem("token");
    navigate("/signup");
  };

  if (showAlert) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '10px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          maxWidth: '90%',
          width: '400px',
          position: 'relative'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ 
            fontSize: '1.2rem', 
            color: '#dc3545', 
            marginBottom: '1rem',
            fontWeight: 'bold'
          }}>
            You cannot register without signing up first! 🔐
          </div>
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#666'
          }}>
            Redirecting to signup page in a few seconds...
          </div>
          <div style={{
            width: '100%',
            height: '4px',
            background: '#f0f0f0',
            borderRadius: '2px',
            marginTop: '1rem',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: '#007bff',
              animation: 'progress 3s linear',
              width: '100%'
            }} />
          </div>
          <style>
            {`
              @keyframes progress {
                from { width: 100%; }
                to { width: 0%; }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <button onClick={handleSignOut} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>
          Sign Out
        </button>
      </div>
      <div className="form-container">
        <h2 className="form-title">Company Registration</h2>
>>>>>>> c7cc7599aaa83831e9ad96deaea185ff250df4f7

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
