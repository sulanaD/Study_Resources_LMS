import { useState, useEffect } from 'react';
import { Plus, MessageSquare, ThumbsUp, Edit2, Trash2, X, Check } from 'lucide-react';
import { postsApi, categoriesApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const postTypeConfig = {
  discussion: { label: 'Discussion', color: 'bg-blue-100 text-blue-700' },
  question: { label: 'Question', color: 'bg-purple-100 text-purple-700' },
  announcement: { label: 'Announcement', color: 'bg-yellow-100 text-yellow-700' },
  study_group: { label: 'Study Group', color: 'bg-green-100 text-green-700' }
};

export default function Posts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
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

  const handleEdit = (post) => {
    setEditingId(post.id);
    setEditForm({ title: post.title, content: post.content || '' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', content: '' });
  };

  const handleSaveEdit = async (postId) => {
    try {
      await postsApi.update(postId, editForm);
      setPosts(posts.map(p => p.id === postId ? { ...p, ...editForm } : p));
      setEditingId(null);
      setEditForm({ title: '', content: '' });
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    setActionLoading(true);
    try {
      await postsApi.delete(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Posts</h1>
          <p className="mt-1 text-sm text-gray-500">Discussions, questions, and announcements</p>
        </div>
        <Link
          to="/create-post"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Post
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {Object.entries(postTypeConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => {
            const typeConfig = postTypeConfig[post.post_type] || postTypeConfig.discussion;
            const isOwner = user && post.author_id === user.id;
            const isEditing = editingId === post.id;

            return (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                      {post.category_name && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          {post.category_name}
                        </span>
                      )}
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full text-lg font-semibold border border-gray-300 rounded px-2 py-1 mb-2"
                      />
                    ) : (
                      <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                    )}
                    {isEditing ? (
                      <textarea
                        value={editForm.content}
                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-3">{post.content}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>By: {post.author_name || 'Anonymous'}</span>
                      <span>{formatDate(post.created_at)}</span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" /> {post.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> {post.comments_count || 0}
                      </span>
                    </div>
                  </div>
                  {isOwner && !isEditing && (
                    <div className="flex gap-1 ml-4">
                      <button onClick={() => handleEdit(post)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)} 
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                        disabled={actionLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {isEditing && (
                    <div className="flex gap-1 ml-4">
                      <button onClick={() => handleSaveEdit(post.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={handleCancelEdit} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
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
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
          <p className="text-sm text-gray-500 mb-4">Be the first to start a discussion!</p>
          <Link
            to="/create-post"
            className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            Create Post
          </Link>
        </div>
      )}
    </div>
  );
}
