// src/utils/auth.js

import axios from "axios";

export const refreshToken = async () => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    console.log("No token found");
    return;
  }

  try {
    const response = await axios.post("/api/auth/refresh_token", {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const newToken = response.data.token;
    sessionStorage.setItem("token", newToken);
    console.log("Token refreshed");
  } catch (error) {
    console.log("Failed to refresh token", error);
  }
};
