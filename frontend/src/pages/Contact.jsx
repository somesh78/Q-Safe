import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would send to your backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contactMethods = [
    {
      icon: '📧',
      title: 'Email Support',
      description: 'Get help from our support team',
      contact: 'support@q-safe.live',
      action: 'mailto:support@q-safe.live'
    },
    {
      icon: '💼',
      title: 'Sales Inquiries',
      description: 'Interested in Enterprise plans?',
      contact: 'sales@q-safe.live',
      action: 'mailto:sales@q-safe.live'
    },
    {
      icon: '🔒',
      title: 'Security Issues',
      description: 'Report security vulnerabilities',
      contact: 'security@q-safe.live',
      action: 'mailto:security@q-safe.live'
    },
    {
      icon: '📞',
      title: 'Phone Support',
      description: 'Enterprise customers only',
      contact: '+1 (555) 123-4567',
      action: 'tel:+15551234567'
    }
  ];

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
            Get in Touch
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#888', 
            maxWidth: '700px', 
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Have questions? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Contact Methods */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '25px',
          marginBottom: '80px'
        }}>
          {contactMethods.map((method, index) => (
            <a key={index} href={method.action} style={{
              background: 'linear-gradient(135deg, #0a0a0a, #111)',
              border: '1px solid #222',
              borderRadius: '12px',
              padding: '30px',
              textAlign: 'center',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              display: 'block'
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
              <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>{method.icon}</div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#00d4ff',
                marginBottom: '10px'
              }}>
                {method.title}
              </h3>
              <p style={{ 
                fontSize: '0.9rem', 
                color: '#888', 
                marginBottom: '15px'
              }}>
                {method.description}
              </p>
              <p style={{ 
                fontSize: '0.95rem', 
                color: '#ccc',
                fontWeight: '500',
                margin: 0
              }}>
                {method.contact}
              </p>
            </a>
          ))}
        </div>

        {/* Contact Form */}
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{
            background: '#0a0a0a',
            border: '1px solid #222',
            borderRadius: '16px',
            padding: '50px'
          }}>
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              color: '#fff',
              marginBottom: '30px',
              textAlign: 'center'
            }}>
              Send Us a Message
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#ccc', 
                  marginBottom: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}>
                  Inquiry Type
                </label>
                <select 
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    background: '#060606',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00d4ff'}
                  onBlur={(e) => e.target.style.borderColor = '#333'}
                >
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="sales">Sales & Pricing</option>
                  <option value="security">Security Issue</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#ccc', 
                  marginBottom: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}>
                  Name *
                </label>
                <input 
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    background: '#060606',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00d4ff'}
                  onBlur={(e) => e.target.style.borderColor = '#333'}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#ccc', 
                  marginBottom: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}>
                  Email *
                </label>
                <input 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    background: '#060606',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00d4ff'}
                  onBlur={(e) => e.target.style.borderColor = '#333'}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#ccc', 
                  marginBottom: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}>
                  Subject *
                </label>
                <input 
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Brief subject of your message"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    background: '#060606',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00d4ff'}
                  onBlur={(e) => e.target.style.borderColor = '#333'}
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#ccc', 
                  marginBottom: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}>
                  Message *
                </label>
                <textarea 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Tell us how we can help..."
                  rows="6"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    background: '#060606',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00d4ff'}
                  onBlur={(e) => e.target.style.borderColor = '#333'}
                />
              </div>

              <button 
                type="submit"
                style={{
                  width: '100%',
                  padding: '15px',
                  background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 212, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {submitted ? '✓ Message Sent!' : 'Send Message'}
              </button>

              {submitted && (
                <p style={{ 
                  marginTop: '20px', 
                  textAlign: 'center', 
                  color: '#00d4ff',
                  fontSize: '0.95rem'
                }}>
                  Thank you! We'll get back to you within 24 hours.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Response Time */}
        <div style={{
          textAlign: 'center',
          marginTop: '60px',
          padding: '40px',
          background: 'linear-gradient(135deg, #0a0a0a, #111)',
          border: '1px solid #222',
          borderRadius: '12px'
        }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: '#00d4ff',
            marginBottom: '15px'
          }}>
            📬 Average Response Time
          </h3>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#ccc',
            margin: 0
          }}>
            General Inquiries: <strong style={{ color: '#fff' }}>24 hours</strong> • 
            Support Tickets: <strong style={{ color: '#fff' }}>4-8 hours</strong> • 
            Security Issues: <strong style={{ color: '#fff' }}>Immediate</strong>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
