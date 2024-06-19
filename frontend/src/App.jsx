import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";

import Header from "./components/common/Header.jsx";
import Navigation from "./components/common/Navigation.jsx";
import Footer from "./components/common/Footer.jsx";
import Dashboard from "./components/dashboard/Dashboard.jsx";
import MapView from "./components/map/MapView.jsx";
import AddEvent from "./components/events/AddEvent.jsx";
import EditEvent from "./components/events/EditEvent.jsx";
import ImportCSV from "./components/import/ImportCSV.jsx";
import InputDemands from "./components/events/InputDemands.jsx";
import EventsAllocationTable from "./components/data_explorer/EventsAllocationTable.jsx";
import ParkingSpaces from "./components/parking_space/ParkingSpaces.jsx";
import ParkingSpace from "./components/parking_space/ParkingSpace.jsx";
import Team from "./components/team/Team.jsx";
import AddParkingSpace from "./components/parking_space/AddParkingSpace.jsx";
import EditParkingSpace from "./components/parking_space/EditParkingSpace.jsx";
import MobileWarning from "./components/common/MobileWarning.jsx";
import theme from "./styles/muiCustomTheme";

function App() {
  const [isNavOpen, setNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const toggleNav = () => {
    setNavOpen(!isNavOpen);
  };

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
          <Navigation isOpen={isNavOpen} toggleNav={toggleNav} />
          <div className="grid-parent">
            <Header toggleNav={toggleNav} />
            <div className="grid-main">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/mapview" element={<MapView />} />
                <Route path="/tableview" element={<EventsAllocationTable />} />
                <Route path="/addEvent" element={<AddEvent />} />
                <Route path="/editEvent" element={<EditEvent />} />
                <Route path="/import" element={<ImportCSV />} />
                <Route path="/input_demands" element={<InputDemands />} />
                <Route path="/user" element={<Team />} />
                <Route path="/parking_spaces" element={<ParkingSpaces />} />
                <Route
                  path="/add_parking_space"
                  element={<AddParkingSpace />}
                />
                <Route
                  path="/edit_parking_space/:id"
                  element={<EditParkingSpace />}
                />
                <Route path="/parking_space/:id" element={<ParkingSpace />} />
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
