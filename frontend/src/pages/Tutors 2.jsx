import { useState, useEffect } from 'react';
import { Search, Star, Mail, Calendar, ExternalLink, Edit2, Trash2, X, Check } from 'lucide-react';
import { tutorsApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Tutors() {
  const { user } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchSubject, setSearchSubject] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);
  const [noResults, setNoResults] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ bio: '', hourly_rate: '', contact_email: '' });

  useEffect(() => {
    fetchSubjects();
    fetchTutors();
  }, [showAvailableOnly]);

  const fetchSubjects = async () => {
    try {
      const res = await tutorsApi.getSubjects();
      setSubjects(res.data.data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTutors = async () => {
    setLoading(true);
    setNoResults(null);
    try {
      const res = await tutorsApi.getAll(showAvailableOnly ? 'true' : null);
      setTutors(res.data.data || []);
    } catch (error) {
      console.error('Error fetching tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchSubject.trim()) {
      fetchTutors();
      return;
    }

    setLoading(true);
    setNoResults(null);
    try {
      const res = await tutorsApi.getBySubject(searchSubject);
      setTutors(res.data.data || []);
      
      if (res.data.data?.length === 0 && res.data.suggestions) {
        setNoResults(res.data.suggestions);
      }
    } catch (error) {
      console.error('Error searching tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAvailability = (availability) => {
    if (!availability || Object.keys(availability).length === 0) return 'Contact for schedule';
    return Object.entries(availability)
      .map(([day, times]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${times.join(', ')}`)
      .join(' | ');
  };

  const handleEdit = (tutor) => {
    setEditingId(tutor.id);
    setEditForm({ 
      bio: tutor.bio || '', 
      hourly_rate: tutor.hourlyRate || '', 
      contact_email: tutor.contactEmail || '' 
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ bio: '', hourly_rate: '', contact_email: '' });
  };

  const handleSaveEdit = async (tutorId) => {
    try {
      const updateData = {
        bio: editForm.bio,
        hourly_rate: editForm.hourly_rate ? parseFloat(editForm.hourly_rate) : null,
        contact_email: editForm.contact_email
      };
      await tutorsApi.update(tutorId, updateData);
      setTutors(tutors.map(t => 
        t.id === tutorId ? { 
          ...t, 
          bio: editForm.bio,
          hourlyRate: editForm.hourly_rate ? parseFloat(editForm.hourly_rate) : t.hourlyRate,
          contactEmail: editForm.contact_email
        } : t
      ));
      setEditingId(null);
      setEditForm({ bio: '', hourly_rate: '', contact_email: '' });
    } catch (error) {
      console.error('Error updating tutor:', error);
      alert('Failed to update tutor profile');
    }
  };

  const handleDelete = async (tutorId) => {
    if (!window.confirm('Are you sure you want to delete your tutor profile?')) return;
    
    try {
      await tutorsApi.delete(tutorId);
      setTutors(tutors.filter(t => t.id !== tutorId));
    } catch (error) {
      console.error('Error deleting tutor:', error);
      alert('Failed to delete tutor profile');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find a Tutor</h1>
        <p className="mt-1 text-sm text-gray-500">Connect with tutors in your subject area</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by subject (e.g., Mathematics, Python)"
              value={searchSubject}
              onChange={(e) => setSearchSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAvailableOnly}
              onChange={(e) => setShowAvailableOnly(e.target.checked)}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Available only</span>
          </label>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Search
          </button>
        </div>
        
        {subjects.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Popular subjects:</span>
            {subjects.slice(0, 8).map((subject) => (
              <button
                key={subject}
                onClick={() => {
                  setSearchSubject(subject);
                  handleSearch();
                }}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
              >
                {subject}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* No Results with Suggestions */}
      {noResults && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800 mb-2">
            No tutors found for "{searchSubject}". Try these subjects instead:
          </p>
          <div className="flex flex-wrap gap-2">
            {noResults.availableSubjects?.map((subject) => (
              <button
                key={subject}
                onClick={() => {
                  setSearchSubject(subject);
                  handleSearch();
                }}
                className="px-3 py-1 text-sm bg-white text-yellow-800 border border-yellow-300 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                {subject}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tutors Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : tutors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tutors.map((tutor) => {
            const isOwner = user && tutor.user_id === user.id;
            const isEditing = editingId === tutor.id;
            
            return (
            <div
              key={tutor.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary-600">
                    {tutor.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{tutor.name}</h3>
                    {tutor.isAvailable && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Available
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-700">{tutor.rating?.toFixed(1) || 'N/A'}</span>
                    <span className="text-sm text-gray-500">({tutor.totalReviews || 0} reviews)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.hourly_rate}
                      onChange={(e) => setEditForm({ ...editForm, hourly_rate: e.target.value })}
                      placeholder="Rate"
                      className="w-20 text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  ) : (
                    tutor.hourlyRate && (
                      <span className="text-lg font-bold text-primary-600">${tutor.hourlyRate}/hr</span>
                    )
                  )}
                  {isOwner && !isEditing && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(tutor)}
                        className="p-1 text-gray-400 hover:text-primary-600 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tutor.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {isEditing && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSaveEdit(tutor.id)}
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
              </div>

              {isEditing ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Bio"
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    rows={2}
                  />
                  <input
                    type="email"
                    value={editForm.contact_email}
                    onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                    placeholder="Contact Email"
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">{tutor.bio}</p>
              )}

              <div className="mt-3">
                <div className="flex flex-wrap gap-1">
                  {tutor.subjects?.map((subject, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span className="truncate">{formatAvailability(tutor.availability)}</span>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                {tutor.contactEmail && (
                  <a
                    href={`mailto:${tutor.contactEmail}`}
                    className="flex-1 px-3 py-2 text-sm text-center text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                )}
                {tutor.bookingLink && (
                  <a
                    href={tutor.bookingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 text-sm text-center text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Book Session
                  </a>
                )}
              </div>
            </div>
          )})}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tutors found</h3>
          <p className="text-sm text-gray-500">Try searching for a different subject</p>
        </div>
      )}
    </div>
  );
}
