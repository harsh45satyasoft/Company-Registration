import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";                                        //Imports Leaflet JavaScript API to create and manage the map
import "leaflet/dist/leaflet.css";                              //Imports Leaflet CSS file for styling

delete L.Icon.Default.prototype._getIconUrl;                    //Removes Leaflet's default method for finding marker icons
L.Icon.Default.mergeOptions({                                   //Manually sets icon URLs so they load properly in bundlers
  iconRetinaUrl:  
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapComponent = ({
  onLocationSelect,
  selectedLocation,
  companies = [],
  selectedCompany = null,
  onLocationClick,
  showAllCompanies = false,
  isDraggable = false,                                         // New prop to enable draggable marker
  userAddress = "",                                            // New prop to pass user-entered address
}) => {
  const mapRef = useRef(null);                                 //Refers to the DOM element where the Leaflet map will be rendered.
  const mapInstanceRef = useRef(null);                         //Stores the Leaflet map instance itself (so it persists without re-rendering).
  const markersRef = useRef([]);                               //Stores the array of marker references added to the map.
  const [isMapReady, setIsMapReady] = useState(false);         //Tracks whether the map has been initialized.
  const [locationName, setLocationName] = useState("");        // State to store location name
  const [previousSelectedCompany, setPreviousSelectedCompany] = useState(null);    // State to store the previously selected company

  // Function to get location name from coordinates using reverse geocoding
  const getLocationName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.display_name) {                     //If the response contains a display_name (a readable address), return it.
        return data.display_name;
      }
      return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;    //If display_name is missing (unlikely but possible), fallback to a plain string using coordinates.
    } catch (error) {                                             //If the fetch fails (e.g. no internet, rate-limited), log the error and return a fallback string.
      console.error("Reverse geocoding error:", error);
      return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Function to animate zoom to a specific company
  const animateToCompany = (company) => {
    if (!mapInstanceRef.current || !company) return;                //If the map instance is not available or the company is not provided, return without doing anything.

    const targetLat = company.location.latitude;
    const targetLng = company.location.longitude;

    // First zoom out to show context
    mapInstanceRef.current.flyTo([targetLat, targetLng], 12, {           //Fly the map(using Leaflet's flyTo method) to a specific location with a specified zoom level 12
      animate: true,
      duration: 1.0,                                                     // 1 second for zoom out
    });

    // Then zoom in to the specific location with a delay
    setTimeout(() => {
      mapInstanceRef.current.flyTo([targetLat, targetLng], 16, {
        animate: true,
        duration: 1.2, // 1.2 seconds for zoom in
      });
    }, 800); // Wait 800ms before zooming in
  };

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {           //The map container (mapRef.current) exists in the DOM.& The map container (mapRef.current) exists in the DOM.
      mapInstanceRef.current = L.map(mapRef.current).setView(  //Creates a Leaflet map instance and sets its initial view.
        [28.6139, 77.209],                                     //New Delhi, India
        10                                                     //Initial zoom level(10)
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {     //Adds the OpenStreetMap tile layer (map visuals) to the map.
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstanceRef.current);
      setIsMapReady(true);                                                    //Set the state to indicate that the map is now ready for use (e.g., adding markers).
    }

    return () => {                                                           //Cleanup function (runs when the component is unmounted)
      if (mapInstanceRef.current) {  
        mapInstanceRef.current.remove();                                     //Removes the Leaflet map instance from the DOM
        mapInstanceRef.current = null;                                       //Clean up memory by setting the map reference to null
        setIsMapReady(false);                                                //Reset isMapReady to false.
      }
    };
  }, []);

  useEffect(() => {                                        //Adds a click event listener to the map
    if (isMapReady && onLocationSelect) {
      mapInstanceRef.current.on("click", (e) => {
        const { lat, lng } = e.latlng;                     //Get the latitude and longitude of the clicked location
        onLocationSelect(lat, lng);                        //Calls the onLocationSelect function and passes the clicked coordinates.
      });
    }
  }, [isMapReady, onLocationSelect]);

  // Enhanced useEffect for handling selected location with draggable marker
  useEffect(() => {                                          // It updates the map view and places a marker when a location is selected.
    if (
      isMapReady &&                                          // The map is initialized
      selectedLocation &&                                    // A location has been selected
      onLocationSelect &&                                    // A callback is provided to update location
      !showAllCompanies                                      // The "show all companies" mode is off (i.e., individual location pin is shown)
    ) {
      // Remove existing markers
      markersRef.current.forEach((m) => mapInstanceRef.current.removeLayer(m));    //Loops through all previous markers and removes them from the map.
      markersRef.current = [];                               // Empties the marker reference array.
  
      // Create draggable marker if isDraggable is true
      const markerOptions = isDraggable ? { draggable: true } : {};     //If isDraggable is true, markerOptions becomes { draggable: true }. Otherwise, it's empty.
      const marker = L.marker(                                          //This creates a new marker at the latitude and longitude provided by selectedLocation.
        [selectedLocation.lat, selectedLocation.lng],
        markerOptions                                       //The markerOptions are passed to determine if the marker is draggable.
      ).addTo(mapInstanceRef.current);                      // Add the marker to the map
  
      // Get and set location name for popup
      const updateLocationName = async () => {
        const name =
          userAddress ||                                     // Use user-provided address if available
          (await getLocationName(selectedLocation.lat, selectedLocation.lng));  // Otherwise,fetch the address string using the coordinates
        setLocationName(name);                               // Store the location name
        marker.bindPopup(name).openPopup();                  // Bind popup to marker and open it
      };
      updateLocationName();
  
      // Add drag event listener if marker is draggable
      if (isDraggable) {
        marker.on("dragend", async (e) => {
          const position = e.target.getLatLng();             // Get new marker position
          const { lat, lng } = position;
  
          // Update coordinates through callback
          onLocationSelect(lat, lng);                        // Update coordinates via callback
  
          // Update popup with new location name (but keep user address if provided)
          const newLocationName =                            // Get new location name
            userAddress || (await getLocationName(lat, lng));
          setLocationName(newLocationName);                  // Update name in state
          marker.bindPopup(newLocationName).openPopup();     // Bind and open updated popup
        });
  
        // Add tooltip to indicate marker is draggable
        marker.bindTooltip("Drag to adjust location", {
          permanent: false,                                 //Tooltip appears only on hover (which is good for draggable markers).
          direction: "top",                                 //Tooltip appears above the marker
          offset: [0, -40],                                 //Moves the tooltip up by 40 pixels, preventing it from overlapping the marker icon.
        });
      }
  
      markersRef.current.push(marker);                       // Store the new marker for future removal or updates
      mapInstanceRef.current.setView(                        // Updates the map view to focus on the selected location
        [selectedLocation.lat, selectedLocation.lng],
        15                                                   // Zoom level (15)
      );
    }
  }, [
    selectedLocation,
    isMapReady,
    isDraggable,
    userAddress,
    onLocationSelect,
    showAllCompanies,
  ]);
  
  
  useEffect(() => {                                                                  //This useEffect dynamically displays all company markers on a Leaflet map, with special highlighting for a selected company
    if (isMapReady && showAllCompanies && companies.length > 0) {                    //There’s at least one company to show (companies.length > 0) on listing page
      markersRef.current.forEach((m) => mapInstanceRef.current.removeLayer(m));      //Before drawing new markers, remove the old ones to prevent duplication.
      markersRef.current = [];                                                       //Clear the markers array

      const defaultIcon = L.icon({                                                   //Default marker icon(blue)
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const selectedIcon = L.icon({                                                    //Selected marker icon(red)
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      companies.forEach((company) => {                                                //Loop through all companies and create a marker for each.
        const isSelected =
          selectedCompany && selectedCompany._id === company._id;                     //Check if the current company is selected
        const marker = L.marker(                                                      //Creates the marker at the company’s location
          [company.location.latitude, company.location.longitude],
          { icon: isSelected ? selectedIcon : defaultIcon }                           //Uses red icon if selected, otherwise blue.
        )
          .addTo(mapInstanceRef.current)                                              //Add the marker to the map
          .bindPopup(`
            <div style="text-align: center; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">
                ${company.companyName}
              </h4>
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">
                <strong>Address:</strong> ${company.address}
              </p>
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">
                <strong>Hours:</strong> ${company.openingHours} - ${company.closingHours}
              </p>
              <p style="margin: 0; font-size: 12px; color: #666;">
                <strong>Contact:</strong> ${company.firstName}
              </p>
            </div>
          `);                                                                         //Binds a popup to the marker with the company name(click on location to see company name at listing page)

        marker.on("click", () => {
          onLocationClick({
            lat: company.location.latitude,
            lng: company.location.longitude,
            companyId: company._id,                                                   //Pass the company ID to the onLocationClick function
          });
        });

        // Add a pulsing effect for selected company marker
        if (isSelected) {                                                        //Checks if the marker is selected:
          marker.on("add", function () {                                         //Listens for when the marker is added to the map:
            const iconElement = marker.getElement();                             //Accesses the marker’s DOM element:
            if (iconElement) {
              iconElement.style.animation = "pulse 2s infinite";
              iconElement.style.filter =
                "drop-shadow(0 0 10px rgba(255, 0, 0, 0.7))";
            }
          });
        }

        markersRef.current.push(marker);                                              //Store the marker in the markersRef array
      });

      // Check if a new company is selected and animate to it
      if (selectedCompany && selectedCompany !== previousSelectedCompany) {   //If a new company is selected (not the same as the last one)
        animateToCompany(selectedCompany);                                    // Fly to it (with zoom in/out effect)
        setPreviousSelectedCompany(selectedCompany);                          // Update the previous selected company
      } else if (!selectedCompany && previousSelectedCompany) {               //If previously a company was selected, but now none is selected:
        // If no company is selected, fit bounds to show all companies
        const group = new L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1), {
          animate: true,
          duration: 1.0,
        });
        setPreviousSelectedCompany(null);                                     // Clear memory of selection
      } else if (!selectedCompany) {
        // Initial load - fit bounds to show all companies
        const group = new L.featureGroup(markersRef.current);                          //Creates a group of markers and adds it to the map
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));                  //Fits the map to the bounds of the group, with a 10% padding
      }
    }
  },[
    companies,
    selectedCompany,
    isMapReady,
    showAllCompanies,
    onLocationClick,
    previousSelectedCompany,
  ]);

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          minHeight: "300px",
        }}
      />
    </>
  );
};

export default MapComponent;

//s = subdomain, z = zoom, x&y = longitude and latitude in tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" [openstreetmap tile layer]