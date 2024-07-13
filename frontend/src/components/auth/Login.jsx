import { useEffect } from "react";
import { Container, Typography, Box, Alert } from "@mui/material";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import "./styles/auth.css";

const Login = () => {
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        localStorage.setItem("clientIp", data.ip);
      } catch (error) {
        console.warn("IP Address not found");
      }
    };

    fetchIp();
  }, []);

  return (
    <Container maxWidth="sm" className="login">
      <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
        <Box className="form-icon-heading">
          <LoginRoundedIcon />
          <Typography variant="h4" gutterBottom>
            Login
          </Typography>
        </Box>
        <Alert severity="info">Login is disabled for this demo.</Alert>
      </Box>
    </Container>
  );
};

export default Login;
