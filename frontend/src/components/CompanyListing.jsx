import React, { useState, useEffect } from "react";
import { getCompanies } from "../services/api";
import MapComponent from "./MapComponent";
import { Search } from "lucide-react";
import * as jwt_decode from "jwt-decode";

const CompanyListing = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    // Filter companies based on search term
    if (searchTerm.trim() === "") {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter((company) =>
        company.companyName.toLowerCase().includes(searchTerm.toLowerCase())     //"microsoft".includes("soft") → true, So, "Soft" from user input would still match "Microsoft".
      );
      setFilteredCompanies(filtered);                                            //Updates the filteredCompanies state with only the companies that matched the search.
      // Reset selected company if it's not in filtered results
      if (
        selectedCompany &&                                                       // if a company is currently selected
        !filtered.find((c) => c._id === selectedCompany._id)                     // but it's NOT in the filtered list         
      ) {
        setSelectedCompany(null);                                                // then clear the selection
      }
    }
  }, [searchTerm, companies, selectedCompany]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);                             //This is typically used to show a loading spinner
      const data = await getCompanies();
      setCompanies(data);                           //Updates the full list of companies in React state.
      setFilteredCompanies(data);                   //Also updates the list used to display filtered results.
    } catch (err) {
      setError("Failed to fetch companies. Please try again.");
      console.error("Error fetching companies:", err);
    } finally {
      setLoading(false);                            //Turns off the loading state.
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCompanyClick = (company) => {
    // If clicking the same company, deselect it
    if (selectedCompany && selectedCompany._id === company._id) {              //Checks if the clicked company (company) is already selected.
      setSelectedCompany(null);                                                // If yes, it deselects the company (e.g. removes map highlight, resets side panel, etc.)
      return;                                                                  //Stops further processing (like re-selecting or re-animating the same marker).
    } 

    setSelectedCompany(company);                 //Used to track which company is currently selected.

    // Move selected company to top of the list
    const updatedCompanies = [
      company,
      ...filteredCompanies.filter((c) => c._id !== company._id),         //Sc. 21
    ];
    setFilteredCompanies(updatedCompanies);                       //Updates the list of companies being displayed.
    
    // Scroll the selected company into view smoothly(delays the scroll logic by 100ms to allow React to render the DOM)
    setTimeout(() => {
      const selectedElement = document.querySelector(
        `[data-company-id="${company._id}"]` 
      );                                                      //targets the specific DOM element representing the selected company using a data-company-id attribute.
      if (selectedElement) {
        selectedElement.scrollIntoView({                      //scrolls the element into the center of the screen smoothly.
          behavior: "smooth",
          block: "start",                                     //aligns the element to the top.
          inline: "nearest",                                  //ensures horizontal alignment is preserved sensibly.
        });
      }
    }, 100);
  };

  const handleMapLocationClick = ({ lat, lng, companyId }) => {
    const clickedCompany = companies.find((c) => c._id === companyId);
    if (clickedCompany) {
      handleCompanyClick(clickedCompany);
    }
  };
  
  const clearSelection = () => {                         //Deselect a company when user clicks outside or on a "clear" button
    setSelectedCompany(null);
  };

  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decoded = jwt_decode.default(token);
      return decoded.userId || decoded.id || decoded._id || null;
    } catch {
      return null;
    }
  };

  const userId = getUserIdFromToken();

  const handleDelete = async (companyId) => {
    if (!window.confirm("Are you sure you want to delete this company?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/companies/${companyId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete company");
      setCompanies((prev) => prev.filter((c) => c._id !== companyId));
      setFilteredCompanies((prev) => prev.filter((c) => c._id !== companyId));
    } catch (err) {
      alert(err.message || "Error deleting company");
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
            fontSize: "18px",
            color: "#666",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #007bff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 10px",
              }}
            ></div>
            Loading companies...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
            fontSize: "18px",
            color: "#dc3545",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .company-item {
          animation: slideIn 0.3s ease-out;
        }
        .company-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3) !important;
        }
        .clear-selection-btn {
          background: linear-gradient(45deg, #ff6b6b, #ee5a24);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
          margin-left: 10px;
        }
        .clear-selection-btn:hover {
          background: linear-gradient(45deg, #ee5a24, #ff6b6b);
          transform: scale(1.05);
        }
      `}</style>
      <div className="container">
        <h2
          style={{
            textAlign: "center",
            marginBottom: "30px",
            color: "#333",
            fontSize: "28px",
            fontWeight: "700",
          }}
        >
          Company Directory
        </h2>

        {/* Search Box */}
        <div
          style={{
            position: "relative",
            marginBottom: "30px",
            maxWidth: "500px",
            margin: "0 auto 30px auto",
          }}
        >
          <Search
            size={20}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#666",
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search companies by name..."
            style={{
              width: "100%",
              padding: "12px 12px 12px 45px",
              border: "2px solid #ddd",
              borderRadius: "25px",
              fontSize: "16px",
              outline: "none",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#007bff";
              e.target.style.boxShadow = "0 0 0 3px rgba(0, 123, 255, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#ddd";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Results Count */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
            color: "#666",
            fontSize: "14px",
          }}
        >
          {searchTerm
            ? `Found ${filteredCompanies.length} companies`
            : `Showing ${companies.length} companies`}
          {selectedCompany && (
            <>
              <span style={{ margin: "0 10px", color: "#007bff" }}>•</span>
              <span style={{ color: "#007bff", fontWeight: "500" }}>
                {selectedCompany.companyName} selected
              </span>
              <button className="clear-selection-btn" onClick={clearSelection}>
                Clear Selection
              </button>
            </>
          )}
        </div>

        <div className="listing-container">
          {/* Companies List */}
          <div className="companies-list">
            <h3
              style={{
                marginBottom: "20px",
                color: "#333",
                borderBottom: "2px solid #007bff",
                paddingBottom: "10px",
              }}
            >
              Companies ({filteredCompanies.length})
            </h3>

            {filteredCompanies.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#666",
                  fontSize: "16px",
                }}
              >
                {searchTerm
                  ? "No companies found matching your search."
                  : "No companies registered yet."}
              </div>
            ) : (
              <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                {filteredCompanies.map((company) => (
                  <div
                    key={company._id}
                    data-company-id={company._id}
                    className={`company-item ${
                      selectedCompany?._id === company._id ? "highlighted" : ""
                    }`}
                    onClick={() => handleCompanyClick(company)}
                    style={{
                      marginBottom: "15px",
                      padding: "20px",
                      border:
                        selectedCompany?._id === company._id
                          ? "2px solid #007bff"
                          : "2px solid #f0f0f0",
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      backgroundColor:
                        selectedCompany?._id === company._id
                          ? "#e3f2fd"
                          : "white",
                      boxShadow:
                        selectedCompany?._id === company._id
                          ? "0 4px 20px rgba(0, 123, 255, 0.3)"
                          : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        color: "#333",
                        fontSize: "18px",
                        fontWeight: "600",
                      }}
                    >
                      {company.companyName}
                      {selectedCompany?._id === company._id && (
                        <span
                          style={{
                            marginLeft: "10px",
                            fontSize: "12px",
                            color: "#007bff",
                            fontWeight: "400",
                          }}
                        >
                          (Click to deselect)
                        </span>
                      )}
                    </h4>
                    <div
                      style={{
                        color: "#666",
                        fontSize: "14px",
                        marginBottom: "8px",
                      }}
                    >
                      <strong>Address:</strong> {company.address}
                    </div>
                    <div
                      style={{
                        color: "#666",
                        fontSize: "14px",
                        marginBottom: "8px",
                      }}
                    >
                      <strong>Hours:</strong> {company.openingHours} -{" "}
                      {company.closingHours}
                    </div>
                    <div
                      style={{
                        color: "#666",
                        fontSize: "14px",
                        marginBottom: "8px",
                      }}
                    >
                      <strong>Contact:</strong> {company.firstName} (
                      {company.email})
                    </div>
                    <div
                      style={{
                        color: "#888",
                        fontSize: "12px",
                      }}
                    >
                      Location: {company.location.latitude.toFixed(4)},{" "}
                      {company.location.longitude.toFixed(4)}
                    </div>
                    {selectedCompany?._id === company._id && (
                      <div
                        style={{
                          marginTop: "10px",
                          padding: "8px 12px",
                          background:
                            "linear-gradient(45deg, #007bff, #0056b3)",
                          color: "white",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                          textAlign: "center",
                        }}
                      >
                        Currently Selected - View on Map
                      </div>
                    )}
                    {userId && company.ownerId === userId && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(company._id); }}       // stopPropagation() prevents the click event from bubbling up to the parent element(It only stops the event from reaching ancestor elements.)
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '6px 14px',
                          cursor: 'pointer',
                          float: 'right',
                          marginLeft: '10px',
                          fontWeight: 'bold',
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map */}
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3
              style={{
                marginBottom: "20px",
                color: "#333",
                borderBottom: "2px solid #007bff",
                paddingBottom: "10px",
              }}
            >
              Map View
              {selectedCompany && (
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "400",
                    color: "#666",
                    marginLeft: "10px",
                  }}
                >
                  - Focused on {selectedCompany.companyName}
                </span>
              )}
            </h3>
            <div
              style={{
                height: "600px",
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid #ddd",
              }}
            >
              <MapComponent
                companies={filteredCompanies}
                selectedCompany={selectedCompany}
                onLocationClick={handleMapLocationClick}
                showAllCompanies={true}
              />
            </div>
            {selectedCompany && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "15px",
                  background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
                  borderRadius: "8px",
                  border: "1px solid #dee2e6",
                }}
              >
                <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>
                  📍 Selected: {selectedCompany.companyName}
                </h4>
                <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
                  {selectedCompany.address}
                </p>
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "12px",
                    color: "#007bff",
                    fontStyle: "italic",
                  }}
                >
                  Click on the company in the list again to deselect
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CompanyListing;