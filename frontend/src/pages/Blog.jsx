import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { fetchBlogPosts } from '../services/api';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSlug, setExpandedSlug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchBlogPosts();
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      const normalized = data.map((item, idx) => ({
        slug: item.slug || item.id?.toString() || `post-${idx}`,
        title: item.title || 'Untitled',
        excerpt:
          item.excerpt || item.summary || item.content?.slice(0, 180) || 'No summary available.',
        content: item.content || item.body || '',
        date: item.date || item.published_at || item.created_at || '—',
        category: item.category || 'General',
        readTime:
          item.readTime || item.read_time || (item.read_time_minutes ? `${item.read_time_minutes} min read` : 'Read'),
        tags: item.tags || [],
        image: item.image || '📝'
      }));
      setPosts(normalized);
    } catch (err) {
      setError('Unable to load blog posts right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(posts.map((post) => post.category)))],
    [posts]
  );

  const filteredPosts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      if (!term) return matchesCategory;
      const haystack = `${post.title} ${post.excerpt} ${post.content} ${post.category} ${(post.tags || []).join(' ')}`.toLowerCase();
      return matchesCategory && haystack.includes(term);
    });
  }, [activeCategory, searchTerm, posts]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedPosts = filteredPosts.slice((currentPageSafe - 1) * pageSize, currentPageSafe * pageSize);

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const toggleExpand = (slug) => {
    setExpandedSlug((prev) => (prev === slug ? null : slug));
  };

  const goToPage = (page) => {
    const next = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(next);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #060606, #0a0a0a)' }}>
      <Header />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 20px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1
            style={{
              fontSize: '3rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '16px',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          >
            Q-Safe Blog
          </h1>
          <p
            style={{
              fontSize: '1.1rem',
              color: '#888',
              maxWidth: '760px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}
          >
            Insights on secure file sharing, compliance, and the product roadmap. Search, filter, and read detailed guidance without placeholders.
          </p>
        </div>

        {/* Search + Filters */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
            alignItems: 'center',
            marginBottom: '24px'
          }}
        >
          <input
            type="search"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              flex: '1 1 280px',
              minWidth: '220px',
              padding: '12px 14px',
              background: '#060606',
              border: '1px solid #222',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem'
            }}
          />

          <div
            style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '5px'
            }}
          >
            {categories.map((category) => (
              <button
                key={category}
                style={{
                  padding: '10px 16px',
                  background:
                    activeCategory === category
                      ? 'linear-gradient(135deg, #00d4ff, #0099cc)'
                      : '#0a0a0a',
                  color: '#fff',
                  border: activeCategory === category ? '1px solid #00d4ff' : '1px solid #333',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleCategoryChange(category)}
                onMouseEnter={(e) => {
                  if (activeCategory !== category) {
                    e.currentTarget.style.borderColor = '#00d4ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== category) {
                    e.currentTarget.style.borderColor = '#333';
                  }
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div
            style={{
              background: '#0a0a0a',
              border: '1px solid #222',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              color: '#ccc'
            }}
          >
            <p style={{ margin: 0 }}>Loading posts...</p>
          </div>
        ) : error ? (
          <div
            style={{
              background: '#0a0a0a',
              border: '1px solid #332222',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              color: '#ff8f8f'
            }}
          >
            <p style={{ marginBottom: '16px' }}>{error}</p>
            <button
              onClick={loadPosts}
              style={{
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #ff6b6b, #ff9f7f)',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div
            style={{
              background: '#0a0a0a',
              border: '1px solid #222',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              color: '#ccc'
            }}
          >
            <p style={{ marginBottom: '16px' }}>No posts available yet. Check back soon.</p>
            <button
              onClick={loadPosts}
              style={{
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </div>
        ) : paginatedPosts.length === 0 ? (
          <div
            style={{
              background: '#0a0a0a',
              border: '1px solid #222',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              color: '#ccc'
            }}
          >
            <p style={{ marginBottom: '20px' }}>
              No posts match your filters. Try clearing search or picking a different category.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveCategory('All');
                setCurrentPage(1);
              }}
              style={{
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '30px',
              marginBottom: '32px'
            }}
          >
            {paginatedPosts.map((post) => {
              const isExpanded = expandedSlug === post.slug;
              const body = isExpanded ? post.content : post.excerpt;
              return (
                <article
                  key={post.slug}
                  style={{
                    background: 'linear-gradient(135deg, #0a0a0a, #111)',
                    border: '1px solid #222',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00d4ff';
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 212, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#222';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                      height: '180px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '4rem'
                    }}
                  >
                    {post.image}
                  </div>

                  <div style={{ padding: '25px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px'
                      }}
                    >
                      <span
                        style={{
                          padding: '5px 12px',
                          background: 'rgba(0, 212, 255, 0.1)',
                          border: '1px solid #00d4ff',
                          borderRadius: '15px',
                          color: '#00d4ff',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                      >
                        {post.category}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#888' }}>{post.readTime}</span>
                    </div>

                    <h3
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#fff',
                        margin: '8px 0 12px'
                      }}
                    >
                      {post.title}
                    </h3>

                    <p
                      style={{
                        fontSize: '0.95rem',
                        color: '#aaa',
                        lineHeight: '1.6',
                        marginBottom: '16px'
                      }}
                    >
                      {body}
                    </p>

                    {post.tags && post.tags.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                          marginBottom: '14px'
                        }}
                      >
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '10px',
                              border: '1px solid #222',
                              background: '#0b0b0b',
                              color: '#8ad8ff',
                              fontSize: '0.85rem'
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '12px',
                        borderTop: '1px solid #222'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#888' }}>{post.date}</span>
                      <button
                        onClick={() => toggleExpand(post.slug)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#00d4ff',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {isExpanded ? 'Show Less' : 'Read Details'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && posts.length > 0 && filteredPosts.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '60px'
            }}
          >
            <button
              onClick={() => goToPage(currentPageSafe - 1)}
              disabled={currentPageSafe <= 1}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #222',
                background: currentPageSafe <= 1 ? '#0b0b0b' : '#111',
                color: '#fff',
                cursor: currentPageSafe <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Prev
            </button>
            <span style={{ color: '#ccc', fontWeight: '600' }}>
              Page {currentPageSafe} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPageSafe + 1)}
              disabled={currentPageSafe >= totalPages}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #222',
                background: currentPageSafe >= totalPages ? '#0b0b0b' : '#111',
                color: '#fff',
                cursor: currentPageSafe >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
