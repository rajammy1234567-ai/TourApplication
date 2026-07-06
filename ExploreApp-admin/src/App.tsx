import { useState } from "react";
import { Layout, type Page } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { VendorApplications } from "./pages/VendorApplications";
import { Users } from "./pages/Users";
import { Vendors } from "./pages/Vendors";
import { Listings } from "./pages/Listings";
import { Bookings } from "./pages/Bookings";
import "./App.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("adminToken"));
  const [page, setPage] = useState<Page>("dashboard");

  const handleLogin = (newToken: string, admin: object) => {
    localStorage.setItem("adminToken", newToken);
    localStorage.setItem("adminData", JSON.stringify(admin));
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    setToken(null);
  };

  if (!token) {
    return <Login onSuccess={handleLogin} />;
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard onNavigate={setPage} />;
      case "applications": return <VendorApplications />;
      case "vendors": return <Vendors />;
      case "users": return <Users />;
      case "listings": return <Listings />;
      case "bookings": return <Bookings />;
      default: return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <Layout page={page} onNavigate={setPage} onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  );
}

export default App;