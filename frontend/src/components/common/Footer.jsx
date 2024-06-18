// src/components/Footer.jsx
import { Box, Link, Typography } from "@mui/material";

const currentYear = new Date().getFullYear();

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#f5f6f8",
        padding: 2,
        textAlign: "center",
        borderTop: "1px solid #ddd",
      }}
    >
      <Box className="certificates-footer" sx={{ marginBottom: 2 }}></Box>
      <Box className="social-footer" sx={{ marginBottom: 2 }}>
        <Box
          component="ul"
          sx={{
            display: "flex",
            justifyContent: "center",
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          <Box component="li" sx={{ margin: "0 10px" }}>
            <Link
              href="https://www.facebook.com/messemuenchen/?locale=de_DE"
              target="_blank"
              title="Facebook"
            >
              <img src="src/assets/icons/facebook.svg" alt="Facebook" />
            </Link>
          </Box>
          <Box component="li" sx={{ margin: "0 10px" }}>
            <Link
              href="https://de.linkedin.com/company/messemuenchen"
              target="_blank"
              title="LinkedIn"
            >
              <img src="src/assets/icons/linkedin.svg" alt="LinkedIn" />
            </Link>
          </Box>
          <Box component="li" sx={{ margin: "0 10px" }}>
            <Link
              href="https://www.instagram.com/messe_muenchen/?hl=de"
              target="_blank"
              title="Instagram"
            >
              <img src="src/assets/icons/instagram.svg" alt="Instagram" />
            </Link>
          </Box>
          <Box component="li" sx={{ margin: "0 10px" }}>
            <Link
              href="https://www.xing.com/pages/messemunchengmbh"
              target="_blank"
              title="Xing"
            >
              <img src="src/assets/icons/xing.svg" alt="Xing" />
            </Link>
          </Box>
          <Box component="li" sx={{ margin: "0 10px" }}>
            <Link
              href="https://www.youtube.com/channel/UCIhWUgI4zRKhHiXnpGWlyhw"
              target="_blank"
              title="YouTube"
            >
              <img src="src/assets/icons/youtube.svg" alt="YouTube" />
            </Link>
          </Box>
          <Box component="li" sx={{ margin: "0 10px" }}>
            <Link
              href="https://twitter.com/messemuenchen?lang=de"
              target="_blank"
              title="X"
            >
              <img src="src/assets/icons/x.svg" alt="X (Twitter)" />
            </Link>
          </Box>
        </Box>
      </Box>
      <Box className="navigation-footer" sx={{ marginBottom: 2 }}>
        <Box
          component="ul"
          sx={{
            display: "flex",
            justifyContent: "center",
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          <Box component="li" sx={{ margin: "0 10px" }}>
            <Link
              href="https://messe-muenchen.de/de/impressum/"
              title="Impressum"
            >
              Impressum
            </Link>
          </Box>
          <Box component="li" sx={{ margin: "0 10px" }}>
            <Link
              href="https://messe-muenchen.de/de/datenschutz/"
              title="Datenschutz"
            >
              Datenschutz
            </Link>
          </Box>
        </Box>
      </Box>
      <Typography className="madeWithLove" sx={{ fontWeight: "bold" }}>
        Made with ♥ in Munich
      </Typography>
      <br />
      <Typography className="copyright">
        © {currentYear} Messe München GmbH
      </Typography>
    </Box>
  );
};

export default Footer;
