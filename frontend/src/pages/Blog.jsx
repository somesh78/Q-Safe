import React, { useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Blog() {
  // Real posts (replace with API data when backend is ready)
  const blogPosts = [
    {
      slug: 'end-to-end-encryption-explained',
      title: 'Understanding End-to-End Encryption',
      excerpt: 'How E2EE protects files from device to recipient and what to watch for when evaluating vendors.',
      content:
        'End-to-end encryption keeps data encrypted from the moment it leaves your device until it is decrypted by the intended recipient. In this guide we cover key exchange, forward secrecy, and why QR-based offline exchange matters for zero-trust file sharing.',
      date: 'February 10, 2026',
      category: 'Security',
      readTime: '5 min read',
      tags: ['E2EE', 'Zero Trust', 'Key Management'],
      image: '🔒'
    },
    {
      slug: 'secure-file-sharing-checklist',
      title: 'Best Practices for Secure File Sharing',
      excerpt: 'A step-by-step checklist for teams sharing sensitive files internally or with vendors.',
      content:
        'From access scoping and password policies to IP allowlists and download caps, this checklist shows how to ship files safely without slowing collaboration. Includes a ready-to-use runbook for incident response.',
      date: 'February 5, 2026',
      category: 'Guides',
      readTime: '7 min read',
      tags: ['Runbook', 'Governance', 'IP Lock'],
      image: '📁'
    },
    {
      slug: 'offline-qr-mode',
      title: 'Introducing Offline QR Mode',
      excerpt: 'Exchange files in air-gapped environments using rotating QR frames—no internet required.',
      content:
        'Offline QR mode slices your payload into encrypted frames, rotates QR codes, and reconstructs the file on the receiving device. Ideal for classified networks and lab environments. We cover performance limits, retry logic, and checksum validation.',
      date: 'January 28, 2026',
      category: 'Features',
      readTime: '4 min read',
      tags: ['Air-gapped', 'QR', 'Offline'],
      image: '📱'
    },
    {
      slug: 'gdpr-compliance-data-protection',
      title: 'GDPR Compliance and Data Protection',
      excerpt: 'How Q-Safe aligns with GDPR requirements for data minimization, access controls, and auditability.',
      content:
        'We detail our data retention defaults, encryption controls, subprocessor posture, and how customers can fulfill data subject requests using audit exports. Mapped to Articles 5, 25, and 32 with practical guidance.',
      date: 'January 20, 2026',
      category: 'Compliance',
      readTime: '6 min read',
      tags: ['GDPR', 'Audit', 'Retention'],
      image: '⚖️'
    },
    {
      slug: 'aes-256-encryption',
      title: 'AES-256 Encryption Explained',
      excerpt: 'A concise primer on AES-256, modes of operation, and why we pair it with strong key derivation.',
      content:
        'AES-256 provides confidentiality when paired with secure key handling. We discuss GCM vs CBC, IV reuse pitfalls, and why we enforce PBKDF2+HMAC with high iteration counts for user-supplied passwords.',
      date: 'January 12, 2026',
      category: 'Technology',
      readTime: '8 min read',
      tags: ['AES-256', 'KDF', 'Crypto'],
      image: '🛡️'
    },
    {
      slug: 'remote-work-file-transfers',
      title: 'Securing Remote Work File Transfers',
      excerpt: 'Patterns for distributed teams to ship sensitive files without VPN bottlenecks.',
      content:
        'Covers device posture checks, short-lived download links, IP locking per session, and automated expiry. Includes a template for vendor onboarding and offboarding.',
      date: 'January 3, 2026',
      category: 'Enterprise',
      readTime: '5 min read',
      tags: ['Remote Work', 'Zero Trust', 'Policy'],
      image: '💼'
    }
  ];

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSlug, setExpandedSlug] = useState(null);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(blogPosts.map((post) => post.category)))],
    []
  );

  const filteredPosts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return blogPosts.filter((post) => {
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      if (!term) return matchesCategory;
      const haystack = `${post.title} ${post.excerpt} ${post.content} ${post.category} ${(post.tags || []).join(' ')}`.toLowerCase();
      return matchesCategory && haystack.includes(term);
    });
  }, [activeCategory, searchTerm]);

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
        {paginatedPosts.length === 0 ? (
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
      </div>
      <Footer />
    </div>
  );
}
