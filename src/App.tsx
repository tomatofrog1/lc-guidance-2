import { HashRouter as Router, Routes, Route } from "react-router-dom";
import SummaryReports from "./pages/SummaryReports";
import CaseCatalog from "./pages/CaseCatalog";
import FileNewCase from "./pages/FileNewCase";
import CaseDetails from "./pages/CaseDetails";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SummaryReports />} />
        <Route path="/catalog" element={<CaseCatalog />} />
        <Route path="/new" element={<FileNewCase />} />
        <Route path="/case/:id" element={<CaseDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
