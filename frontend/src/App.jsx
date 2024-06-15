// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";

import Header from "./components/Header.jsx";
import Navigation from "./components/Navigation.jsx";
import Footer from "./components/Footer.jsx";
import Dashboard from "./components/dashboard/Dashboard.jsx";
import MapView from "./components/MapView.jsx";
import AddEvent from "./components/AddEvent.jsx";
import EditEvent from "./components/EditEvent.jsx";
import ImportCSV from "./components/ImportCSV.jsx";
import InputDemands from "./components/InputDemands.jsx";
import EventsAllocationTable from "./components/EventsAllocationTable.jsx";
import Team from "./components/Team.jsx";
import MobileWarning from "./components/MobileWarning.jsx";
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
