import { useState, useEffect, useCallback } from "react";
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
  const [severity, setSeverity] = useState("info");
  const [passwordStatus, setPasswordStatus] = useState([]);
  const [allFieldsFilled, setAllFieldsFilled] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Temporäre Demodaten für Benutzername und E-Mail
        const response = {
          data: {
            username: "MMT Student",
            email: "mmt@southpark.tirtey.com",
          },
        };

        setUserName(response.data.username);
        setEmail(response.data.email);
      } catch (error) {
        setMessage("Error fetching user data");
        setSeverity("error");
      }
    };

    fetchData();
  }, []);

  const checkPasswordRules = useCallback(() => {
    const passwordRules = [
      {
        rule: "New Passwords match",
        test: () =>
          newPassword.length > 0 &&
          confirmNewPassword.length > 0 &&
          newPassword === confirmNewPassword,
      },
      {
        rule: "At least 8 characters",
        test: () => newPassword.length >= 8,
      },
      { rule: "At least 1 digit", test: () => /\d/.test(newPassword) },
      {
        rule: "At least 1 special character",
        test: () => /\W/.test(newPassword),
      },
    ];

    return passwordRules.map((rule) => ({
      rule: rule.rule,
      passed: rule.test(newPassword),
    }));
  }, [newPassword, confirmNewPassword]);

  useEffect(() => {
    const validateFields = () => {
      const allRules = checkPasswordRules();
      setPasswordStatus(allRules);
      const allPassed = allRules.every((r) => r.passed);
      setAllFieldsFilled(
        username &&
          email &&
          currentPassword &&
          newPassword &&
          confirmNewPassword &&
          allPassed,
      );
    };

    validateFields();
  }, [
    username,
    email,
    currentPassword,
    newPassword,
    confirmNewPassword,
    checkPasswordRules,
  ]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("Password update is disabled for this demo.");
    setSeverity("info");
  };

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
        <Alert severity="warning">
          Password update functionality is disabled for this demo.
        </Alert>
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
            autoComplete="off"
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
            autoComplete="off"
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
            autoComplete="off"
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
            disabled={!allFieldsFilled}
          >
            Update
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default Account;
