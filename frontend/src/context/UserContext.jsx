import { createContext, useContext, useEffect, useState } from "react";
import { supabase, incrementTokens } from "../supabaseClient";
import { getUsernameById } from "../supabaseClient";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [statistics, setStatistics] = useState({
    editedTexts: 0,
    usedTokens: 0,
    corrections: 0
  });
  const [guest, setGuest] = useState(
    localStorage.getItem("isGuest") === "true"
  );

  function handleTokenChange(k) {
    if (tokens + k < 0) {
      alert("Insufficient tokens! Please purchase more tokens to continue.");
      window.location.href = "/tokens";
      return;
    }
    setTokens((prev) => prev + k);
    incrementTokens(k);
  }

  const updateStatistics = async (field, value) => {
    try {
      const { error } = await supabase.rpc('increment_statistic', {
        p_user_id: user.id,
        p_column: field,
        p_value: value
      });

      if (error) throw error;

      // Update local state
      setStatistics(prev => ({
        ...prev,
        [field]: (prev[field] || 0) + value
      }));
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  function signInAsGuest() {
    // check if guest is blocked
    const blockedUntil = parseInt(localStorage.getItem("guestBlockedUntil") || '0');
    if (blockedUntil && Date.now() < blockedUntil) {
      alert("You are locked out for 3 minutes.");
      return;
    }
    // clear block on new guest login
    localStorage.removeItem("guestBlockedUntil");
    localStorage.setItem("isGuest", "true");
    setGuest(true);
    setUser(null);
    setLoading(false);
    setTokens(0);
  }

  function signOutGuest() {
    setGuest(false);
    localStorage.removeItem("isGuest");
  }

  const fetchTokenBalance = async (userId) => {
    try {
      // First fetch user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("tokens, is_paid")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      // Then fetch or create statistics
      const { data: statsData, error: statsError } = await supabase
        .from("user_statistics")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (statsError) {
        if (statsError.code === 'PGRST116') {
          // Statistics don't exist, create them
          const { data: newStats, error: insertError } = await supabase
            .from("user_statistics")
            .insert([{
              user_id: userId,
              edited_texts: 0,
              used_tokens: 0,
              available_tokens: userData.tokens || 0,
              corrections: 0
            }])
            .select()
            .single();

          if (insertError) throw insertError;
          
          setStatistics({
            editedTexts: 0,
            usedTokens: 0,
            availableTokens: userData.tokens || 0,
            corrections: 0
          });
        } else {
          throw statsError;
        }
      } else {
        setStatistics({
          editedTexts: statsData.edited_texts,
          usedTokens: statsData.used_tokens,
          availableTokens: statsData.available_tokens,
          corrections: statsData.corrections
        });
      }

      setTokens(userData.tokens || 0);
      setIsPaid(userData.is_paid || false);

    } catch (error) {
      console.error("Error fetching user data:", error.message);
      setTokens(0);
      setIsPaid(false);
      setStatistics({
        editedTexts: 0,
        usedTokens: 0,
        availableTokens: 0,
        corrections: 0
      });
    }
  };

  useEffect(() => {
    // Get current session/user on mount
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);

      // if logged in via OAuth, clear guest state
      if (session?.user) signOutGuest();

      if (session?.user) {
        fetchTokenBalance(session.user.id);
        getUsernameById(session.user.id).then((uname) => setUsername(uname));
      }
    };

    getUser();

    // Subscribe to auth changes (login, logout, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          // clear guest on real login
          signOutGuest();
          fetchTokenBalance(session.user.id);
          getUsernameById(session.user.id).then((uname) => setUsername(uname));
        } else {
          setTokens(0);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!user?.id) return;

        const { data: userData, error } = await supabase
          .from('users')
          .select('tokens, edited_texts, corrections, used_tokens, is_paid')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setTokens(userData.tokens || 0);
        setIsPaid(userData.is_paid || false);
        setStatistics({
          editedTexts: userData.edited_texts || 0,
          usedTokens: userData.used_tokens || 0,
          corrections: userData.corrections || 0
        });

      } catch (error) {
        console.error('Error fetching user data:', error);
        setTokens(0);
        setIsPaid(false);
        setStatistics({
          editedTexts: 0,
          usedTokens: 0,
          corrections: 0
        });
      }
    };

    fetchUserData();
  }, [user]);

  const value = {
    user,
    username,
    loading,
    tokens,
    guest,
    isPaid,
    statistics,
    handleTokenChange,
    signInAsGuest,
    signOutGuest,
    updateStatistics
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
