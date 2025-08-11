import LoginComponent from "../components/LoginComponent";
import "./LoginPage.css"; // ✅ Add this import
import { useNavigate, useLocation } from "react-router-dom";

export default function LoginPage() {
  // This page serves as a wrapper for the LoginComponent
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/home";

  const handleLoginSuccess = (json) => {
    localStorage.setItem("authToken", json.token);
    if (json.user?._id) localStorage.setItem("userId", json.user._id);
    navigate(from, { replace: true });
  };

  return (
    <div className="login-page">
      <h1>Quick Parks: A National Park Finder</h1>
      <LoginComponent onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}
