import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperUserRoute from "./components/SuperUserRoute";
import "./App.css";
import MainLayout from "./layouts/MainLayout";
import EditorPage from "./pages/EditorPage";
import HomePage from "./pages/HomePage";
import AccountPage from "./pages/AccountPage";
import TokensPage from "./pages/TokensPage";
import DocumentsPage from "./pages/DocumentsPage";
import DocumentPage from "./pages/DocumentPage";
import LoginPage from "./pages/LoginPage";
import SuperUserDashboard from "./pages/SuperUserDashboard";
import ComplaintsPage from "./pages/ComplaintsPage";
import ComplaintResponsePage from "./pages/ComplaintResponsePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/complaint-response" element={<ComplaintResponsePage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:id" element={<DocumentPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/tokens" element={<TokensPage />} />
          <Route path="/complaints" element={<ComplaintsPage />} />

          <Route
            path="/superuser"
            element={
              <SuperUserRoute>
                <SuperUserDashboard />
              </SuperUserRoute>
            }
          />


        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
