// src/pages/ComplaintsPage.jsx
import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import {
  getComplaintsByRespondentId,
  respondToComplaint,
} from "../supabaseClient";
import { useNavigate } from "react-router-dom";

function ComplaintResponsePage() {
  const { user, loading } = useUser();
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [respondentNote, setRespondentNote] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      async function fetchComplaints() {
        const data = await getComplaintsByRespondentId(user.id);
        const unanswered = data?.filter(
          (c) => !c.respondent_note || c.respondent_note.trim() === ""
        );
        if (!unanswered || unanswered.length === 0) {
          navigate("/", { replace: true });
        } else {
          setComplaints(unanswered);
        }
      }
      fetchComplaints();
    }
  }, [user, loading, navigate]);

  async function handleRespondToComplaint() {
    if (!selectedComplaint || !respondentNote.trim()) return;

    const success = await respondToComplaint(
      selectedComplaint.id,
      respondentNote.trim()
    );

    if (success) {
      const remaining = complaints.filter(
        (c) => c.id !== selectedComplaint.id
      );
      if (remaining.length === 0) {
        navigate("/", { replace: true });
      } else {
        setComplaints(remaining);
        setSelectedComplaint(null);
        setRespondentNote("");
      }
    } else {
      alert("Failed to respond to the complaint. Please try again.");
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view your complaints.</div>;

  return (
    <div className="complaints-page">
      <main className="panel">
        <h2 className="title">Respond to Complaints</h2>
        <select
          onChange={(e) => {
            const selectedId = e.target.value;
            if (selectedId === "") {
              setSelectedComplaint(null);
            } else {
              const selected = complaints.find(
                (c) => String(c.id) === selectedId
              );
              setSelectedComplaint(selected || null);
            }
          }}
        >
          <option value="">Select a complaint</option>
          {complaints.map((complaint) => (
            <option key={complaint.id} value={complaint.id}>
              {complaint.id} - {complaint.complainant.username}
            </option>
          ))}
        </select>
        {selectedComplaint && (
          <>
            <div className="text-block-input">
              {selectedComplaint.complainant_note}
            </div>
            <textarea
              className="text-block-input"
              value={respondentNote}
              onChange={(e) => setRespondentNote(e.target.value)}
              placeholder="Write your response..."
            />
            <button onClick={handleRespondToComplaint}>Respond</button>
          </>
        )}
      </main>
    </div>
  );
}

export default ComplaintResponsePage;
