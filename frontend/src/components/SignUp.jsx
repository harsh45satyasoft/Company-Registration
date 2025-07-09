import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);                                                                  //Sets a loading state to show a spinner or disable UI while waiting for the response.
      // TODO: Replace with actual API call
      const response = await fetch("http://localhost:5000/api/users/signup", {           // Sends a POST request to the API endpoint.( to be your backend route for registering a new user)
        method: "POST",                                                                  //Method: POST — because you're sending data to create a new resource.
        headers: {
          "Content-Type": "application/json",                                            // Tells the server we're sending JSON.
        },
        body: JSON.stringify({                                                           // Converts the form data to a JSON string.
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // Store the token in localStorage
      localStorage.setItem("token", data.token);                                         //Stores the JWT token (or any auth token) in localStorage for session persistence.
      
      // Redirect to registration page
      navigate("/register");
    } catch (err) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <style>
        {`
          .signup-container {
            max-width: 400px;
            margin: 40px auto;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .signup-title {
            text-align: center;
            color: #333;
            margin-bottom: 20px;
          }

          .signup-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .form-group label {
            color: #555;
            font-size: 14px;
          }

          .form-group input {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
          }

          .form-group input:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
          }

          .submit-button {
            background: #007bff;
            color: white;
            padding: 12px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
          }

          .submit-button:hover {
            background: #0056b3;
          }

          .submit-button:disabled {
            background: #ccc;
            cursor: not-allowed;
          }

          .error-message {
            color: #dc3545;
            font-size: 14px;
            text-align: center;
            margin-top: 10px;
          }
        `}
      </style>

      <h2 className="signup-title">Create an Account</h2>
      
      <form onSubmit={handleSubmit} className="signup-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
          />
        </div>

        <button 
          type="submit" 
          className="submit-button" 
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        {error && <div className="error-message">{error}</div>}
      </form>
      <div style={{ textAlign: 'center', marginTop: '15px' }}>
        <span>Already have an account? </span>
        <a href="/login" style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}>Log in</a>
      </div>
    </div>
  );
};

export default SignUp; 