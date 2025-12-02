import { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, AlertCircle, Loader, Edit2, Trash2, X, Check } from 'lucide-react';
import { requestsApi, categoriesApi } from '../api';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  in_progress: { label: 'In Progress', icon: Loader, color: 'text-blue-600 bg-blue-50' },
  fulfilled: { label: 'Fulfilled', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  closed: { label: 'Closed', icon: AlertCircle, color: 'text-gray-600 bg-gray-50' }
};

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ topic: '', description: '' });
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    category_id: '',
    preferred_format: 'any',
    requested_by: '' // Will be set from user
  });

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, categoriesRes] = await Promise.all([
        requestsApi.getAll(filterStatus || null),
        categoriesApi.getAll()
      ]);
      setRequests(requestsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.topic.length < 3) {
      alert('Topic must be at least 3 characters');
      return;
    }
    if (formData.description.length < 10) {
      alert('Description must be at least 10 characters');
      return;
    }

    try {
      await requestsApi.create({
        ...formData,
        requested_by: user?.id || 'demo-user-id'
      });
      setShowForm(false);
      setFormData({
        topic: '',
        description: '',
        category_id: '',
        preferred_format: 'any',
        requested_by: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Failed to create request. Please try again.');
    }
  };

  const handleEdit = (request) => {
    setEditingId(request.id);
    setEditForm({ topic: request.topic, description: request.description || '' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ topic: '', description: '' });
  };

  const handleSaveEdit = async (requestId) => {
    try {
      await requestsApi.update(requestId, editForm);
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, ...editForm } : r
      ));
      setEditingId(null);
      setEditForm({ topic: '', description: '' });
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request');
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    
    try {
      await requestsApi.delete(requestId);
      setRequests(requests.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resource Requests</h1>
          <p className="mt-1 text-sm text-gray-500">Request resources you can't find</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Request
        </button>
      </div>

      {/* Request Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit a Resource Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Discrete Mathematics"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you're looking for in detail..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Format</label>
                <select
                  value={formData.preferred_format}
                  onChange={(e) => setFormData({ ...formData, preferred_format: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="any">Any Format</option>
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                  <option value="notes">Notes</option>
                  <option value="past_paper">Past Papers</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-3 py-1 text-sm rounded-lg ${!filterStatus ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All
        </button>
        {Object.entries(statusConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`px-3 py-1 text-sm rounded-lg ${filterStatus === key ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => {
            const status = statusConfig[request.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            const isOwner = user && request.requested_by === user.id;
            const isEditing = editingId === request.id;
            
            return (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.topic}
                          onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                          className="text-lg font-semibold border border-gray-300 rounded px-2 py-1 flex-1"
                        />
                      ) : (
                        <h3 className="text-lg font-semibold text-gray-900">{request.topic}</h3>
                      )}
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </div>
                    {isEditing ? (
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{request.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      {request.category_name && (
                        <span>Category: {request.category_name}</span>
                      )}
                      <span>Format: {request.preferred_format?.toUpperCase()}</span>
                      <span>By: {request.requester_name || 'Anonymous'}</span>
                    </div>
                  </div>
                  {isOwner && !isEditing && (
                    <div className="flex gap-1 ml-4">
                      <button
                        onClick={() => handleEdit(request)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(request.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {isEditing && (
                    <div className="flex gap-1 ml-4">
                      <button
                        onClick={() => handleSaveEdit(request.id)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
          <p className="text-sm text-gray-500">Be the first to request a resource!</p>
        </div>
      )}
    </div>
  );
}
