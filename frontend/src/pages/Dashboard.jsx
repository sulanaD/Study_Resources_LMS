import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileQuestion, Users, MessageSquare, TrendingUp, Clock } from 'lucide-react';
import { resourcesApi, requestsApi, tutorsApi, postsApi, categoriesApi } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    resources: 0,
    requests: 0,
    tutors: 0,
    posts: 0
  });
  const [recentResources, setRecentResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [resourcesRes, requestsRes, tutorsRes, postsRes, categoriesRes] = await Promise.all([
        resourcesApi.getAll(5),
        requestsApi.getAll(null, 50),
        tutorsApi.getAll('true', 50),
        postsApi.getAll(null, null, 50),
        categoriesApi.getWithCounts()
      ]);

      setStats({
        resources: resourcesRes.data.data?.length || 0,
        requests: requestsRes.data.data?.length || 0,
        tutors: tutorsRes.data.data?.length || 0,
        posts: postsRes.data.data?.length || 0
      });

      setRecentResources(resourcesRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Resources', value: stats.resources, icon: BookOpen, color: 'bg-blue-500', link: '/resources' },
    { label: 'Pending Requests', value: stats.requests, icon: FileQuestion, color: 'bg-yellow-500', link: '/requests' },
    { label: 'Available Tutors', value: stats.tutors, icon: Users, color: 'bg-green-500', link: '/tutors' },
    { label: 'Active Posts', value: stats.posts, icon: MessageSquare, color: 'bg-purple-500', link: '/posts' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome to the Student Resource Platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.link}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Resources */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              Recent Resources
            </h2>
            <Link to="/resources" className="text-sm text-primary-600 hover:text-primary-700">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentResources.length > 0 ? (
              recentResources.map((resource) => (
                <div key={resource.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{resource.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {resource.category_name} • {resource.file_type?.toUpperCase()}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{resource.view_count} views</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No resources yet</p>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              Categories
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.length > 0 ? (
              categories.map((category) => (
                <div key={category.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xl">{category.icon || '📁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{category.name}</p>
                    <p className="text-xs text-gray-500">{category.resource_count || 0} resources</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4 col-span-2">No categories yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-sm p-6 text-white">
        <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
        <p className="text-primary-100 text-sm mb-4">Get started with the platform</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/resources"
            className="px-4 py-2 bg-white text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
          >
            Search Resources
          </Link>
          <Link
            to="/requests"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-400 transition-colors"
          >
            Request Resource
          </Link>
          <Link
            to="/tutors"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-400 transition-colors"
          >
            Find Tutor
          </Link>
          <Link
            to="/create-post"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-400 transition-colors"
          >
            Create Post
          </Link>
        </div>
      </div>
    </div>
  );
}
