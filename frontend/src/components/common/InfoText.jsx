// src/components/InfoTextComponent.jsx
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import PropTypes from "prop-types";

const InfoTextComponent = ({
  infoText,
  direction = "right",
  iconPosition = "right",
}) => {
  return (
    <div className={`infoText__Container ${direction}`}>
      {iconPosition === "left" && (
        <LightbulbRoundedIcon fontSize="small" className="infoText__Icon" />
      )}
      <span className="infoText__Text">{infoText}</span>
      {iconPosition === "right" && (
        <LightbulbRoundedIcon fontSize="small" className="infoText__Icon" />
      )}
    </div>
  );
};

InfoTextComponent.propTypes = {
  infoText: PropTypes.string.isRequired,
  direction: PropTypes.oneOf(["left", "right"]),
  iconPosition: PropTypes.oneOf(["left", "right"]),
};

export default InfoTextComponent;
