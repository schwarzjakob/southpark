import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

const CustomBreadcrumb = ({ links }) => {
  const navigate = useNavigate();

  const handleClick = (event, path) => {
    event.preventDefault();
    navigate(path);
  };

  const breadcrumbs = links.map((link, index) => {
    if (index === links.length - 1) {
      return (
        <Typography key={index} color="text.primary">
          {link.label}
        </Typography>
      );
    }

    return (
      <Link
        underline="hover"
        key={index}
        color="inherit"
        onClick={(event) => handleClick(event, link.path)}
        href={link.path}
      >
        {link.label}
      </Link>
    );
  });

  return (
    <Stack spacing={2} className="breadcrumbs">
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        {breadcrumbs}
      </Breadcrumbs>
    </Stack>
  );
};

CustomBreadcrumb.propTypes = {
  links: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default CustomBreadcrumb;
