import CircularProgress from "@mui/material/CircularProgress";
import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import useAuth from "../hooks/useAuth";
import { Box } from "@mui/material";

const ProtectedRoute = ({ element }) => {
  const isAuthenticated = useAuth();
  const location = useLocation();

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
