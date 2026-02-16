import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function About() {
  const values = [
    {
      icon: '🔒',
      title: 'Security First',
      description: 'We believe privacy is a fundamental right. Every decision we make prioritizes the security of your data.'
    },
    {
      icon: '🌟',
      title: 'User-Centric Design',
      description: 'Powerful security doesn\'t have to be complicated. We make encryption accessible to everyone.'
    },
    {
      icon: '🚀',
      title: 'Continuous Innovation',
      description: 'We constantly improve our platform with cutting-edge security features and user feedback.'
    },
    {
      icon: '🤝',
      title: 'Transparency',
      description: 'We\'re open about our security practices, data handling, and business operations.'
    }
  ];

  const team = [
    {
      role: 'Security',
      description: 'Cryptography experts and security researchers ensuring your data stays protected.'
    },
    {
      role: 'Development',
      description: 'Full-stack engineers building reliable, scalable infrastructure for secure file transfers.'
    },
    {
      role: 'Support',
      description: 'Dedicated team providing 24/7 assistance and ensuring your experience is seamless.'
    },
    {
      role: 'Compliance',
      description: 'Legal and compliance experts maintaining GDPR, HIPAA, and industry standards.'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #060606, #0a0a0a)' }}>
      <Header />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 20px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            color: '#fff',
            marginBottom: '20px',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            About Q-Safe
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#888', 
            maxWidth: '800px', 
            margin: '0 auto',
            lineHeight: '1.8'
          }}>
            We're on a mission to make military-grade file encryption accessible to everyone. 
            In a world where data breaches are common, we believe everyone deserves secure file transfer.
          </p>
        </div>

        {/* Mission Statement */}
        <div style={{
          background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
          borderRadius: '16px',
          padding: '60px 40px',
          marginBottom: '80px',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#fff',
            marginBottom: '25px'
          }}>
            Our Mission
          </h2>
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#f0f0f0',
            maxWidth: '900px',
            margin: '0 auto',
            lineHeight: '1.8'
          }}>
            To provide the most secure, user-friendly file transfer platform that empowers individuals 
            and organizations to share sensitive data without compromising on security or convenience.
          </p>
        </div>

        {/* Story Section */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#fff',
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            Our Story
          </h2>
          
          <div style={{
            background: '#0a0a0a',
            border: '1px solid #222',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#ccc', 
              lineHeight: '1.8',
              marginBottom: '20px'
            }}>
              Q-Safe was born from a simple observation: existing file transfer solutions either prioritize 
              convenience over security or security over usability. We asked ourselves—why can't we have both?
            </p>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#ccc', 
              lineHeight: '1.8',
              marginBottom: '20px'
            }}>
              In 2024, our founding team of security researchers and software engineers set out to build 
              a file transfer platform that wouldn't compromise. We wanted military-grade encryption that 
              your grandmother could use.
            </p>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#ccc', 
              lineHeight: '1.8',
              marginBottom: '20px'
            }}>
              Today, Q-Safe serves thousands of users worldwide—from healthcare professionals sharing 
              patient data to journalists protecting source materials. Our innovative features like offline 
              QR code transfers and IP locking set us apart in the industry.
            </p>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#ccc', 
              lineHeight: '1.8',
              margin: 0
            }}>
              But we're just getting started. We continue to innovate, listening to our users and staying 
              ahead of emerging security threats. Your trust is our responsibility, and we take it seriously.
            </p>
          </div>
        </div>

        {/* Values */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#fff',
            textAlign: 'center',
            marginBottom: '50px'
          }}>
            Our Values
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {values.map((value, index) => (
              <div key={index} style={{
                background: 'linear-gradient(135deg, #0a0a0a, #111)',
                border: '1px solid #222',
                borderRadius: '12px',
                padding: '35px',
                textAlign: 'center',
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
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>{value.icon}</div>
                <h3 style={{ 
                  fontSize: '1.4rem', 
                  fontWeight: '600', 
                  color: '#00d4ff',
                  marginBottom: '15px'
                }}>
                  {value.title}
                </h3>
                <p style={{ 
                  fontSize: '1rem', 
                  color: '#aaa', 
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#fff',
            textAlign: 'center',
            marginBottom: '50px'
          }}>
            Our Team
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '25px',
            marginBottom: '40px'
          }}>
            {team.map((dept, index) => (
              <div key={index} style={{
                background: '#0a0a0a',
                border: '1px solid #222',
                borderRadius: '12px',
                padding: '30px',
                borderLeft: '4px solid #00d4ff'
              }}>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '600', 
                  color: '#00d4ff',
                  marginBottom: '15px'
                }}>
                  {dept.role}
                </h3>
                <p style={{ 
                  fontSize: '0.95rem', 
                  color: '#aaa', 
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {dept.description}
                </p>
              </div>
            ))}
          </div>
          
          <p style={{ 
            textAlign: 'center', 
            fontSize: '1.1rem', 
            color: '#888',
            fontStyle: 'italic'
          }}>
            Our distributed team works from around the globe, united by a passion for security and privacy.
          </p>
        </div>

        {/* Stats */}
        <div style={{
          background: 'linear-gradient(135deg, #0a0a0a, #111)',
          border: '1px solid #222',
          borderRadius: '16px',
          padding: '60px 40px',
          marginBottom: '60px'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            textAlign: 'center'
          }}>
            {[
              { number: '50K+', label: 'Active Users' },
              { number: '2M+', label: 'Files Transferred' },
              { number: '99.9%', label: 'Uptime' },
              { number: '0', label: 'Data Breaches' }
            ].map((stat, index) => (
              <div key={index}>
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: '700', 
                  color: '#00d4ff',
                  marginBottom: '10px'
                }}>
                  {stat.number}
                </div>
                <div style={{ 
                  fontSize: '1.1rem', 
                  color: '#888',
                  fontWeight: '500'
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div style={{
          textAlign: 'center',
          padding: '60px 30px',
          background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
          borderRadius: '16px'
        }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#fff',
            marginBottom: '20px'
          }}>
            Join Thousands of Secure Users
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#f0f0f0',
            marginBottom: '30px'
          }}>
            Start protecting your file transfers with military-grade encryption today.
          </p>
          <Link to="/signup" style={{
            display: 'inline-block',
            padding: '15px 40px',
            background: '#060606',
            color: '#00d4ff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '1.1rem',
            transition: 'all 0.3s ease',
            border: '2px solid #060606',
            marginRight: '15px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#060606';
            e.currentTarget.style.transform = 'translateY(-3px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#060606';
            e.currentTarget.style.color = '#00d4ff';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            Get Started Free
          </Link>
          <Link to="/contact" style={{
            display: 'inline-block',
            padding: '15px 40px',
            background: 'transparent',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '1.1rem',
            transition: 'all 0.3s ease',
            border: '2px solid #fff'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#060606';
            e.currentTarget.style.transform = 'translateY(-3px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            Contact Us
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
