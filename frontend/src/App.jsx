import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import "./components/common/styles/common.css";

import theme from "./styles/muiCustomTheme";
import MobileWarning from "./components/common/MobileWarning.jsx";
import Header from "./components/common/Header.jsx";
import Footer from "./components/common/Footer.jsx";
import Team from "./components/team/Team.jsx";
import Dashboard from "./components/dashboard/Dashboard.jsx";
import Map from "./components/map/Map.jsx";
import Events from "./components/events/Events.jsx";
import AddEvent from "./components/events/AddEvent.jsx";
import Event from "./components/events/Event.jsx";
import EditEvent from "./components/events/EditEvent.jsx";
import ParkingSpaces from "./components/parking_spaces/ParkingSpaces.jsx";
import ParkingSpace from "./components/parking_spaces/ParkingSpace.jsx";
import AddParkingSpace from "./components/parking_spaces/AddParkingSpace.jsx";
import EditParkingSpace from "./components/parking_spaces/EditParkingSpace.jsx";
import EditCapacity from "./components/parking_spaces/EditCapacity.jsx";
import AddCapacity from "./components/parking_spaces/AddCapacity.jsx";

function App() {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const overlay = document.querySelector(".page-transition-overlay");

    overlay.classList.remove("slide-up");
    overlay.classList.add("slide-down");

    const handleRouteChange = () => {
      overlay.classList.remove("slide-down");
      overlay.classList.add("slide-up");

      setTimeout(() => {
        overlay.classList.remove("slide-up");
        overlay.classList.add("slide-down");
      }, 500);
    };

    handleRouteChange();

    return () => {
      window.removeEventListener("beforeunload", handleRouteChange);
    };
  }, [location]);

  if (isMobile) {
    return <MobileWarning />;
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="page-transition-overlay"></div>
      <div className="App">
        <div className="grid-parent">
          <Header />
          <div className="grid-main">
            <Routes>
              {/* Map Route */}
              <Route path="/" element={<Map />} />

              {/* Dashboard Route */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Events Routes */}
              <Route path="/events" element={<Events />} />
              <Route path="/event/add" element={<AddEvent />} />
              <Route path="/events/event/:id" element={<Event />} />
              <Route path="/events/event/edit/:id" element={<EditEvent />} />

              {/* Parking Spaces Routes */}
              <Route path="/parking_spaces" element={<ParkingSpaces />} />
              <Route path="/parking_space/:id" element={<ParkingSpace />} />
              <Route path="/parking_space/add" element={<AddParkingSpace />} />
              <Route
                path="/parking_space/edit/:id"
                element={<EditParkingSpace />}
              />
              <Route
                path="/parking_space/capacity/edit"
                element={<EditCapacity />}
              />
              <Route
                path="/parking_space/capacity/add"
                element={<AddCapacity />}
              />

              {/* Team Route */}
              <Route path="/team" element={<Team />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </div>
    </ThemeProvider>
  );
}

function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default AppWrapper;
