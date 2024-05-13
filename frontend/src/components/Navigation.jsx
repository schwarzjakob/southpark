import React from "react";
import { Link } from "react-router-dom";

const Navigation = ({ isOpen, toggleNav }) => {
  return (
    <div
      className={`grid-navigation ${isOpen ? "grid-navigation__visible" : ""}`}
    >
      <div className="nav-menue__header">
        <button className="nav-close" onClick={toggleNav}>
          <img src="src/assets/icons/close.svg" alt="Close" />
        </button>
        <Link to="/" title="Home">
          <div className="logo-container">
            <img
              src="src/assets//logo.svg"
              alt="Messe München"
              className="logo"
            />
            <h1 className="site-title">
              Parking Area<br></br>Management
            </h1>
          </div>
        </Link>
      </div>
      <div className="nav-menue__content">
        <ul>
          <li>
            <Link to="/">
              <img src="src/assets/icons/dashboard.svg" alt="Dashboard" />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/mapview">
              <img src="src/assets/icons/map.svg" alt="Kartenansicht" />
              <span>Kartenansicht</span>
            </Link>
          </li>
          <li>
            <Link to="/tableview">
              <img src="src/assets/icons/calendar.svg" alt="Tabellenansichtt" />
              <span>Tabellenansichtt</span>
            </Link>
          </li>
          <li>
            <Link to="/addEvent">
              <img src="src/assets/icons/add.svg" alt="Neues Event" />
              <span>Neues Event</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Navigation;
