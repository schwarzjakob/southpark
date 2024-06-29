import { useState, useEffect } from "react";
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
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import AlternateEmailRoundedIcon from "@mui/icons-material/AlternateEmailRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import "./styles/auth.css";

const Account = () => {
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [severity, setSeverity] = useState("success");

  const passwordRules = [
    {
      rule: "Passwords match",
      test: (pwd) =>
        pwd.length > 0 &&
        confirmNewPassword.length > 0 &&
        pwd === confirmNewPassword,
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const response = await axios.get("/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setUserName(response.data.username);
        setEmail(response.data.email);
      } catch (error) {
        setMessage("Error fetching user data");
        setSeverity("error");
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setMessage("Passwords do not match");
      setSeverity("error");
      return;
    }

    const passwordStatus = checkPasswordRules(newPassword);
    const failedRule = passwordStatus.find((rule) => !rule.passed);

    if (failedRule) {
      setMessage(`Password must ${failedRule.rule.toLowerCase()}`);
      setSeverity("error");
      return;
    }

    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.put(
        "/api/auth/user/password",
        {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_new_password: confirmNewPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      setMessage(response.data.message);
      setSeverity("success");
      // Reset the password fields after a successful update
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      setMessage(error.response.data.message || "Update failed");
      setSeverity("error");
    }
  };

  const passwordStatus = checkPasswordRules(newPassword);

  return (
    <Container maxWidth="sm" className="account">
      <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
        <Box className="form-icon-heading">
          <ManageAccountsRoundedIcon />
          <Typography variant="h4" gutterBottom>
            Manage Account
          </Typography>
        </Box>
        <Box className="form-icon-row">
          <AccountCircleRoundedIcon />
          <Typography variant="body1">User Name: {username}</Typography>
        </Box>

        <Box className="form-icon-row">
          <AlternateEmailRoundedIcon />
          <Typography variant="body1">E-Mail: {email}</Typography>
        </Box>
        {message && <Alert severity={severity}>{message}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Current Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <TextField
            label="New Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <TextField
            label="Confirm New Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            autoComplete="new-password"
            required
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
          <Button
            className="account-submit"
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
          >
            Update
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default Account;
