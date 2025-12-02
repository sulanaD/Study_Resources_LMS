import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, FileText, Video, File, Link as LinkIcon, Edit2, Trash2, X, Check } from 'lucide-react';
import { resourcesApi, categoriesApi } from '../api';
import { useAuth } from '../context/AuthContext';

const fileTypeIcons = {
  pdf: FileText,
  video: Video,
  notes: FileText,
  past_paper: File,
  link: LinkIcon,
  other: File
};

export default function Resources() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchCategories();
    fetchResources();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await resourcesApi.getAll(50);
      setResources(res.data.data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await resourcesApi.search(searchQuery, selectedCategory, selectedType);
      setResources(res.data.data || []);
      
      if (res.data.data?.length === 0 && res.data.suggestion) {
        // Show suggestion to create request
        console.log('Suggestion:', res.data.suggestion);
      }
    } catch (error) {
      console.error('Error searching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resource) => {
    try {
      await resourcesApi.trackDownload(resource.id);
      if (resource.file_url) {
        window.open(resource.file_url, '_blank');
      }
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  };

  const handleEdit = (resource) => {
    setEditingId(resource.id);
    setEditForm({ title: resource.title, description: resource.description || '' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', description: '' });
  };

  const handleSaveEdit = async (resourceId) => {
    try {
      await resourcesApi.update(resourceId, editForm);
      setResources(resources.map(r => 
        r.id === resourceId ? { ...r, ...editForm } : r
      ));
      setEditingId(null);
      setEditForm({ title: '', description: '' });
    } catch (error) {
      console.error('Error updating resource:', error);
      alert('Failed to update resource');
    }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      await resourcesApi.delete(resourceId);
      setResources(resources.filter(r => r.id !== resourceId));
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
        <p className="mt-1 text-sm text-gray-500">Search and browse academic resources</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
            <option value="notes">Notes</option>
            <option value="past_paper">Past Papers</option>
            <option value="link">Links</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Search
          </button>
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => {
            const FileIcon = fileTypeIcons[resource.file_type] || File;
            const isOwner = user && resource.author_id === user.id;
            const isEditing = editingId === resource.id;
            
            return (
              <div
                key={resource.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <FileIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full text-sm font-semibold border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{resource.title}</h3>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{resource.category_name}</p>
                  </div>
                  {isOwner && !isEditing && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(resource)}
                        className="p-1 text-gray-400 hover:text-primary-600 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {isEditing && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSaveEdit(resource.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                {isEditing ? (
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 mt-3"
                    rows={2}
                  />
                ) : (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">{resource.description}</p>
                )}
                
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {resource.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {resource.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" /> {resource.download_count}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownload(resource)}
                    className="px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    {resource.file_type === 'link' ? 'Open' : 'Download'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
          <p className="text-sm text-gray-500 mb-4">Try adjusting your search or filters</p>
          <a
            href="/requests"
            className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            Request a Resource
          </a>
        </div>
      )}
    </div>
  );
}
