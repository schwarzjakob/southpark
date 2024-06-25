import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("auth");
    console.log("Auth state from localStorage:", token);
    if (token) {
      setIsAuthenticated(true);
      console.log("User is authenticated");
    } else {
      setIsAuthenticated(false);
      console.log("User is not authenticated");
    }
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
