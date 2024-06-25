import axios from "axios";

export const logUserActivity = async (activity) => {
  try {
    await axios.post("/api/auth/log", activity, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error logging user activity", error);
  }
};
