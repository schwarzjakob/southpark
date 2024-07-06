import { useState } from "react";
import PropTypes from "prop-types";
import {
  IconButton,
  Popper,
  MenuItem,
  Checkbox,
  ListItemText,
  Box,
  Paper,
  ClickAwayListener,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterListRounded";

const FilterDropdown = ({ options, selectedOptions, onChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setOpen(false);
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

  const getStatusText = (status) => {
    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <FilterListIcon />
      </IconButton>
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        style={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper>
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
                      <ListItemText primary={getStatusText(option)} />
                    </MenuItem>
                  ))}
                </Box>
              ))}
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
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
