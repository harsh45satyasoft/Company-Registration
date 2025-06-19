import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";                          //For navigation one page to another
import { checkEmailAvailability, registerCompany } from "../services/api";
import MapComponent from "./MapComponent";
import axios from "axios";

const Registration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    password: "",
    companyName: "",
    openingHours: "",
    closingHours: "",
    address: "",
    latitude: "",
    longitude: "",
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [emailStatus, setEmailStatus] = useState({
    message: "",
    isValid: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ message: "", type: "" });
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [hasInitialLocation, setHasInitialLocation] = useState(false);     // Track if location was set from address
  const [loading, setLoading] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");                          //This tries to retrieve a token (usually a JWT or auth token) from the browser's localStorage.
    if (!token) {
      setShowAlert(true);                                                 //You have a UI alert component (e.g., a red message that says "You must be signed in") controlled by showAlert state.
      const timer = setTimeout(() => {
        navigate("/signup");                                              //(after 3 seconds)Then you automatically navigate to the /signup
      }, 3000);                                                           //After showing the alert, you give the user 3 seconds (3000ms) to read it.
      return () => clearTimeout(timer);
    }
  }, [navigate]);                                                         //If the component unmounts before the 3-second timeout finishes, this will cancel the timer to avoid memory leaks or unwanted navigation.

  // Debounced email check
  useEffect(() => {
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
    }
  }, [formData.email]);

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

  const geocodeAddress = async (address) => {                            //Defines an async function that accepts an address string and attempts to geocode it (i.e., get its coordinates).
    if (isGeocodingAddress) return;                                      //If a geocoding request is already in progress (isGeocodingAddress is true), it exits early to prevent duplicate requests.

    setIsGeocodingAddress(true);                                         //Sets the state to show that geocoding is happening — useful for disabling inputs, showing spinners, etc.

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(   //This fetch call sends a GET request to the Nominatim API to convert a human-readable address (like "New Delhi, India") into latitude and longitude (aka geocoding).
          address
        )}&limit=1`                                                      //Limits response to a single most relevant result
      );
      const data = await response.json();                                //Converts the response into a JavaScript object (data is an array of location results).

      if (data && data.length > 0) {                                     //If Location Found, Extract & Store Coordinates
        const { lat, lon } = data[0];                                    //Extracts latitude and longitude from the first location result.
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
        }));
        setHasInitialLocation(true);                                // Mark that we have initial location from address
      } else {
        // If no results found, clear coordinates
        setFormData((prev) => ({
          ...prev,
          latitude: "",
          longitude: "",
        }));
        setHasInitialLocation(false);                                    // Mark that we don't have initial location from address
      }   
    } catch (error) {
      console.error("Geocoding error:", error);
      // On error, clear coordinates
      setFormData((prev) => ({
        ...prev,
        latitude: "",
        longitude: "",
      }));
      setHasInitialLocation(false);
    } finally {
      setIsGeocodingAddress(false);                                      //This line ensures that the geocoding status is reset whether the request succeeded or failed.
    }
  };

  const handleInputChange = (e) => {                                    //Handles input changes
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error(ex. clear name field) when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

// Enhanced location select handler - only updates coordinates, not address
  const handleLocationSelect = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Please enter first name";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Please enter email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Please enter password";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Please enter company name";
    }

    if (!formData.openingHours.trim()) {
      newErrors.openingHours = "Please enter opening hours";
    }

    if (!formData.closingHours.trim()) {
      newErrors.closingHours = "Please enter closing hours";
    }

    // Validate that closing time is after opening time
    if (formData.openingHours && formData.closingHours) {
      const openingTime = new Date(`2000-01-01T${formData.openingHours}`);
      const closingTime = new Date(`2000-01-01T${formData.closingHours}`);

      if (closingTime <= openingTime) {
        newErrors.closingHours = "Closing time must be after opening time";
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = "Please enter address";
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.location = "Please select location on map or enter a valid address";
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "Please agree to terms and conditions";
    }

    return newErrors;
  };

  const focusFirstErrorField = (errors) => {
    const fieldOrder = [
      "firstName",
      "email",
      "password",
      "companyName",
      "openingHours",
      "closingHours",
      "address",
      "location",
      "agreeTerms",
    ];

    for (const field of fieldOrder) {                                //Loops through the fields in the fieldOrder array
      if (errors[field]) {                                           //If the field has an validation error
        const element =                                              //This tries to find the DOM element for that field in the following priority
          document.querySelector(`[name="${field}"]`) ||             //The || operator ensures it grabs the first match.
          document.querySelector(`#${field}`) ||
          document.querySelector(`.${field}-error`);
        if (element) {
          element.focus();                                           //element.focus() gives it focus so the user can start fixing the error.
          element.scrollIntoView({ behavior: "smooth", block: "center" });  //scrollIntoView() scrolls the element into the center of the screen smoothly.
          break;                                                            //break ensures only the first invalid field is acted on.
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();                                             //Prevents the browser from reloading the page when the form is submitted.

    const formErrors = validateForm();                              //Calls the validateForm function to validate the form.

    if (Object.keys(formErrors).length > 0) {                       //If there are validation errors
      setErrors(formErrors);                                        //stores the error messages for the UI to display.
      focusFirstErrorField(formErrors);                             //Calls the focusFirstErrorField function to focus on the first invalid field.
      return;                                                       //Exits the function.
    } 

    if (!emailStatus.isValid) {                                     //If the email is not available (already registered), it sets an email-specific error.
      setErrors({ email: "Please use an available email address" });//Stores the error message for the UI to display.
      document.querySelector('[name="email"]').focus();             //Focuses on the email field.
      return;
    }

    setIsSubmitting(true);                                          //can disable the submit button to prevent double submissions.
    setSubmitStatus({ message: "", type: "" });                     // clears any prior submission messages (success/error).

    try {
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
    } catch (error) {
      console.error("Registration error:", error);
      setSubmitStatus({
        message:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);                              //Resets the isSubmitting flag whether it succeeded or failed.
    }
  };

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

        {submitStatus.message && (
          <div
            style={{
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "20px",
              backgroundColor:
                submitStatus.type === "success" ? "#d4edda" : "#f8d7da",
              color: submitStatus.type === "success" ? "#155724" : "#721c24",
              border: `1px solid ${
                submitStatus.type === "success" ? "#c3e6cb" : "#f5c6cb"
              }`,
            }}
          >
            {submitStatus.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`form-input ${errors.firstName ? "error" : ""}`}
                placeholder="Enter first name"
              />
              {errors.firstName && (                                               //errors is usually a state object (e.g., from useState) that holds form validation error messages.
                <span className="error-message">{errors.firstName}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`form-input ${errors.email ? "error" : ""}`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
              {emailStatus.message && (
                <span
                  className={
                    emailStatus.isValid ? "success-message" : "error-message"
                  }
                >
                  {emailStatus.message}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`form-input ${errors.password ? "error" : ""}`}
                placeholder="Enter password (min 6 characters)"
              />
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className={`form-input ${errors.companyName ? "error" : ""}`}
                placeholder="Enter company name"
              />
              {errors.companyName && (
                <span className="error-message">{errors.companyName}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Opening Hours *</label>
              <input
                type="time"
                name="openingHours"
                value={formData.openingHours}
                onChange={handleInputChange}
                className={`form-input ${errors.openingHours ? "error" : ""}`}
              />
              {errors.openingHours && (
                <span className="error-message">{errors.openingHours}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Closing Hours *</label>
              <input
                type="time"
                name="closingHours"
                value={formData.closingHours}
                onChange={handleInputChange}
                className={`form-input ${errors.closingHours ? "error" : ""}`}
              />
              {errors.closingHours && (
                <span className="error-message">{errors.closingHours}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className={`form-input ${errors.address ? "error" : ""}`}
              placeholder="Enter company address (e.g., Sanjay Palace, Agra)"
            />
            {errors.address && (
              <span className="error-message">{errors.address}</span>
            )}
            {isGeocodingAddress && (
              <span style={{ fontSize: "12px", color: "#007bff" }}>
                Finding location on map...
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
            Location on Map {hasInitialLocation && "(Drag marker to adjust)"}
            </label>
            <div className="map-container">
              <MapComponent
                onLocationSelect={handleLocationSelect}                                  //A function triggered when the user clicks on the map to select a new location.
                selectedLocation={                                                       //Passes the current location to the map so it can display a pin/marker.
                  formData.latitude && formData.longitude
                    ? {
                        lat: parseFloat(formData.latitude),
                        lng: parseFloat(formData.longitude),
                      }
                    : null
                }
                isDraggable={true}                                                       // Enable draggable marker
                userAddress={formData.address.trim()}                                    // Pass user address to show in popup
                showAllCompanies={false}                                                 // Ensure this is registration mode 
              />
            </div>
            {errors.location && (
              <span className="error-message location-error">
                {errors.location}
              </span>
            )}
            {formData.latitude && formData.longitude && (                               //If both latitude and longitude are present, it displays them below the map
              <div
                style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}
              >
                <strong>Coordinates:</strong>{" "}
                {parseFloat(formData.latitude).toFixed(6)},{" "}   
                {parseFloat(formData.longitude).toFixed(6)}
                {hasInitialLocation && (                                               //If hasInitialLocation is true, it renders a <span> element.
                  <span style={{ color: "#28a745", marginLeft: "10px" }}>
                    ✓ Location found from address
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginTop: "20px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleInputChange}
                style={{
                  marginRight: "8px",
                  transform: "scale(1.2)",
                }}
              />
              I agree to the terms and conditions *
            </label>
            {errors.agreeTerms && (
              <span className="error-message agreeTerms-error">
                {errors.agreeTerms}
              </span>
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register Company"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registration;

//disabled={isSubmitting}
//This disables the button while the form is submitting, preventing multiple submissions.
//isSubmitting is a state variable (likely from useState) that tracks whether the form submission is in progress.

//Ternary operator: This conditionally renders text based on the value of isSubmitting.
//true	"Registering..." (indicates loading)
//false	"Register Company" (normal button text)

//{parseFloat(formData.latitude).toFixed(6)} =>                            Rounded to 6 decimal places

//Location on Map {hasInitialLocation && "(Drag marker to adjust)"} =>   If there is an initial location, it displays "(Drag marker to adjust)"