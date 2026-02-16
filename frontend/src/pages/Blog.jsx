import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Blog() {
  const blogPosts = [
    {
      title: 'Understanding End-to-End Encryption',
      excerpt: 'Learn how end-to-end encryption protects your files from the moment they leave your device until they reach the intended recipient.',
      date: 'February 10, 2026',
      category: 'Security',
      readTime: '5 min read',
      image: '🔒'
    },
    {
      title: 'Best Practices for Secure File Sharing',
      excerpt: 'Discover essential security practices when sharing sensitive files, from password protection to IP whitelisting.',
      date: 'February 5, 2026',
      category: 'Guides',
      readTime: '7 min read',
      image: '📁'
    },
    {
      title: 'Introducing Offline QR Mode',
      excerpt: 'Transfer files securely in air-gapped environments using our new QR code generation feature—no internet required.',
      date: 'January 28, 2026',
      category: 'Features',
      readTime: '4 min read',
      image: '📱'
    },
    {
      title: 'GDPR Compliance and Data Protection',
      excerpt: 'How Q-Safe ensures compliance with GDPR and other data protection regulations while maintaining maximum security.',
      date: 'January 20, 2026',
      category: 'Compliance',
      readTime: '6 min read',
      image: '⚖️'
    },
    {
      title: 'AES-256 Encryption Explained',
      excerpt: 'A deep dive into AES-256 encryption—the military-grade standard we use to protect your files.',
      date: 'January 12, 2026',
      category: 'Technology',
      readTime: '8 min read',
      image: '🛡️'
    },
    {
      title: 'Securing Remote Work File Transfers',
      excerpt: 'Essential tips for organizations enabling secure file sharing in distributed and remote work environments.',
      date: 'January 3, 2026',
      category: 'Enterprise',
      readTime: '5 min read',
      image: '💼'
    }
  ];

  const categories = ['All', 'Security', 'Guides', 'Features', 'Compliance', 'Technology', 'Enterprise'];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #060606, #0a0a0a)' }}>
      <Header />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 20px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            color: '#fff',
            marginBottom: '20px',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            Q-Safe Blog
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#888', 
            maxWidth: '700px', 
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Insights on security, encryption, and best practices for protecting your data.
          </p>
        </div>

        {/* Category Filter */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: '60px'
        }}>
          {categories.map((category, index) => (
            <button key={index} style={{
              padding: '10px 25px',
              background: index === 0 ? 'linear-gradient(135deg, #00d4ff, #0099cc)' : '#0a0a0a',
              border: index === 0 ? 'none' : '1px solid #333',
              borderRadius: '25px',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (index !== 0) {
                e.currentTarget.style.borderColor = '#00d4ff';
                e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (index !== 0) {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.background = '#0a0a0a';
              }
            }}>
              {category}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '30px',
          marginBottom: '80px'
        }}>
          {blogPosts.map((post, index) => (
            <article key={index} style={{
              background: 'linear-gradient(135deg, #0a0a0a, #111)',
              border: '1px solid #222',
              borderRadius: '12px',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
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
            }}>
              {/* Image */}
              <div style={{
                background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                height: '180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem'
              }}>
                {post.image}
              </div>

              {/* Content */}
              <div style={{ padding: '25px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <span style={{
                    padding: '5px 12px',
                    background: 'rgba(0, 212, 255, 0.1)',
                    border: '1px solid #00d4ff',
                    borderRadius: '15px',
                    color: '#00d4ff',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    {post.category}
                  </span>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    color: '#888'
                  }}>
                    {post.readTime}
                  </span>
                </div>

                <p style={{ 
                  fontSize: '1rem', 
                  color: '#888',
                  margin: 0
                }}>
                  📚 Looking for older posts? Archive coming soon.
                </p>
                  {post.title}
                </h3>

                <p style={{ 
                  fontSize: '0.95rem', 
                  color: '#aaa', 
                  lineHeight: '1.6',
                  marginBottom: '20px'
                }}>
                  {post.excerpt}
                </p>

                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '15px',
                  borderTop: '1px solid #222'
                }}>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    color: '#888'
                  }}>
                    {post.date}
                  </span>
                  <span style={{
                    color: '#00d4ff',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    Read More →
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div style={{
          textAlign: 'center',
          padding: '60px 40px',
          background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
          borderRadius: '16px',
          marginBottom: '60px'
        }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#fff',
            marginBottom: '15px'
          }}>
            Stay Updated
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#f0f0f0',
            marginBottom: '30px',
            maxWidth: '600px',
            margin: '0 auto 30px'
          }}>
            Subscribe to our newsletter for the latest security insights, product updates, and best practices.
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '15px',
            maxWidth: '500px',
            margin: '0 auto',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <input 
              type="email"
              placeholder="your.email@example.com"
              style={{
                flex: '1',
                minWidth: '250px',
                padding: '15px 20px',
                background: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <button style={{
              padding: '15px 35px',
              background: '#060606',
              border: '2px solid #060606',
              borderRadius: '8px',
              color: '#00d4ff',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#060606';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#060606';
              e.currentTarget.style.color = '#00d4ff';
            }}>
              Subscribe
            </button>
          </div>
        </div>

        {/* Archive Notice */}
        <div style={{
          textAlign: 'center',
          padding: '30px',
          background: '#0a0a0a',
          border: '1px solid #222',
          borderRadius: '12px'
        }}>
          <p style={{ 
            fontSize: '1rem', 
            color: '#888',
            margin: 0
          }}>
            📚 Looking for older posts? <Link to="/blog/archive" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: '600' }}>Browse our archive</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
