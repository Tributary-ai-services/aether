import React, { useState, useMemo } from 'react';
import { workflowTemplates, workflowTemplateCategories } from '../../data/workflowTemplates.js';
import {
  Search,
  FileText,
  Shield,
  CheckSquare,
  Workflow,
  Tag,
  ArrowRight,
} from 'lucide-react';

const categoryIcons = {
  document_processing: FileText,
  compliance_check: Shield,
  approval_chain: CheckSquare,
  custom: Workflow,
};

const WorkflowTemplateGallery = ({ onSelect, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTemplates = useMemo(() => {
    return workflowTemplates.filter((tpl) => {
      const matchesCategory = selectedCategory === 'all' || tpl.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {workflowTemplateCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-(--color-primary-600) text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No templates match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
          {filteredTemplates.map((tpl) => {
            const Icon = categoryIcons[tpl.category] || Workflow;
            return (
              <button
                key={tpl.id}
                onClick={() => onSelect(tpl)}
                className="text-left border border-gray-200 rounded-lg p-4 hover:border-(--color-primary-400) hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg shrink-0 group-hover:bg-blue-100 transition-colors">
                    <Icon size={18} className="text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 text-sm truncate">{tpl.name}</h4>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-(--color-primary-600) transition-colors shrink-0 ml-2" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tpl.description}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {tpl.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">
                          <Tag size={8} />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1.5">
                      {tpl.steps.length} steps &middot; {tpl.triggers.length} trigger{tpl.triggers.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Back button */}
      {onBack && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Back to options
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkflowTemplateGallery;
