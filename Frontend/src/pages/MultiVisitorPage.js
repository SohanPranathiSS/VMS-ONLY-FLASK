import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/MultiVisitorPage.css';

const MultiVisitorPage = () => {
    // Get the host information from the navigation state, with fallbacks.
    const location = useLocation();
    const { hostId, hostName, companyName } = location.state || { 
        hostId: '', 
        hostName: 'Host', 
        companyName: '' 
    };

    return (
        <div className="multi-visitor-container">
            <div className="multi-visitor-card">
                <h1 className="multi-visitor-title">Add a Visitor</h1>
                <p className="multi-visitor-subtitle">
                    How would you like to add the visitor's details?
                    {companyName && <span className="company-context"> (for {companyName})</span>}
                </p>
                
                



                {/* Action buttons to choose the method of adding a visitor */}
                <div className="multi-visitor-actions">
                
                
                  {/* Button to navigate to a future business card scanning page */}
                    <Link to="/scanCard1" state={{ hostId, hostName, companyName }} className="scan-card-btn">
                        Scan Business Card
                    </Link>



                    {/* Button to navigate to the QR code scanning page */}
                    <Link to="/scanQr" state={{ hostId, hostName, companyName }} className="scan-qr-btn">
                        Scan QR Code
                    </Link>

                
                    {/* Button to navigate to the manual check-in page */}
                    <Link to="/checkin" state={{ hostId, hostName, companyName }} className="manual-entry-btn">
                        Manually Enter the Data
                    </Link>
                    
                  

                </div>
            </div>
        </div>
    );
};

export default MultiVisitorPage;
