import { useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import SummaryReports from "./pages/SummaryReports";
import CaseCatalog from "./pages/CaseCatalog";
import CaseDetails from "./pages/CaseDetails";
import SignIn from "./pages/SignIn";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <SignIn onSignIn={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SummaryReports />} />
          <Route path="/catalog" element={<CaseCatalog />} />
          <Route path="/case/:id" element={<CaseDetails />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
