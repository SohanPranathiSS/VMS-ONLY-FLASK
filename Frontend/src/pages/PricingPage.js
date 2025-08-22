import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RazorpayPayment from '../components/RazorpayPayment';
import EmailVerificationModal from '../components/EmailVerificationModal';
import TrialRegistrationModal from '../components/TrialRegistrationModal';
import '../styles/PricingPage.css';
import { getPricingPlans } from '../utils/apiService';

const PricingPage = () => {
  const [activeCategory, setActiveCategory] = useState('general-faqs');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  // Currency symbol helper
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

  // Handle FAQ category selection
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    
    // Update active classes on categories
    document.querySelectorAll('.faq-category-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`button[data-category="${category}"]`).classList.add('active');
    
    // Show the correct FAQ section
    document.querySelectorAll('.faq-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(category).classList.add('active');
  };
  
  // Handle FAQ accordion toggle
  const toggleFaqItem = (e) => {
    const faqItem = e.currentTarget.closest('.faq-item');
    
    // Close other open FAQs
    document.querySelectorAll('.faq-item.active').forEach(item => {
      if (item !== faqItem) {
        item.classList.remove('active');
      }
    });
    
    // Toggle the clicked FAQ
    faqItem.classList.toggle('active');
  };
  
  // Function to handle payment button click
  const handlePaymentClick = (planName, amount, cycle, currency) => {
    setSelectedPlan({ name: planName, amount: amount, billing_cycle: cycle, currency: currency });
    setShowEmailModal(true);
  };
  
  // Handle email verification success
  const handleEmailVerified = (email) => {
    // Store email in localStorage for subscription creation after payment
    localStorage.setItem('subscription_email', email);
    
    // Close the email verification modal
    setShowEmailModal(false);
    
    // Show a brief confirmation message
    const confirmationMsg = document.createElement('div');
    confirmationMsg.className = 'email-confirmation-message';
    confirmationMsg.textContent = `Verified ${email} - Please proceed with payment`;
    confirmationMsg.style.position = 'fixed';
    confirmationMsg.style.top = '20px';
    confirmationMsg.style.left = '50%';
    confirmationMsg.style.transform = 'translateX(-50%)';
    confirmationMsg.style.backgroundColor = '#d4edda';
    confirmationMsg.style.color = '#155724';
    confirmationMsg.style.padding = '10px 20px';
    confirmationMsg.style.borderRadius = '4px';
    confirmationMsg.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    confirmationMsg.style.zIndex = '1000';
    
    document.body.appendChild(confirmationMsg);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(confirmationMsg)) {
        document.body.removeChild(confirmationMsg);
      }
    }, 3000);
  };
  
  // Handle email verification failure (email not registered)
  const handleEmailNotVerified = () => {
    // You may choose to offer trial explicitly from the email modal UI
    setShowEmailModal(false);
  };
  
  // Handle email modal close (cancel button) - only close and reset selected plan
  const handleEmailModalClose = () => {
    setShowEmailModal(false);
    setSelectedPlan(null); // Reset so pricing cards show "Get Started" again
  };

  // Explicitly show Trial Registration when requested from email modal
  const handleShowTrialFromEmail = () => {
    setShowEmailModal(false);
    setShowTrialModal(true);
  };
  
  // Handle trial registration success
  const handleTrialRegistered = (email) => {
    // Store email for future use
    localStorage.setItem('subscription_email', email);
    
    // Show success message
    alert('Your 7-day trial has been activated! You can now explore all features.');
    
    // Close the trial modal
    setShowTrialModal(false);
  };
  
  // Handle payment success
  const handlePaymentSuccess = (response) => {
    // Create transaction ID display with fallback
    const transactionId = response?.razorpay_payment_id || 'TEST_TRANSACTION';
    
    // Log success information for debugging
    console.log('Payment successful!', {
      plan: selectedPlan?.name,
      amount: selectedPlan?.amount,
      transactionId: transactionId
    });
    
    // Show a more user-friendly success message
    const successMessage = document.createElement('div');
    successMessage.className = 'payment-success-message';
    successMessage.innerHTML = `
      <div class="payment-success-inner">
        <div class="payment-success-icon">✓</div>
        <h3>Payment Successful!</h3>
        <p>Thank you for your purchase of the ${selectedPlan?.name} plan.</p>
        <p>Transaction ID: ${transactionId}</p>
        <p><small>Note: This is a test payment and no actual charges were made.</small></p>
        <button class="payment-success-button">Continue</button>
      </div>
    `;
    document.body.appendChild(successMessage);
    
    // Add event listener to close message
    const continueButton = successMessage.querySelector('.payment-success-button');
    if (continueButton) {
      continueButton.addEventListener('click', () => {
        if (successMessage && document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      });
    }
    
    // Reset the selected plan
    setSelectedPlan(null);
    
    // In a real application, you would typically:
    // 1. Save the subscription to the user's account
    // 2. Update the UI to reflect the new subscription status
    // 3. Redirect to a thank you page or dashboard
    // window.location.href = '/dashboard';
  };
  
  // Handle payment failure
  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    
    // Create a more user-friendly error message modal instead of an alert
    const errorMessage = document.createElement('div');
    errorMessage.className = 'payment-success-message'; // Reuse the styling
    errorMessage.innerHTML = `
      <div class="payment-success-inner payment-error-inner">
        <div class="payment-error-icon">✕</div>
        <h3>Payment Failed</h3>
        <p>Sorry, we couldn't process your payment at this time.</p>
        <p>Error: ${error?.message || error?.description || 'Unknown error'}</p>
        <p><small>This is a test environment. No charges were made.</small></p>
        <button class="payment-success-button">Try Again</button>
      </div>
    `;
    document.body.appendChild(errorMessage);
    
    // Add event listener to close message
    const tryAgainButton = errorMessage.querySelector('.payment-success-button');
    if (tryAgainButton) {
      tryAgainButton.addEventListener('click', () => {
        if (errorMessage && document.body.contains(errorMessage)) {
          document.body.removeChild(errorMessage);
        }
      });
    }
    
    // Reset the selected plan
    setSelectedPlan(null);
  };

  // Fetch pricing plans
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoadingPlans(true);
        const resp = await getPricingPlans();
        // resp expected: { success: true, plans: [...] }
        const fetched = Array.isArray(resp?.plans) ? resp.plans : [];

        // Sort to ensure a user-friendly order: Basic, Professional, Enterprise if present
        const order = ['basic', 'professional', 'enterprise'];
        fetched.sort((a, b) => {
          const ai = order.indexOf(String(a.plan_name || '').toLowerCase());
          const bi = order.indexOf(String(b.plan_name || '').toLowerCase());
          if (ai !== -1 && bi !== -1) return ai - bi;
          if (ai !== -1) return -1;
          if (bi !== -1) return 1;
          // otherwise by price then name
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

  // Initialize event listeners after component mounts
  useEffect(() => {
    // Initialize FAQ question click handlers
    document.querySelectorAll('.faq-question').forEach(question => {
      question.addEventListener('click', toggleFaqItem);
    });
    
    // Initialize category button click handlers
    document.querySelectorAll('.faq-category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.getAttribute('data-category');
        handleCategoryChange(category);
      });
    });
    
    // Cleanup event listeners on unmount
    return () => {
      document.querySelectorAll('.faq-question').forEach(question => {
        question.removeEventListener('click', toggleFaqItem);
      });
    };
  }, []);
  
  return (
    <div className="pricing-page">
      <Navbar showMainLinks={true} showAuthButtons={true} />
      
      {/* Email Verification Modal */}
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
      
      {/* Trial Registration Modal */}
      {showTrialModal && (
        <TrialRegistrationModal
          onSuccess={handleTrialRegistered}
          onCancel={() => setShowTrialModal(false)}
        />
      )}
      
      <div className="pricing-hero">
        <div className="pricing-container">
          <h1>Simple, Transparent Pricing</h1>
          <p>Choose the plan that works best for your organization</p>
        </div>
      </div>

      <section className="pricing-plans">
        <div className="pricing-container">
          {/* Billing cycle toggle */}
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
            selectedPlan && selectedPlan.name === plan.plan_name && selectedPlan.billing_cycle === plan.billing_cycle && !showEmailModal && localStorage.getItem('subscription_email') ? (
                          <RazorpayPayment 
                            amount={plan.price}
              currency={plan.currency || 'INR'}
                            planName={plan.plan_name}
              billingCycle={plan.billing_cycle}
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

      <section className="pricing-faq">
        <div className="pricing-container">
          <h2>Frequently Asked Questions</h2>
          
          <div className="faq-categories">
            <button className="faq-category-btn active" data-category="general-faqs">General</button>
            <button className="faq-category-btn" data-category="billing-faqs">Billing</button>
            <button className="faq-category-btn" data-category="features-faqs">Features</button>
            <button className="faq-category-btn" data-category="support-faqs">Support</button>
          </div>
          
          <div className="faq-grid">
            {/* General Questions */}
            <div className="faq-section active" id="general-faqs">
              <div className="faq-item">
                <div className="faq-question">
                  <h3>How does your pricing structure work?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>Our pricing is based on a monthly or annual subscription model with three tiers: Basic, Professional, and Enterprise. Each tier includes specific features and visitor limits. The Basic plan supports up to 100 visitors per month, while the Professional plan allows unlimited visitors. Enterprise plans are custom-tailored to your organization's specific needs.</p>
                </div>
              </div>
              
              <div className="faq-item">
                <div className="faq-question">
                  <h3>Is there a free trial available?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>Yes, we offer a 14-day free trial on all our plans with no credit card required. During your trial, you'll have access to all features of the Professional plan to help you evaluate if our visitor management system meets your needs.</p>
                </div>
              </div>
              
              <div className="faq-item">
                <div className="faq-question">
                  <h3>What happens if I exceed my monthly visitor limit?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>For the Basic plan, if you exceed your 100 visitor limit, you'll be charged $0.50 per additional visitor for that month. We'll notify you when you're approaching your limit so you can decide whether to upgrade to the Professional plan or pay for the additional visitors.</p>
                </div>
              </div>
              
              <div className="faq-item">
                <div className="faq-question">
                  <h3>How do you define a "visitor" for billing purposes?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>A "visitor" is defined as a unique individual who checks in through our system within a given month. If the same person visits multiple times in the same month, they count as a single visitor for billing purposes. This helps businesses with frequent returning visitors save on costs.</p>
                </div>
              </div>
            </div>
            
            {/* Billing Questions */}
            <div className="faq-section" id="billing-faqs">
              <div className="faq-item">
                <div className="faq-question">
                  <h3>Do you offer discounts for annual billing?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>Yes, we offer a 15% discount for annual billing on all our plans. This not only saves you money but also ensures uninterrupted service for your visitor management needs throughout the year.</p>
                </div>
              </div>
              
              <div className="faq-item">
                <div className="faq-question">
                  <h3>Can I upgrade or downgrade my plan?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>Absolutely! You can change your plan at any time through your account dashboard. When upgrading, the new features will be immediately available, and we'll prorate the charges for the remainder of your billing cycle. When downgrading, changes will take effect at the start of your next billing cycle.</p>
                </div>
              </div>
              
              <div className="faq-item">
                <div className="faq-question">
                  <h3>What payment methods do you accept?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>We accept all major credit cards (Visa, MasterCard, American Express, Discover) and direct bank transfers for annual subscriptions. Enterprise customers also have the option for invoiced payments with net-30 terms.</p>
                </div>
              </div>
              
              <div className="faq-item">
                <div className="faq-question">
                  <h3>Is there an additional cost for multiple locations?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>The Basic and Professional plans are designed for single locations. For multiple locations, we offer discounted pricing on our Enterprise plan based on the number of locations and total visitor volume. Please contact our sales team for a custom quote.</p>
                </div>
              </div>
            </div>
            
            {/* Features Questions */}
            <div className="faq-section" id="features-faqs">
              <div className="faq-item">
                <div className="faq-question">
                  <h3>What features are included in the Basic plan?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>The Basic plan includes essential visitor management features such as digital check-in, email notifications to hosts, visitor badges, standard reports, and a visitor log. It's ideal for small businesses with up to 100 monthly visitors who need a simple, effective solution.</p>
                </div>
              </div>
              
              <div className="faq-item">
                <div className="faq-question">
                  <h3>What additional features does the Professional plan offer?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>The Professional plan includes everything in Basic plus unlimited visitors, advanced check-in features, customizable workflows, pre-registration functionality, business card scanning for quick check-in, custom visitor badges, advanced reporting with analytics, and integration capabilities with popular calendar and messaging apps.</p>
                </div>
              </div>
              
              <div className="faq-item">
                <div className="faq-question">
                  <h3>Does the system work offline if internet connectivity is lost?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>Yes, our Professional and Enterprise plans include offline mode functionality. The system will continue to operate during internet outages and automatically sync data once connection is restored, ensuring your visitor management process remains uninterrupted.</p>
                </div>
              </div>
              
              <div className="faq-item">
                <div className="faq-question">
                  <h3>Can I customize the visitor check-in experience with my company branding?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>Basic branding options like adding your logo are available on all plans. The Professional plan allows for customization of the visitor check-in interface with your colors and welcome message. Enterprise plans offer complete white-labeling options and custom branded visitor badges.</p>
                </div>
              </div>
            </div>
            
            {/* Support Questions */}
            <div className="faq-section" id="support-faqs">
              <div className="faq-item">
                <div className="faq-question">
                  <h3>What kind of support do you offer?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>Basic plan customers receive email support with a 24-hour response time. Professional plan customers get email and chat support with a 12-hour response time. Enterprise customers enjoy priority support with dedicated account managers, phone support, and a guaranteed 4-hour response time.</p>
                </div>
              </div>
              
              <div className="faq-item">
                <div className="faq-question">
                  <h3>Do you provide onboarding and training?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>All plans include access to our knowledge base and video tutorials. Professional plans include a one-hour virtual onboarding session. Enterprise plans offer comprehensive onboarding with custom training sessions for your team and ongoing quarterly review meetings.</p>
                </div>
              </div>
              
              <div className="faq-item">
                <div className="faq-question">
                  <h3>What is your uptime guarantee?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>We guarantee 99.9% uptime for all our plans. Enterprise customers receive a Service Level Agreement (SLA) with compensation for any downtime exceeding our guaranteed uptime percentage. Our system is hosted on redundant servers with regular backups to ensure reliability.</p>
                </div>
              </div>
              
              <div className="faq-item">
                <div className="faq-question">
                  <h3>Is there a contract or commitment period?</h3>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>Monthly plans can be cancelled at any time with no commitment. Annual plans offer significant savings but require a one-year commitment. Enterprise plans typically have a minimum term of one year with customized renewal terms based on your organization's needs.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="faq-contact">
            <p>Still have questions? Contact our sales team at <a href="mailto:apps@pranathiss.com">apps@pranathiss.com</a> or call us at <a href="tel:+91 9347500901">+91 9347500901</a>.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;
