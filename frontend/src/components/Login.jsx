import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.username || !formData.password) {
      setError("Both fields are required");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("token", data.token);                             //Stores the JWT token (or any auth token) in localStorage for session persistence.
      navigate("/register");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ maxWidth: 400, margin: '40px auto', padding: 20, background: 'white', borderRadius: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#333', marginBottom: 20 }}>Log In</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label htmlFor="username" style={{ color: '#555', fontSize: 14 }}>Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username"
            style={{ padding: 10, border: '1px solid #ddd', borderRadius: 5, fontSize: 16 }}
          />
        </div>
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label htmlFor="password" style={{ color: '#555', fontSize: 14 }}>Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            style={{ padding: 10, border: '1px solid #ddd', borderRadius: 5, fontSize: 16 }}
          />
        </div>
        <button type="submit" style={{ background: '#007bff', color: 'white', padding: 12, border: 'none', borderRadius: 5, fontSize: 16, cursor: 'pointer', transition: 'background-color 0.3s' }} disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>
        {error && <div style={{ color: '#dc3545', fontSize: 14, textAlign: 'center', marginTop: 10 }}>{error}</div>}
      </form>
    </div>
  );
};

export default Login; 