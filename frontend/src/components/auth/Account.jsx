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
  const [passwordStatus, setPasswordStatus] = useState([]);
  const [allFieldsFilled, setAllFieldsFilled] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

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

  const validateCurrentPassword = async (password) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "/api/auth/user/password",
        {
          current_password: password,
          new_password: password,
          confirm_new_password: password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.status === 200;
    } catch (error) {
      return false;
    }
  };

  const handleCurrentPasswordBlur = async () => {
    const isValid = await validateCurrentPassword(currentPassword);
    if (!isValid) {
      setMessage("Current password is incorrect");
      setSeverity("error");
    } else {
      setMessage(null);
    }
  };

  const checkPasswordRules = useCallback(
    async (pwd) => {
      const passwordRules = [
        {
          rule: "New Passwords match",
          test: (pwd) =>
            newPassword.length > 0 &&
            confirmNewPassword.length > 0 &&
            pwd === confirmNewPassword,
        },
        { rule: "At least 8 characters", test: (pwd) => pwd.length >= 8 },
        { rule: "At least 1 digit", test: (pwd) => /\d/.test(pwd) },
        { rule: "At least 1 special character", test: (pwd) => /\W/.test(pwd) },
      ];

      const results = await Promise.all(
        passwordRules.map(async (rule) => ({
          rule: rule.rule,
          passed: await rule.test(pwd),
        }))
      );
      return results;
    },
    [newPassword, confirmNewPassword]
  );

  useEffect(() => {
    const validateFields = async () => {
      const allRules = await checkPasswordRules(newPassword);
      setPasswordStatus(allRules);
      const allPassed = allRules.every((r) => r.passed);
      setAllFieldsFilled(
        username &&
          email &&
          currentPassword &&
          newPassword &&
          confirmNewPassword &&
          allPassed
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const token = localStorage.getItem("token");
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
        }
      );
      setMessage(response.data.message);
      setSeverity("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      setMessage(error.response.data.message || "Update failed");
      setSeverity("error");
    }
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
            onBlur={handleCurrentPasswordBlur}
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
