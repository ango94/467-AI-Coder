// components/Footer.js
import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <a href="/test" target="_blank" rel="noopener noreferrer">
          🔍 Run Security Tests
        </a>
        <span> | </span>
        <a href="/login">
          🔐 Return to Login
        </a>
        <span> | </span>
        <a
          href="https://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
        >
          🌐 Switch to Vulnerable Website
        </a>
      </div>
    </footer>
  );
}

export default Footer;
