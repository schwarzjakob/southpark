import { useEffect } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import useAuth from "../hooks/useAuth";
import { refreshToken } from "../hooks/refreshToken";
import { Box } from "@mui/material";
import "./styles/auth.css";

const ProtectedRoute = ({ element }) => {
  const isAuthenticated = useAuth();
  const location = useLocation();

  useEffect(() => {
    refreshToken(); // Refresh token on component mount
  }, []);

  if (isAuthenticated === null) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return element;
};

ProtectedRoute.propTypes = {
  element: PropTypes.element.isRequired,
};

export default ProtectedRoute;
