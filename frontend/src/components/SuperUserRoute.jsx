import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';

function SuperUserRoute({ children }) {
  const { user, loading: userLoading } = useUser();
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSuperUser() {
      if (userLoading) return;
      if (!user) {
        setIsSuperUser(false);
        setChecking(false);
        return;
      }
      const { data, error } = await supabase
        .from('superusers')
        .select('user_id')
        .eq('user_id', user.id)
        .single();
      if (error) console.error('Checking superuser table failed:', error.message);
      setIsSuperUser(!!data);
      setChecking(false);
    }

    checkSuperUser();
  }, [user, userLoading]);

  if (userLoading || checking) {
    return <div className="p-4">Loading...</div>;
  }

  if (!isSuperUser) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default SuperUserRoute;