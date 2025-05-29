// components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useEffect, useState } from "react";
import { getComplaintsByRespondentId } from "../supabaseClient";

export default function ProtectedRoute({ children }) {
  const { user, guest, loading } = useUser();
  const [redirectToComplaints, setRedirectToComplaints] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (loading || !user) return;

    async function checkComplaints() {
      const complaints = await getComplaintsByRespondentId(user.id);
      const hasUnanswered = complaints?.some(
        (c) => !c.respondent_note || c.respondent_note.trim() === ""
      );
      if (hasUnanswered) {
        setRedirectToComplaints(true);
      }
    }

    checkComplaints();
  }, [user, loading]);

  if (loading) return null;

  if (!user && !guest) return <Navigate to="/login" replace />;

  if (redirectToComplaints && location.pathname !== "/complaint-response") {
    return <Navigate to="/complaint-response" replace />;
  }

  return children;
}
