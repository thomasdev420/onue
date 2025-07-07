import { useState } from 'react';
import { Brain, Trash2, RefreshCw, Eye, EyeOff, Target, Palette, Goal, Users, MessageSquare } from 'lucide-react';
import useAIMemory from '../../shared/hooks/useAIMemory';

export default function MemoryManager() {
  const {
    memories,
    summary,
    loading,
    error,
    fetchMemories,
    cleanupMemories,
    getMemoryInsights,
    hasPreferences
  } = useAIMemory();

  const [showDetails, setShowDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const insights = getMemoryInsights();

  const categoryIcons = {
    creative_preferences: <Palette className="w-4 h-4" />,
    goals_and_objectives: <Goal className="w-4 h-4" />,
    style_preferences: <Palette className="w-4 h-4" />,
    content_patterns: <Brain className="w-4 h-4" />,
    brand_voice: <MessageSquare className="w-4 h-4" />,
    target_audience: <Users className="w-4 h-4" />,
    interaction_history: <Brain className="w-4 h-4" />,
    success_metrics: <Target className="w-4 h-4" />
  };

  const categoryLabels = {
    creative_preferences: 'Creative Preferences',
    goals_and_objectives: 'Goals & Objectives',
    style_preferences: 'Style Preferences',
    content_patterns: 'Content Patterns',
    brand_voice: 'Brand Voice',
    target_audience: 'Target Audience',
    interaction_history: 'Interaction History',
    success_metrics: 'Success Metrics'
  };

  const handleCleanup = async () => {
    if (confirm('Are you sure you want to clean up old memories? This will remove low-priority memories older than 90 days.')) {
      try {
        await cleanupMemories(90);
        alert('Memory cleanup completed successfully!');
      } catch (error) {
        alert('Failed to cleanup memories: ' + error.message);
      }
    }
  };

  const filteredMemories = selectedCategory 
    ? memories.filter(m => m.category === selectedCategory)
    : memories;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading AI memory...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading AI memory</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => fetchMemories()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">AI Memory & Preferences</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button
            onClick={() => fetchMemories()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{insights.totalMemories}</div>
          <div className="text-sm text-blue-700">Total Memories</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{insights.highPriority.length}</div>
          <div className="text-sm text-green-700">High Priority</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{Object.keys(insights.categories).length}</div>
          <div className="text-sm text-purple-700">Categories</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">
            {insights.topPreferences.length > 0 ? insights.topPreferences[0]?.access_count || 0 : 0}
          </div>
          <div className="text-sm text-orange-700">Most Accessed</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {Object.entries(insights.categories).map(([category, count]) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {categoryIcons[category]}
              {categoryLabels[category] || category}
              <span className="text-xs">({count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Memory List */}
      {showDetails && (
        <div className="space-y-4">
          {filteredMemories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedCategory 
                ? `No memories found in ${categoryLabels[selectedCategory] || selectedCategory}`
                : 'No AI memories found. Start using the app to build up your preferences!'
              }
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMemories.map((memory) => (
                <div
                  key={memory.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {categoryIcons[memory.category]}
                        <span className="text-sm font-medium text-gray-700">
                          {categoryLabels[memory.category] || memory.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          memory.priority >= 4 ? 'bg-red-100 text-red-700' :
                          memory.priority >= 3 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          Priority {memory.priority}
                        </span>
                      </div>
                      <div className="text-gray-900 mb-1">{memory.value}</div>
                      {memory.context && (
                        <div className="text-sm text-gray-600 mb-2">{memory.context}</div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Accessed {memory.access_count} times</span>
                        <span>Created {new Date(memory.created_at).toLocaleDateString()}</span>
                        <span>Last accessed {new Date(memory.last_accessed).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            AI uses these preferences to provide more personalized responses
          </div>
          <button
            onClick={handleCleanup}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Cleanup Old Memories
          </button>
        </div>
      </div>
    </div>
  );
} 