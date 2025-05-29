import React, { useState, useEffect } from "react";
import { Outlet, Link } from "react-router";
import Logo from "../components/Logo";
import accountCircle from "../assets/account_circle.svg";
import { useUser } from "../context/UserContext";
import { supabase } from "../supabaseClient";
import StatsPanel from "../components/StatsPanel";

function Header() {
  const { user, loading: userLoading, tokens, isPaid } = useUser();
  const [isSuperUser, setIsSuperUser] = useState(false);

  useEffect(() => {
    async function checkSuperUser() {
      if (userLoading || !user) {
        setIsSuperUser(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("superusers")
          .select("user_id")
          .eq("user_id", user.id);
        
        if (error) throw error;
        
        // Check if there are any matching records
        setIsSuperUser(data && data.length > 0);
      } catch (error) {
        console.error("Superuser lookup error:", error.message);
        setIsSuperUser(false);
      }
    }
    checkSuperUser();
  }, [user, userLoading]);

  return (
    <header>
      <nav>
        <ul className="left-links">
          <li>
            <Link to="/">
              <Logo />
            </Link>
          </li>
          <li>
            <Link to="/editor">Editor</Link>
          </li>
          <li>
            <Link to="/documents">Documents</Link>
          </li>

          {isSuperUser && (
            <li>
              <Link to="/superuser" className="text-purple-600 hover:text-purple-700">
                Super User Dashboard
              </Link>
            </li>
          )}

          <li>
            <Link to="/complaints">Make a Complaint</Link>
          </li>
        </ul>
        <ul className="right-links">
          {isPaid && (
            <li className="stats-summary">
              <Link to="/tokens">
                🪙 {tokens} tokens available
              </Link>
            </li>
          )}
          {!isPaid && (
            <li>
              <Link to="/tokens">🪙 {tokens}</Link>
            </li>
          )}
          <li>
            <Link to="/account">
              <img
                src={accountCircle}
                alt="Account"
                width="30px"
                style={{ transform: "translateY(4px)" }}
              />
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

function MainLayout() {
  const { isPaid } = useUser();
  
  return (
    <div className="app-container">
      <Header />
      <main className={isPaid ? 'paid-user' : 'free-user'}>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
