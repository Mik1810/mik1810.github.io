import './Footer.css';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {year} Michael. Tutti i diritti riservati.</p>
        <div className="footer-links">
          <a href="https://github.com/Mik1810" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="https://linkedin.com/in/" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
