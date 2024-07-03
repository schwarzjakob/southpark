import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logUserActivity } from "../hooks/logger";

const LoggerHOC = (WrappedComponent) => {
  const WithLogging = (props) => {
    const location = useLocation();

    useEffect(() => {
      const logPageView = async () => {
        const email = localStorage.getItem("email");
        const token = localStorage.getItem("token");
        const clientIp = localStorage.getItem("clientIp");

        if (token) {
          try {
            const user = JSON.parse(atob(token.split(".")[1]));
            const activity = {
              user_name: user.username || "Unknown User",
              email: email || "Unknown Email",
              session_id: token,
              page_accessed: location.pathname,
              ip_address: clientIp || "Unknown IP",
            };

            await logUserActivity(activity);
          } catch (error) {
            console.error("Error parsing token or logging activity", error);
          }
        }
      };

      logPageView();
    }, [location]);

    return <WrappedComponent {...props} />;
  };

  WithLogging.displayName = `LoggerHOC(${getDisplayName(WrappedComponent)})`;
  return WithLogging;
};

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}

export default LoggerHOC;
