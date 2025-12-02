import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/NavBarCSS.css'
const NavBar = () => {
    const getInitial = () => {
        const fullName = localStorage.getItem("fullName");
        return fullName ? fullName.charAt(0).toUpperCase() : "";
        };
  return (
    <div>
      <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="logo">
              <div className="logo-icon">
                <div className="logo-icon-inner"></div>
              </div>
              <span className="logo-text">SyncPad</span>
            </Link>

            <div className="nav-links">
              <button className="nav-link"><Link to='/' className='link2'>Home</Link></button>
              <button className="nav-link"><Link to='/about' className='link2'>About</Link></button>
              <button className="nav-link"><Link to='/contact' className='link2'>Contact us</Link></button>

              {/* 🔥 Conditional Rendering */}
              {localStorage.getItem("isLoggedIn") === "true" ? (
                <button
                  className="btn-sign-in"
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = "/"; // refresh UI + redirect
                  }}
                >
                  Logout
                </button>
              ) : (
                <button className="btn-sign-in">
                  <Link to="/signup" className="link1">Sign up</Link>
                </button>
              )}

              {localStorage.getItem("isLoggedIn") === "true" && (
                <Link to="/room" className="user-circle">
                    {getInitial()}
                </Link>
                )}
            </div>
          </div>
      </nav>
    </div>
  )
}

export default NavBar
