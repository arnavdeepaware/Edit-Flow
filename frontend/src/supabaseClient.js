import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
  });

  if (error) console.error("Error signing in:", error);
  return data;
}

export async function getAllUsers() {
  const { data, error } = await supabase.from("users").select();

  if (error) {
    console.error("Error getting users:", error);
    return null;
  }

  return data;
}

export async function getUsernameById(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("username")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error getting username:", error);
    return null;
  }

  return data.username;
}

export async function getIdByUsername(username) {
  console.log("searching for username", username);

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (error) {
    console.error("Error getting user ID by username:", error);
    return null;
  }

  return data.id;
}

export async function updateUsername(userId, username) {
  const { data, error } = await supabase
    .from("users")
    .update({ username: username })
    .eq("id", userId);

  if (error) {
    console.error("Error updating username:", error);
    return null;
  }

  return data;
}

export async function getDocumentsByUserId(id) {
  const { data, error } = await supabase
    .from("documents")
    .select()
    .eq("owner_id", id);

  if (error) {
    console.error("Error fetching documents:", error);
    return null;
  }

  return data;
}

export async function getSharedDocumentIds(userId) {
  const { data, error } = await supabase
    .from("document_access")
    .select("document_id")
    .eq("user_id", userId)
    .eq("access_status", "collaborator");

  if (error) {
    console.error("Error fetching shared documents:", error);
    return null;
  }

  return data.map((entry) => entry.document_id);
}

export async function getDocumentById(id) {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching document:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching document:", error);
    return null;
  }
}

export async function incrementTokens(amount) {
  const { error } = await supabase.rpc("increment_tokens", { k: amount });

  if (error) {
    console.error("Failed to increment tokens:", error.message);
  }
}

export async function deductTokensOnUser(userId, amount) {
  // First check current token balance
  const { data: userData, error: fetchError } = await supabase
    .from("users")
    .select("tokens")
    .eq("id", userId)
    .single();

  if (fetchError) {
    console.error("Failed to fetch user tokens:", fetchError.message);
    return false;
  }

  if (userData.tokens < amount) {
    console.error("Insufficient tokens");
    return false;
  }

  const { error } = await supabase.rpc("deduct_tokens_on_user", {
    user_id: userId,
    amount: amount,
  });

  if (error) {
    console.error("Failed to deduct tokens:", error.message);
    return false;
  }

  return true;
}

export async function createDocument(userId, text, title) {
  const { data, error } = await supabase
    .from("documents")
    .insert([{ owner_id: userId, content: text, title: title }])
    .select();

  if (error) {
    console.error("Error creating document:", error);
    return null;
  }

  const { data2, error2 } = await supabase
    .from("document_access")
    .insert([
      { user_id: userId, document_id: data[0].id, access_status: "owner" },
    ])
    .select();

  if (error2) {
    console.error("Error updating document access:", error2);
    return null;
  }
}

export async function updateDocument(document) {
  const { id, ...fields } = document;

  const { data, error } = await supabase
    .from("documents")
    .update(fields)
    .eq("id", document.id);

  if (error) {
    console.error("Error updating document:", error);
    return null;
  }

  return data?.[0];
}

export async function deleteDocument(documentId) {
  const { data, error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .select();

  if (error) {
    console.error("Error deleting document:", error);
    return null;
  }

  return data;
}

export async function inviteUserToDocument(userId, documentId) {
  const { data, error } = await supabase
    .from("document_access")
    .insert([
      { user_id: userId, document_id: documentId, access_status: "invited" },
    ])
    .select();

  if (error) {
    console.error("Error inviting user:", error);
    return null;
  }

  return data[0];
}

export async function acceptInvite(userId, documentId) {
  const { data, error } = await supabase
    .from("document_access")
    .update({ access_status: "collaborator" })
    .eq("user_id", userId)
    .eq("document_id", documentId)
    .select();

  if (error) {
    console.error("Error accepting invite:", error);
    return null;
  }

  return data;
}

export async function rejectInvite(userId, documentId) {
  const { data, error } = await supabase
    .from("document_access")
    .delete()
    .eq("user_id", userId)
    .eq("document_id", documentId)
    .select();

  if (error) {
    console.error("Error rejecting invite:", error);
    return null;
  }

  return data;
}

export async function getDocumentInvited(documentId) {
  const { data, error } = await supabase
    .from("document_access")
    .select()
    .eq("document_id", documentId)
    .eq("access_status", "invited");

  if (error) {
    console.error("Error getting document collaborators:", error);
    return null;
  }

  return data.map((entry) => entry.user_id);
}

export async function getInvitesByUserId(userId) {
  const { data, error } = await supabase
    .from("document_access")
    .select()
    .eq("user_id", userId)
    .eq("access_status", "invited");

  if (error) {
    console.error("Error getting user invites:", error);
    return null;
  }

  return data.map((entry) => entry.document_id);
}

export async function getDocumentCollaborators(documentId) {
  const { data, error } = await supabase
    .from("document_access")
    .select()
    .eq("document_id", documentId)
    .eq("access_status", "collaborator");

  if (error) {
    console.error("Error getting document collaborators:", error);
    return null;
  }

  return data.map((entry) => entry.user_id);
}

export async function submitBlacklistRequest(word) {
  const { data, error } = await supabase.from("blacklist_requests").insert([
    {
      word: word,
    },
  ]);

  if (error) {
    console.error("Error submitting request:", error.message);
    return null;
  }

  return data;
}

export async function makeComplaint(complainantId, respondentId, text) {
  console.log({
    complainant_id: complainantId,
    respondent_id: respondentId,
    complainant_note: text,
  });

  const { data, error } = await supabase
    .from("complaints")
    .insert([
      {
        complainant_id: complainantId,
        respondent_id: respondentId,
        complainant_note: text,
      },
    ])
    .select();

  if (error) {
    console.error("Error making complaint:", error);
    return null;
  }

  return data;
}

export async function getBlacklistWords() {
  const { data, error } = await supabase.from("blacklist").select("word");

  if (error) {
    console.error("Error getting blacklist words:", error);
    return null;
  }

  return data;
}

export async function getComplaints() {
  const { data, error } = await supabase
    .from("complaints")
    .select(
      `
      *,
      complainant:complainant_id(username),
      respondent:respondent_id(username)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching complaints:", error);
    return null;
  }

  return data;
}

export async function getComplaintsByRespondentId(userId) {
  const { data, error } = await supabase
    .from("complaints")
    .select(`
      *,
      complainant:users!complainant_id ( username )
    `)
    .eq("respondent_id", userId)
    .eq("status", "unresolved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching complaints for user:", error);
    return null;
  }

  return data;
}

export async function respondToComplaint(complaintId, text) {
  const { error } = await supabase
    .from("complaints")
    .update({ respondent_note: text })
    .eq("id", complaintId);

  if (error) {
    console.error("Error responding to complaint:", error);
    return false;
  }

  return true;
}

export async function resolveComplaint(complaintId) {
  const { data, error } = await supabase
    .from("complaints")
    .update({
      status: "resolved"
    })
    .eq("id", complaintId)
    .select();

  if (error) {
    console.error("Error resolving complaint:", error);
    return null;
  }

  return data;
}

export async function manageUserTokens(userId, amount) {
  const { error } = await supabase.rpc("manage_user_tokens", {
    user_id: userId,
    amount: amount,
  });

  if (error) {
    console.error("Failed to manage tokens:", error.message);
    throw error;
  }
}
