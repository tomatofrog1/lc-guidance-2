import { useState } from "react";
import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import SummaryReports from "./pages/SummaryReports";
import CaseCatalog from "./pages/CaseCatalog";
import CaseDetails from "./pages/CaseDetails";
import PendingCases from "./pages/PendingCases";
import Backup from "./pages/Backup";
import SignIn from "./pages/SignIn";
import "./App.css";

function AppRoutes() {
  const location = useLocation();

  const getTitle = () => {
    if (location.pathname.startsWith("/case/")) return "Case Details";
    if (location.pathname === "/catalog") return "Guidance Office";
    if (location.pathname === "/pending") return "Pending Cases";
    if (location.pathname === "/backup") return "Backup";
    return "Summary & Reports";
  };

  return (
    <Layout title={getTitle()} pageKey={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<SummaryReports />} />
        <Route path="/catalog" element={<CaseCatalog />} />
        <Route path="/pending" element={<PendingCases />} />
        <Route path="/case/:id" element={<CaseDetails />} />
        <Route path="/backup" element={<Backup />} />
      </Routes>
    </Layout>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <SignIn onSignIn={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
