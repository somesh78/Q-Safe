import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for personal use and testing',
      features: [
        '100 MB per file',
        '10 uploads per day',
        'Basic encryption (AES-256)',
        'Online & offline modes',
        'Password protection',
        '24-hour expiration max',
        '5 downloads per file',
        'Community support'
      ],
      cta: 'Get Started',
      popular: false,
      gradient: 'linear-gradient(135deg, #0a0a0a, #111)'
    },
    {
      name: 'Professional',
      price: '$9.99',
      period: 'per month',
      description: 'For professionals and small teams',
      features: [
        '5 GB per file',
        'Unlimited uploads',
        'Military-grade encryption',
        'Advanced security features',
        'IP locking',
        '30-day expiration max',
        'Unlimited downloads',
        'Audit logs & analytics',
        'Priority support',
        'Custom branding',
        'API access'
      ],
      cta: 'Start Free Trial',
      popular: true,
      gradient: 'linear-gradient(135deg, #00d4ff, #0099cc)'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For organizations with advanced needs',
      features: [
        'Unlimited file size',
        'Unlimited uploads',
        'Advanced encryption options',
        'Single Sign-On (SSO)',
        'Dedicated infrastructure',
        'Custom expiration policies',
        'Advanced audit & compliance',
        'SLA guarantee (99.9% uptime)',
        'Dedicated account manager',
        '24/7 premium support',
        'Custom integrations',
        'On-premise deployment option'
      ],
      cta: 'Contact Sales',
      popular: false,
      gradient: 'linear-gradient(135deg, #1a1a1a, #222)'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #060606, #0a0a0a)' }}>
      <Header />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 20px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            color: '#fff',
            marginBottom: '20px',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            Simple, Transparent Pricing
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#888', 
            maxWidth: '700px', 
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Choose the plan that fits your needs. All plans include our core security features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '30px',
          marginBottom: '60px'
        }}>
          {plans.map((plan, index) => (
            <div key={index} style={{
              background: plan.popular ? plan.gradient : '#0a0a0a',
              border: plan.popular ? 'none' : '1px solid #222',
              borderRadius: '16px',
              padding: plan.popular ? '40px 30px' : '30px',
              position: 'relative',
              transition: 'all 0.3s ease',
              transform: plan.popular ? 'scale(1.05)' : 'scale(1)'
            }}
            onMouseEnter={(e) => {
              if (!plan.popular) {
                e.currentTarget.style.borderColor = '#00d4ff';
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 212, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!plan.popular) {
                e.currentTarget.style.borderColor = '#222';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#060606',
                  color: '#00d4ff',
                  padding: '5px 20px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  border: '2px solid #00d4ff'
                }}>
                  MOST POPULAR
                </div>
              )}

              <h3 style={{ 
                fontSize: '1.75rem', 
                fontWeight: '700', 
                color: plan.popular ? '#fff' : '#00d4ff',
                marginBottom: '10px',
                textAlign: 'center'
              }}>
                {plan.name}
              </h3>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ 
                  fontSize: '3rem', 
                  fontWeight: '700', 
                  color: plan.popular ? '#fff' : '#fff'
                }}>
                  {plan.price}
                </span>
                <span style={{ 
                  fontSize: '1rem', 
                  color: plan.popular ? '#f0f0f0' : '#888',
                  marginLeft: '5px'
                }}>
                  /{plan.period}
                </span>
              </div>

              <p style={{ 
                fontSize: '0.95rem', 
                color: plan.popular ? '#f0f0f0' : '#aaa',
                textAlign: 'center',
                marginBottom: '30px',
                minHeight: '45px'
              }}>
                {plan.description}
              </p>

              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                marginBottom: '30px' 
              }}>
                {plan.features.map((feature, idx) => (
                  <li key={idx} style={{ 
                    padding: '12px 0',
                    color: plan.popular ? '#f0f0f0' : '#ccc',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: idx < plan.features.length - 1 ? `1px solid ${plan.popular ? 'rgba(255,255,255,0.1)' : '#1a1a1a'}` : 'none'
                  }}>
                    <span style={{ color: plan.popular ? '#fff' : '#00d4ff', marginRight: '10px' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link to={plan.name === 'Enterprise' ? '/contact' : '/signup'} style={{
                display: 'block',
                padding: '15px 30px',
                background: plan.popular ? '#060606' : '#00d4ff',
                color: plan.popular ? '#00d4ff' : '#060606',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                border: plan.popular ? '2px solid #060606' : 'none'
              }}
              onMouseEnter={(e) => {
                if (plan.popular) {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.color = '#060606';
                } else {
                  e.currentTarget.style.background = '#00b8e6';
                }
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                if (plan.popular) {
                  e.currentTarget.style.background = '#060606';
                  e.currentTarget.style.color = '#00d4ff';
                } else {
                  e.currentTarget.style.background = '#00d4ff';
                }
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div style={{ maxWidth: '800px', margin: '80px auto 0' }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#fff',
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            Frequently Asked Questions
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { q: 'Can I change plans later?', a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.' },
              { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.' },
              { q: 'Is there a free trial for paid plans?', a: 'Yes, Professional plans include a 14-day free trial. No credit card required.' },
              { q: 'What happens to my data if I downgrade?', a: 'Your existing uploads remain accessible, but new uploads will follow your plan limits.' }
            ].map((faq, index) => (
              <div key={index} style={{
                background: '#0a0a0a',
                border: '1px solid #222',
                borderRadius: '12px',
                padding: '25px',
              }}>
                <h4 style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600', 
                  color: '#00d4ff',
                  marginBottom: '10px'
                }}>
                  {faq.q}
                </h4>
                <p style={{ 
                  fontSize: '0.95rem', 
                  color: '#aaa', 
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>      <Footer />    </div>
  );
}
