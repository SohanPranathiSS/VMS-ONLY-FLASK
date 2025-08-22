import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RazorpayPayment from '../components/RazorpayPayment';
import EmailVerificationModal from '../components/EmailVerificationModal';
import TrialRegistrationModal from '../components/TrialRegistrationModal';
import '../styles/PricingPage.css';
import { getPricingPlans } from '../utils/apiService';

const AdminPricingPage = () => {
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');

  const getCurrencySymbol = (code) => {
    const c = String(code || '').toUpperCase();
    switch (c) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'CNY': return '¥';
      case 'AUD': return 'A$';
      case 'CAD': return 'C$';
      case 'SGD': return 'S$';
      case 'AED': return 'د.إ';
      default: return c || '₹';
    }
  };

  const handlePaymentClick = (planName, amount, cycle, currency) => {
    // Obtain admin details from localStorage
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch { user = null; }
    const adminEmail = user?.email || localStorage.getItem('subscription_email') || '';
    if (adminEmail) {
      localStorage.setItem('subscription_email', adminEmail);
    }
    setSelectedPlan({ name: planName, amount: amount, billing_cycle: cycle, currency: currency, user });
    // Skip email modal and go straight to Razorpay
    setShowEmailModal(false);
  };

  const handleEmailVerified = (email) => {
    localStorage.setItem('subscription_email', email);
    setShowEmailModal(false);
  };

  const handleEmailModalClose = () => {
    setShowEmailModal(false);
    setSelectedPlan(null);
  };

  const handleShowTrialFromEmail = () => {
    setShowEmailModal(false);
    setShowTrialModal(true);
  };

  const handleTrialRegistered = (email) => {
    localStorage.setItem('subscription_email', email);
    alert('Your 7-day trial has been activated!');
    setShowTrialModal(false);
  };

  const handlePaymentSuccess = (response) => {
    console.log('Payment successful!', {
      plan: selectedPlan?.name,
      amount: selectedPlan?.amount,
      transactionId: response?.razorpay_payment_id || 'TEST_TRANSACTION'
    });
  setSelectedPlan(null);
  // Redirect to Admin Dashboard -> Subscription Details
  navigate('/admin', { state: { activeSection: 'subscription' } });
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    setSelectedPlan(null);
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoadingPlans(true);
        const resp = await getPricingPlans();
        const fetched = Array.isArray(resp?.plans) ? resp.plans : [];

        const order = ['basic', 'professional', 'enterprise'];
        fetched.sort((a, b) => {
          const ai = order.indexOf(String(a.plan_name || '').toLowerCase());
          const bi = order.indexOf(String(b.plan_name || '').toLowerCase());
          if (ai !== -1 && bi !== -1) return ai - bi;
          if (ai !== -1) return -1;
          if (bi !== -1) return 1;
          const ap = a.price ?? Number.POSITIVE_INFINITY;
          const bp = b.price ?? Number.POSITIVE_INFINITY;
          if (ap !== bp) return ap - bp;
          return String(a.plan_name).localeCompare(String(b.plan_name));
        });

        if (isMounted) {
          setPlans(fetched);
          setPlansError('');
        }
      } catch (e) {
        if (isMounted) setPlansError('Failed to load pricing plans');
      } finally {
        if (isMounted) setLoadingPlans(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="pricing-page">
  <Navbar showMainLinks={false} showAuthButtons={false} isLoggedIn={true} />

  {showEmailModal && selectedPlan && (
        <EmailVerificationModal
          planName={selectedPlan.name}
          planAmount={selectedPlan.amount}
          planCurrency={selectedPlan.currency}
          planBillingCycle={selectedPlan.billing_cycle}
          onSuccess={handleEmailVerified}
          onCancel={handleEmailModalClose}
          onShowTrial={handleShowTrialFromEmail}
        />
      )}

      {showTrialModal && (
        <TrialRegistrationModal
          onSuccess={handleTrialRegistered}
          onCancel={() => setShowTrialModal(false)}
        />
      )}

      <div className="pricing-hero">
        <div className="pricing-container">
          <h1>Plans & Pricing</h1>
          <p>Choose the plan that works best for your organization</p>
        </div>
      </div>

      <section className="pricing-plans">
        <div className="pricing-container">
          <div className="billing-toggle" style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                name="billingCycle"
                value="monthly"
                checked={billingCycle === 'monthly'}
                onChange={() => setBillingCycle('monthly')}
              />
              Monthly plan
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                name="billingCycle"
                value="yearly"
                checked={billingCycle === 'yearly'}
                onChange={() => setBillingCycle('yearly')}
              />
              Yearly plan (2 months free)
            </label>
          </div>
          {loadingPlans ? (
            <div>Loading plans...</div>
          ) : plansError ? (
            <div className="error">{plansError}</div>
          ) : (
            (() => {
              const filteredPlans = plans.filter(p => {
                const cycle = String(p.billing_cycle || '').toLowerCase();
                if (billingCycle === 'monthly') return cycle === 'monthly';
                return cycle === 'yearly' || cycle === 'annual';
              });
              if (!filteredPlans.length) {
                return <div style={{ textAlign: 'center', padding: '16px' }}>No plans available for the selected billing cycle.</div>;
              }
              return (
                <div className="pricing-grid">
                  {filteredPlans.map((plan) => {
                    const isEnterprise = (plan.price === null || plan.price === undefined) || /enterprise/i.test(plan.plan_name || '');
                    const showMostPopular = /professional/i.test(plan.plan_name || '');
                    const displayPrice = isEnterprise ? 'Custom' : `${getCurrencySymbol(plan.currency)}${plan.price}`;
                    const period = (String(plan.billing_cycle || '').toLowerCase() === 'yearly' || String(plan.billing_cycle || '').toLowerCase() === 'annual') ? '/year' : '/month';

                    return (
                      <div key={plan.id} className={`pricing-card ${showMostPopular ? 'featured' : ''}`}>
                        {showMostPopular && <div className="popular-tag">Most Popular</div>}
                        <div className="pricing-card-header">
                          <h3>{plan.plan_name}</h3>
                          <div className="pricing-price">
                            <span className="price">{displayPrice}</span>
                            {!isEnterprise && <span className="period">{period}</span>}
                          </div>
                          <p>{plan.description || (isEnterprise ? 'For large organizations' : 'Choose this plan')}</p>
                        </div>
                        <div className="pricing-card-body">
                          <ul className="pricing-features">
                            {(plan.features || []).map((f, idx) => (
                              <li key={idx}>{f.is_included ? '✓' : '✕'} {f.feature_name}</li>
                            ))}
                          </ul>
                          {isEnterprise ? (
                            <button 
                              className="pricing-btn"
                              onClick={() => window.location.href = "mailto:apps@pranathiss.com?subject=Enterprise%20Plan%20Inquiry"}
                            >
                              Contact Sales
                            </button>
                          ) : (
                            selectedPlan && selectedPlan.name === plan.plan_name && selectedPlan.billing_cycle === plan.billing_cycle && !showEmailModal ? (
                              <RazorpayPayment 
                                amount={plan.price}
                                currency={plan.currency || 'INR'}
                                planName={plan.plan_name}
                                billingCycle={plan.billing_cycle}
                                autoOpen={true}
                                customerName={selectedPlan?.user?.name || selectedPlan?.user?.full_name}
                                customerEmail={selectedPlan?.user?.email}
                                customerContact={selectedPlan?.user?.mobile_number || selectedPlan?.user?.phone}
                                onSuccess={handlePaymentSuccess} 
                                onFailure={handlePaymentFailure}
                              />
                            ) : (
                              <button 
                                className={`pricing-btn ${showMostPopular ? 'primary' : ''}`}
                                onClick={() => handlePaymentClick(plan.plan_name, plan.price, plan.billing_cycle, plan.currency)}
                              >
                                Get Started
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminPricingPage;
