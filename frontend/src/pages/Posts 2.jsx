import { useState, useEffect } from 'react';
import { MessageSquare, HelpCircle, Megaphone, BookOpen, Pin, User, Edit2, Trash2, X, Save } from 'lucide-react';
import { postsApi, categoriesApi } from '../api';
import { useAuth } from '../context/AuthContext';

const postTypeConfig = {
  resource: { label: 'Resource', icon: BookOpen, color: 'bg-blue-100 text-blue-700' },
  help_request: { label: 'Help Request', icon: HelpCircle, color: 'bg-yellow-100 text-yellow-700' },
  tutor_flyer: { label: 'Tutor Flyer', icon: User, color: 'bg-green-100 text-green-700' },
  announcement: { label: 'Announcement', icon: Megaphone, color: 'bg-purple-100 text-purple-700' }
};

export default function Posts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterType, filterCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        postsApi.getAll(filterType || null, filterCategory || null),
        categoriesApi.getAll()
      ]);
      setPosts(postsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleEditClick = (post) => {
    setEditingPost(post.id);
    setEditForm({ title: post.title, description: post.description });
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditForm({ title: '', description: '' });
  };

  const handleSaveEdit = async (postId) => {
    if (!editForm.title.trim() || !editForm.description.trim()) {
      alert('Title and description are required');
      return;
    }
    
    setActionLoading(true);
    try {
      await postsApi.update(postId, {
        title: editForm.title,
        description: editForm.description
      });
      // Update local state
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, title: editForm.title, description: editForm.description }
          : p
      ));
      setEditingPost(null);
      setEditForm({ title: '', description: '' });
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (postId) => {
    setDeleteConfirm(postId);
  };

  const handleConfirmDelete = async (postId) => {
    setActionLoading(true);
    try {
      await postsApi.delete(postId);
      // Remove from local state
      setPosts(posts.filter(p => p.id !== postId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setActionLoading(false);
    }
  };

  const isOwnPost = (post) => {
    return user && post.author_id === user.id;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
          <p className="mt-1 text-sm text-gray-500">Browse community posts and announcements</p>
        </div>
        <a
          href="/create-post"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Create Post
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Post Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {Object.entries(postTypeConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => {
            const typeConfig = postTypeConfig[post.post_type] || postTypeConfig.resource;
            const TypeIcon = typeConfig.icon;
            const isEditing = editingPost === post.id;
            const isDeleting = deleteConfirm === post.id;
            
            return (
              <div
                key={post.id}
                className={`bg-white rounded-xl shadow-sm border ${post.is_pinned ? 'border-primary-300 ring-1 ring-primary-100' : 'border-gray-200'} p-5`}
              >
                {/* Delete Confirmation */}
                {isDeleting && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 mb-3">Are you sure you want to delete this post?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirmDelete(post.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.is_pinned && (
                          <Pin className="h-4 w-4 text-primary-500" />
                        )}
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="text-lg font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500"
                          />
                        ) : (
                          <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      </div>
                      
                      {/* Edit/Delete buttons - only show for own posts */}
                      {isOwnPost(post) && !isDeleting && (
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(post.id)}
                                disabled={actionLoading}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Save changes"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditClick(post)}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit post"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(post.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete post"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {isEditing ? (
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full text-sm text-gray-600 mt-2 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-gray-600 mt-2">{post.description}</p>
                    )}
                    
                    {post.attachment_urls && post.attachment_urls.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.attachment_urls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:text-primary-700 underline"
                          >
                            Attachment {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                      {post.category_name && (
                        <span className="px-2 py-1 bg-gray-100 rounded-full">{post.category_name}</span>
                      )}
                      <span>By {post.author_name || 'Anonymous'}</span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
          <p className="text-sm text-gray-500 mb-4">Be the first to create a post!</p>
          <a
            href="/create-post"
            className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            Create Post
          </a>
        </div>
      )}
    </div>
  );
}
