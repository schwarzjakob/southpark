import Lottie from "react-lottie";
import animationData from "../../assets/404.json";
import Box from "@mui/material/Box";

const NotFound = () => {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "50vh",
    textAlign: "center",
    margin: "5 ",
  };

  const animationStyle = {
    width: "100%",
    maxWidth: "600px",
  };

  return (
    <Box maxWidth="30rem" marginLeft="auto" marginRight="auto">
      <div style={containerStyle}>
        <div style={animationStyle}>
          <Lottie options={defaultOptions} />
        </div>
      </div>
    </Box>
  );
};

export default NotFound;
