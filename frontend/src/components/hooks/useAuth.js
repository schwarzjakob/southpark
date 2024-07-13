import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { refreshToken } from "./refreshToken";

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const demoToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Ik1NVCBTdHVkZW50IiwiZW1haWwiOiJtbXRAc291dGh2YXJrLnRpcnRleS5jb20ifQ.s5fKBr0Pn8iQ8Nz9IUPm9J6-kRAgphJ0Y1dE3_NsQZI";
  
    localStorage.setItem("token", demoToken);
    localStorage.setItem("auth", "true");
    localStorage.setItem("user", "MMT Student");
    localStorage.setItem("email", "mmt@southpark.tirtey.com");
    setIsAuthenticated(true);
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
