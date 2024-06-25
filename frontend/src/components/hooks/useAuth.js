import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // Initially null to indicate loading state
  const [isFirstLogin, setIsFirstLogin] = useState(true); // Flag to handle first login redirection
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const auth = localStorage.getItem("auth");
    console.log("Auth state from localStorage:", auth);
    if (auth === "true") {
      setIsAuthenticated(true);
      console.log("User is authenticated");
    } else {
      setIsAuthenticated(false);
      console.log("User is not authenticated");
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate("/login");
    } else if (isAuthenticated === true && isFirstLogin) {
      console.log("User is authenticated, redirecting to /");
      setIsFirstLogin(false); // Reset the flag after the first redirection
      navigate("/");
    }
  }, [isAuthenticated, isFirstLogin, navigate, location.pathname]);

  return isAuthenticated;
};

export default useAuth;
