import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, AlertCircle } from 'lucide-react';
import { postsApi, categoriesApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    post_type: 'resource',
    category_id: '',
    attachment_urls: []
  });
  const [newAttachment, setNewAttachment] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Validate URL format
  const isValidUrl = (url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const handleAddAttachment = () => {
    const url = newAttachment.trim();
    if (url) {
      if (!isValidUrl(url)) {
        setError('Please enter a valid URL starting with http:// or https://');
        return;
      }
      setFormData({
        ...formData,
        attachment_urls: [...formData.attachment_urls, url]
      });
      setNewAttachment('');
      setError('');
    }
  };

  const handleRemoveAttachment = (index) => {
    setFormData({
      ...formData,
      attachment_urls: formData.attachment_urls.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate title
    if (!formData.title.trim() || formData.title.trim().length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }
    
    // Validate description
    if (!formData.description.trim() || formData.description.trim().length < 20) {
      setError('Description must be at least 20 characters');
      return;
    }

    if (!user?.id) {
      setError('You must be logged in to create a post');
      return;
    }

    setLoading(true);
    try {
      const postData = {
        ...formData,
        author_id: user.id,
        category_id: formData.category_id || null
      };
      await postsApi.create(postData);
      navigate('/posts');
    } catch (err) {
      console.error('Error creating post:', err);
      const errorMsg = err.response?.data?.detail;
      if (typeof errorMsg === 'string') {
        setError(errorMsg);
      } else if (Array.isArray(errorMsg)) {
        setError(errorMsg.map(e => e.msg).join(', '));
      } else {
        setError('Failed to create post. Please check your input and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const postTypes = [
    { value: 'resource', label: 'Resource Share', description: 'Share study materials, notes, or helpful links' },
    { value: 'help_request', label: 'Help Request', description: 'Ask for help from the community' },
    { value: 'tutor_flyer', label: 'Tutor Flyer', description: 'Offer your tutoring services' },
    { value: 'announcement', label: 'Announcement', description: 'General announcements for students' }
  ];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create a Post</h1>
        <p className="mt-1 text-sm text-gray-500">Share resources, request help, or promote your tutoring services</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Post Type Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Post Type *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {postTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, post_type: type.value })}
                className={`p-4 text-left rounded-lg border-2 transition-colors ${
                  formData.post_type === type.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900">{type.label}</p>
                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Post Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter a descriptive title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide details about your post..."
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a category (optional)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (URLs)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={newAttachment}
                onChange={(e) => setNewAttachment(e.target.value)}
                placeholder="https://example.com/file.pdf"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            {formData.attachment_urls.length > 0 && (
              <div className="space-y-2">
                {formData.attachment_urls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <span className="flex-1 text-sm text-gray-600 truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/posts')}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
