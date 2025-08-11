import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import "./Navbar.css";  // import the styles

export default function Navbar() {
  const { user } = useAuth();



  return (
    <nav className="navbar">
      <div className="navbar__left">
        <div className="navbar__brand">Quick Parks</div>
        <div className="navbar__links">
          <Link to="/home">Home</Link>
          <Link to="/Saved_parks">Saved Parks</Link>
        </div>
      </div>
      <div>
        {user && <span className="navbar__user">{user.username || user.email}</span>}
        <LogoutButton />
      </div>
    </nav>
  );
}
