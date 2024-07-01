import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { refreshToken } from "./refreshToken";

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshToken, 55 * 60 * 1000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      const currentPath = location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register") {
        navigate("/login", { state: { from: location } });
      }
    } else if (isAuthenticated === true) {
      if (location.pathname === "/login" || location.pathname === "/register") {
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, navigate, location]);

  return isAuthenticated;
};

export default useAuth;
