import { useState, useEffect } from 'react';
import { supabase, getComplaints, resolveComplaint, manageUserTokens } from '../supabaseClient';
import { useUser } from '../context/UserContext';

function SuperUserDashboard() {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [blacklistRequests, setBlacklistRequests] = useState([]);
  const [blacklistedWords, setBlacklistedWords] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [newWord, setNewWord] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [resolutions, setResolutions] = useState({});
  const [tokenInputs, setTokenInputs] = useState({});
  const [rejectionReasons, setRejectionReasons] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchBlacklistRequests();
    fetchBlacklistedWords();
    fetchComplaints();
    fetchRejectionReasons();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Clear error message after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  async function fetchUsers() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email !== 'arshanand2524@gmail.com' && user?.email !== 'hseam14@gmail.com' && user?.email !== 'aditya.jha2020123@gmail.com') {
        // setError('Unauthorized access');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error) throw error;
      setUsers(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBlacklistRequests() {
    try {
      console.log('Fetching blacklist requests...');
      const { data, error } = await supabase
        .from('blacklist_requests')
        .select('*');

      if (error) {
        console.error('Error fetching blacklist requests:', error);
        throw error;
      }
      
      console.log('Blacklist requests data:', data);
      setBlacklistRequests(data || []);
    } catch (error) {
      console.error('Error in fetchBlacklistRequests:', error);
      setError(error.message);
    }
  }

  async function fetchBlacklistedWords() {
    try {
      const { data, error } = await supabase
        .from('blacklist')
        .select('*');

      if (error) throw error;
      setBlacklistedWords(data || []);
    } catch (error) {
      setError(error.message);
    }
  }

  async function fetchComplaints() {
    try {
      const data = await getComplaints();
      if (data) {
        setComplaints(data);
      }
    } catch (error) {
      setError(error.message);
    }
  }

  async function fetchRejectionReasons() {
    try {
      console.log('Fetching rejection reasons...');
      
      // First check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
      console.log('Current user:', user);

      // Check if user is superuser
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_superuser')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error checking superuser status:', userError);
        throw userError;
      }
      console.log('User superuser status:', userData);

      // Fetch rejection reasons
      const { data, error } = await supabase
        .from('rejection_reasons')
        .select(`
          *,
          users:user_id (email),
          documents:document_id (title)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rejection reasons:', error);
        throw error;
      }

      console.log('Rejection reasons data:', data);
      setRejectionReasons(data || []);
    } catch (error) {
      console.error('Error in fetchRejectionReasons:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      // First delete all document access entries where the user is a collaborator or invited
      const { error: accessError } = await supabase
        .from('document_access')
        .delete()
        .eq('user_id', userId);

      if (accessError) throw accessError;

      // Get all documents owned by the user
      const { data: ownedDocs, error: fetchError } = await supabase
        .from('documents')
        .select('id')
        .eq('owner_id', userId);

      if (fetchError) throw fetchError;

      // For each owned document, delete all document access entries
      if (ownedDocs && ownedDocs.length > 0) {
        for (const doc of ownedDocs) {
          const { error: docAccessError } = await supabase
            .from('document_access')
            .delete()
            .eq('document_id', doc.id);

          if (docAccessError) throw docAccessError;
        }
      }

      // Then delete all documents owned by the user
      const { error: docError } = await supabase
        .from('documents')
        .delete()
        .eq('owner_id', userId);

      if (docError) throw docError;

      // Finally delete the user from the users table using RPC
      const { error: userError } = await supabase.rpc('delete_user', { user_id: userId });

      if (userError) throw userError;

      setSuccessMessage('User successfully deleted');
      fetchUsers();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveBlacklistRequest(word) {
    try {
      setLoading(true);
      
      // Add to blacklist table
      const { error: blacklistError } = await supabase
        .from('blacklist')
        .insert([{ word: word }]);

      if (blacklistError) throw blacklistError;

      // Remove from requests table
      const { error: requestError } = await supabase
        .from('blacklist_requests')
        .delete()
        .eq('word', word);

      if (requestError) throw requestError;

      setSuccessMessage('Word successfully added to blacklist');
      fetchBlacklistRequests();
      fetchBlacklistedWords();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRejectBlacklistRequest(word) {
    if (!window.confirm(`Are you sure you want to reject "${word}" from being blacklisted?`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('blacklist_requests')
        .delete()
        .eq('word', word);

      if (error) throw error;

      setSuccessMessage('Word request rejected');
      fetchBlacklistRequests();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveBlacklistedWord(word) {
    if (!window.confirm(`Are you sure you want to remove "${word}" from the blacklist?`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('blacklist')
        .delete()
        .eq('word', word);

      if (error) throw error;

      setSuccessMessage('Word successfully removed from blacklist');
      fetchBlacklistedWords();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveComplaint(complaintId) {
    try {
      setLoading(true);
      const result = await resolveComplaint(complaintId);
      if (result) {
        setSuccessMessage('Complaint resolved successfully');
        fetchComplaints();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleManageTokens(userId, amount) {
    try {
      setLoading(true);
      await manageUserTokens(userId, amount);
      setSuccessMessage(`Successfully ${amount > 0 ? 'added' : 'deducted'} ${Math.abs(amount)} tokens`);
      setTokenInputs(prev => ({ ...prev, [userId]: '' })); // Clear input after successful operation
      fetchUsers(); // Refresh the users list to show updated token balance
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleRejectionResponse = async (rejectionId, status) => {
    try {
      // Update rejection reason status
      const { error: updateError } = await supabase
        .from('rejection_reasons')
        .update({ status })
        .eq('id', rejectionId);

      if (updateError) throw updateError;

      // Get the rejection reason to find the user
      const rejection = rejectionReasons.find(r => r.id === rejectionId);
      if (!rejection) throw new Error('Rejection reason not found');

      // Update user tokens
      const tokenChange = status === 'approved' ? 5 : -1;
      const { error: tokenError } = await supabase.rpc('increment_statistic', {
        p_user_id: rejection.user_id,
        p_column: 'used_tokens',
        p_value: tokenChange
      });

      if (tokenError) throw tokenError;

      // Refresh the list
      fetchRejectionReasons();
    } catch (error) {
      console.error('Error handling rejection response:', error);
      alert('Failed to process rejection response. Please try again.');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = blacklistRequests.filter(request => 
    request.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWords = blacklistedWords.filter(word => 
    word.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredComplaints = complaints.filter(complaint => 
    complaint.complainant_note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.complainant?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.respondent?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !users.length) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto panel">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 title">Super User Dashboard</h1>
        <div className="space-y-2">
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 panel">
        <ul className="flex -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block p-4 text-lg font-medium ${
                activeTab === 'users'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 text-lg font-medium ${
                activeTab === 'blacklist'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('blacklist')}
            >
              Blacklist Management
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 text-lg font-medium ${
                activeTab === 'complaints'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('complaints')}
            >
              Complaints
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 text-lg font-medium ${
                activeTab === 'rejections'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('rejections')}
            >
              Rejection Reasons
            </button>
          </li>
        </ul>
      </div>

      {/* Search Bar */}
      <div className="mb-6 panel">
        <input
          type="text"
          placeholder={`Search ${activeTab === 'users' ? 'users' : activeTab === 'blacklist' ? 'blacklisted words' : activeTab === 'complaints' ? 'complaints' : 'rejection reasons'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow overflow-hidden panel">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.tokens} tokens
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2 items-center">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={tokenInputs[user.id] || ''}
                            onChange={(e) => setTokenInputs(prev => ({ ...prev, [user.id]: e.target.value }))}
                            placeholder="Amount"
                            className="w-20 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                          <button
                            onClick={() => handleManageTokens(user.id, parseInt(tokenInputs[user.id] || '0'))}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out transform hover:scale-105"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => handleManageTokens(user.id, -parseInt(tokenInputs[user.id] || '0'))}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out transform hover:scale-105"
                          >
                            Deduct
                          </button>
                        </div>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out transform hover:scale-105"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blacklist Tab */}
      {activeTab === 'blacklist' && (
        <div className="space-y-8 panel">
          {/* Blacklist Requests Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Blacklist Requests</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request.word} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.word}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                          <button
                            onClick={() => handleApproveBlacklistRequest(request.word)}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out transform hover:scale-105"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectBlacklistRequest(request.word)}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out transform hover:scale-105"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredRequests.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No pending blacklist requests</p>
                )}
              </div>
            </div>
          </div>

          {/* Current Blacklist Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Blacklist</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredWords.map((item) => (
                      <tr key={item.word} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.word}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleRemoveBlacklistedWord(item.word)}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out transform hover:scale-105"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredWords.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No blacklisted words found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complainant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Respondent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complaint</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {complaint.complainant?.username || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {complaint.respondent?.username || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {complaint.complainant_note}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {complaint.respondent_note || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        complaint.status === 'resolved' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {complaint.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {complaint.status !== 'resolved' && complaint.respondent_note && (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleResolveComplaint(complaint.id)}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out transform hover:scale-105"
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredComplaints.length === 0 && (
              <p className="text-gray-500 text-center py-4">No complaints found</p>
            )}
          </div>
        </div>
      )}

      {/* Rejection Reasons Tab */}
      {activeTab === 'rejections' && (
        <div className="bg-white rounded-lg shadow overflow-hidden panel">
          {console.log('Rendering rejection reasons tab, data:', rejectionReasons)}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rejectionReasons.map((rejection) => (
                  <tr key={rejection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rejection.users?.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rejection.documents?.title || 'No document'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {rejection.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rejection.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : rejection.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {rejection.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rejection.status === 'pending' && (
                        <div className="space-x-2">
                          <button
                            onClick={() => handleRejectionResponse(rejection.id, 'approved')}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out transform hover:scale-105"
                          >
                            Approve (+5 tokens)
                          </button>
                          <button
                            onClick={() => handleRejectionResponse(rejection.id, 'rejected')}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out transform hover:scale-105"
                          >
                            Reject (-1 token)
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rejectionReasons.length === 0 && (
              <p className="text-gray-500 text-center py-4">No rejection reasons found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperUserDashboard; 