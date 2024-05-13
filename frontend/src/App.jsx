import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header.jsx";
import Navigation from "./components/Navigation.jsx";
import Footer from "./components/Footer.jsx";
import Dashboard from "./components/Dashboard.jsx";
import MapView from "./components/MapView.jsx";
import AddEvent from "./components/AddEvent.jsx";
import EventsAllocationTable from "./components/EventsAllocationTable.jsx";

function App() {
  const [isNavOpen, setNavOpen] = useState(false);

  const toggleNav = () => {
    setNavOpen(!isNavOpen);
  };

  return (
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
            </Routes>
          </div>
          <Footer />
        </div>
      </div>
    </BrowserRouter>
  );
}
export default App;
