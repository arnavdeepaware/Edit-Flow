import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import {
  getUsernameById,
  submitBlacklistRequest,
  getInvitesByUserId,
  getDocumentById,
  acceptInvite,
  rejectInvite,
  deductTokensOnUser,
  getComplaintsByRespondentId,
  respondToComplaint,
} from "../supabaseClient";

function HomePage() {
  const { user, loading, guest } = useUser();
  const [username, setUsername] = useState(null);
  const [invitedDocs, setInvitedDocs] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [respondentNote, setRespondentNote] = useState("");

  useEffect(() => {
    if (loading) return;
    if (user) {
      // real user: fetch username and invites
      getUsernameById(user.id).then((uname) => setUsername(uname));
      async function fetchInvites() {
        const doc_ids = await getInvitesByUserId(user.id);
        const docs = await Promise.all(
          doc_ids.map(async (id) => {
            const doc = await getDocumentById(id);
            const owner = await getUsernameById(doc.owner_id);
            return { ...doc, owner };
          })
        );
        setInvitedDocs(docs);
      }
      fetchInvites();

      async function fetchComplaints() {
        const data = await getComplaintsByRespondentId(user.id);
        if (data) setComplaints(data);
      }

      fetchComplaints();
    } else if (guest) {
      // guest user: set placeholder
      setUsername("Guest");
      setInvitedDocs([]);
      setComplaints([]);
    }
  }, [user, guest, loading]);

  function handleAcceptInvite(docId) {
    acceptInvite(user.id, docId);
    setInvitedDocs((docs) => docs.filter((doc) => doc.id !== docId));
  }

  async function handleRespondToComplaint() {
    if (!selectedComplaint || !respondentNote.trim()) return;

    const success = await respondToComplaint(
      selectedComplaint.id,
      respondentNote.trim()
    );

    if (success) {
      // Remove the complaint from the list
      setComplaints((prev) =>
        prev.filter((c) => c.id !== selectedComplaint.id)
      );

      // Clear input and selection
      setRespondentNote("");
      setSelectedComplaint(null);
    } else {
      alert("Failed to respond to the complaint. Please try again.");
    }
  }

  async function handleRejectInvite(docId) {
    await rejectInvite(user.id, docId); // wait for invite rejection
    setInvitedDocs((docs) => docs.filter((doc) => doc.id !== docId));

    const rejectedDoc = invitedDocs.find((doc) => doc.id === docId);
    console.log("rejected doc is", rejectedDoc);
    if (rejectedDoc) {
      console.log("waiting for deduction of tokens");
      await deductTokensOnUser(rejectedDoc.owner_id, 3); // wait for token deduction
    } else {
      console.error("Rejected document not found for docId:", docId);
    }
    console.log("deduction complete!");
  }

  function handleBlacklistRequest(e) {
    e.preventDefault();
    console.log("submitting to blacklist");
    submitBlacklistRequest(e.target.word.value);
    e.target.word.value = "";
  }

  if (loading) return <div>Loading...</div>;

  console.log(complaints);
  return (
    <div className="home-page">
      <main>
        <div>Welcome, {username}</div>
        <div className="panel blacklist-form">
          <h2 className="title">Suggest a Blacklist Word</h2>
          <form onSubmit={handleBlacklistRequest}>
            <input type="text" name="word" />
            <button type="submit">Submit</button>
          </form>
        </div>
        {user && (
          <div className="panel">
            <h2 className="title">Invites</h2>
            <div>
              {invitedDocs.map((doc) => (
                <div key={doc.id} className="invite-entry">
                  <b>{doc.title}</b>
                  <span>-</span>
                  <span className="username">{doc.owner}</span>
                  <button onClick={() => handleAcceptInvite(doc.id)}>
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectInvite(doc.id)}
                    className="reject-btn"
                  >
                    Reject
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default HomePage;
