import React from "react";
import { Link } from "react-router-dom";

function Header({ toggleNav }) {
  return (
    <header className="header">
      <div className="layout-desktop">
        <div className="nav-left">
          <button className="nav-open" onClick={toggleNav}>
            <img src="src/assets/icons/burger-menu.svg" alt="Menu" />
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
        <div className="nav-right">
          <Link to="/user" className="user-icon">
            <img src="src/assets/icons/user.svg" alt="User Account" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
