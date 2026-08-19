import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import FacultyDetail from "./pages/FacultyDetail";
import Onboarding from "./pages/Onboarding";
import { useAuth } from "./context/AuthContext";

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {isAuthenticated ? (
        <>
          <Route path="/" element={<Dashboard />} />
          <Route path="/faculty/:id" element={<FacultyDetail />} />
        </>
      ) : (
        <Route path="*" element={<Onboarding />} />
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export { Link };