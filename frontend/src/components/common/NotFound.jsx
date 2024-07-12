import Box from "@mui/material/Box";
import gif404 from "../../assets/404.gif";
import { useEffect } from "react";

const NotFound = () => {
  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "50vh",
    textAlign: "center",
    margin: "5 ",
  };

  const gifStyle = {
    width: "100%",
    maxWidth: "600px",
  };

  useEffect(() => {
    document.body.style.backgroundColor = "#FDFDFD";
  }, []);

  return (
    <Box maxWidth="30rem" marginLeft="auto" marginRight="auto">
      <div style={containerStyle}>
        <div style={gifStyle}>
          <img src={gif404} alt="404 Not Found" style={gifStyle} />
        </div>
      </div>
    </Box>
  );
};

export default NotFound;
