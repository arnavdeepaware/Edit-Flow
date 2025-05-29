import React, { useEffect, useState } from "react";
import { getAllUsers, makeComplaint } from "../supabaseClient";
import { useUser } from "../context/UserContext";

function ComplaintsPage() {
  const { user } = useUser();
  const [users, setUsers] = useState(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [complaintText, setComplaintText] = useState("");

  useEffect(() => {
    getAllUsers().then((data) => setUsers(data));
  }, []);

  async function handleComplain() {
    if (!selectedUser || !complaintText.trim()) {
      alert("Please select a user and enter complaint text.");
      return;
    }
    await makeComplaint(user.id, selectedUser, complaintText);
    setComplaintText("");
    setSelectedUser("");
  }

  if (!user) return <div>Please sign in to make complaints.</div>;

  return (
    users && (
      <div className="complaints-page">
        <main className="panel">
          <h2 className="title">Make a Complaint</h2>
          <div className="select-user">
            <label>Select a User: </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Select User</option>
              {users.map(
                (otherUser) =>
                  /* otherUser.id !== user.id */ true  && (
                    <option key={otherUser.id} value={otherUser.id}>
                      {otherUser.username}
                    </option>
                  )
              )}
            </select>
          </div>
          <textarea
            className="text-block-input"
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
          ></textarea>
          <div className="button-container">
            <button onClick={handleComplain}>Submit Complaint</button>
          </div>
        </main>
      </div>
    )
  );
}

export default ComplaintsPage;
