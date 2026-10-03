import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Search,
  PlusCircle,
  Tag,
  Users,
  ExternalLink,
  Code,
  Sparkles,
} from 'lucide-react';
import { projectService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await projectService.getProjects({
        search,
        category,
        status,
      });
      if (res.data?.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [category, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800' }}>Academic Projects & Research</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Discover student capstone projects, explore modern tech stacks, and team up with peers.
          </p>
        </div>

        <Link to="/student/projects/new" className="btn btn-primary">
          <PlusCircle size={16} />
          <span>Create New Project</span>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              alignItems: 'flex-end',
            }}
          >
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Search Projects</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '34px' }}
                  placeholder="Title, technology, tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Web Development">Web Development</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Cloud Computing">Cloud Computing</option>
                <option value="IoT & Embedded">IoT & Embedded</option>
                <option value="Cybersecurity">Cybersecurity</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="planning">Planning</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>

            <div>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
                Filter Projects
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <LoadingSpinner text="Loading academic projects..." />
      ) : projects.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No projects found"
            message="No projects matched your criteria. You can create the first project in this category!"
            action={
              <Link to="/student/projects/new" className="btn btn-primary">
                Create Project
              </Link>
            }
          />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '24px',
          }}
        >
          {projects.map((proj) => (
            <div
              key={proj._id}
              className="card card-hover"
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '10px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: 'var(--primary)',
                  }}
                >
                  {proj.category}
                </span>
                <span className={`badge badge-${proj.status}`}>{proj.status}</span>
              </div>

              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
                <Link to={`/student/projects/${proj._id}`} style={{ color: 'inherit' }}>
                  {proj.title}
                </Link>
              </h3>

              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  marginBottom: '16px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {proj.description}
              </p>

              {/* Technologies */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                {proj.technologies?.map((tech, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.725rem',
                      backgroundColor: 'var(--bg-subtle)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: 'var(--text-main)',
                      fontWeight: '500',
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Footer Meta */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                    }}
                  >
                    {proj.ownerId?.userName?.charAt(0) || 'U'}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {proj.ownerId?.userName}
                  </span>
                </div>

                <Link
                  to={`/student/projects/${proj._id}`}
                  className="btn btn-secondary btn-sm"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
