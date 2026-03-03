import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TAGS = [
  { label: 'All', value: '' },
  { label: 'Cybersecurity', value: 'cybersecurity' },
  { label: 'Encryption', value: 'encryption' },
  { label: 'Privacy', value: 'privacy' },
  { label: 'Security', value: 'security' },
  { label: 'DevOps', value: 'devops' },
];

const PAGE_SIZE = 9;

export default function Blog() {
  const [articles, setArticles] = useState([]);
  const [activeTag, setActiveTag] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchArticles = useCallback(async (tag) => {
    setLoading(true);
    setError('');
    try {
      const tagParam = tag || 'cybersecurity';
      const res = await fetch(
        `https://dev.to/api/articles?tag=${tagParam}&per_page=30&top=30`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setArticles(data);
    } catch (err) {
      setError('Unable to load articles right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles(activeTag);
  }, [activeTag, fetchArticles]);

  const filteredArticles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return articles;
    return articles.filter((a) => {
      const haystack = `${a.title} ${a.description} ${(a.tag_list || []).join(' ')} ${a.user?.name || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [articles, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedArticles = filteredArticles.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const handleTagChange = (tag) => {
    setActiveTag(tag);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #060606)' }}>
      <Header />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 20px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '800',
            color: 'var(--text-primary, #fff)',
            marginBottom: '16px',
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.03em'
          }}>
            Security & Privacy Insights
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary, #888)',
            maxWidth: '650px',
            margin: '0 auto',
            lineHeight: '1.7'
          }}>
            Curated articles on cybersecurity, encryption, privacy, and secure file sharing from the developer community.
          </p>
        </div>

        {/* Search + Tag Filters */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '15px',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <input
            type="search"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              flex: '1 1 280px',
              minWidth: '220px',
              padding: '12px 16px',
              background: 'var(--bg-card, #0a0a0a)',
              border: '1px solid var(--border-color, #222)',
              borderRadius: '10px',
              color: 'var(--text-primary, #fff)',
              fontSize: '1rem',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary, #00d4ff)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color, #222)'; }}
          />

          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            flexWrap: 'wrap'
          }}>
            {TAGS.map((tag) => (
              <button
                key={tag.value}
                style={{
                  padding: '8px 16px',
                  background: activeTag === tag.value
                    ? 'linear-gradient(135deg, #00d4ff, #0099cc)'
                    : 'var(--bg-card, #0a0a0a)',
                  color: activeTag === tag.value ? '#fff' : 'var(--text-secondary, #aaa)',
                  border: activeTag === tag.value ? '1px solid #00d4ff' : '1px solid var(--border-color, #333)',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleTagChange(tag.value)}
                onMouseEnter={(e) => {
                  if (activeTag !== tag.value) e.currentTarget.style.borderColor = '#00d4ff';
                }}
                onMouseLeave={(e) => {
                  if (activeTag !== tag.value) e.currentTarget.style.borderColor = 'var(--border-color, #333)';
                }}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{
                background: 'var(--bg-card, #0a0a0a)',
                border: '1px solid var(--border-color, #222)',
                borderRadius: '12px',
                height: '380px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            ))}
          </div>
        ) : error ? (
          <div style={{
            background: 'var(--bg-card, #0a0a0a)',
            border: '1px solid rgba(255,100,100,0.3)',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <p style={{ color: '#ff8f8f', marginBottom: '20px', fontSize: '1.05rem' }}>{error}</p>
            <button
              onClick={() => fetchArticles(activeTag)}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Retry
            </button>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div style={{
            background: 'var(--bg-card, #0a0a0a)',
            border: '1px solid var(--border-color, #222)',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
            <p style={{ color: 'var(--text-secondary, #aaa)', marginBottom: '20px', fontSize: '1.05rem' }}>
              No articles match "<strong>{searchTerm}</strong>". Try a different search term.
            </p>
            <button
              onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <>
            {/* Results count */}
            <p style={{
              color: 'var(--text-secondary, #888)',
              fontSize: '0.9rem',
              marginBottom: '16px'
            }}>
              Showing {paginatedArticles.length} of {filteredArticles.length} articles
            </p>

            {/* Articles Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '24px',
              marginBottom: '32px'
            }}>
              {paginatedArticles.map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <article
                    style={{
                      background: 'var(--bg-card, #0a0a0a)',
                      border: '1px solid var(--border-color, #222)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00d4ff';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 212, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color, #222)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Cover Image */}
                    <div style={{
                      height: '180px',
                      background: article.cover_image
                        ? `url(${article.cover_image}) center/cover`
                        : 'linear-gradient(135deg, #00d4ff22, #0099cc22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {!article.cover_image && (
                        <span style={{ fontSize: '3.5rem', opacity: 0.5 }}>🔒</span>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Tags */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginBottom: '10px'
                      }}>
                        {(article.tag_list || []).slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            style={{
                              padding: '3px 10px',
                              background: 'rgba(0, 212, 255, 0.08)',
                              border: '1px solid rgba(0, 212, 255, 0.25)',
                              borderRadius: '8px',
                              color: '#00d4ff',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Title */}
                      <h3 style={{
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        color: 'var(--text-primary, #fff)',
                        margin: '0 0 8px',
                        lineHeight: '1.4',
                        fontFamily: 'var(--font-display)'
                      }}>
                        {article.title}
                      </h3>

                      {/* Description */}
                      <p style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary, #aaa)',
                        lineHeight: '1.6',
                        marginBottom: '16px',
                        flex: 1
                      }}>
                        {article.description?.slice(0, 140)}{article.description?.length > 140 ? '...' : ''}
                      </p>

                      {/* Footer: author + date + reading time */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--border-color, #1a1a1a)',
                        marginTop: 'auto'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {article.user?.profile_image && (
                            <img
                              src={article.user.profile_image}
                              alt={article.user.name}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                            />
                          )}
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #888)' }}>
                            {article.user?.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #888)' }}>
                            {formatDate(article.published_at)}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #666)' }}>
                            {article.reading_time_minutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </a>
              ))}
            </div>

            {/* Pagination — only show when more than 1 page */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '40px'
              }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                  disabled={safePage <= 1}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, #222)',
                    background: safePage <= 1 ? 'var(--bg-card, #0b0b0b)' : 'var(--bg-card-hover, #111)',
                    color: 'var(--text-primary, #fff)',
                    cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                    opacity: safePage <= 1 ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  ← Prev
                </button>
                <span style={{ color: 'var(--text-secondary, #ccc)', fontWeight: '600', fontSize: '0.9rem' }}>
                  Page {safePage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                  disabled={safePage >= totalPages}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, #222)',
                    background: safePage >= totalPages ? 'var(--bg-card, #0b0b0b)' : 'var(--bg-card-hover, #111)',
                    color: 'var(--text-primary, #fff)',
                    cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                    opacity: safePage >= totalPages ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
