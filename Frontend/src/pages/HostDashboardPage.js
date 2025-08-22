import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getVisits, checkOutVisit } from '../utils/apiService';
import HostFooter from '../components/HostFooter';
import Navbar from '../components/Navbar';
import Pagination from '../components/Pagination';
import '../styles/HostDashboardPage.css';

const HostDashboardPage = () => {
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVisits, setTotalVisits] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Number of visits per page

  console.log('Rendering HostDashboardPage');

  useEffect(() => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem('user'));
      if (loggedInUser) {
        setUser(loggedInUser);
        console.log('User loaded:', loggedInUser);
      } else {
        setError('No user is logged in. Please log in again.');
        console.error('No user found in localStorage');
      }
    } catch (e) {
      setError('Could not retrieve user data. Please log in again.');
      console.error('Error parsing user data:', e);
    }
  }, []);

  const fetchHostVisits = useCallback(async (page = currentPage) => {
    if (!user) {
      console.log('No user, skipping fetchHostVisits');
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log('Fetching visits for host:', user.name, 'at company:', user.company_name, 'page:', page, 'limit:', itemsPerPage);

      // Backend gets host ID from JWT token, no need to pass hostId as parameter
      const response = await getVisits('host', {}, page, itemsPerPage);
      console.log('Visits response:', response);
      
      // Handle different response formats
      if (response.visits) {
        // Paginated response
        setVisits(response.visits);
        setTotalPages(response.totalPages || 1);
        setTotalVisits(response.totalVisits || 0);
        setCurrentPage(response.currentPage || page);
        console.log('✅ Paginated visits fetched:', {
          visitsCount: response.visits?.length || 0,
          currentPage: response.currentPage || page,
          totalPages: response.totalPages || 1,
          totalVisits: response.totalVisits || 0,
          requestedPage: page
        });
        // Debug: Log the first visit to check reason field
        if (response.visits && response.visits.length > 0) {
          console.log('🔍 First visit data:', {
            id: response.visits[0].id,
            reason: response.visits[0].reason,
            purpose_of_visit: response.visits[0].purpose_of_visit,
            allFields: Object.keys(response.visits[0])
          });
        }
      } else if (Array.isArray(response)) {
        // Non-paginated response (fallback)
        setVisits(response);
        setTotalPages(1);
        setTotalVisits(response.length);
        setCurrentPage(1);
        console.log('⚠️ Non-paginated visits fetched:', response?.length || 0, 'visits');
      } else {
        setVisits([]);
        setTotalPages(1);
        setTotalVisits(0);
        setCurrentPage(1);
        console.log('❌ No valid visits data received');
      }
    } catch (err) {
      console.error('Fetch visits error:', err.message);
      setError('Failed to load your visits. Please try refreshing the page.');
      setVisits([]);
      setTotalPages(1);
      setTotalVisits(0);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  }, [user, itemsPerPage, currentPage]);

  // Separate effect for initial load when user is available
  useEffect(() => {
    if (user) {
      fetchHostVisits(1); // Always start from page 1 on initial load
    }
  }, [user]); // Only depend on user, not fetchHostVisits

  // Separate effect for when itemsPerPage changes
  useEffect(() => {
    if (user && itemsPerPage) {
      setCurrentPage(1); // Reset to page 1 when items per page changes
      fetchHostVisits(1);
    }
  }, [itemsPerPage]); // Only when itemsPerPage changes

  const handleCheckOut = async (visitId) => {
    try {
      console.log('Checking out visit:', visitId);
      await checkOutVisit(visitId);
      // Refresh current page after checkout
      await fetchHostVisits(currentPage);
    } catch (err) {
      setError(`Failed to check out visitor: ${err.message}`);
      console.error('Checkout error:', err);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    console.log('Page change requested:', newPage, 'Current total pages:', totalPages);
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchHostVisits(newPage);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newLimit) => {
    console.log('Items per page change:', newLimit);
    setItemsPerPage(newLimit);
    // The useEffect for itemsPerPage will handle the reset and fetch
  };

  const handleLogout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="host-dashboard-bg">
      <Navbar 
        showAuthButtons={false}
        showMainLinks={false}
        isLoggedIn={true}
        onLogout={handleLogout}
        showDashboardTitle={true}
        dashboardTitle="Host Panel"
      />
      <div className="host-dashboard-container">
        <div className="host-dashboard-header-modern">
          <div>
            <h2 className="host-dashboard-title">Host Dashboard</h2>
            <p className="host-dashboard-subtitle">
              Welcome, {user ? user.name : 'Host'}
              {user && user.company_name && <span className="company-name"> - {user.company_name}</span>}
            </p>
          </div>
          <Link 
            to="/multiVisitor" 
            state={{ 
              hostId: user ? user.id : '', 
              hostName: user ? user.name : '', 
              companyName: user ? user.company_name : '' 
            }} 
            className="add-visitor-btn"
          >
            + Add Visitor
          </Link>
        </div>
        {error && <p className="host-dashboard-error">{error}</p>}
        {loading ? (
          <div className="loading-container">
            <p>Loading your visitors...</p>
          </div>
        ) : (
          <div className="host-dashboard-table-card">
            <div className="table-header">
              <h3>Your Visitors</h3>
              {totalVisits > 0 && (
                <span className="total-count">Total: {totalVisits} visits</span>
              )}
            </div>
            <table className="host-dashboard-table-modern">
              <thead>
                <tr>
                  <th>Visitor Name</th>
                  <th>Email</th>
                  <th>Photo</th>
                  <th>ID Card Photo</th>
                  <th>ID Number</th>
                  <th>Reason</th>
                  <th>Check-In Time</th>
                  <th>Check-Out Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visits.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="no-data">
                      {totalVisits === 0 ? 'You have no visitors currently.' : 'No visitors found on this page.'}
                    </td>
                  </tr>
                ) : (
                  visits.map((visit) => (
                    <tr key={visit.id}>
                      <td>{visit.visitorName}</td>
                      <td>{visit.visitorEmail}</td>
                      <td>
                        {(visit.visitorPhoto || visit.photo) && (
                          <img
                            src={visit.visitorPhoto || visit.photo}
                            alt="Visitor"
                            className="host-dashboard-photo"
                          />
                        )}
                      </td>
                      <td>
                        {visit.idCardPhoto && (
                          <img
                            src={visit.idCardPhoto}
                            alt="ID Card"
                            className="host-dashboard-photo"
                          />
                        )}
                      </td>
                      <td>
                        {visit.idCardNumber ? visit.idCardNumber : 'N/A'}
                      </td>
                      <td>
                        {/* Debug: Show what data is available */}
                        {(() => {
                          const reasonValue = visit.reason || 'N/A';
                          // Debug logging for this specific visit
                          if (visit.id) {
                            console.log(`Visit ${visit.id} reason data:`, {
                              reason: visit.reason,
                              final_value: reasonValue,
                              visitorName: visit.visitorName
                            });
                          }
                          return reasonValue;
                        })()}
                      </td>
                      <td>{new Date(visit.check_in_time).toLocaleString()}</td>
                      <td>
                        {visit.check_out_time
                          ? new Date(visit.check_out_time).toLocaleString()
                          : 'Checked In'}
                      </td>
                      <td>
                        {!visit.check_out_time ? (
                          <button
                            onClick={() => handleCheckOut(visit.id)}
                            className="host-dashboard-checkout-modern"
                          >
                            Check Out
                          </button>
                        ) : (
                          <span className="host-dashboard-checkedout">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination Component */}
            {totalVisits > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalVisits}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                showItemsPerPage={true}
                itemsPerPageOptions={[5, 10, 20, 50]}
              />
            )}
          </div>
        )}
      </div>
      
      <HostFooter />
    </div>
  );
};

export default HostDashboardPage;