import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import Registration from "./components/Registration";
import CompanyListing from "./components/CompanyListing";
import "./styles/global.css";
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@clerk/clerk-react";

// Initialize Clerk
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  return (
    <div className="App">
      <nav
        style={{
          background: "#007bff",
          padding: "1rem 2rem",
          marginBottom: "2rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <h1 style={{ color: "white", margin: 0 }}>Company Portal</h1>
          <div
            style={{ display: "flex", alignItems: "center", gap: "2rem" }}
          >
            <Link
              to="/"
              style={{
                color: "white",
                textDecoration: "none",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                transition: "background-color 0.3s",
              }}
              onMouseOver={(e) =>
                (e.target.style.backgroundColor = "rgba(255,255,255,0.1)")
              }
              onMouseOut={(e) =>
                (e.target.style.backgroundColor = "transparent")
              }
            >
              Register
            </Link>
            <Link
              to="/listing"
              style={{
                color: "white",
                textDecoration: "none",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                transition: "background-color 0.3s",
              }}
              onMouseOver={(e) =>
                (e.target.style.backgroundColor = "rgba(255,255,255,0.1)")
              }
              onMouseOut={(e) =>
                (e.target.style.backgroundColor = "transparent")
              }
            >
              Companies
            </Link>
            <div style={{ marginLeft: "1rem" }}>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <Registration />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/listing"
          element={
            <>
              <SignedIn>
                <CompanyListing />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route path="/sign-in/*" element={<Navigate to="/" />} />
        <Route path="/sign-up/*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;