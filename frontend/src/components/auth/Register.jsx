import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import axios from "axios";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import "./styles/auth.css";

const Register = () => {
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [message, setMessage] = useState(null);
  const [severity, setSeverity] = useState("success");
  const navigate = useNavigate();

  const passwordRules = [
    {
      rule: "Passwords match",
      test: (pwd) =>
        pwd.length > 0 && confirmPassword.length > 0 && pwd === confirmPassword,
    },
    { rule: "At least 8 characters", test: (pwd) => pwd.length >= 8 },
    { rule: "At least 1 digit", test: (pwd) => /\d/.test(pwd) },
    { rule: "At least 1 special character", test: (pwd) => /\W/.test(pwd) },
  ];

  const checkPasswordRules = (pwd) =>
    passwordRules.map((rule) => ({
      rule: rule.rule,
      passed: rule.test(pwd),
    }));

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
        access_token: accessToken,
      });
      setMessage(response.data.message);
      setSeverity("success");

      const { token } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("auth", "true");
      localStorage.setItem("user", response.data.username);
      localStorage.setItem("email", response.data.email);
      window.dispatchEvent(new Event("authChange"));

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1000);
    } catch (error) {
      setMessage(error.response.data.message || "Registration failed");
      setSeverity("error");
    }
  };

  const passwordStatus = checkPasswordRules(password);

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
            required={true}
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
            required={true}
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
            required={true}
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
            required={true}
          />
          <List>
            {passwordStatus.map(({ rule, passed }) => (
              <ListItem key={rule} sx={{ padding: "0px 16px", margin: "0px" }}>
                <ListItemText primary={rule} />
                {passed ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <CancelIcon color="error" />
                )}
              </ListItem>
            ))}
          </List>
          <TextField
            label="Access Token"
            variant="outlined"
            fullWidth
            margin="normal"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            autoComplete="access-token"
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
