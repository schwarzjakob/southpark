import { useState } from "react";
import PropTypes from "prop-types";
import {
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  Box,
  Divider,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterListRounded";

const FilterDropdown = ({
  options,
  selectedOptions,
  onChange,
  align = "left",
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggle = (option) => {
    const newSelectedOptions = selectedOptions.includes(option)
      ? selectedOptions.filter((selected) => selected !== option)
      : [...selectedOptions, option];
    onChange(newSelectedOptions);
  };

  const filteredOptions = options.filter(
    (option) => typeof option === "string" && option.trim() !== "",
  );
  const sortedOptions = filteredOptions.sort((a, b) => a.localeCompare(b));
  const maxItemsPerColumn = 6;
  const columns = [];

  for (let i = 0; i < sortedOptions.length; i += maxItemsPerColumn) {
    columns.push(sortedOptions.slice(i, i + maxItemsPerColumn));
  }

  const getTransformOrigin = () => {
    switch (align) {
      case "left":
        return { vertical: "top", horizontal: 0 };
      case "center":
        return { vertical: "top", horizontal: "center" };
      case "right":
        return { vertical: "top", horizontal: "right" };
      default:
        return { vertical: "top", horizontal: 0 };
    }
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <FilterListIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: align }}
        transformOrigin={getTransformOrigin()}
        style={{ position: "fixed !important" }}
      >
        <Box display="flex">
          {columns.map((column, columnIndex) => (
            <Box key={`column-${columnIndex}`}>
              {column.map((option, optionIndex) => (
                <MenuItem
                  key={`option-${columnIndex}-${optionIndex}`}
                  onClick={() => handleToggle(option)}
                  className="filter-dropdown-item"
                >
                  <Checkbox
                    checked={selectedOptions.indexOf(option) > -1}
                    value={option}
                  />
                  <ListItemText primary={option} />
                </MenuItem>
              ))}
              {columnIndex < columns.length - 1 && (
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ backgroundColor: "lightgray", margin: "8px 0" }}
                />
              )}
            </Box>
          ))}
        </Box>
      </Menu>
    </>
  );
};

FilterDropdown.propTypes = {
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  align: PropTypes.oneOf(["left", "center", "right"]),
};

export default FilterDropdown;
