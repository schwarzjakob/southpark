import axios from "axios";

export const refreshToken = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return false;
  }

  try {
    const response = await axios.post(
      "/api/auth/refresh_token",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const newToken = response.data.token;
    localStorage.setItem("token", newToken);
    console.log("User token refreshed");
    return true;
  } catch (error) {
    console.log("Failed to refresh user token", error);
    localStorage.removeItem("token");
    localStorage.removeItem("auth");
    localStorage.removeItem("user");
    localStorage.removeItem("email");
    return false;
  }
};
