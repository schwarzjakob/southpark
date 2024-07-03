import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import "./styles/auth.css";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [severity, setSeverity] = useState("success");
  const [clientIp, setClientIp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await axios.get("https://api.ipify.org?format=json");
        setClientIp(response.data.ip);
        sessionStorage.setItem("clientIp", response.data.ip);
      } catch (error) {
        console.warn("IP Address not found");
      }
    };

    fetchIp();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/login", {
        identifier: identifier.trim(),
        password,
        ip_address: clientIp,
      });
      const { token } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("auth", "true");
      setMessage("Login Successful");
      setSeverity("success");
      window.dispatchEvent(new Event("authChange"));

      setTimeout(() => {
        const initialPath = location.state?.from?.pathname || "/";
        navigate(initialPath, { replace: true });
      }, 1000);
    } catch (error) {
      setMessage(error.response.data.message || "Invalid credentials");
      setSeverity("error");
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" className="login">
      <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
        <Box className="form-icon-heading">
          <LoginRoundedIcon />
          <Typography variant="h4" gutterBottom>
            Login
          </Typography>
        </Box>

        {message && <Alert severity={severity}>{message}</Alert>}

        {loading ? (
          <CircularProgress />
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              label="Username or Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username email"
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button
              className="login-submit"
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
            >
              Login
            </Button>
            <Button
              component={RouterLink}
              className="register-link"
              to="/register"
              variant="outlined"
              color="primary"
              fullWidth
            >
              Sign up
            </Button>
          </form>
        )}
      </Box>
    </Container>
  );
};

export default Login;
