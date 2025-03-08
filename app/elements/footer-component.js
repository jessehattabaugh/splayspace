export default function FooterComponent({ html }) {
  return html`
    <footer class="footer">
      <p>SplaySpace - An infinite world to explore with friends</p>
      <div class="footer-links">
        <a href="#" id="about-link">About</a>
        <a href="#" id="help-link">Help</a>
        <a href="#" id="terms-link">Terms</a>
        <a href="#" id="privacy-link">Privacy</a>
      </div>
    </footer>
    
    <style>
      .footer {
        padding: 10px 20px;
        background: rgba(0, 0, 0, 0.8);
        color: #ccc;
        font-size: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .footer p {
        margin: 0;
      }
      
      .footer-links {
        display: flex;
        gap: 15px;
      }
      
      .footer-links a {
        color: #ccc;
        text-decoration: none;
      }
      
      .footer-links a:hover {
        color: white;
        text-decoration: underline;
      }
    </style>
  `;
}
