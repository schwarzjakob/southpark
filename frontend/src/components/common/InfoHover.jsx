import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import PropTypes from "prop-types";

const InfoHoverComponent = ({ infoText, direction = "bottom" }) => {
  return (
    <Tooltip title={infoText} arrow placement={direction}>
      <IconButton size="small" className="infoHover__Container">
        <InfoOutlinedIcon fontSize="small" className="infoHover__Icon" />
      </IconButton>
    </Tooltip>
  );
};

InfoHoverComponent.propTypes = {
  infoText: PropTypes.string.isRequired,
  direction: PropTypes.oneOf(["top", "bottom", "left", "right"]),
};

export default InfoHoverComponent;
