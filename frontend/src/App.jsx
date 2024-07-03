import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./styles/muiCustomTheme";
import "./components/common/styles/common.css";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register.jsx";
import Account from "./components/auth/Account.jsx";
import LoggerHOC from "./components/common/LoggerHOC";
import MobileWarning from "./components/common/MobileWarning.jsx";
import Header from "./components/common/Header.jsx";
import Footer from "./components/common/Footer.jsx";
import Team from "./components/team/Team.jsx";
import Dashboard from "./components/dashboard/Dashboard.jsx";
import MapPage from "./components/map/MapPage.jsx";
import Events from "./components/events/Events.jsx";
import Event from "./components/events/addEditEvent/Event.jsx";
import AddEvent from "./components/events/addEditEvent/AddEvent.jsx";
import EditEvent from "./components/events/addEditEvent/EditEvent.jsx";
import EventDemandAllocation from "./components/events/allocation/AllocateParkingSpaces.jsx";
import ParkingSpaces from "./components/parking_spaces/ParkingSpaces.jsx";
import ParkingSpace from "./components/parking_spaces/ParkingSpace.jsx";
import AddParkingSpace from "./components/parking_spaces/AddParkingSpace.jsx";
import EditParkingSpace from "./components/parking_spaces/EditParkingSpace.jsx";
import EditCapacity from "./components/parking_spaces/EditCapacity.jsx";
import AddCapacity from "./components/parking_spaces/AddCapacity.jsx";
import NotFound from "./components/common/NotFound.jsx";

const LoggedLogin = LoggerHOC(Login);
const LoggedRegister = LoggerHOC(Register);
const LoggedAccount = LoggerHOC(Account);
const LoggedMap = LoggerHOC(MapPage);
const LoggedDashboard = LoggerHOC(Dashboard);
const LoggedEvents = LoggerHOC(Events);
const LoggedAddEvent = LoggerHOC(AddEvent);
const LoggedEvent = LoggerHOC(Event);
const LoggedEditEvent = LoggerHOC(EditEvent);
const LoggedParkingSpaces = LoggerHOC(ParkingSpaces);
const LoggedParkingSpace = LoggerHOC(ParkingSpace);
const LoggedAddParkingSpace = LoggerHOC(AddParkingSpace);
const LoggedEditParkingSpace = LoggerHOC(EditParkingSpace);
const LoggedEditCapacity = LoggerHOC(EditCapacity);
const LoggedAddCapacity = LoggerHOC(AddCapacity);
const LoggedTeam = LoggerHOC(Team);

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
      <div className="page-transition-overlay"></div>
      <div className="App">
        <div className="grid-parent">
          <Header />
          <div className="grid-main">
            <Routes>
              <Route path="/login" element={<LoggedLogin />} />
              <Route path="/register" element={<LoggedRegister />} />
              <Route
                path="/account"
                element={<ProtectedRoute element={<LoggedAccount />} />}
              />
              <Route
                path="/"
                element={<ProtectedRoute element={<LoggedMap />} />}
              />
              <Route
                path="/dashboard"
                element={<ProtectedRoute element={<LoggedDashboard />} />}
              />
              <Route
                path="/events"
                element={<ProtectedRoute element={<LoggedEvents />} />}
              />
              <Route
                path="/event/add"
                element={<ProtectedRoute element={<LoggedAddEvent />} />}
              />
              <Route
                path="/events/event/:id"
                element={<ProtectedRoute element={<LoggedEvent />} />}
              />
              <Route
                path="/events/event/edit/:id"
                element={<ProtectedRoute element={<LoggedEditEvent />} />}
              />
              <Route
                path="/events/event/:id/allocate-parking-spaces"
                element={<ProtectedRoute element={<EventDemandAllocation />} />}
              />
              <Route
                path="/parking_spaces"
                element={<ProtectedRoute element={<LoggedParkingSpaces />} />}
              />
              <Route
                path="/parking_space/:id"
                element={<ProtectedRoute element={<LoggedParkingSpace />} />}
              />
              <Route
                path="/parking_space/add"
                element={<ProtectedRoute element={<LoggedAddParkingSpace />} />}
              />
              <Route
                path="/parking_space/edit/:id"
                element={
                  <ProtectedRoute element={<LoggedEditParkingSpace />} />
                }
              />
              <Route
                path="/parking_space/capacity/edit"
                element={<ProtectedRoute element={<LoggedEditCapacity />} />}
              />
              <Route
                path="/parking_space/capacity/add"
                element={<ProtectedRoute element={<LoggedAddCapacity />} />}
              />
              <Route
                path="/team"
                element={<ProtectedRoute element={<LoggedTeam />} />}
              />
              <Route path="*" element={<NotFound />} />
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
