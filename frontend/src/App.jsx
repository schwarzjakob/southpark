import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import "./components/common/styles/common.css";

import theme from "./styles/muiCustomTheme";
import MobileWarning from "./components/common/MobileWarning.jsx";
import Header from "./components/common/Header.jsx";
import Footer from "./components/common/Footer.jsx";
import Team from "./components/team/Team.jsx";
import Dashboard from "./components/dashboard/Dashboard.jsx";
import MapView from "./components/map/MapView.jsx";
import Events from "./components/events/Events.jsx";
import AddEvent from "./components/events/AddEvent.jsx";
import Event from "./components/events/Event.jsx";
import EditEvent from "./components/events/EditEvent.jsx";
import ParkingSpaces from "./components/parking_space/ParkingSpaces.jsx";
import ParkingSpace from "./components/parking_space/ParkingSpace.jsx";
import AddParkingSpace from "./components/parking_space/AddParkingSpace.jsx";
import EditParkingSpace from "./components/parking_space/EditParkingSpace.jsx";
import EditCapacity from "./components/parking_space/EditCapacity.jsx";
import AddCapacity from "./components/parking_space/AddCapacity.jsx";

function App() {
  const [isMobile, setIsMobile] = useState(false);

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

  if (isMobile) {
    return <MobileWarning />;
  }

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <div className="App">
          <div className="grid-parent">
            <Header />
            <div className="grid-main">
              <Routes>
                <Route path="/team" element={<Team />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/mapview" element={<MapView />} />
                {/* Events Routes*/}
                <Route path="/events" element={<Events />} />
                <Route path="/event/add" element={<AddEvent />} />
                <Route path="/events/event/:id" element={<Event />} />
                <Route path="/events/event/edit/:id" element={<EditEvent />} />
                {/* Parking Spaces Routes*/}
                <Route path="/parking_spaces" element={<ParkingSpaces />} />
                <Route path="/parking_space/:id" element={<ParkingSpace />} />
                <Route
                  path="/parking_space/add"
                  element={<AddParkingSpace />}
                />
                <Route
                  path="/parking_space/edit/:id"
                  element={<EditParkingSpace />}
                />
                {/* Capacity Routes*/}
                <Route path="/capacity/edit" element={<EditCapacity />} />
                <Route path="/capacity/add" element={<AddCapacity />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
