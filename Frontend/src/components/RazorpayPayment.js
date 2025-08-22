import React, { useEffect } from 'react';
import axios from 'axios';

// RazorpayPayment component for handling payment integration
// Added support for autoOpen and customer prefill details
const RazorpayPayment = ({ amount, currency = 'INR', planName, billingCycle = 'monthly', onSuccess, onFailure, autoOpen = false, customerName, customerEmail, customerContact }) => {
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    const res = await loadRazorpayScript();
    
    if (!res) {
      alert('Razorpay SDK failed to load. Check your internet connection.');
      return;
    }

    try {
      // You would typically fetch this from your backend API
      // For demonstration purposes, we're creating it directly
      const options = {
        key: "rzp_test_R7YlLIhpaGugyd", // Enter the Key ID generated from the Dashboard
        amount: amount * 100, // Amount in smallest currency unit (paise for INR)
        currency: currency || "INR",
        name: "Visitor Management System",
        description: `Payment for ${planName} Plan`,
        image: "https://via.placeholder.com/150?text=VMS", // Placeholder image for testing
      handler: function (response) {
        // This function will be called on payment success
        // Send payment verification to your server
        verifyPayment(response);
      },
      prefill: {
        name: customerName || (JSON.parse(localStorage.getItem('user') || '{}')?.name) || 'Admin User',
        email: customerEmail || localStorage.getItem('subscription_email') || (JSON.parse(localStorage.getItem('user') || '{}')?.email) || 'admin@example.com',
        contact: customerContact || (JSON.parse(localStorage.getItem('user') || '{}')?.mobile_number) || '9999999999'
      },
      // Add these test mode options to make testing easier
      "readonly": {
        "email": false,
        "contact": false
      },
      // Add test card info in notes to help testers
      "notes": {
        "plan": planName,
        "test_info": "Use card: 4111 1111 1111 1111, Any future expiry, Any CVV"
      },
      theme: {
        color: "#3498db"
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
    
    paymentObject.on('payment.failed', function (response){
      console.error('Payment failed:', response.error);
      if (onFailure) onFailure(response.error);
    });
    } catch (error) {
      console.error('Error initializing Razorpay:', error);
      if (onFailure) onFailure({ message: 'Failed to initialize payment gateway' });
    }
  };

  // Auto-open Razorpay when requested
  useEffect(() => {
    if (autoOpen) {
      // slight delay to ensure component is mounted and script can attach properly
      const t = setTimeout(() => { handlePayment(); }, 50);
      return () => clearTimeout(t);
    }
  }, [autoOpen]);

  // Function to verify payment with backend
  const verifyPayment = async (response) => {
    try {
      console.log("Payment successful! Payment ID:", response.razorpay_payment_id);
      
      // Get email from localStorage (saved during email verification step)
      const email = localStorage.getItem('subscription_email');
      
      if (email) {
        console.log("Creating subscription for email:", email);
        
        // Try to create subscription record
        try {
          try {
            // Create subscription in the database
            await axios.post('http://localhost:4000/api/subscription/create', {
              email: email,
              planName: planName,
              amount: amount,
              paymentId: response.razorpay_payment_id,
              billingCycle: billingCycle
            });
            
            console.log('Subscription created successfully in database');
          } catch (err) {
            console.warn('Subscription API not available:', err);
            // Development mode - log what would have happened
            console.log('DEV MODE: Would have created subscription with:', {
              email,
              planName,
              amount,
              paymentId: response.razorpay_payment_id,
              billingCycle
            });
          }
          
          // Clear the email from localStorage
          localStorage.removeItem('subscription_email');
        } catch (apiError) {
          console.warn('Could not save subscription, continuing with payment success:', apiError);
        }
      } else {
        console.warn('No email found in localStorage for subscription creation');
      }
      
      // Skip backend payment verification for now and treat all payments as successful
      // This is for development purposes only!
      if (onSuccess) onSuccess(response);
    } catch (error) {
      console.error('Payment verification error:', error);
      if (onFailure) onFailure(error);
    }
  };

  return (
    <button 
      className="razorpay-payment-button" 
      onClick={handlePayment}
    >
      Pay with Razorpay
    </button>
  );
};

export default RazorpayPayment;
