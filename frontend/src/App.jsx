import React, { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import Header from "./components/Header.jsx";
import Navigation from "./components/Navigation.jsx";
import Footer from "./components/Footer.jsx";
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
            <EventsAllocationTable />
          </div>
          <Footer />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
