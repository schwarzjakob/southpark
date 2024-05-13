import React from "react";
const currentYear = new Date().getFullYear();

const Footer = () => {
  return (
    <footer id="footer">
      <div className="certificates-footer">
        {/* Hier könnten Zertifikats-Icons oder Links eingefügt werden */}
      </div>
      <div className="social-footer">
        <ul>
          <li>
            <a
              href="https://www.facebook.com/messemuenchen/?locale=de_DE"
              target="_blank"
              title="Facebook"
            ></a>
            <img src="src/assets/icons/facebook.svg" alt="Facebook" />
          </li>
          <li>
            <a
              href="https://de.linkedin.com/company/messemuenchen"
              target="_blank"
              title="LinkedIn"
            >
              <img src="src/assets/icons/linkedin.svg" alt="LinkedIn" />
            </a>
          </li>
          <li>
            <a
              href="https://www.instagram.com/messe_muenchen/?hl=de"
              target="_blank"
              title="Instagram"
            >
              <img src="src/assets/icons/instagram.svg" alt="Instagram" />
            </a>
          </li>
          <li>
            <a
              href="https://www.xing.com/pages/messemunchengmbh"
              target="_blank"
              title="Xing"
            >
              <img src="src/assets/icons/xing.svg" alt="Xing" />
            </a>
          </li>
          <li>
            <a
              href="https://www.youtube.com/channel/UCIhWUgI4zRKhHiXnpGWlyhw"
              target="_blank"
              title="YouTube"
            >
              <img src="src/assets/icons/youtube.svg" alt="YouTube" />
            </a>
          </li>
          <li>
            <a
              href="https://twitter.com/messemuenchen?lang=de"
              target="_blank"
              title="X"
            >
              <img src="src/assets/icons/x.svg" alt="X (Twitter)" />
            </a>
          </li>
        </ul>
      </div>
      <div className="navigation-footer">
        <ul>
          <li>
            <a href="https://messe-muenchen.de/de/impressum/" title="Impressum">
              Impressum
            </a>
          </li>
          <li>
            <a
              href="https://messe-muenchen.de/de/datenschutz/"
              title="Datenschutz"
            >
              Datenschutz
            </a>
          </li>
        </ul>
      </div>
      <span className="madeWithLove">Made with ♥ in Munich</span>
      <br></br>
      <span className="copyright">© {currentYear} Messe München GmbH</span>
    </footer>
  );
};

export default Footer;
