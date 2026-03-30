export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-brand">
          <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--cream)' }}>Theatrica</span>
          <p>Where film lovers meet. Review movies, match on taste, and find people who feel the same things you do.</p>
        </div>
        <div className="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><a href="#">Top Rated</a></li>
            <li><a href="#">New Releases</a></li>
            <li><a href="#">By Genre</a></li>
            <li><a href="#">Collections</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Account</h4>
          <ul>
            <li><a href="#">Sign Up</a></li>
            <li><a href="#">Sign In</a></li>
            <li><a href="#">Watchlist</a></li>
            <li><a href="#">Settings</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Theatrica. All rights reserved.</span>
        <div className="footer-socials">
          <a href="#" aria-label="GitHub">
            <svg viewBox="0 0 19 19" width="18" height="18"><use href="/icons.svg#github-icon" /></svg>
          </a>
          <a href="#" aria-label="X / Twitter">
            <svg viewBox="0 0 19 19" width="18" height="18"><use href="/icons.svg#x-icon" /></svg>
          </a>
          <a href="#" aria-label="Discord">
            <svg viewBox="0 0 20 19" width="18" height="18"><use href="/icons.svg#discord-icon" /></svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
