import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import axios from "axios";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const Register = () => {
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [severity, setSeverity] = useState("success");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setSeverity("error");
      return;
    }
    try {
      const response = await axios.post("/api/auth/register", {
        username,
        email,
        password,
      });
      setMessage(response.data.message);
      setSeverity("success");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setMessage(error.response.data.message || "Registration failed");
      setSeverity("error");
    }
  };

  return (
    <Container maxWidth="sm" className="register">
      <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
        <Box className="form-icon-heading">
          <PersonAddAltRoundedIcon />
          <Typography variant="h4" gutterBottom>
            Sign Up
          </Typography>
        </Box>
        {message && <Alert severity={severity}>{message}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="User Name"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUserName(e.target.value)}
            autoComplete="username"
          />
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <TextField
            label="Confirm Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Button
            className="register-submit"
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
          >
            Sign Up
          </Button>
          <Button
            component={RouterLink}
            className="register-link"
            to="/login"
            variant="outlined"
            color="primary"
            fullWidth
          >
            <ArrowBackIcon />
            Back
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default Register;
