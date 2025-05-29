import React from "react";
import { supabase, updateUsername } from "../supabaseClient";
import { useUser } from "../context/UserContext";

function AccountPage() {
  const { user, guest, signOutGuest } = useUser();

  async function handleUpdateUsername(e) {
    e.preventDefault();
    const username = e.target.username.value;

    updateUsername(user.id, username).then(() => {
      window.location.reload();
    });
  }

  async function handleLogout() {
    if (guest) {
      // clear guest session
      signOutGuest();
      console.log("Guest signed out");
    } else {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Logout error:", error.message);
      else console.log("User signed out");
    }
    window.location.reload();
  }

  return (
    <div className="account-page">
      <main className="panel">
        <h2 className="title">Account/Settings</h2>
        <form onSubmit={handleUpdateUsername}>
          <label htmlFor="">Change Username: </label>
          <input type="text" name="username"/>
          <button>Update Username</button>
        </form>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </main>
    </div>
  );
}

export default AccountPage;
