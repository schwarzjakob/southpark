import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#6a91ce",
      light: "#b3b3b3",
      dark: "#4e75bc",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#b3b3b3",
      light: "#ff79b0",
      dark: "#c60055",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f5f6f8",
      paper: "#ffffff",
    },
    text: {
      primary: "#333333",
      secondary: "#666666",
    },
    error: {
      main: "#ff566a",
    },
    success: {
      main: "#18c788",
    },
    grey: {
      50: "#f5f5f5",
      100: "#e9e9e9",
      200: "#cccccc",
      300: "#b3b3b3",
      400: "#999999",
      500: "#808080",
      600: "#666666",
      700: "#4d4d4d",
      800: "#333333",
      900: "#1a1a1a",
    },
  },
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    h1: {
      fontSize: "3.052rem",
      fontWeight: 400,
      lineHeight: 1.3,
      textTransform: "capitalize",
    },
    h2: {
      fontSize: "2.441rem",
      fontWeight: 400,
      lineHeight: 1.3,
      textTransform: "capitalize",
    },
    h3: {
      fontSize: "1.953rem",
      fontWeight: 400,
      lineHeight: 1.3,
      textTransform: "capitalize",
    },
    h4: {
      fontSize: "1.563rem",
      fontWeight: 400,
      lineHeight: 1.3,
      textTransform: "capitalize",
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 400,
      lineHeight: 1.3,
      textTransform: "capitalize",
    },
    body1: {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontWeight: 400,
      lineHeight: 1.75,
    },
    small: {
      fontSize: "0.7em",
    },
  },
  shape: {
    borderRadius: 6,
  },
  shadows: [
    "none",
    "0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)",
    "0px 1px 5px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)",
    "0px 1px 8px rgba(0, 0, 0, 0.12), 0px 1px 3px rgba(0, 0, 0, 0.24)",
    "0px 1px 10px rgba(0, 0, 0, 0.12), 0px 1px 4px rgba(0, 0, 0, 0.24)",
    "0px 1px 14px rgba(0, 0, 0, 0.12), 0px 1px 5px rgba(0, 0, 0, 0.24)",
    "0px 1px 18px rgba(0, 0, 0, 0.12), 0px 1px 6px rgba(0, 0, 0, 0.24)",
    "0px 2px 16px rgba(0, 0, 0, 0.12), 0px 2px 10px rgba(0, 0, 0, 0.24)",
    "0px 3px 18px rgba(0, 0, 0, 0.12), 0px 3px 14px rgba(0, 0, 0, 0.24)",
    "0px 4px 20px rgba(0, 0, 0, 0.12), 0px 4px 16px rgba(0, 0, 0, 0.24)",
    "0px 5px 22px rgba(0, 0, 0, 0.12), 0px 5px 18px rgba(0, 0, 0, 0.24)",
    "0px 6px 24px rgba(0, 0, 0, 0.12), 0px 6px 20px rgba(0, 0, 0, 0.24)",
    "0px 7px 26px rgba(0, 0, 0, 0.12), 0px 7px 22px rgba(0, 0, 0, 0.24)",
    "0px 8px 28px rgba(0, 0, 0, 0.12), 0px 8px 24px rgba(0, 0, 0, 0.24)",
    "0px 9px 30px rgba(0, 0, 0, 0.12), 0px 9px 26px rgba(0, 0, 0, 0.24)",
    "0px 10px 32px rgba(0, 0, 0, 0.12), 0px 10px 28px rgba(0, 0, 0, 0.24)",
    "0px 11px 34px rgba(0, 0, 0, 0.12), 0px 11px 30px rgba(0, 0, 0, 0.24)",
    "0px 12px 36px rgba(0, 0, 0, 0.12), 0px 12px 32px rgba(0, 0, 0, 0.24)",
    "0px 13px 38px rgba(0, 0, 0, 0.12), 0px 13px 34px rgba(0, 0, 0, 0.24)",
    "0px 14px 40px rgba(0, 0, 0, 0.12), 0px 14px 36px rgba(0, 0, 0, 0.24)",
    "0px 15px 42px rgba(0, 0, 0, 0.12), 0px 15px 38px rgba(0, 0, 0, 0.24)",
    "0px 16px 44px rgba(0, 0, 0, 0.12), 0px 16px 40px rgba(0, 0, 0, 0.24)",
    "0px 17px 46px rgba(0, 0, 0, 0.12), 0px 17px 42px rgba(0, 0, 0, 0.24)",
    "0px 18px 48px rgba(0, 0, 0, 0.12), 0px 18px 44px rgba(0, 0, 0, 0.24)",
    "0px 19px 50px rgba(0, 0, 0, 0.12), 0px 19px 46px rgba(0, 0, 0, 0.24)",
    "0px 20px 52px rgba(0, 0, 0, 0.12), 0px 20px 48px rgba(0, 0, 0, 0.24)",
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
          textTransform: "capitalize",
          padding: "0.375rem 0.75rem",
          boxShadow: "var(--shadow-1)",
          transition: "var(--transition)",
          "&:hover": {
            backgroundColor: "#4e75bc",
            boxShadow: "var(--shadow-3)",
          },
        },
        text: {
          "&.btn-hipster": {
            color: "#6a91ce",
            backgroundColor: "#d8e0eb",
            "&:hover": {
              color: "#d8e0eb",
              backgroundColor: "#6a91ce",
            },
          },
          "&.btn-block": {
            width: "100%",
          },
        },
        containedSecondary: {
          "&:hover": {
            backgroundColor: "#666666", // grey color for hover effect
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          padding: "0.375rem 0.75rem",
          marginBottom: "1rem",
          borderRadius: "6px",
        },
        standardError: {
          color: "#842029",
          backgroundColor: "#f8d7da",
        },
        standardSuccess: {
          color: "#18c788",
          backgroundColor: "#e9f6ef",
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        columnHeaders: {
          backgroundColor: "#6a91ce",
          color: "#ffffff",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontWeight: 700,
        },
        main: {
          fontFamily: "Arial, Helvetica, sans-serif !important",
        },
        row: {
          color: "#333333 !important",
          backgroundColor: "#f5f5f5 !important",
          "&:nth-of-type(even)": {
            backgroundColor: "#e6e6e6 !important",
          },
          "&:hover": {
            backgroundColor: "#cccccc !important",
          },
        },
        cell: {
          "&:focus": {
            outline: "none !important",
          },
        },
      },
    },
  },
});

export default theme;
