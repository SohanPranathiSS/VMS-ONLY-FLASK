import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  getUsers, 
  getVisits, 
  createUser, 
  getVisitorHistory, 
  getPendingVisitors, 
  getBlacklistedVisitors,
  updateVisitorBlacklist,
  getReports,
  exportReport,
  preRegisterVisitor, 
  getPreRegistrations, 
  generateVisitorBadge, 
  generatePreRegistrationBadge, 
  getRecurringVisits,
  updateRecurringVisit,
  generateRecurringInstances,
  getSystemSettings, 
  updateSystemSettings, 
  createAdminUser, 
  updateUser, 
  deleteUser,
  exportSystemData,
  importSystemData,
  getAuditLogs,
  getSystemBackups,
  createBackup,
  restoreBackup
} from '../utils/apiService';
import AdminFooter from '../components/AdminFooter';
import Navbar from '../components/Navbar';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import '../styles/AdminDashboardPage.css';
import '../styles/AdvancedVisitorPage.css';
import '../styles/ReportsPage.css';
import '../styles/SystemAdminPage.css';
import '../styles/SystemAdminScrollable.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

console.log('autoTable function:', typeof autoTable);

const AdminDashboardPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Admin Dashboard States
  const [users, setUsers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    hostName: '',
    visitorName: '',
    visitorId: ''
  });
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Host', // Default to Host
    mobile_number: '',
    department: '',
    designation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeSubSection, setActiveSubSection] = useState('visitor-dashboard');
  const [activeSubSubSection, setActiveSubSubSection] = useState('visitor-status-metrics');
  const [userRole, setUserRole] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [showVisitorDetails, setShowVisitorDetails] = useState(false);

  // Master data states for consistency across all sections
  const [masterVisitsData, setMasterVisitsData] = useState([]);
  const [masterPreRegistrationsData, setMasterPreRegistrationsData] = useState([]);
  const [masterBlacklistedData, setMasterBlacklistedData] = useState([]);
  const [dataLastFetched, setDataLastFetched] = useState(null);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  const [blacklistedVisitors, setBlacklistedVisitors] = useState([]);
  const [showOverstayModal, setShowOverstayModal] = useState(false);
  const [overstayVisitors, setOverstayVisitors] = useState([]);
  const [showIncompleteCheckoutsModal, setShowIncompleteCheckoutsModal] = useState(false);
  const [incompleteCheckoutVisitors, setIncompleteCheckoutVisitors] = useState([]);
  const [showTotalVisitorsModal, setShowTotalVisitorsModal] = useState(false);
  const [showCheckedInVisitorsModal, setShowCheckedInVisitorsModal] = useState(false);
  const [showPendingVisitorsModal, setShowPendingVisitorsModal] = useState(false);
  const [showExpectedVisitorsModal, setShowExpectedVisitorsModal] = useState(false);
  const [showCheckedOutVisitorsModal, setShowCheckedOutVisitorsModal] = useState(false);
  const [showBlacklistedVisitorsModal, setShowBlacklistedVisitorsModal] = useState(false);
  const [showSecurityIncidentsModal, setShowSecurityIncidentsModal] = useState(false);
  const [securityIncidentsData, setSecurityIncidentsData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [visitorsPerPage] = useState(10);
  const [activeVisitorTab, setActiveVisitorTab] = useState('all');
  const [expandedMenus, setExpandedMenus] = useState({
    dashboard: true,
    visitorLogs: false,
    manageUsers: false,
    visitorDashboard: true,
    hrDashboard: false,
    visitorDashboardLogs: false,
    hrDashboardLogs: false,
    reports: false,
    advancedVisitors: false,
    systemAdmin: false
  });
  const [visitorCounts, setVisitorCounts] = useState({
    all: 0,
    'checked-in': 0,
    pending: 0,
    expected: 0,
    'checked-out': 0,
    blacklisted: 0
  });
  const [visitorTypeCounts, setVisitorTypeCounts] = useState({
    guests: 0,
    vendors: 0,
    interviewees: 0,
    contractors: 0,
    delivery: 0,
    maintenance: 0,
    clients: 0,
    partners: 0,
    other: 0
  });
  // Add state to persist overview statistics
  const [overviewStats, setOverviewStats] = useState({
    totalVisitors: 0,
    uniqueVisitors: 0,
    avgDuration: 0,
    peakHour: 'N/A',
    noShows: 0,
    securityIncidents: 0,
    blacklistedIncidents: 0,
    overstayIncidents: 0
  });
  
  // Add state to persist security insights statistics
  const [securityStats, setSecurityStats] = useState({
    blacklistedAttempts: [],
    overstays: [],
    incompleteCheckouts: [],
    afterHoursVisits: [],
    frequentVisitors: [],
    noShows: [],
    securityScore: 100,
    totalIncidents: 0,
    riskLevel: 'Low'
  });
  
  const [reportData, setReportData] = useState(null);
  const [reportDateRange, setReportDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [activeReportTab, setActiveReportTab] = useState('overview');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Advanced Visitor States
  const [activeTab, setActiveTab] = useState('preregister');
  const [preRegistrations, setPreRegistrations] = useState([]);
  const [recurringVisits, setRecurringVisits] = useState([]);
  const [visitorHistory, setVisitorHistory] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({
    startDate: '',
    endDate: '',
    visitorEmail: '',
    hostName: ''
  });
  
  // Separate pagination state for visitor history
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(5); // Configurable items per page for history
  
  // Separate pagination state for visitor logs
  const [visitorLogsCurrentPage, setVisitorLogsCurrentPage] = useState(1);
  const [visitorLogsItemsPerPage, setVisitorLogsItemsPerPage] = useState(5); // Configurable items per page for visitor logs
  const [preRegForm, setPreRegForm] = useState({
    visitorName: '',
    visitorEmail: '',
    visitorPhone: '',
    visitorCompany: '',
    hostName: '',
    visitDate: '',
    visitTime: '',
    purpose: '',
    duration: '',
    isRecurring: false,
    recurringPattern: 'weekly',
    recurringEndDate: '',
    specialRequirements: '',
    emergencyContact: '',
    vehicleNumber: '',
    numberOfVisitors: 1
  });
  const [qrCodeData, setQrCodeData] = useState(null);
  const [badgeData, setBadgeData] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [message, setMessage] = useState('');

  // System Admin States
  const [systemAdminActiveTab, setSystemAdminActiveTab] = useState('settings');
  const [systemSettings, setSystemSettings] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    allowPreregistration: true,
    requireApproval: true,
    maxVisitorDuration: 8,
    workingHours: {
      start: '09:00',
      end: '18:00'
    },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: false,
      hostNotification: true,
      adminNotification: true
    },
    securityLevel: 'medium',
    dataRetentionDays: 365,
    backupFrequency: 'daily',
    maintenanceMode: false
  });
  const [systemUsers, setSystemUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [backupProgress, setBackupProgress] = useState(0);
  const [auditFilters, setAuditFilters] = useState({
    startDate: '',
    endDate: '',
    action: '',
    username: ''
  });
  const [newAdminUser, setNewAdminUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'host',
    department: '',
    phone: '',
    isActive: true
  });
  const [editingUser, setEditingUser] = useState(null);

  // Handle navigation from other pages
  useEffect(() => {
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection);
      if (location.state.activeSection === 'advanced-visitors') {
        setActiveTab('preregister');
      }
    }
  }, [location.state]);

  // Get user role and company info
  useEffect(() => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem('user'));
      if (loggedInUser && loggedInUser.role) {
        setUserRole(loggedInUser.role);
        if (loggedInUser.company_name) {
          setCompanyInfo({
            name: loggedInUser.company_name,
            adminName: loggedInUser.name,
            id: loggedInUser.company_id
          });
        }
      } else {
        setError('Could not determine user role. Please log in again.');
      }
    } catch (e) {
      setError('Could not retrieve user data. Please log in again.');
      console.error('Error parsing user data:', e);
    }

    const fetchAllUsers = async () => {
      try {
        console.log('🔄 Fetching users data from API...');
        const usersData = await getUsers();
        console.log('✅ Users data received:', usersData);
        console.log('📊 Number of users:', usersData?.length || 0);
        
        // Log detailed structure of first user if available
        if (usersData && usersData.length > 0) {
          console.log('👤 Sample user structure:', usersData[0]);
          console.log('🔍 Available fields:', Object.keys(usersData[0]));
        }
        
        setUsers(usersData);
        console.log('✅ Users state updated successfully');
      } catch (err) {
        console.error('❌ Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
      }
    };
    fetchAllUsers();
  }, []);

  // Apply client-side filtering for visits
  useEffect(() => {
    console.log('🔍 Client-side filtering triggered:', { activeVisitorTab, visitsLength: visits.length });
    
    if (activeVisitorTab === 'pending' || activeVisitorTab === 'blacklisted') {
      console.log('📋 Setting filtered visits directly for pending/blacklisted:', visits.length);
      setFilteredVisits(visits);
      return;
    }

    let filtered = [...visits];
    if (filters.visitorName) {
      filtered = filtered.filter(visit => 
        visit.visitorName?.toLowerCase().includes(filters.visitorName.toLowerCase()) ||
        visit.visitor_name?.toLowerCase().includes(filters.visitorName.toLowerCase())
      );
    }
    if (filters.visitorId) {
      filtered = filtered.filter(visit => 
        visit.id?.toString().includes(filters.visitorId) ||
        visit.visitor_id?.toString().includes(filters.visitorId)
      );
    }
    setFilteredVisits(filtered);
  }, [visits, filters, activeVisitorTab]);

  // Calculate statistics for current period using master data for consistency
  const calculateOverviewStats = useCallback(() => {
    if (!isInitialDataLoaded) return {
      totalVisitors: 0,
      uniqueVisitors: 0,
      avgDuration: 0,
      peakHour: 'N/A',
      noShows: 0,
      securityIncidents: 0,
      blacklistedIncidents: 0,
      overstayIncidents: 0
    };

    // Use complete master data instead of filteredVisits for consistency across all sections
    const allMasterData = [...masterVisitsData, ...masterPreRegistrationsData];
    
    // 1. Total Visitors: Only count visitors who actually checked in
    const checkedInVisitors = allMasterData.filter(visit => visit.check_in_time);
    const totalVisitors = checkedInVisitors.length;
    
    // Calculate unique visitors by email (only from checked-in visitors)
    const uniqueEmails = new Set(checkedInVisitors.map(visit => 
      visit.visitor_email || visit.visitorEmail || 'unknown'
    ).filter(email => email !== 'unknown'));
    const uniqueVisitors = uniqueEmails.size;
    
    // Calculate average duration for completed visits
    const completedVisits = allMasterData.filter(visit => 
      visit.check_in_time && visit.check_out_time
    );
    
    let avgDuration = 0;
    if (completedVisits.length > 0) {
      const totalDuration = completedVisits.reduce((sum, visit) => {
        const checkIn = new Date(visit.check_in_time);
        const checkOut = new Date(visit.check_out_time);
        return sum + (checkOut - checkIn) / (1000 * 60); // Convert to minutes
      }, 0);
      avgDuration = Math.round(totalDuration / completedVisits.length);
    }
    
    // Calculate peak hour (only from checked-in visitors)
    const hourCounts = {};
    checkedInVisitors.forEach(visit => {
      const hour = new Date(visit.check_in_time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHour = Object.entries(hourCounts).reduce((peak, [hour, count]) => 
      count > (hourCounts[peak] || 0) ? hour : peak, '0'
    );
    
    const peakHourFormatted = peakHour !== '0' ? 
      `${parseInt(peakHour)}:00 ${parseInt(peakHour) >= 12 ? 'PM' : 'AM'}` : 'N/A';
    
    // Calculate no-shows (pre-registrations that were never checked in)
    const noShows = allMasterData.filter(visit => 
      visit.isPreRegistration && !visit.check_in_time && 
      new Date(visit.visit_date) < new Date()
    ).length;
    
    // 2. Security Incidents: Include blacklisted visitors AND overstay incidents
    const now = new Date();
    
    // Blacklisted visitors
    const blacklistedIncidents = masterBlacklistedData.length;
    
    // Overstay incidents (visits longer than 8 hours)
    const overstayIncidents = allMasterData.filter(visit => {
      if (!visit.check_in_time) return false;
      const checkInTime = new Date(visit.check_in_time);
      const endTime = visit.check_out_time ? new Date(visit.check_out_time) : now;
      const hoursStayed = (endTime - checkInTime) / (1000 * 60 * 60);
      return hoursStayed > 8;
    }).length;
    
    // Total security incidents
    const securityIncidents = blacklistedIncidents + overstayIncidents;

    return {
      totalVisitors,
      uniqueVisitors,
      avgDuration,
      peakHour: peakHourFormatted,
      noShows,
      securityIncidents,
      blacklistedIncidents,
      overstayIncidents
    };
  }, [isInitialDataLoaded, masterVisitsData, masterPreRegistrationsData, masterBlacklistedData]);

  // Enhanced Security analytics calculations using master data for consistency
  const calculateSecurityInsights = useCallback(() => {
    if (!isInitialDataLoaded) return {
      blacklistedAttempts: [],
      overstays: [],
      incompleteCheckouts: [],
      afterHoursVisits: [],
      frequentVisitors: [],
      noShows: [],
      securityScore: 100,
      totalIncidents: 0,
      riskLevel: 'Low'
    };

    const now = new Date();
    
    // Use master data instead of filteredVisits for consistency
    const allMasterData = [...masterVisitsData, ...masterPreRegistrationsData];
    
    // Blacklisted visitor attempts
    const blacklistedAttempts = masterBlacklistedData;
    
    // Overstay incidents (visits longer than 8 hours)
    const overstays = allMasterData.filter(v => {
      if (!v.check_in_time) return false;
      const checkInTime = new Date(v.check_in_time);
      const endTime = v.check_out_time ? new Date(v.check_out_time) : now;
      const hoursStayed = (endTime - checkInTime) / (1000 * 60 * 60);
      return hoursStayed > 8;
    });
    
    // Incomplete checkouts (24+ hours without checkout)
    const incompleteCheckouts = allMasterData.filter(v => 
      v.check_in_time && 
      (!v.check_out_time || v.check_out_time.trim() === '') && 
      (now - new Date(v.check_in_time)) > 24 * 60 * 60 * 1000
    );
    
    // After-hours visits (before 8 AM or after 6 PM)
    const afterHoursVisits = allMasterData.filter(v => {
      if (!v.check_in_time) return false;
      const hour = new Date(v.check_in_time).getHours();
      return hour < 8 || hour > 18;
    });
    
    // Frequent visitors (5+ visits in the period)
    const visitorCounts = {};
    allMasterData.forEach(visit => {
      const email = visit.visitor_email || visit.visitorEmail || 'unknown';
      visitorCounts[email] = (visitorCounts[email] || 0) + 1;
    });
    const frequentVisitors = Object.entries(visitorCounts)
      .filter(([email, count]) => count >= 5 && email !== 'unknown')
      .sort((a, b) => b[1] - a[1]);
    
    // No-shows (scheduled but didn't arrive)
    const noShows = allMasterData.filter(visit => 
      visit.isPreRegistration && !visit.check_in_time && 
      new Date(visit.visit_date) < new Date()
    );
    
    // Security score calculation (0-100)
    let securityScore = 100;
    securityScore -= blacklistedAttempts.length * 10; // -10 per blacklisted attempt
    securityScore -= overstays.length * 5; // -5 per overstay
    securityScore -= incompleteCheckouts.length * 2; // -2 per incomplete checkout
    securityScore -= afterHoursVisits.length * 1; // -1 per after-hours visit
    securityScore = Math.max(0, securityScore); // Don't go below 0
    
    return {
      blacklistedAttempts,
      overstays,
      incompleteCheckouts,
      afterHoursVisits,
      frequentVisitors,
      noShows,
      securityScore,
      totalIncidents: blacklistedAttempts.length + overstays.length + incompleteCheckouts.length,
      riskLevel: securityScore > 80 ? 'Low' : securityScore > 60 ? 'Medium' : 'High'
    };
  }, [isInitialDataLoaded, masterVisitsData, masterPreRegistrationsData, masterBlacklistedData]);

  // Calculate previous period stats for comparison using master data for consistency
  const calculatePreviousStats = useCallback(() => {
    if (!isInitialDataLoaded) return {
      totalVisitors: 0,
      avgDuration: 0,
      securityIncidents: 0
    };

    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(currentDate.getTime() - (60 * 24 * 60 * 60 * 1000));
    
    // Use master data instead of filteredVisits for consistency
    const allMasterData = [...masterVisitsData, ...masterPreRegistrationsData];
    const previousPeriodVisits = allMasterData.filter(visit => {
      const visitDate = new Date(visit.visit_date || visit.check_in_time);
      return visitDate >= sixtyDaysAgo && visitDate < thirtyDaysAgo;
    });
    
    const totalVisitors = previousPeriodVisits.length;
    
    const completedVisits = previousPeriodVisits.filter(visit => 
      visit.check_in_time && visit.check_out_time
    );
    
    let avgDuration = 0;
    if (completedVisits.length > 0) {
      const totalDuration = completedVisits.reduce((sum, visit) => {
        const checkIn = new Date(visit.check_in_time);
        const checkOut = new Date(visit.check_out_time);
        return sum + (checkOut - checkIn) / (1000 * 60);
      }, 0);
      avgDuration = Math.round(totalDuration / completedVisits.length);
    }
    
    // Count security incidents from previous period using master data
    const securityIncidents = masterBlacklistedData.filter(visitor => {
      const blacklistDate = new Date(visitor.blacklisted_at || visitor.created_at || visitor.visit_date);
      return blacklistDate >= sixtyDaysAgo && blacklistDate < thirtyDaysAgo;
    }).length;
    
    return {
      totalVisitors,
      avgDuration,
      securityIncidents
    };
  }, [isInitialDataLoaded, masterVisitsData, masterPreRegistrationsData, masterBlacklistedData]);

  // Enhanced Host Performance calculations using master data for consistency
  const calculateHostPerformance = useCallback(() => {
    const hostStats = {};
    
    // Use master data instead of filteredVisits for consistency
    const allMasterData = [...masterVisitsData, ...masterPreRegistrationsData];
    
    allMasterData.forEach(visit => {
      const hostName = visit.person_to_meet || visit.personToMeet || visit.host || visit.host_name || 'Unknown';
      
      // Count visits per host
      if (!hostStats[hostName]) {
        hostStats[hostName] = {
          host_name: hostName,
          visits: 0,
          totalDuration: 0,
          completedVisits: 0,
          noShows: 0,
          averageDuration: 0,
          lastVisit: null,
          visitReasons: {},
          peakHours: {}
        };
      }
      
      hostStats[hostName].visits++;
      
      // Calculate duration for completed visits
      if (visit.check_in_time && visit.check_out_time) {
        const checkIn = new Date(visit.check_in_time);
        const checkOut = new Date(visit.check_out_time);
        const duration = (checkOut - checkIn) / (1000 * 60); // minutes
        hostStats[hostName].totalDuration += duration;
        hostStats[hostName].completedVisits++;
        
        // Track peak hours for this host
        const hour = checkIn.getHours();
        hostStats[hostName].peakHours[hour] = (hostStats[hostName].peakHours[hour] || 0) + 1;
      }
      
      // Track no-shows
      if (visit.isPreRegistration && !visit.check_in_time && 
          new Date(visit.visit_date) < new Date()) {
        hostStats[hostName].noShows++;
      }
      
      // Track visit reasons
      const reason = visit.visit_reason || visit.visitReason || visit.purpose || 'Unknown';
      hostStats[hostName].visitReasons[reason] = (hostStats[hostName].visitReasons[reason] || 0) + 1;
      
      // Track last visit
      const visitDate = new Date(visit.check_in_time || visit.visit_date);
      if (!hostStats[hostName].lastVisit || visitDate > hostStats[hostName].lastVisit) {
        hostStats[hostName].lastVisit = visitDate;
      }
    });
    
    // Calculate average duration for each host
    Object.values(hostStats).forEach(host => {
      if (host.completedVisits > 0) {
        host.averageDuration = Math.round(host.totalDuration / host.completedVisits);
      }
      
      // Find peak hour for this host
      const peakHour = Object.entries(host.peakHours).reduce((peak, [hour, count]) => 
        count > (host.peakHours[peak] || 0) ? hour : peak, '0'
      );
      host.peakHour = peakHour !== '0' ? 
        `${parseInt(peakHour)}:00 ${parseInt(peakHour) >= 12 ? 'PM' : 'AM'}` : 'N/A';
      
      // Find most common visit reason
      host.topReason = Object.entries(host.visitReasons).reduce((top, [reason, count]) => 
        count > (host.visitReasons[top] || 0) ? reason : top, 'N/A'
      );
    });
    
    // Sort by number of visits
    const sortedHosts = Object.values(hostStats).sort((a, b) => b.visits - a.visits);
    
    return sortedHosts;
  }, [masterVisitsData, masterPreRegistrationsData]);

  // Update overview stats when master data changes
  useEffect(() => {
    if (isInitialDataLoaded) {
      const stats = calculateOverviewStats();
      setOverviewStats(stats);
      console.log('📊 Overview stats updated from master data:', stats);
      console.log('🔍 Data consistency check:', {
        masterVisits: masterVisitsData.length,
        masterPreRegs: masterPreRegistrationsData.length,
        masterBlacklisted: masterBlacklistedData.length,
        calculatedTotal: stats.totalVisitors,
        calculatedSecurity: stats.securityIncidents
      });
    }
  }, [isInitialDataLoaded, calculateOverviewStats]);

  // Update security stats when master data changes
  useEffect(() => {
    if (isInitialDataLoaded) {
      const securityInsights = calculateSecurityInsights();
      setSecurityStats(securityInsights);
      console.log('🔒 Security stats updated from master data:', securityInsights);
    }
  }, [isInitialDataLoaded, calculateSecurityInsights]);

  // Centralized data fetching function to maintain consistency across all sections
  const fetchMasterData = useCallback(async (forceRefresh = false) => {
    if (!userRole) {
      console.log('❌ No userRole available, skipping master data fetch');
      return;
    }

    // Check if we need to refresh data (only fetch if forced or data is older than 30 seconds)
    const now = new Date();
    if (!forceRefresh && dataLastFetched && (now - dataLastFetched) < 30000 && isInitialDataLoaded) {
      console.log('📋 Using cached data, last fetched:', dataLastFetched);
      return;
    }
    
    console.log('🔄 Fetching master data for consistency...', { userRole, forceRefresh });
    setLoading(true);
    setError('');
    
    try {
      const apiFilters = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        visitorName: filters.visitorName,
        visitorId: filters.visitorId,
        hostName: filters.hostName,
        limit: 1000 // Increased limit for comprehensive data
      };
      
      console.log('📊 Master API Filters:', apiFilters);
      
      // Fetch all data sources in parallel for consistency
      const [
        allVisitsData,
        allPreRegistrationsData,
        allBlacklistedData
      ] = await Promise.all([
        getVisits(userRole, Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))).catch(err => {
          console.warn('⚠️ Failed to fetch visits:', err);
          return [];
        }),
        getPreRegistrations(apiFilters).catch(err => {
          console.warn('⚠️ Failed to fetch pre-registrations:', err);
          return [];
        }),
        getBlacklistedVisitors(apiFilters).catch(err => {
          console.warn('⚠️ Failed to fetch blacklisted visitors:', err);
          return [];
        })
      ]);

      console.log('✅ Master data fetched:', {
        visits: allVisitsData.length,
        preRegistrations: allPreRegistrationsData.length,
        blacklisted: allBlacklistedData.length
      });

      // Transform and standardize all data for consistency
      const standardizedVisits = allVisitsData.map(visit => ({
        ...visit,
        // Ensure consistent field mapping
        visitor_name: visit.visitor_name || visit.visitorName || visit.person_name || visit.name,
        visitor_email: visit.visitor_email || visit.visitorEmail || visit.email,
        visitor_phone: visit.visitor_phone || visit.visitorPhone || visit.phone,
        host_name: visit.host_name || visit.hostName || visit.person_to_meet,
        visitor_company: visit.visitor_company || visit.company || visit.visitorCompany,
        purpose: visit.purpose || visit.reason || visit.visitReason,
        source: 'regular_visit'
      }));

      const standardizedPreRegs = allPreRegistrationsData.map(preReg => ({
        ...preReg,
        // Map pre-registration fields to standard visit structure
        visitor_name: preReg.visitor_name || preReg.visitorName,
        visitor_email: preReg.visitor_email || preReg.visitorEmail,
        visitor_phone: preReg.visitor_phone || preReg.visitorPhone,
        host_name: preReg.host_name || preReg.hostName,
        visitor_company: preReg.visitor_company || preReg.company,
        purpose: preReg.purpose || preReg.reason,
        visitor_id: preReg.id || preReg.visitor_id,
        check_in_time: preReg.status === 'checked_in' ? preReg.checked_in_at : null,
        check_out_time: preReg.status === 'checked_out' ? preReg.checked_out_at : null,
        isPreRegistration: true,
        source: 'pre_registration'
      }));

      const standardizedBlacklisted = allBlacklistedData.map(visitor => ({
        ...visitor,
        // Standardize blacklisted visitor fields
        visitor_name: visitor.person_name || visitor.visitor_name || visitor.name || visitor.visitorName,
        visitor_email: visitor.email || visitor.visitor_email || visitor.visitorEmail,
        visitor_phone: visitor.phone || visitor.visitor_phone || visitor.visitorPhone,
        host_name: visitor.person_to_meet || visitor.host_name || visitor.hostName,
        visitor_company: visitor.visitor_company || visitor.company,
        purpose: visitor.visit_reason || visitor.purpose || visitor.reason,
        visitor_id: visitor.visitor_id || visitor.id,
        blacklist_reason: visitor.reason_to_blacklist || visitor.blacklist_reason || visitor.reason_for_blacklist,
        visitorPhoto: visitor.picture || visitor.photo || visitor.visitorPhoto,
        isBlacklisted: true,
        is_blacklisted: true,
        source: 'blacklisted'
      }));

      // Store master data
      setMasterVisitsData(standardizedVisits);
      setMasterPreRegistrationsData(standardizedPreRegs);
      setMasterBlacklistedData(standardizedBlacklisted);
      setDataLastFetched(now);
      setIsInitialDataLoaded(true);

      // Allow useEffect to handle view updates to prevent circular dependencies

    } catch (err) {
      console.error('❌ Error in fetchMasterData:', err);
      setError('Failed to load visitor data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, userRole, dataLastFetched, isInitialDataLoaded]);

  // Filter visits by category - defined before updateCurrentView to avoid initialization errors
  const filterVisitsByCategory = useCallback((visits, category) => {
    const now = new Date();
    switch (category) {
      case 'checked-in':
        return visits.filter(visit => 
          visit.check_in_time && !visit.check_out_time
        );
      case 'pending':
        return visits.filter(visit => 
          !visit.check_in_time && visit.status === 'pending'
        );
      case 'expected':
        return visits.filter(visit => {
          const visitDate = new Date(visit.visit_date);
          return !visit.check_in_time && visitDate >= now.setHours(0, 0, 0, 0);
        });
      case 'checked-out':
        return visits.filter(visit => 
          visit.check_in_time && visit.check_out_time
        );
      case 'blacklisted':
        return visits.filter(visit => 
          visit.isBlacklisted === true || visit.is_blacklisted === true
        );
      default:
        return visits;
    }
  }, []);

  // Function to update current view based on active tab using master data
  const updateCurrentView = useCallback((visitsData, preRegsData, blacklistedData) => {
    console.log('🎯 Updating current view for tab:', activeVisitorTab);
    
    let combinedData = [];
    let preRegsForView = [];

    switch (activeVisitorTab) {
      case 'pending':
        // Combine all data and filter for pending
        const allPendingData = [...visitsData, ...preRegsData];
        combinedData = allPendingData.filter(visit => {
          // Skip blacklisted items
          if (visit.isBlacklisted || visit.is_blacklisted) return false;
          
          // Skip already checked-in items
          if (visit.check_in_time) return false;
          
          // For pre-registrations with pending status
          if (visit.isPreRegistration && visit.status === 'pending') {
            const visitDate = new Date(visit.visit_date);
            const today = new Date().setHours(0, 0, 0, 0);
            return visitDate <= today;
          }
          
          // For regular visits that are pending (past visits not checked in)
          if (!visit.isPreRegistration && !visit.check_in_time) {
            const visitDate = new Date(visit.visit_date);
            const today = new Date().setHours(0, 0, 0, 0);
            return visitDate < today;
          }
          
          return false;
        });
        preRegsForView = combinedData.filter(item => item.isPreRegistration);
        break;

      case 'blacklisted':
        combinedData = blacklistedData;
        preRegsForView = blacklistedData.filter(item => item.isPreRegistration);
        break;

      case 'all':
        combinedData = [...visitsData, ...preRegsData];
        preRegsForView = preRegsData;
        break;

      default:
        // For other tabs, use visits data and apply category filtering
        combinedData = filterVisitsByCategory([...visitsData, ...preRegsData], activeVisitorTab);
        preRegsForView = preRegsData;
        break;
    }

    console.log('✅ Current view updated:', {
      tab: activeVisitorTab,
      totalData: combinedData.length,
      preRegs: preRegsForView.length
    });

    setVisits(combinedData);
    setPreRegistrations(preRegsForView);
    setBlacklistedVisitors(blacklistedData);

  }, [activeVisitorTab, filterVisitsByCategory]);

  // Update current view when activeVisitorTab changes
  useEffect(() => {
    if (isInitialDataLoaded) {
      console.log('🎯 Updating current view due to tab change:', activeVisitorTab);
      updateCurrentView(masterVisitsData, masterPreRegistrationsData, masterBlacklistedData);
    }
  }, [activeVisitorTab, updateCurrentView, isInitialDataLoaded]);

  // Update current view when master data is initially loaded or substantially changes
  useEffect(() => {
    if (isInitialDataLoaded && (masterVisitsData.length > 0 || masterPreRegistrationsData.length > 0 || masterBlacklistedData.length > 0)) {
      console.log('📋 Master data available, updating current view');
      updateCurrentView(masterVisitsData, masterPreRegistrationsData, masterBlacklistedData);
    }
  }, [isInitialDataLoaded, updateCurrentView]); // Only depend on isInitialDataLoaded to avoid loops


// Function to format minutes into "Xh Ymin"
const formatDuration = (minutes) => {
  if (!minutes || isNaN(minutes)) return 'N/A';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) return `${remainingMinutes}min`;
  return `${hours}h ${remainingMinutes}min`;
};



  // Simplified visitor data function that uses master data for consistency
  const fetchVisitorData = useCallback(async (forceRefresh = false) => {
    console.log('🎯 fetchVisitorData called, delegating to fetchMasterData');
    await fetchMasterData(forceRefresh);
  }, [fetchMasterData]);

  // Initial data load
  useEffect(() => {
    console.log('🎯 useEffect for initial data load:', { activeSection, userRole });
    if ((activeSection === 'visitor-logs' || activeSection === 'dashboard') && userRole && !isInitialDataLoaded) {
      console.log('🚀 Loading initial master data...');
      fetchMasterData(true); // Force initial load
    }
  }, [activeSection, userRole, isInitialDataLoaded, fetchMasterData]);

  // Refresh data when filters change (but not on initial load)
  useEffect(() => {
    // Only refresh if initial data is loaded AND we have meaningful filter changes
    const hasFilters = filters.startDate || filters.endDate || filters.visitorName || filters.visitorId || filters.hostName;
    
    console.log('🔄 Filters changed:', { filters, hasFilters, isInitialDataLoaded });
    
    if (isInitialDataLoaded && hasFilters) {
      console.log('🔄 Refreshing data due to filter changes...');
      fetchMasterData(true); // Force refresh when filters change
    }
  }, [filters.startDate, filters.endDate, filters.visitorName, filters.visitorId, filters.hostName, fetchMasterData, isInitialDataLoaded]);

  // Reset visitor logs pagination when sub-section changes
  useEffect(() => {
    setVisitorLogsCurrentPage(1);
  }, [activeSubSubSection]);

  // Generate comprehensive report data from master data for consistency
  const generateReportFromMasterData = useCallback(() => {
    if (!isInitialDataLoaded) return null;
    
    console.log('📊 Generating report from master data...');
    
    // Combine all master data for analysis
    const allData = [...masterVisitsData, ...masterPreRegistrationsData];
    const filteredData = allData.filter(visit => {
      if (!visit.visit_date && !visit.check_in_time) return false;
      
      const visitDate = new Date(visit.visit_date || visit.check_in_time);
      const startDate = reportDateRange.startDate ? new Date(reportDateRange.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = reportDateRange.endDate ? new Date(reportDateRange.endDate) : new Date();
      
      return visitDate >= startDate && visitDate <= endDate;
    });
    
    console.log('📊 Filtered data for report:', filteredData.length, 'visits');
    
    // Generate overview statistics
    const overview = {
      totalVisits: filteredData.length,
      uniqueVisitors: new Set(filteredData.map(v => v.visitor_email || v.visitorEmail || v.visitor_name || v.visitorName)).size,
      avgDuration: calculateAverageDuration(filteredData),
      peakHour: calculatePeakHour(filteredData),
      noShows: filteredData.filter(v => v.isPreRegistration && !v.check_in_time && new Date(v.visit_date) < new Date()).length,
      completedVisits: filteredData.filter(v => v.check_in_time && v.check_out_time).length,
      securityIncidents: masterBlacklistedData.length + filteredData.filter(v => isOverstay(v)).length
    };
    
    // Generate daily statistics
    const dailyStats = generateDailyStats(filteredData);
    
    // Generate host statistics
    const hostStats = generateHostStats(filteredData);
    
    // Generate purpose statistics
    const purposeStats = generatePurposeStats(filteredData);
    
    return {
      overview,
      dailyStats,
      hostStats,
      purposeStats,
      generatedAt: new Date().toISOString(),
      dataSource: 'master_data'
    };
  }, [isInitialDataLoaded, masterVisitsData, masterPreRegistrationsData, masterBlacklistedData, reportDateRange]);

  // Helper function to calculate average duration
  const calculateAverageDuration = (visits) => {
    const completedVisits = visits.filter(v => v.check_in_time && v.check_out_time);
    if (completedVisits.length === 0) return 0;
    
    const totalDuration = completedVisits.reduce((sum, visit) => {
      const checkIn = new Date(visit.check_in_time);
      const checkOut = new Date(visit.check_out_time);
      return sum + (checkOut - checkIn) / (1000 * 60); // Convert to minutes
    }, 0);
    
    return Math.round(totalDuration / completedVisits.length);
  };

  // Helper function to calculate peak hour
  const calculatePeakHour = (visits) => {
    const hourCounts = {};
    visits.forEach(visit => {
      if (visit.check_in_time) {
        const hour = new Date(visit.check_in_time).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
    
    const peakHour = Object.entries(hourCounts).reduce((peak, [hour, count]) => 
      count > (hourCounts[peak] || 0) ? hour : peak, '12'
    );
    
    return `${parseInt(peakHour)}:00 ${parseInt(peakHour) >= 12 ? 'PM' : 'AM'}`;
  };

  // Helper function to check if visit is overstay
  const isOverstay = (visit) => {
    if (!visit.check_in_time || visit.check_out_time) return false;
    const checkInTime = new Date(visit.check_in_time);
    const now = new Date();
    const hoursStayed = (now - checkInTime) / (1000 * 60 * 60);
    return hoursStayed > 8;
  };

  // Helper function to generate daily statistics
  const generateDailyStats = (visits) => {
    const dailyCounts = {};
    
    visits.forEach(visit => {
      const date = visit.check_in_time ? new Date(visit.check_in_time) : new Date(visit.visit_date);
      const dateKey = date.toISOString().split('T')[0];
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
    });
    
    return Object.entries(dailyCounts)
      .map(([date, visits]) => ({ date, visits }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Helper function to generate host statistics
  const generateHostStats = (visits) => {
    const hostCounts = {};
    
    visits.forEach(visit => {
      const hostName = visit.host_name || visit.hostName || visit.person_to_meet || 'Unknown';
      if (!hostCounts[hostName]) {
        hostCounts[hostName] = {
          host_name: hostName,
          visits: 0,
          completedVisits: 0,
          avgDuration: 0,
          totalDuration: 0
        };
      }
      
      hostCounts[hostName].visits++;
      
      if (visit.check_in_time && visit.check_out_time) {
        const duration = (new Date(visit.check_out_time) - new Date(visit.check_in_time)) / (1000 * 60);
        hostCounts[hostName].completedVisits++;
        hostCounts[hostName].totalDuration += duration;
        hostCounts[hostName].avgDuration = Math.round(hostCounts[hostName].totalDuration / hostCounts[hostName].completedVisits);
      }
    });
    
    return Object.values(hostCounts).sort((a, b) => b.visits - a.visits);
  };

  // Helper function to generate purpose statistics
  const generatePurposeStats = (visits) => {
    const purposeCounts = {};
    
    visits.forEach(visit => {
      const purpose = visit.purpose || visit.reason || visit.visit_reason || 'Other';
      purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
    });
    
    return Object.entries(purposeCounts)
      .map(([purpose, count]) => ({ purpose, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Fetch report data (now using master data for consistency)
  const fetchReportData = useCallback(async () => {
    if (!isInitialDataLoaded) {
      console.log('📊 Master data not loaded yet, skipping report generation');
      return;
    }
    
    setLoading(true);
    try {
      console.log('📊 Generating report data from master data for consistency');
      
      // Generate report data from master data instead of separate API call
      const reportData = generateReportFromMasterData();
      console.log('📊 Report data generated from master data:', reportData);
      setReportData(reportData);
    } catch (err) {
      console.error('❌ Error generating report data:', err);
      setError('Failed to generate report data');
    } finally {
      setLoading(false);
    }
  }, [isInitialDataLoaded]);

  useEffect(() => {
    if (activeSection === 'reports' && isInitialDataLoaded) {
      console.log('📊 Entered reports section - ensuring data consistency');
      fetchReportData();
    }
  }, [activeSection, fetchReportData, isInitialDataLoaded]);

  // Regenerate reports when master data changes or date range changes
  useEffect(() => {
    if (activeSection === 'reports' && isInitialDataLoaded) {
      console.log('📊 Regenerating reports due to data/date range change');
      fetchReportData();
    }
  }, [reportDateRange, masterVisitsData.length, masterPreRegistrationsData.length, masterBlacklistedData.length, activeSection, isInitialDataLoaded, fetchReportData]);

  // Advanced Visitor Data Fetching
  useEffect(() => {
    if (activeSection === 'advanced-visitors') {
      if (activeTab === 'preregistrations') {
        fetchPreRegistrations();
      } else if (activeTab === 'recurring') {
        fetchRecurringVisits();
      } else if (activeTab === 'history') {
        fetchVisitorHistory();
      }
    }
  }, [activeSection, activeTab]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  const fetchPreRegistrations = async () => {
    setLoading(true);
    try {
      const data = await getPreRegistrations();
      setPreRegistrations(data);
    } catch (err) {
      setError('Failed to load pre-registrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecurringVisits = async () => {
    setLoading(true);
    try {
      const data = await getRecurringVisits();
      setRecurringVisits(data);
    } catch (err) {
      setError('Failed to load recurring visits');
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitorHistory = async () => {
    setLoading(true);
    try {
      const data = await getVisitorHistory(historyFilters);
      setVisitorHistory(data);
    } catch (err) {
      setError('Failed to load visitor history');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      hostName: '',
      visitorName: '',
      visitorId: ''
    });
    setVisitorLogsCurrentPage(1); // Reset visitor logs pagination
    fetchVisitorData();
  };

  const handleUserInputChange = (e) => {
    setNewUser(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log('🚀 Creating new user with data:', newUser);
    
    try {
      const result = await createUser(newUser);
      console.log('✅ User creation successful:', result);
      
      // Reset form
      setNewUser({ 
        name: '', 
        email: '', 
        password: '', 
        role: 'Host',
        mobile_number: '',
        department: '',
        designation: ''
      });
      setError('');
      
      // Refresh users list
      console.log('🔄 Refreshing users list...');
      const usersData = await getUsers();
      console.log('📊 Updated users data:', usersData);
      setUsers(usersData);
      
      setActiveSection('manage-users');
      // Show success message
      alert('Host created successfully!');
    } catch (err) {
      console.error('❌ Error creating user:', err);
      setError(err.message || 'Failed to create host. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setVisitorLogsCurrentPage(1); // Reset visitor logs pagination when applying filters
    fetchVisitorData();
  };

  // Helper function to calculate percentage change
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Enhanced visitor analytics calculations using master data for consistency
  const calculateVisitorAnalytics = () => {
    // Use master data instead of filteredVisits for consistency
    const allMasterData = [...masterVisitsData, ...masterPreRegistrationsData];
    const totalVisitors = allMasterData.length;
    
    // Calculate unique visitors by email
    const uniqueEmails = new Set(allMasterData.map(visit => 
      visit.visitor_email || visit.visitorEmail || 'unknown'
    ).filter(email => email !== 'unknown'));
    const uniqueVisitors = uniqueEmails.size;
    
    // Calculate returning visitors
    const returningVisitors = Math.max(0, totalVisitors - uniqueVisitors);
    
    // Calculate average duration for completed visits
    const completedVisits = allMasterData.filter(visit => 
      visit.check_in_time && visit.check_out_time
    );
    
    let avgDuration = 0;
    if (completedVisits.length > 0) {
      const totalDuration = completedVisits.reduce((sum, visit) => {
        const checkIn = new Date(visit.check_in_time);
        const checkOut = new Date(visit.check_out_time);
        return sum + (checkOut - checkIn) / (1000 * 60); // Convert to minutes
      }, 0);
      avgDuration = Math.round(totalDuration / completedVisits.length);
    }
    
    // Calculate peak hour
    const hourCounts = {};
    allMasterData.forEach(visit => {
      if (visit.check_in_time) {
        const hour = new Date(visit.check_in_time).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
    
    const peakHour = Object.entries(hourCounts).reduce((peak, [hour, count]) => 
      count > (hourCounts[peak] || 0) ? hour : peak, '0'
    );
    
    const peakHourFormatted = peakHour !== '0' ? 
      `${parseInt(peakHour)}:00 ${parseInt(peakHour) >= 12 ? 'PM' : 'AM'}` : 'N/A';
    
    // Calculate no-shows (pre-registrations that were never checked in)
    const noShows = allMasterData.filter(visit => 
      visit.isPreRegistration && !visit.check_in_time && 
      new Date(visit.visit_date) < new Date()
    ).length;
    
    // Calculate visit patterns
    const dayOfWeekCounts = {};
    const visitReasons = {};
    const hostMeetings = {};
    
    allMasterData.forEach(visit => {
      // Day of week analysis
      if (visit.check_in_time || visit.visit_date) {
        const date = new Date(visit.check_in_time || visit.visit_date);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
        dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
      }
      
      // Visit reason analysis
      const reason = visit.visit_reason || visit.visitReason || visit.purpose || 'Unknown';
      visitReasons[reason] = (visitReasons[reason] || 0) + 1;
      
      // Host meeting analysis
      const host = visit.person_to_meet || visit.personToMeet || visit.host || 'Unknown';
      hostMeetings[host] = (hostMeetings[host] || 0) + 1;
    });
    
    // Find busiest day
    const busiestDay = Object.entries(dayOfWeekCounts).reduce((busiest, [day, count]) => 
      count > (dayOfWeekCounts[busiest] || 0) ? day : busiest, 'N/A'
    );
    
    // Find most common visit reason
    const topVisitReason = Object.entries(visitReasons).reduce((top, [reason, count]) => 
      count > (visitReasons[top] || 0) ? reason : top, 'N/A'
    );
    
    // Find most visited host
    const topHost = Object.entries(hostMeetings).reduce((top, [host, count]) => 
      count > (hostMeetings[top] || 0) ? host : top, 'N/A'
    );
    
    // Calculate check-in completion rate
    const totalScheduled = allMasterData.filter(visit => visit.isPreRegistration).length;
    const actualCheckIns = allMasterData.filter(visit => visit.check_in_time).length;
    const checkInRate = totalScheduled > 0 ? Math.round((actualCheckIns / totalScheduled) * 100) : 100;
    
    return {
      totalVisitors,
      uniqueVisitors,
      returningVisitors,
      avgDuration,
      peakHour: peakHourFormatted,
      noShows,
      busiestDay,
      topVisitReason,
      topHost,
      checkInRate,
      completedVisits: completedVisits.length,
      dayOfWeekCounts,
      visitReasons,
      hostMeetings
    };
  };

  // Enhanced PDF Export Function with Charts and Graphs
  const exportToPDF = async () => {
    try {
      setLoading(true);
      
      const doc = new jsPDF();
      let yPosition = 20;

      // Helper function to add charts to PDF
      const addChartToPDF = async (chartId, title, width = 160, height = 80) => {
        try {
          const chartElement = document.getElementById(chartId);
          if (chartElement) {
            const canvas = await html2canvas(chartElement, {
              backgroundColor: '#ffffff',
              scale: 2,
              logging: false
            });
            
            const imgData = canvas.toDataURL('image/png');
            
            // Check if we need a new page
            if (yPosition + height > 250) {
              doc.addPage();
              yPosition = 20;
            }
            
            // Add chart title
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(title, 20, yPosition);
            yPosition += 10;
            
            // Add chart image
            doc.addImage(imgData, 'PNG', 20, yPosition, width, height);
            yPosition += height + 15;
            
            return true;
          }
        } catch (error) {
          console.error(`Error adding chart ${chartId}:`, error);
        }
        return false;
      };

      // Create temporary chart containers for PDF generation
      const createTemporaryCharts = () => {
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '800px';
        tempContainer.style.height = '400px';
        document.body.appendChild(tempContainer);

        // Chart configurations
        const chartConfigs = {
          visitorStatusChart: {
            type: 'doughnut',
            data: {
              labels: ['Checked In', 'Checked Out', 'Pending', 'Expected', 'Blacklisted'],
              datasets: [{
                data: [
                  visitorCounts['checked-in'] || 0,
                  visitorCounts['checked-out'] || 0,
                  visitorCounts.pending || 0,
                  visitorCounts.expected || 0,
                  visitorCounts.blacklisted || 0
                ],
                backgroundColor: [
                  '#4CAF50', // Green for checked in
                  '#2196F3', // Blue for checked out
                  '#FF9800', // Orange for pending
                  '#9C27B0', // Purple for expected
                  '#F44336'  // Red for blacklisted
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    padding: 15,
                    usePointStyle: true
                  }
                },
                title: {
                  display: true,
                  text: 'Visitor Status Distribution',
                  font: { size: 16, weight: 'bold' }
                }
              }
            }
          },
          
          visitTrendsChart: {
            type: 'line',
            data: {
              labels: getLast7Days(),
              datasets: [{
                label: 'Daily Visits',
                data: calculateDailyVisits(),
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#2196F3',
                pointRadius: 4
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  display: true,
                  position: 'top'
                },
                title: {
                  display: true,
                  text: 'Visit Trends (Last 7 Days)',
                  font: { size: 16, weight: 'bold' }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(0,0,0,0.1)' },
                  ticks: { stepSize: 1 }
                },
                x: {
                  grid: { color: 'rgba(0,0,0,0.1)' }
                }
              }
            }
          },

          hourlyTrafficChart: {
            type: 'bar',
            data: {
              labels: Array.from({length: 24}, (_, i) => `${i}:00`),
              datasets: [{
                label: 'Visits by Hour',
                data: calculateHourlyTraffic(),
                backgroundColor: 'rgba(76, 175, 80, 0.8)',
                borderColor: '#4CAF50',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  display: true,
                  position: 'top'
                },
                title: {
                  display: true,
                  text: 'Hourly Traffic Distribution',
                  font: { size: 16, weight: 'bold' }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(0,0,0,0.1)' },
                  ticks: { stepSize: 1 }
                },
                x: {
                  grid: { display: false }
                }
              }
            }
          },

          purposeAnalysisChart: {
            type: 'bar',
            data: {
              labels: getTopPurposes().map(p => p.purpose.length > 15 ? p.purpose.substring(0, 15) + '...' : p.purpose),
              datasets: [{
                label: 'Visit Count',
                data: getTopPurposes().map(p => p.count),
                backgroundColor: [
                  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                  '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                ],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              indexAxis: 'y',
              plugins: {
                legend: {
                  display: false
                },
                title: {
                  display: true,
                  text: 'Top Visit Purposes',
                  font: { size: 16, weight: 'bold' }
                }
              },
              scales: {
                x: {
                  beginAtZero: true,
                  grid: { color: 'rgba(0,0,0,0.1)' }
                },
                y: {
                  grid: { display: false }
                }
              }
            }
          }
        };

        // Create chart elements
        Object.entries(chartConfigs).forEach(([chartId, config]) => {
          const chartContainer = document.createElement('div');
          chartContainer.style.width = '400px';
          chartContainer.style.height = '300px';
          chartContainer.style.marginBottom = '20px';
          
          const canvas = document.createElement('canvas');
          canvas.id = `pdf-${chartId}`;
          canvas.width = 400;
          canvas.height = 300;
          
          chartContainer.appendChild(canvas);
          tempContainer.appendChild(chartContainer);
          
          // Create chart
          new ChartJS(canvas.getContext('2d'), config);
        });

        return tempContainer;
      };

      // Helper functions for chart data
      const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        return days;
      };

      const calculateDailyVisits = () => {
        const dailyCounts = new Array(7).fill(0);
        const today = new Date();
        
        filteredVisits.forEach(visit => {
          if (visit.check_in_time || visit.visit_date) {
            const visitDate = new Date(visit.check_in_time || visit.visit_date);
            const daysDiff = Math.floor((today - visitDate) / (1000 * 60 * 60 * 24));
            if (daysDiff >= 0 && daysDiff < 7) {
              dailyCounts[6 - daysDiff]++;
            }
          }
        });
        
        return dailyCounts;
      };

      const calculateHourlyTraffic = () => {
        const hourlyData = new Array(24).fill(0);
        
        filteredVisits.forEach(visit => {
          if (visit.check_in_time) {
            const hour = new Date(visit.check_in_time).getHours();
            hourlyData[hour]++;
          }
        });
        
        return hourlyData;
      };

      const getTopPurposes = () => {
        const purposeCounts = {};
        
        filteredVisits.forEach(visit => {
          const purpose = (visit.purpose || visit.reason || 'Not Specified').trim();
          purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
        });
        
        return Object.entries(purposeCounts)
          .sort(([,a], [,b]) => b - a)
          .map(([purpose, count]) => ({ purpose, count }));
      };

      // Add PDF header
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text('Visitor Management System', 20, yPosition);
      
      yPosition += 10;
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text('Analytics Report', 20, yPosition);
      
      yPosition += 15;
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Report Period: ${reportDateRange.startDate} to ${reportDateRange.endDate}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, yPosition);
      yPosition += 20;

      // Add executive summary
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Executive Summary', 20, yPosition);
      yPosition += 10;

      const realOverviewStats = overviewStats;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const summaryText = [
        `• Total visitors processed: ${realOverviewStats.totalVisitors}`,
        `• Unique visitors: ${realOverviewStats.uniqueVisitors}`,
        `• Average visit duration: ${realOverviewStats.avgDuration} minutes`,
        `• Peak visitor hour: ${realOverviewStats.peakHour}`,
        `• Current active visitors: ${visitorCounts['checked-in'] || 0}`,
        `• System utilization: ${filteredVisits.length > 0 ? 'Active' : 'Low'}`
      ];
      
      summaryText.forEach(text => {
        doc.text(text, 25, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;

      // Create temporary charts for PDF
      const tempChartContainer = createTemporaryCharts();
      
      // Wait for charts to render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add charts to PDF
      doc.addPage();
      yPosition = 20;
      
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text('Visual Analytics', 20, yPosition);
      yPosition += 20;

      // Add visitor status chart
      await addChartToPDF('pdf-visitorStatusChart', 'Visitor Status Distribution', 160, 100);
      
      // Add visit trends chart
      await addChartToPDF('pdf-visitTrendsChart', 'Visit Trends (Last 7 Days)', 160, 100);
      
      // Add hourly traffic chart
      if (yPosition > 180) {
        doc.addPage();
        yPosition = 20;
      }
      await addChartToPDF('pdf-hourlyTrafficChart', 'Hourly Traffic Distribution', 160, 100);
      
      // Add purpose analysis chart
      await addChartToPDF('pdf-purposeAnalysisChart', 'Top Visit Purposes', 160, 100);

      // Clean up temporary charts
      document.body.removeChild(tempChartContainer);

      // Add detailed statistics table
      doc.addPage();
      yPosition = 20;
      
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Detailed Statistics', 20, yPosition);
      yPosition += 15;
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value', 'Details']],
        body: [
          ['Total Visitors', realOverviewStats.totalVisitors, 'All visitors in date range'],
          ['Unique Visitors', realOverviewStats.uniqueVisitors, 'Distinct visitor count'],
          ['Average Duration', realOverviewStats.avgDuration + ' min', 'Based on check-in/out times'],
          ['Peak Hour', realOverviewStats.peakHour, 'Highest traffic period'],
          ['No-shows', realOverviewStats.noShows, 'Expected but not arrived'],
          ['Active Visits', visitorCounts['checked-in'] || 0, 'Currently checked in'],
          ['Completed Visits', visitorCounts['checked-out'] || 0, 'Successfully checked out'],
          ['Pending Approvals', visitorCounts.pending || 0, 'Awaiting host approval'],
          ['Blacklisted', visitorCounts.blacklisted || 0, 'Restricted visitors']
        ],
        theme: 'striped',
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 10 }
      });

      // Add recent visitor activity
      if (filteredVisits.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Recent Visitor Activity', 20, 20);
        
        const sortedVisits = [...filteredVisits]
          .filter(visit => visit.visitor_name || visit.visitorName)
          .sort((a, b) => {
            const dateA = new Date(a.check_in_time || a.visit_date || 0);
            const dateB = new Date(b.check_in_time || b.visit_date || 0);
            return dateB - dateA;
          })
          .slice(0, 20);
        
        autoTable(doc, {
          startY: 35,
          head: [['Visitor', 'Host', 'Check-In', 'Status', 'Purpose']],
          body: sortedVisits.map(visit => {
            const checkInTime = visit.check_in_time ? new Date(visit.check_in_time) : null;
            const status = visit.check_out_time ? 'Completed' : 
                          visit.check_in_time ? 'Active' : 'Pending';
            
            return [
              visit.visitor_name || visit.visitorName || 'N/A',
              visit.host_name || visit.hostName || 'N/A',
              checkInTime ? checkInTime.toLocaleString() : 'Not checked in',
              status,
              (visit.purpose || visit.reason || 'Not specified').substring(0, 30)
            ];
          }),
          theme: 'striped',
          headStyles: { 
            fillColor: [41, 128, 185],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 20, right: 20 },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 35 },
            2: { cellWidth: 40 },
            3: { cellWidth: 25 },
            4: { cellWidth: 45 }
          }
        });
      }

      // Add footer to all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${pageCount}`, 20, 285);
        doc.text('Visitor Management System - Confidential Report', 105, 285, { align: 'center' });
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 190, 285, { align: 'right' });
      }

      // Save the PDF
      const fileName = `VMS-Analytics-Report-${reportDateRange.startDate}-to-${reportDateRange.endDate}.pdf`;
      doc.save(fileName);
      
      setMessage('Enhanced PDF report with charts exported successfully');
      setTimeout(() => setMessage(''), 5000);
      
    } catch (err) {
      setError('Failed to export enhanced PDF report');
      console.error('Enhanced PDF Export Error:', err);
    } finally {
      setLoading(false);
    }
  };
  // Enhanced Excel Export Function
  const exportToExcel = async () => {
    try {
      setLoading(true);
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Overview Sheet
      if (reportData && reportData.overview) {
        const overviewData = [
          ['Visitor Management System Report'],
          [`Report Period: ${reportDateRange.startDate} to ${reportDateRange.endDate}`],
          [`Generated on: ${new Date().toLocaleDateString()}`],
          [''],
          ['Overview Statistics'],
          ['Metric', 'Value'],
          ['Total Visitors', reportData.overview.totalVisits || 0],
          ['Unique Visitors', reportData.overview.uniqueVisitors || 0],
          ['Average Duration (minutes)', Math.round(parseFloat(reportData.overview.avgDuration || 0))],
          ['Peak Hour', reportData.overview.peakHour || '2:00 PM'],
          ['No-shows', reportData.overview.noShows || 0],
          ['Security Incidents', 0],
          [''],
          ['Visitor Status Distribution'],
          ['Status', 'Count'],
          ['Total Visitors', visitorCounts.all],
          ['Checked In', visitorCounts['checked-in']],
          ['Checked Out', visitorCounts['checked-out']],
          ['Pending', visitorCounts.pending],
          ['Expected', visitorCounts.expected],
          ['Blacklisted', visitorCounts.blacklisted]
        ];
        
        const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');
      }
      
      // Host Performance Sheet
      if (reportData && reportData.hostStats && reportData.hostStats.length > 0) {
        const hostData = [
          ['Host Performance'],
          [''],
          ['Host Name', 'Total Visitors', 'Rank']
        ];
        
        reportData.hostStats.forEach((host, index) => {
          hostData.push([host.host_name, host.visits, index + 1]);
        });
        
        const hostSheet = XLSX.utils.aoa_to_sheet(hostData);
        XLSX.utils.book_append_sheet(workbook, hostSheet, 'Host Performance');
      }
      
      // Visitor Details Sheet
      if (filteredVisits.length > 0) {
        const visitorData = [
          ['Visitor Details'],
          [''],
          ['Visitor Name', 'Host Name', 'Check In', 'Check Out', 'Status', 'Purpose', 'Duration (min)', 'Visitor Type']
        ];
        
        filteredVisits.forEach(visit => {
          const checkIn = visit.check_in_time ? new Date(visit.check_in_time).toLocaleString() : 'N/A';
          const checkOut = visit.check_out_time ? new Date(visit.check_out_time).toLocaleString() : 'N/A';
          const duration = visit.check_in_time && visit.check_out_time 
            ? Math.round((new Date(visit.check_out_time) - new Date(visit.check_in_time)) / (1000 * 60))
            : 'N/A';
          
          visitorData.push([
            visit.visitor_name || 'N/A',
            visit.host_name || 'N/A',
            checkIn,
            checkOut,
            visit.status || 'Unknown',
            visit.purpose || 'N/A',
            duration,
            visit.visitor_type || 'General'
          ]);
        });
        
        const visitorSheet = XLSX.utils.aoa_to_sheet(visitorData);
        XLSX.utils.book_append_sheet(workbook, visitorSheet, 'Visitor Details');
      }
      
      // Visitor Type Distribution Sheet
      const typeData = [
        ['Visitor Type Distribution'],
        [''],
        ['Type', 'Count'],
        ['Guests', visitorTypeCounts.guests],
        ['Vendors', visitorTypeCounts.vendors],
        ['Interviewees', visitorTypeCounts.interviewees],
        ['Contractors', visitorTypeCounts.contractors],
        ['Delivery', visitorTypeCounts.delivery],
        ['Maintenance', visitorTypeCounts.maintenance],
        ['Clients', visitorTypeCounts.clients],
        ['Partners', visitorTypeCounts.partners],
        ['Other', visitorTypeCounts.other]
      ];
      
      const typeSheet = XLSX.utils.aoa_to_sheet(typeData);
      XLSX.utils.book_append_sheet(workbook, typeSheet, 'Visitor Types');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileName = `visitor-report-${reportDateRange.startDate}-to-${reportDateRange.endDate}.xlsx`;
      
      // Save the file
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
      
      setMessage('Excel report exported successfully');
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
      
    } catch (err) {
      setError('Failed to export Excel report');
      console.error('Excel Export Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Export Handler
  const handleExport = async (format) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      if (format === 'pdf') {
        await exportToPDF();
      } else if (format === 'excel') {
        await exportToExcel();
      } else if (format === 'csv') {
        await exportToCSV();
      } else {
        // Fallback to original API call for other formats
        await exportReport('report', format, reportDateRange);
      }
    } catch (err) {
      setError(`Failed to export ${format} report`);
      console.error('Export Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // CSV Export Function
  const exportToCSV = async () => {
    try {
      setLoading(true);
      
      const csvData = [];
      
      // Add headers
      csvData.push([
        'Date',
        'Visitor Name',
        'Host Name',
        'Check In Time',
        'Check Out Time',
        'Duration (minutes)',
        'Status',
        'Purpose',
        'Visitor Type',
        'Company'
      ]);
      
      // Add visitor data
      filteredVisits.forEach(visit => {
        const checkIn = visit.check_in_time ? new Date(visit.check_in_time).toLocaleString() : 'N/A';
        const checkOut = visit.check_out_time ? new Date(visit.check_out_time).toLocaleString() : 'N/A';
        const duration = visit.check_in_time && visit.check_out_time 
          ? Math.round((new Date(visit.check_out_time) - new Date(visit.check_in_time)) / (1000 * 60))
          : 'N/A';
        
        csvData.push([
          visit.check_in_time ? new Date(visit.check_in_time).toLocaleDateString() : 'N/A',
          visit.visitor_name || 'N/A',
          visit.host_name || 'N/A',
          checkIn,
          checkOut,
          duration,
          visit.status || 'Unknown',
          visit.purpose || 'N/A',
          visit.visitor_type || 'General',
          visit.visitor_company || 'N/A'
        ]);
      });
      
      // Convert to CSV string
      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const fileName = `visitor-data-${reportDateRange.startDate}-to-${reportDateRange.endDate}.csv`;
      saveAs(blob, fileName);
      
      setMessage('CSV file exported successfully');
      setTimeout(() => setMessage(''), 5000);
      
    } catch (err) {
      setError('Failed to export CSV file');
      console.error('CSV Export Error:', err);
    } finally {
      setLoading(false);
      setShowExportDropdown(false);
    }
  };

  // Summary Report Export
  const handleExportSummary = async () => {
    try {
      setLoading(true);
      
      // Use the imported jsPDF directly
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(24);
      doc.text('Executive Summary Report', 20, 30);
      
      doc.setFontSize(12);
      doc.text(`Period: ${reportDateRange.startDate} to ${reportDateRange.endDate}`, 20, 45);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55);
      
      // Key Metrics
      doc.setFontSize(16);
      doc.text('Key Performance Indicators', 20, 80);
      
      let yPos = 100;
      const metrics = [
        ['Total Visitors', visitorCounts.all],
        ['Active Visitors', visitorCounts['checked-in']],
        ['Completed Visits', visitorCounts['checked-out']],
        ['Security Rating', '95%'],
        ['Average Visit Duration', reportData?.overview?.avgDuration ? Math.round(parseFloat(reportData.overview.avgDuration)) + ' min' : 'N/A']
      ];
      
      metrics.forEach(([label, value]) => {
        doc.setFontSize(12);
        doc.text(label + ':', 30, yPos);
        doc.setFont(undefined, 'bold');
        doc.text(String(value), 120, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 15;
      });
      
      // Charts placeholder
      doc.setFontSize(14);
      doc.text('Visitor Trends Analysis', 20, yPos + 20);
      doc.setFontSize(10);
      doc.text('• Peak hours: 10 AM - 2 PM', 30, yPos + 35);
      doc.text('• Most common visit purpose: Business meetings', 30, yPos + 45);
      doc.text('• Average visitor satisfaction: 4.8/5', 30, yPos + 55);
      
      const fileName = `summary-report-${reportDateRange.startDate}-to-${reportDateRange.endDate}.pdf`;
      doc.save(fileName);
      
      setMessage('Summary report exported successfully');
      setTimeout(() => setMessage(''), 5000);
      
    } catch (err) {
      setError('Failed to export summary report');
      console.error('Summary Export Error:', err);
    } finally {
      setLoading(false);
      setShowExportDropdown(false);
    }
  };

  // Custom Export Dialog
  const handleExportCustom = () => {
    // This would open a modal for custom export options
    alert('Custom export feature coming soon! This will allow you to select specific data fields and date ranges.');
    setShowExportDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleNavigation = (section, subSection = null, subSubSection = null) => {
    setActiveSection(section);
    if (subSection) setActiveSubSection(subSection);
    if (subSubSection) setActiveSubSubSection(subSubSection);
    if (section === 'advanced-visitors') {
      setActiveTab('preregister');
    }
    
    // Set the appropriate visitor tab based on the subSubSection
    if (subSubSection) {
      const subSectionToTabMapping = {
        'total-visitors': 'all',
        'checked-in-visitors': 'checked-in',
        'pending-visitors': 'pending',
        'expected-visitors': 'expected',
        'checked-out-visitors': 'checked-out',
        'blacklist-visitors': 'blacklisted'
      };
      
      const targetTab = subSectionToTabMapping[subSubSection];
      if (targetTab) {
        console.log('🎯 Setting visitor tab from navigation:', targetTab);
        setActiveVisitorTab(targetTab);
      }
    }
  };

  const handleVisitorMetricClick = (metricType) => {
    console.log('🎯 Visitor metric clicked:', metricType);
    
    // Navigate to visitor logs section with the appropriate tab
    setActiveSection('visitor-logs');
    setActiveSubSection('visitor-dashboard-logs');
    
    // Expand the visitor logs menu if it's collapsed
    setExpandedMenus(prev => ({
      ...prev,
      visitorLogs: true,
      visitorDashboardLogs: true
    }));
    
    // Map metric types to visitor subsection types
    const subSectionMapping = {
      'all': 'total-visitors',
      'checked-in': 'checked-in-visitors', 
      'pending': 'pending-visitors',
      'expected': 'expected-visitors',
      'checked-out': 'checked-out-visitors',
      'blacklisted': 'blacklist-visitors'
    };
    
    const targetSubSubSection = subSectionMapping[metricType] || 'total-visitors';
    setActiveSubSubSection(targetSubSubSection);
    
    // Also set the visitor tab for additional filtering if needed
    const tabMapping = {
      'all': 'all',
      'checked-in': 'checked-in', 
      'pending': 'pending',
      'expected': 'expected',
      'checked-out': 'checked-out',
      'blacklisted': 'blacklisted'
    };
    
    const targetTab = tabMapping[metricType] || 'all';
    console.log('🎯 Setting visitor tab to:', targetTab);
    setActiveVisitorTab(targetTab);
  };

  const handleVisitorTabChange = (tab) => {
    setActiveVisitorTab(tab);
  };

  const handleViewVisitorDetails = async (visitor) => {
    try {
      const history = await getVisitorHistory(visitor.visitor_id || visitor.id);
      setSelectedVisitor({ ...visitor, history });
      setShowVisitorDetails(true);
    } catch (err) {
      setError('Failed to load visitor history');
      console.error(err);
    }
  };

  const handleRemoveFromBlacklist = async (visitorId) => {
    try {
      await updateVisitorBlacklist(visitorId, false);
      fetchVisitorData();
      calculateVisitorCounts();
    } catch (error) {
      setError('Failed to remove visitor from blacklist');
      console.error(error);
    }
  };



  const handleShowOverstayModal = () => {
    try {
      setShowOverstayModal(true);
      
      // Calculate overstay visitors from current securityStats
      const security = securityStats;
      console.log('Overstay visitors for modal:', security.overstays);
      setOverstayVisitors(security.overstays);
    } catch (error) {
      setError('Failed to load overstay incidents');
      console.error('Error fetching overstay visitors:', error);
      setOverstayVisitors([]);
    }
  };

  const handleShowIncompleteCheckoutsModal = () => {
    try {
      setShowIncompleteCheckoutsModal(true);
      
      // Calculate incomplete checkouts from current securityStats
      const security = securityStats;
      console.log('Incomplete checkout visitors for modal:', security.incompleteCheckouts);
      setIncompleteCheckoutVisitors(security.incompleteCheckouts);
    } catch (error) {
      setError('Failed to load incomplete checkouts');
      console.error('Error fetching incomplete checkout visitors:', error);
      setIncompleteCheckoutVisitors([]);
    }
  };

  const handleShowTotalVisitorsModal = () => {
    try {
      setShowTotalVisitorsModal(true);
      setCurrentPage(1); // Reset pagination
    } catch (error) {
      setError('Failed to load total visitors');
      console.error('Error opening total visitors modal:', error);
    }
  };

  const handleShowCheckedInVisitorsModal = () => {
    try {
      console.log('Total visits:', visits.length);
      console.log('Sample visit data:', visits[0]);
      console.log('Sample visit keys:', visits[0] ? Object.keys(visits[0]) : 'No visits');
      const filteredVisitors = getFilteredVisitorsByStatus('checked-in');
      console.log('Filtered checked-in visitors:', filteredVisitors.length, filteredVisitors);
      setShowCheckedInVisitorsModal(true);
      setCurrentPage(1); // Reset pagination
    } catch (error) {
      setError('Failed to load checked-in visitors');
      console.error('Error opening checked-in visitors modal:', error);
    }
  };

  const handleShowPendingVisitorsModal = () => {
    try {
      setShowPendingVisitorsModal(true);
      setCurrentPage(1); // Reset pagination
    } catch (error) {
      setError('Failed to load pending visitors');
      console.error('Error opening pending visitors modal:', error);
    }
  };

  const handleShowExpectedVisitorsModal = () => {
    try {
      setShowExpectedVisitorsModal(true);
      setCurrentPage(1); // Reset pagination
    } catch (error) {
      setError('Failed to load expected visitors');
      console.error('Error opening expected visitors modal:', error);
    }
  };

  const handleShowCheckedOutVisitorsModal = () => {
    try {
      setShowCheckedOutVisitorsModal(true);
      setCurrentPage(1); // Reset pagination
    } catch (error) {
      setError('Failed to load checked-out visitors');
      console.error('Error opening checked-out visitors modal:', error);
    }
  };

  const handleShowBlacklistedVisitorsModal = () => {
    try {
      setShowBlacklistedVisitorsModal(true);
      setCurrentPage(1); // Reset pagination
    } catch (error) {
      setError('Failed to load blacklisted visitors');
      console.error('Error opening blacklisted visitors modal:', error);
    }
  };

  const handleShowSecurityIncidentsModal = () => {
    try {
      console.log('🔒 Opening Security Incidents modal...');
      
      // Gather all security incidents from master data
      const now = new Date();
      const allIncidents = [];
      
      // 1. Blacklisted visitors
      masterBlacklistedData.forEach(visitor => {
        allIncidents.push({
          id: visitor.id || visitor.visitor_id,
          type: 'Blacklisted',
          severity: 'High',
          visitor_name: visitor.visitor_name || visitor.person_name || visitor.name,
          visitor_email: visitor.visitor_email || visitor.email,
          visitor_phone: visitor.visitor_phone || visitor.phone,
          host_name: visitor.host_name || visitor.person_to_meet,
          incident_time: visitor.blacklisted_at || visitor.created_at || visitor.visit_date,
          description: `Blacklisted visitor: ${visitor.blacklist_reason || visitor.reason_to_blacklist || 'Reason not specified'}`,
          details: visitor.blacklist_reason || visitor.reason_to_blacklist || 'No additional details available',
          source: 'Blacklist'
        });
      });
      
      // 2. Overstay incidents from visits
      [...masterVisitsData, ...masterPreRegistrationsData].forEach(visit => {
        if (visit.check_in_time && !visit.check_out_time) {
          const checkInTime = new Date(visit.check_in_time);
          const hoursStayed = (now - checkInTime) / (1000 * 60 * 60);
          
          if (hoursStayed > 8) {
            allIncidents.push({
              id: visit.id || visit.visitor_id,
              type: 'Overstay',
              severity: hoursStayed > 24 ? 'High' : hoursStayed > 12 ? 'Medium' : 'Low',
              visitor_name: visit.visitor_name || visit.person_name,
              visitor_email: visit.visitor_email || visit.email,
              visitor_phone: visit.visitor_phone || visit.phone,
              host_name: visit.host_name || visit.person_to_meet,
              incident_time: visit.check_in_time,
              description: `Visitor overstay: ${Math.round(hoursStayed)} hours since check-in`,
              details: `Check-in: ${new Date(visit.check_in_time).toLocaleString()}, Duration: ${Math.round(hoursStayed)} hours`,
              source: 'Overstay'
            });
          }
        }
      });
      
      // 3. Incomplete checkouts (24+ hours without checkout)
      [...masterVisitsData, ...masterPreRegistrationsData].forEach(visit => {
        if (visit.check_in_time && (!visit.check_out_time || visit.check_out_time.trim() === '')) {
          const checkInTime = new Date(visit.check_in_time);
          const hoursStayed = (now - checkInTime) / (1000 * 60 * 60);
          
          if (hoursStayed > 24) {
            allIncidents.push({
              id: visit.id || visit.visitor_id,
              type: 'Incomplete Checkout',
              severity: 'Medium',
              visitor_name: visit.visitor_name || visit.person_name,
              visitor_email: visit.visitor_email || visit.email,
              visitor_phone: visit.visitor_phone || visit.phone,
              host_name: visit.host_name || visit.person_to_meet,
              incident_time: visit.check_in_time,
              description: `Incomplete checkout: ${Math.round(hoursStayed)} hours since check-in`,
              details: `Check-in: ${new Date(visit.check_in_time).toLocaleString()}, No checkout recorded`,
              source: 'Incomplete Checkout'
            });
          }
        }
      });
      
      // Sort incidents by severity and time (most recent first)
      allIncidents.sort((a, b) => {
        const severityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return new Date(b.incident_time) - new Date(a.incident_time);
      });
      
      console.log('🔒 Security incidents collected:', allIncidents.length);
      setSecurityIncidentsData(allIncidents);
      setShowSecurityIncidentsModal(true);
      setCurrentPage(1); // Reset pagination
    } catch (error) {
      setError('Failed to load security incidents');
      console.error('Error opening security incidents modal:', error);
    }
  };

  const getVisitorCategory = (visit) => {
    // Handle blacklisted visitors first - highest priority
    if (visit.isBlacklisted || visit.is_blacklisted) return 'Blacklisted';
    
    // Handle checked-out visitors - check both time fields and status
    if ((visit.check_in_time && visit.check_out_time) || visit.status === 'checked_out') {
      return 'Checked-Out';
    }
    
    // Handle checked-in visitors - check both time field and status
    if ((visit.check_in_time && !visit.check_out_time) || visit.status === 'checked_in') {
      return 'Checked-In';
    }
    
    // For pre-registrations, use their status to determine category
    if (visit.isPreRegistration || visit.source === 'pre_registration') {
      switch (visit.status) {
        case 'checked_in':
          return 'Checked-In';
        case 'checked_out':
          return 'Checked-Out';
        case 'pending':
        case 'approved':
        case 'confirmed':
          // For pending pre-registrations, check if visit date is today or future
          const visitDate = new Date(visit.visit_date || visit.visit_date);
          const today = new Date();
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const visitDateStart = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
          
          if (visitDateStart >= todayStart) {
            return 'Expected'; // Future or today's visits
          } else {
            return 'Pending'; // Past visits that haven't been completed
          }
        case 'cancelled':
        case 'rejected':
          return 'Cancelled';
        default:
          return 'Unknown';
      }
    }
    
    // For regular visits (non-pre-registrations)
    if (!visit.check_in_time) {
      // Check if there's a visit date to determine if it's expected or pending
      if (visit.visit_date) {
        const visitDate = new Date(visit.visit_date);
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const visitDateStart = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
        
        if (visitDateStart >= todayStart) {
          return 'Expected';
        } else {
          return 'Pending';
        }
      } else {
        // No visit date specified - treat as pending
        return 'Pending';
      }
    }
    
    return 'Unknown';
  };

  const getOverstayAlert = (visit) => {
    if (!visit.check_in_time || visit.check_out_time) return null;
    const checkInTime = new Date(visit.check_in_time);
    const now = new Date();
    const hoursStayed = (now - checkInTime) / (1000 * 60 * 60);
    if (hoursStayed > 8) return 'danger';
    if (hoursStayed > 4) return 'warning';
    return null;
  };

  // Helper function to filter visitors by status using consistent master data
  const getFilteredVisitorsByStatus = useCallback((status) => {
    // Use master data for consistent filtering across all sections
    let dataSource = [];
    
    switch (status) {
      case 'blacklisted':
        // Always use master blacklisted data for consistency
        dataSource = masterBlacklistedData;
        console.log('🚫 Using master blacklisted data:', dataSource.length);
        break;
      case 'all':
        // Combine all master data sources
        dataSource = [...masterVisitsData, ...masterPreRegistrationsData];
        break;
      default:
        // For other statuses, use combined master data and apply filtering
        dataSource = [...masterVisitsData, ...masterPreRegistrationsData];
        break;
    }
    
    if (status === 'blacklisted') {
      return dataSource; // Already filtered blacklisted data
    }
    
    const filtered = dataSource.filter(visit => {
      switch (status) {
        case 'checked-in':
          // Visitors who have checked in but not checked out
          return visit.check_in_time && !visit.check_out_time && visit.status !== 'checked_out';
        case 'pending':
          // Visitors who haven't checked in yet and don't have a future visit date
          if (visit.isBlacklisted || visit.is_blacklisted) return false;
          if (visit.check_in_time) return false;
          
          if (visit.isPreRegistration && visit.status === 'pending') {
            const visitDate = new Date(visit.visit_date);
            const today = new Date().setHours(0, 0, 0, 0);
            return visitDate.setHours(0, 0, 0, 0) <= today;
          }
          
          if (!visit.isPreRegistration && !visit.check_in_time) {
            const visitDate = new Date(visit.visit_date);
            const today = new Date().setHours(0, 0, 0, 0);
            return visitDate < today;
          }
          
          return false;
        case 'expected':
          // Visitors scheduled for today or future dates who haven't checked in
          return !visit.check_in_time && visit.visit_date && 
                 new Date(visit.visit_date) >= new Date().setHours(0,0,0,0);
        case 'checked-out':
          // Visitors who have both check-in and check-out times
          return visit.check_in_time && visit.check_out_time;
        case 'all':
          return true;
        default:
          return true;
      }
    });
    
    console.log(`� Filtered ${status} visitors:`, filtered.length);
    return filtered;
  }, [masterVisitsData, masterPreRegistrationsData, masterBlacklistedData]);

  // Helper function for pagination
  const getPaginatedData = (data, currentPage, itemsPerPage) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return data.slice(indexOfFirstItem, indexOfLastItem);
  };

  // Helper function to get total pages
  const getTotalPages = (dataLength, itemsPerPage) => {
    return Math.ceil(dataLength / itemsPerPage);
  };

  // Calculate visitor counts using master data for consistency
  const calculateVisitorCounts = useCallback(async () => {
    if (!isInitialDataLoaded) return;
    
    console.log('📊 Calculating visitor counts from master data...');
    
    try {
      // Use master data for consistent counts across all sections
      const allData = [...masterVisitsData, ...masterPreRegistrationsData];
      
      const counts = {
        all: allData.length,
        'checked-in': getFilteredVisitorsByStatus('checked-in').length,
        pending: getFilteredVisitorsByStatus('pending').length,
        expected: getFilteredVisitorsByStatus('expected').length,
        'checked-out': getFilteredVisitorsByStatus('checked-out').length,
        blacklisted: masterBlacklistedData.length
      };
      
      console.log('✅ Updated visitor counts from master data:', counts);
      setVisitorCounts(counts);

      // Calculate visitor type counts based on purpose/reason using master data
      const typeCounts = {
        guests: 0,
        vendors: 0,
        interviewees: 0,
        contractors: 0,
        delivery: 0,
        maintenance: 0,
        clients: 0,
        partners: 0,
        other: 0
      };

      // Include both visits and pre-registrations for type counting
      allData.forEach(visit => {
        const purpose = (visit.reason || visit.purpose || '').toLowerCase();
        const company = (visit.company || visit.visitor_company || '').toLowerCase();
        
        // More comprehensive classification based on purpose and company
        if (purpose.includes('interview') || purpose.includes('candidate') || purpose.includes('job') || 
            purpose.includes('hiring') || purpose.includes('recruitment') || purpose.includes('hr meeting')) {
          typeCounts.interviewees++;
        } else if (purpose.includes('vendor') || purpose.includes('supplier') || purpose.includes('sales') || 
                   purpose.includes('procurement') || purpose.includes('business proposal') || 
                   company.includes('vendor') || company.includes('supplier')) {
          typeCounts.vendors++;
        } else if (purpose.includes('contract') || purpose.includes('construction') || purpose.includes('repair') ||
                   purpose.includes('renovation') || purpose.includes('installation') || purpose.includes('work') ||
                   company.includes('construction') || company.includes('contractor')) {
          typeCounts.contractors++;
        } else if (purpose.includes('delivery') || purpose.includes('courier') || purpose.includes('package') ||
                   purpose.includes('shipment') || purpose.includes('pickup') || purpose.includes('fedex') ||
                   purpose.includes('ups') || purpose.includes('dhl') || company.includes('delivery') ||
                   company.includes('courier') || company.includes('logistics')) {
          typeCounts.delivery++;
        } else if (purpose.includes('maintenance') || purpose.includes('service') || purpose.includes('technical') ||
                   purpose.includes('repair') || purpose.includes('support') || purpose.includes('it support') ||
                   purpose.includes('cleaning') || purpose.includes('facility') || company.includes('service') ||
                   company.includes('maintenance') || company.includes('technical')) {
          typeCounts.maintenance++;
        } else if (purpose.includes('client') || purpose.includes('customer') || purpose.includes('business meeting') ||
                   purpose.includes('consultation') || purpose.includes('presentation') || purpose.includes('demo') ||
                   purpose.includes('proposal meeting') || purpose.includes('project meeting')) {
          typeCounts.clients++;
        } else if (purpose.includes('partner') || purpose.includes('collaboration') || purpose.includes('partnership') ||
                   purpose.includes('alliance') || purpose.includes('joint venture') || purpose.includes('strategic meeting')) {
          typeCounts.partners++;
        } else if (purpose.includes('visit') || purpose.includes('guest') || purpose.includes('personal') || 
                   purpose.includes('friend') || purpose.includes('family') || purpose.includes('tour') ||
                   purpose.includes('general visit') || purpose.includes('casual visit')) {
          typeCounts.guests++;
        } else if (purpose.trim() === '' || purpose.includes('other') || purpose.includes('misc')) {
          typeCounts.other++;
        } else {
          // Default to guests for unclassified purposes
          typeCounts.guests++;
        }
      });

      setVisitorTypeCounts(typeCounts);
      
    } catch (error) {
      console.error('❌ Error calculating visitor counts:', error);
    }
  }, [isInitialDataLoaded, masterVisitsData, masterPreRegistrationsData, masterBlacklistedData, getFilteredVisitorsByStatus]);

  // Update visitor counts when master data changes
  useEffect(() => {
    if (isInitialDataLoaded) {
      calculateVisitorCounts();
    }
  }, [calculateVisitorCounts, isInitialDataLoaded]);

  const last30DaysVisits = visits.filter(visit => {
    const visitDate = new Date(visit.check_in_time);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return visitDate >= thirtyDaysAgo;
  });

  const getChartData = () => {
    const today = new Date();
    const labels = [];
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      labels.push(dateString);
      const count = last30DaysVisits.filter(visit => 
        new Date(visit.check_in_time).toISOString().split('T')[0] === dateString
      ).length;
      data.push(count);
    }
    return {
      labels,
      datasets: [
        {
          label: 'Visitors per Day',
          data,
          backgroundColor: '#0984e3',
          borderColor: '#0984e3',
          borderWidth: 1
        }
      ]
    };
  };

  const getVisitReasonsData = () => {
    // Calculate real statistics from actual database visit data
    if (!visits || visits.length === 0) {
      return {
        labels: ['No Data Available'],
        datasets: [{
          data: [1],
          backgroundColor: ['#E0E0E0'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };
    }

    // Count actual purposes from database data
    const actualPurposeCounts = {};
    
    visits.forEach(visit => {
      // Get the exact purpose/reason from database
      const purpose = visit.reason || visit.purpose || visit.visit_purpose || 'Not Specified';
      
      // Use the exact purpose as stored in database
      if (actualPurposeCounts[purpose]) {
        actualPurposeCounts[purpose]++;
      } else {
        actualPurposeCounts[purpose] = 1;
      }
    });

    // Sort by count (descending) to show most common purposes first
    const sortedPurposes = Object.entries(actualPurposeCounts)
      .sort(([,a], [,b]) => b - a)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    const labels = Object.keys(sortedPurposes);
    const data = Object.values(sortedPurposes);

    // Generate colors dynamically based on number of categories
    const generateColors = (count) => {
      const baseColors = [
        '#2E86AB', '#A23B72', '#F18F01', '#C73E1D',
        '#1B998B', '#84A59D', '#F5853F', '#6C757D',
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
      ];
      
      if (count <= baseColors.length) {
        return baseColors.slice(0, count);
      }
      
      // Generate additional colors if needed
      const colors = [...baseColors];
      for (let i = baseColors.length; i < count; i++) {
        const hue = (i * 137.508) % 360; // Golden angle approximation
        colors.push(`hsl(${hue}, 65%, 60%)`);
      }
      return colors;
    };

    const backgroundColor = generateColors(labels.length);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 4,
          hoverBorderWidth: 3
        }
      ]
    };
  };

  // Generate fallback visitor trend data from master data if reportData is not available
  const generateFallbackTrendData = () => {
    if (!reportData || !reportData.dailyStats || reportData.dailyStats.length === 0) {
      // Generate fallback data from master data instead of random data
      if (isInitialDataLoaded && masterVisitsData.length > 0) {
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateKey = date.toISOString().split('T')[0];
          
          // Count actual visits from master data for this date
          const visitsForDate = masterVisitsData.filter(visit => {
            const visitDate = visit.check_in_time ? new Date(visit.check_in_time) : new Date(visit.visit_date);
            return visitDate && visitDate.toISOString().split('T')[0] === dateKey;
          }).length;
          
          last7Days.push({
            label: date.toLocaleDateString(),
            data: visitsForDate
          });
        }
        
        return {
          labels: last7Days.map(d => d.label),
          data: last7Days.map(d => d.data)
        };
      }
      
      // If no master data available, return null instead of random data
      return null;
    }
    return null;
  };

  const fallbackData = generateFallbackTrendData();

  // Memoize chart data to prevent unnecessary re-renders
  const visitorTrendData = useMemo(() => {
    console.log('📊 Generating visitor trend chart data');
    return reportData ? {
      labels: reportData.dailyStats?.map(d => {
        try {
          return new Date(d.date).toLocaleDateString();
        } catch (e) {
          console.error('Error formatting date:', d.date);
          return d.date;
        }
      }) || fallbackData?.labels || [],
      datasets: [
        {
          label: 'Daily Visitors',
          data: reportData.dailyStats?.map(d => d.visits || 0) || fallbackData?.data || [],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    } : fallbackData ? {
      labels: fallbackData.labels,
      datasets: [
        {
          label: 'Daily Visitors (Master Data)',
          data: fallbackData.data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    } : null;
  }, [reportData, fallbackData]);

  const hostActivityData = useMemo(() => {
    console.log('📊 Generating host activity chart data');
    return reportData ? {
      labels: reportData.hostStats?.map(h => h.host_name) || [],
      datasets: [
        {
          label: 'Visitors Received',
          data: reportData.hostStats?.map(h => h.visits) || [],
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
          ],
        }
      ]
    } : null;
  }, [reportData]);

  const visitReasonData = useMemo(() => {
    console.log('📊 Generating visit reason chart data');
    return reportData ? {
      labels: reportData.purposeStats?.map(r => r.purpose) || [],
      datasets: [
        {
          data: reportData.purposeStats?.map(r => r.count) || [],
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#FF6384',
            '#C9CBCF'
          ],
        }
      ]
    } : null;
  }, [reportData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Visitors'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Advanced Visitor Handlers
  const handlePreRegSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Clean the form data to handle empty strings properly
      const cleanedForm = {
        ...preRegForm,
        // Convert empty strings to null for optional fields
        duration: preRegForm.duration && preRegForm.duration.trim() !== '' ? preRegForm.duration : null,
        specialRequirements: preRegForm.specialRequirements && preRegForm.specialRequirements.trim() !== '' ? preRegForm.specialRequirements : null,
        emergencyContact: preRegForm.emergencyContact && preRegForm.emergencyContact.trim() !== '' ? preRegForm.emergencyContact : null,
        vehicleNumber: preRegForm.vehicleNumber && preRegForm.vehicleNumber.trim() !== '' ? preRegForm.vehicleNumber : null,
        recurringEndDate: preRegForm.recurringEndDate && preRegForm.recurringEndDate.trim() !== '' ? preRegForm.recurringEndDate : null
      };

      const result = await preRegisterVisitor(cleanedForm);
      setMessage('Visitor pre-registered successfully!');
      setQrCodeData(result.qrCode);
      setPreRegForm({
        visitorName: '',
        visitorEmail: '',
        visitorPhone: '',
        visitorCompany: '',
        hostName: '',
        visitDate: '',
        visitTime: '',
        purpose: '',
        duration: '',
        isRecurring: false,
        recurringPattern: 'weekly',
        recurringEndDate: '',
        specialRequirements: '',
        emergencyContact: '',
        vehicleNumber: '',
        numberOfVisitors: 1
      });
    } catch (err) {
      setError(err.message || 'Failed to pre-register visitor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreRegForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateBadge = async (preRegId) => {
    setLoading(true);
    setError('');
    
    try {
      const badgeResponse = await generatePreRegistrationBadge(preRegId);
      setBadgeData(badgeResponse);
      setShowBadgeModal(true);
    } catch (err) {
      setError('Failed to generate visitor badge: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const printBadge = () => {
    if (badgeData && badgeData.html) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Visitor Badge</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          ${badgeData.html}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const showQRCode = (visitor) => {
    setSelectedVisitor(visitor);
    setShowQRModal(true);
  };

  // Share QR Code Functions
  const shareQRCode = async (method) => {
    if (!selectedVisitor) return;

    const qrData = selectedVisitor.qr_code || JSON.stringify({
      visitorId: selectedVisitor.visitor_id || selectedVisitor.id,
      visitorName: selectedVisitor.visitor_name || selectedVisitor.visitorName,
      visitDate: selectedVisitor.visit_date || selectedVisitor.check_in_time
    });

    const shareText = `QR Code for ${selectedVisitor.visitor_name || selectedVisitor.visitorName} - Visit on ${selectedVisitor.visit_date ? new Date(selectedVisitor.visit_date).toLocaleDateString() : 'N/A'}`;
    const shareUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(qrData)}`;

    try {
      switch (method) {
        case 'email':
          const emailSubject = encodeURIComponent(`QR Code for ${selectedVisitor.visitor_name || selectedVisitor.visitorName}`);
          const emailBody = encodeURIComponent(`Please find the QR code data for visitor ${selectedVisitor.visitor_name || selectedVisitor.visitorName}.\n\nQR Code Data: ${qrData}\n\nVisit Details:\nHost: ${selectedVisitor.host_name || selectedVisitor.hostName}\nDate: ${selectedVisitor.visit_date ? new Date(selectedVisitor.visit_date).toLocaleDateString() : 'N/A'}\nTime: ${selectedVisitor.visit_time || 'N/A'}\nPurpose: ${selectedVisitor.purpose || 'N/A'}`);
          window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`);
          break;

        case 'sms':
          const smsBody = encodeURIComponent(`QR Code for ${selectedVisitor.visitor_name || selectedVisitor.visitorName}: ${qrData}`);
          window.open(`sms:?body=${smsBody}`);
          break;

        case 'whatsapp':
          const whatsappText = encodeURIComponent(`QR Code for ${selectedVisitor.visitor_name || selectedVisitor.visitorName}\n\nQR Data: ${qrData}\n\nVisit Details:\nHost: ${selectedVisitor.host_name || selectedVisitor.hostName}\nDate: ${selectedVisitor.visit_date ? new Date(selectedVisitor.visit_date).toLocaleDateString() : 'N/A'}`);
          window.open(`https://wa.me/?text=${whatsappText}`);
          break;

        case 'copy':
          await navigator.clipboard.writeText(qrData);
          setMessage('QR Code data copied to clipboard!');
          setTimeout(() => setMessage(''), 3000);
          break;

        case 'download':
          // Enhanced download functionality for the new QR modal
          setLoading(true);
          try {
            const qrCodeElement = document.querySelector('.qr-code-svg') || 
                                 document.querySelector('.qr-code-frame svg') || 
                                 document.querySelector('.qr-code-container svg');
          
          if (qrCodeElement) {
            // Create a higher quality canvas for better download
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const svgData = new XMLSerializer().serializeToString(qrCodeElement);
            
            // Create a blob from SVG data
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = () => {
              // Set canvas size for high quality (larger than display size)
              canvas.width = 400;
              canvas.height = 400;
              
              // Fill with white background
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Draw the QR code
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              // Convert to blob and download
              canvas.toBlob((blob) => {
                const downloadUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `qr-code-${(selectedVisitor.visitor_name || selectedVisitor.visitorName || 'visitor').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(downloadUrl);
                setMessage('QR Code downloaded successfully!');
                setTimeout(() => setMessage(''), 3000);
                setLoading(false);
              }, 'image/png', 1.0);
              
              URL.revokeObjectURL(url);
            };
            
            img.onerror = () => {
              console.error('Failed to load QR code image, trying alternative method...');
              // Fallback: Create QR code data URL and download
              try {
                const qrData = selectedVisitor.qr_code || JSON.stringify({
                  visitorId: selectedVisitor.visitor_id || selectedVisitor.id,
                  visitorName: selectedVisitor.visitor_name || selectedVisitor.visitorName,
                  visitDate: selectedVisitor.visit_date || selectedVisitor.check_in_time
                });
                
                // Create a simple text file with QR data as fallback
                const textBlob = new Blob([`QR Code Data for ${selectedVisitor.visitor_name || selectedVisitor.visitorName}\n\nData: ${qrData}\n\nScan this data with a QR code generator to recreate the QR code.`], { type: 'text/plain' });
                const textUrl = URL.createObjectURL(textBlob);
                const link = document.createElement('a');
                link.href = textUrl;
                link.download = `qr-data-${(selectedVisitor.visitor_name || selectedVisitor.visitorName || 'visitor').replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(textUrl);
                setMessage('QR Code data downloaded as text file!');
                setTimeout(() => setMessage(''), 3000);
                setLoading(false);
              } catch (error) {
                console.error('Fallback download also failed:', error);
                setMessage('Failed to download QR code. Please try again.');
              }
              URL.revokeObjectURL(url);
            };
            
            img.src = url;
          } else {
            console.error('QR Code element not found, trying alternative download...');
            // Alternative method: download QR data as text
            try {
              const qrData = selectedVisitor.qr_code || JSON.stringify({
                visitorId: selectedVisitor.visitor_id || selectedVisitor.id,
                visitorName: selectedVisitor.visitor_name || selectedVisitor.visitorName,
                visitDate: selectedVisitor.visit_date || selectedVisitor.check_in_time
              });
              
              const textBlob = new Blob([`QR Code Data for ${selectedVisitor.visitor_name || selectedVisitor.visitorName}\n\nData: ${qrData}\n\nScan this data with a QR code generator to recreate the QR code.`], { type: 'text/plain' });
              const textUrl = URL.createObjectURL(textBlob);
              const link = document.createElement('a');
              link.href = textUrl;
              link.download = `qr-data-${(selectedVisitor.visitor_name || selectedVisitor.visitorName || 'visitor').replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(textUrl);
              setMessage('QR Code data downloaded as text file!');
              setTimeout(() => setMessage(''), 3000);
              setLoading(false);
            } catch (error) {
              console.error('Alternative download failed:', error);
              setMessage('Failed to download QR code. Please try again.');
            }
          }
          } catch (error) {
            console.error('Download error:', error);
            setMessage('Failed to download QR code. Please try again.');
          } finally {
            setLoading(false);
          }
          break;

        default:
          if (navigator.share) {
            await navigator.share({
              title: shareText,
              text: qrData,
              url: shareUrl
            });
          } else {
            // Fallback to copy
            await navigator.clipboard.writeText(qrData);
            setMessage('QR Code data copied to clipboard!');
            setTimeout(() => setMessage(''), 3000);
          }
      }
    } catch (err) {
      console.error('Share failed:', err);
      setError('Failed to share QR code');
      setTimeout(() => setError(''), 3000);
    }
  };

  const updateRecurringStatus = async (id, status) => {
    setLoading(true);
    try {
      await updateRecurringVisit(id, { status });
      setMessage(`Recurring visit ${status} successfully`);
      fetchRecurringVisits();
    } catch (err) {
      setError(`Failed to ${status} recurring visit`);
    } finally {
      setLoading(false);
    }
  };

  const editRecurringVisit = async (id, pattern, endDate) => {
    setLoading(true);
    try {
      await updateRecurringVisit(id, { 
        recurringPattern: pattern, 
        recurringEndDate: endDate 
      });
      setMessage('Recurring visit updated successfully');
      fetchRecurringVisits();
    } catch (err) {
      setError('Failed to update recurring visit');
    } finally {
      setLoading(false);
    }
  };

  const generateInstances = async (id) => {
    setLoading(true);
    try {
      const result = await generateRecurringInstances(id);
      setMessage(result.message);
      fetchPreRegistrations();
    } catch (err) {
      setError('Failed to generate recurring instances');
    } finally {
      setLoading(false);
    }
  };

  const handleBlacklistUpdate = async (visitorId, isBlacklisted) => {
    if (!visitorId) {
      setError('Cannot blacklist visitor: Visitor ID not found');
      return;
    }

    const visitor = visitorHistory.find(v => v.visitor_id === visitorId);
    const visitorEmail = visitor?.visitor_email || visitor?.email;

    if (!visitorEmail) {
      setError('Cannot blacklist visitor: Email not found');
      return;
    }

    const confirmMessage = isBlacklisted 
      ? `Are you sure you want to blacklist all visits for "${visitorEmail}"? This will affect all visit records for this email address.`
      : `Are you sure you want to remove "${visitorEmail}" from the blacklist? This will affect all visit records for this email address.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const response = await updateVisitorBlacklist(visitorId, isBlacklisted);
      const affectedCount = response.affectedRecords || 1;
      setMessage(`${isBlacklisted ? 'Blacklisted' : 'Unblacklisted'} all visits for ${visitorEmail}. ${affectedCount} record(s) updated.`);
      if (activeTab === 'history') {
        fetchVisitorHistory();
      }
    } catch (err) {
      console.error('Blacklist update error:', err);
      setError(`Failed to ${isBlacklisted ? 'blacklist' : 'unblacklist'} visitor: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryFilterChange = (e) => {
    const { name, value } = e.target;
    setHistoryFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyHistoryFilters = async () => {
    setLoading(true);
    setHistoryCurrentPage(1); // Reset pagination when applying filters
    try {
      const history = await getVisitorHistory(historyFilters);
      setVisitorHistory(history);
    } catch (error) {
      console.error('Error fetching visitor history:', error);
      setError('Error fetching visitor history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearHistoryFilters = async () => {
    setHistoryFilters({
      startDate: '',
      endDate: '',
      visitorEmail: '',
      hostName: ''
    });
    setHistoryCurrentPage(1); // Reset pagination when clearing filters

    setLoading(true);
    try {
      const history = await getVisitorHistory({
        startDate: '',
        endDate: '',
        visitorEmail: '',
        hostName: ''
      });
      setVisitorHistory(history);
      setMessage('Filters cleared successfully');
    } catch (error) {
      console.error('Error fetching visitor history:', error);
      setError('Error fetching visitor history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatVisitStatus = (visit) => {
    if (visit.status) {
      switch (visit.status) {
        case 'completed': return 'Completed';
        case 'in_progress': return 'In Progress';
        case 'scheduled': return 'Scheduled';
        case 'missed': return 'Missed';
        default: return 'Expected';
      }
    }
    
    if (visit.check_out_time) return 'Completed';
    if (visit.check_in_time) return 'In Progress';
    
    const visitDateTime = new Date(`${visit.visit_date} ${visit.visit_time}`);
    if (visitDateTime > new Date()) return 'Scheduled';
    
    return 'Missed';
  };

  // System Admin Functions
  const loadSystemData = async () => {
    try {
      setLoading(true);
      const [settingsData, usersData, auditData, backupsData] = await Promise.all([
        getSystemSettings(),
        getUsers(),
        getAuditLogs(auditFilters),
        getSystemBackups()
      ]);
      
      // Ensure settingsData has proper structure with fallbacks
      const safeSettingsData = {
        companyName: '',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        allowPreregistration: true,
        requireApproval: true,
        maxVisitorDuration: 8,
        workingHours: {
          start: '09:00',
          end: '18:00'
        },
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: false,
          hostNotification: true,
          adminNotification: true
        },
        securityLevel: 'medium',
        dataRetentionDays: 365,
        backupFrequency: 'daily',
        maintenanceMode: false,
        ...settingsData,
        workingHours: {
          start: '09:00',
          end: '18:00',
          ...settingsData?.workingHours
        },
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: false,
          hostNotification: true,
          adminNotification: true,
          ...settingsData?.notificationSettings
        }
      };
      
      setSystemSettings(safeSettingsData);
      setSystemUsers(usersData);
      setAuditLogs(auditData);
      setBackups(backupsData);
    } catch (error) {
      console.error('Error loading system data:', error);
      setError('Error loading system data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSystemSettings(systemSettings);
      setMessage('System settings updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Error updating settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, newAdminUser);
        setMessage('User updated successfully');
        setEditingUser(null);
      } else {
        await createAdminUser(newAdminUser);
        setMessage('User created successfully');
      }
      
      setNewAdminUser({
        name: '',
        email: '',
        password: '',
        role: 'host',
        department: '',
        phone: '',
        isActive: true
      });
      
      await loadSystemData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Error saving user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewAdminUser({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department || '',
      phone: user.phone || '',
      isActive: user.is_active !== false
    });
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    setLoading(true);
    try {
      await deleteUser(userId);
      setMessage('User deleted successfully');
      await loadSystemData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Error deleting user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    setBackupProgress(0);
    try {
      // Simulate backup progress
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      await createBackup();
      setBackupProgress(100);
      setMessage('Backup created successfully');
      
      setTimeout(() => {
        setBackupProgress(0);
        setMessage('');
      }, 3000);
      
      await loadSystemData();
    } catch (error) {
      console.error('Error creating backup:', error);
      setError('Error creating backup. Please try again.');
      setBackupProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId) => {
    if (!window.confirm('Are you sure you want to restore this backup? This will overwrite current data.')) return;
    
    setLoading(true);
    try {
      await restoreBackup(backupId);
      setMessage('Backup restored successfully');
      await loadSystemData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error restoring backup:', error);
      setError('Error restoring backup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportSystemData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage('Data exported successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Error exporting data. Please try again.');
    }
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setLoading(true);
        await importSystemData(data);
        setMessage('Data imported successfully');
        await loadSystemData();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error('Error importing data:', error);
        setError('Error importing data. Please check file format.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAuditFilterChange = (e) => {
    const { name, value } = e.target;
    setAuditFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const logs = await getAuditLogs(auditFilters);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError('Error fetching audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load system data when system admin tab is accessed
  useEffect(() => {
    if (activeSection === 'system-admin') {
      loadSystemData();
    }
  }, [activeSection]);

  return (
    <div className="admin-dashboard-bg">
      {/* Responsive Navigation Bar */}
      <Navbar 
        isLoggedIn={true}
        onLogout={handleLogout}
        showMainLinks={false}
        showAuthButtons={false}
        showDashboardTitle={true}
        dashboardTitle="Admin Panel"
      />
      <div className="admin-dashboard-wrapper">
        <aside className="admin-sidebar">
          <h3 className="sidebar-title">Admin Panel</h3>
          <ul className="sidebar-menu">
            <li>
              <button 
                className={`sidebar-menu-btn ${activeSection === 'dashboard' ? 'active' : ''}`}
                onClick={() => toggleMenu('dashboard')}
                type="button"
                data-section="dashboard"
                aria-expanded={expandedMenus.dashboard}
              >
                <span>📊 Dashboard</span>
                <span className="chevron">▶</span>
              </button>
              {expandedMenus.dashboard && (
                <ul className="sidebar-submenu">
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${activeSubSection === 'visitor-dashboard' ? 'active' : ''}`}
                      onClick={() => {
                        toggleMenu('visitorDashboard');
                        handleNavigation('dashboard', 'visitor-dashboard');
                      }}
                      type="button"
                      data-parent="dashboard"
                      aria-expanded={expandedMenus.visitorDashboard}
                    >
                      <span>👥 Visitor Dashboard</span>
                      <span className="chevron">▶</span>
                    </button>
                    {expandedMenus.visitorDashboard && (
                      <ul className="sidebar-sub-submenu">
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'visitor-status-metrics' ? 'active' : ''}`}
                            onClick={() => handleNavigation('dashboard', 'visitor-dashboard', 'visitor-status-metrics')}
                            type="button"
                            data-grandparent="dashboard"
                          >
                            📈 Visitor Status Metrics
                          </button>
                        </li>
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'visitor-statistics' ? 'active' : ''}`}
                            onClick={() => handleNavigation('dashboard', 'visitor-dashboard', 'visitor-statistics')}
                            type="button"
                            data-grandparent="dashboard"
                          >
                            📊 Visitor Statistics
                          </button>
                        </li>
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'frequent-visitors' ? 'active' : ''}`}
                            onClick={() => handleNavigation('dashboard', 'visitor-dashboard', 'frequent-visitors')}
                            type="button"
                            data-grandparent="dashboard"
                          >
                            🔄 Most Frequent Visitors
                          </button>
                        </li>
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'visitor-type-data' ? 'active' : ''}`}
                            onClick={() => handleNavigation('dashboard', 'visitor-dashboard', 'visitor-type-data')}
                            type="button"
                            data-grandparent="dashboard"
                          >
                            📋 Visitor Type Data
                          </button>
                        </li>
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'visitor-type-chart' ? 'active' : ''}`}
                            onClick={() => handleNavigation('dashboard', 'visitor-dashboard', 'visitor-type-chart')}
                            type="button"
                            data-grandparent="dashboard"
                          >
                            🥧 Visitor Type Differentiation
                          </button>
                        </li>
                      </ul>
                    )}
                  </li>
                  {/* <li>
                    <button
                      className={`sidebar-submenu-btn ${activeSubSection === 'hr-dashboard' ? 'active' : ''}`}
                      onClick={() => {
                        toggleMenu('hrDashboard');
                        handleNavigation('dashboard', 'hr-dashboard');
                      }}
                      type="button"
                      data-parent="dashboard"
                      aria-expanded={expandedMenus.hrDashboard}
                    >
                      <span>👔 HR Dashboard</span>
                      <span className="chevron">▶</span>
                    </button>
                    {expandedMenus.hrDashboard && (
                      <ul className="sidebar-sub-submenu">
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'guests-statistics' ? 'active' : ''}`}
                            onClick={() => handleNavigation('dashboard', 'hr-dashboard', 'guests-statistics')}
                            type="button"
                            data-grandparent="dashboard"
                          >
                            📊 Guests Statistics
                          </button>
                        </li>
                      </ul>
                    )}
                  </li> */}
                </ul>
              )}
            </li>
            <li>
              <button 
                className={`sidebar-menu-btn ${activeSection === 'visitor-logs' ? 'active' : ''}`}
                onClick={() => toggleMenu('visitorLogs')}
                type="button"
                data-section="visitor-logs"
                aria-expanded={expandedMenus.visitorLogs}
              >
                <span>📋 Visitor Management</span>
                <span className="chevron">▶</span>
              </button>
              {expandedMenus.visitorLogs && (
                <ul className="sidebar-submenu">
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${activeSubSection === 'visitor-dashboard-logs' ? 'active' : ''}`}
                      onClick={() => {
                        toggleMenu('visitorDashboardLogs');
                        handleNavigation('visitor-logs', 'visitor-dashboard-logs');
                      }}
                      type="button"
                      data-parent="visitor-logs"
                      aria-expanded={expandedMenus.visitorDashboardLogs}
                    >
                      <span>👥 Visitor Logs</span>
                      <span className="chevron">▶</span>
                    </button>
                    {expandedMenus.visitorDashboardLogs && (
                      <ul className="sidebar-sub-submenu">
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'total-visitors' ? 'active' : ''}`}
                            onClick={() => handleNavigation('visitor-logs', 'visitor-dashboard-logs', 'total-visitors')}
                            type="button"
                            data-grandparent="visitor-logs"
                          >
                            👤 Total Visitors
                          </button>
                        </li>
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'checked-in-visitors' ? 'active' : ''}`}
                            onClick={() => handleNavigation('visitor-logs', 'visitor-dashboard-logs', 'checked-in-visitors')}
                            type="button"
                            data-grandparent="visitor-logs"
                          >
                            ✅ Checked-In Visitors
                          </button>
                        </li>
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'pending-visitors' ? 'active' : ''}`}
                            onClick={() => handleNavigation('visitor-logs', 'visitor-dashboard-logs', 'pending-visitors')}
                            type="button"
                            data-grandparent="visitor-logs"
                          >
                            ⏳ Pending Visitors
                          </button>
                        </li>
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'expected-visitors' ? 'active' : ''}`}
                            onClick={() => handleNavigation('visitor-logs', 'visitor-dashboard-logs', 'expected-visitors')}
                            type="button"
                            data-grandparent="visitor-logs"
                          >
                            📅 Expected Visitors
                          </button>
                        </li>
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'checked-out-visitors' ? 'active' : ''}`}
                            onClick={() => handleNavigation('visitor-logs', 'visitor-dashboard-logs', 'checked-out-visitors')}
                            type="button"
                            data-grandparent="visitor-logs"
                          >
                            ❌ Checked-Out Visitors
                          </button>
                        </li>
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'blacklist-visitors' ? 'active' : ''}`}
                            onClick={() => handleNavigation('visitor-logs', 'visitor-dashboard-logs', 'blacklist-visitors')}
                            type="button"
                            data-grandparent="visitor-logs"
                          >
                            🚫 Blacklist Visitors
                          </button>
                        </li>
                      </ul>
                    )}
                  </li>
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${activeSubSection === 'hr-dashboard-logs' ? 'active' : ''}`}
                      onClick={() => {
                        toggleMenu('hrDashboardLogs');
                        handleNavigation('visitor-logs', 'hr-dashboard-logs');
                      }}
                      type="button"
                      data-parent="visitor-logs"
                      aria-expanded={expandedMenus.hrDashboardLogs}
                    >
                      <span>👔 Guest Management</span>
                      <span className="chevron">▶</span>
                    </button>
                    {expandedMenus.hrDashboardLogs && (
                      <ul className="sidebar-sub-submenu">
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'total-guests' ? 'active' : ''}`}
                            onClick={() => handleNavigation('visitor-logs', 'hr-dashboard-logs', 'total-guests')}
                            type="button"
                            data-grandparent="visitor-logs"
                          >
                            👥 Total Guests
                          </button>
                        </li>
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'pending-guests' ? 'active' : ''}`}
                            onClick={() => handleNavigation('visitor-logs', 'hr-dashboard-logs', 'pending-guests')}
                            type="button"
                            data-grandparent="visitor-logs"
                          >
                            ⏳ Pending Guests
                          </button>
                        </li>
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'awaiting-guests' ? 'active' : ''}`}
                            onClick={() => handleNavigation('visitor-logs', 'hr-dashboard-logs', 'awaiting-guests')}
                            type="button"
                            data-grandparent="visitor-logs"
                          >
                            ⏰ Awaiting Guests
                          </button>
                        </li>
                        <li>
                          <button
                            className={`sidebar-sub-submenu-btn ${activeSubSubSection === 'onboarded-guests' ? 'active' : ''}`}
                            onClick={() => handleNavigation('visitor-logs', 'hr-dashboard-logs', 'onboarded-guests')}
                            type="button"
                            data-grandparent="visitor-logs"
                          >
                            🎯 Onboarded Guests
                          </button>
                        </li>
                      </ul>
                    )}
                  </li>
                </ul>
              )}
            </li>
            <li>
              <button 
                className={`sidebar-menu-btn ${activeSection === 'manage-users' ? 'active' : ''}`}
                onClick={() => {
                  toggleMenu('manageUsers');
                  handleNavigation('manage-users');
                }}
                type="button"
                data-section="manage-users"
                aria-expanded={expandedMenus.manageUsers}
              >
                <span>👥 Manage Users</span>
                <span className="chevron">▶</span>
              </button>
              {expandedMenus.manageUsers && (
                <ul className="sidebar-submenu">
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${activeSubSection === 'add-new-host' ? 'active' : ''}`}
                      onClick={() => handleNavigation('manage-users', 'add-new-host')}
                      type="button"
                      data-parent="manage-users"
                    >
                      ➕ Add New Host
                    </button>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <button 
                className={`sidebar-menu-btn ${activeSection === 'reports' ? 'active' : ''}`}
                onClick={() => {
                  toggleMenu('reports');
                  handleNavigation('reports');
                }}
                type="button"
                data-section="reports"
                aria-expanded={expandedMenus.reports}
              >
                <span>📊 Reports & Analytics</span>
                <span className="chevron">▶</span>
              </button>
              {expandedMenus.reports && (
                <ul className="sidebar-submenu">
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${activeReportTab === 'overview' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavigation('reports');
                        setActiveReportTab('overview');
                      }}
                      type="button"
                      data-parent="reports"
                    >
                      📈 Overview
                    </button>
                  </li>
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${activeReportTab === 'visitors' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavigation('reports');
                        setActiveReportTab('visitors');
                      }}
                      type="button"
                      data-parent="reports"
                    >
                      👥 Visitor Analytics
                    </button>
                  </li>
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${activeReportTab === 'hosts' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavigation('reports');
                        setActiveReportTab('hosts');
                      }}
                      type="button"
                      data-parent="reports"
                    >
                      👔 Host Performance
                    </button>
                  </li>
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${activeReportTab === 'security' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavigation('reports');
                        setActiveReportTab('security');
                      }}
                      type="button"
                      data-parent="reports"
                    >
                      🔒 Security Insights
                    </button>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <button 
                className={`sidebar-menu-btn ${activeSection === 'advanced-visitors' ? 'active' : ''}`}
                onClick={() => {
                  toggleMenu('advancedVisitors');
                  handleNavigation('advanced-visitors');
                }}
                type="button"
                data-section="advanced-visitors"
                aria-expanded={expandedMenus.advancedVisitors}
              >
                <span>👥 Advanced Visitor Features</span>
                <span className="chevron">▶</span>
              </button>
              {expandedMenus.advancedVisitors && (
                <ul className="sidebar-submenu">
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${activeTab === 'preregister' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavigation('advanced-visitors');
                        setActiveTab('preregister');
                      }}
                      type="button"
                      data-parent="advanced-visitors"
                    >
                      ➕ Pre-Register Visitor
                    </button>
                  </li>
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${activeTab === 'preregistrations' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavigation('advanced-visitors');
                        setActiveTab('preregistrations');
                      }}
                      type="button"
                      data-parent="advanced-visitors"
                    >
                      📋 Pre-Registrations
                    </button>
                  </li>
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${activeTab === 'qrcode' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavigation('advanced-visitors');
                        setActiveTab('qrcode');
                      }}
                      type="button"
                      data-parent="advanced-visitors"
                    >
                      📷 View QR Code 
                    </button>
                  </li>
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${activeTab === 'recurring' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavigation('advanced-visitors');
                        setActiveTab('recurring');
                      }}
                      type="button"
                      data-parent="advanced-visitors"
                    >
                      🔄 Recurring Visits
                    </button>
                  </li>
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${activeTab === 'history' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavigation('advanced-visitors');
                        setActiveTab('history');
                      }}
                      type="button"
                      data-parent="advanced-visitors"
                    >
                      📜 Visitor History
                    </button>
                  </li>
                </ul>
              )}
            </li>
            {/* <li>
              <button 
                className={`sidebar-menu-btn ${activeSection === 'system-admin' ? 'active' : ''}`}
                onClick={() => {
                  toggleMenu('systemAdmin');
                  handleNavigation('system-admin');
                }}
                type="button"
                data-section="system-admin"
                aria-expanded={expandedMenus.systemAdmin}
              >
                <span>⚙️ System Administration</span>
                <span className="chevron">▶</span>
              </button>
              {expandedMenus.systemAdmin && (
                <ul className="sidebar-submenu">
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${systemAdminActiveTab === 'settings' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavigation('system-admin');
                        setSystemAdminActiveTab('settings');
                      }}
                      type="button"
                      data-parent="system-admin"
                    >
                      ⚙️ System Settings
                    </button>
                  </li>
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${systemAdminActiveTab === 'users' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavigation('system-admin');
                        setSystemAdminActiveTab('users');
                      }}
                      type="button"
                      data-parent="system-admin"
                    >
                      👥 User Management
                    </button>
                  </li>
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${systemAdminActiveTab === 'audit' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavigation('system-admin');
                        setSystemAdminActiveTab('audit');
                      }}
                      type="button"
                      data-parent="system-admin"
                    >
                      📋 Audit Logs
                    </button>
                  </li>
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${systemAdminActiveTab === 'backup' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavigation('system-admin');
                        setSystemAdminActiveTab('backup');
                      }}
                      type="button"
                      data-parent="system-admin"
                    >
                      💾 Backup & Restore
                    </button>
                  </li>
                  <li>
                    <button
                      className={`sidebar-submenu-btn ${systemAdminActiveTab === 'maintenance' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavigation('system-admin');
                        setSystemAdminActiveTab('maintenance');
                      }}
                      type="button"
                      data-parent="system-admin"
                    >
                      🔧 Maintenance
                    </button>
                  </li>
                </ul>
              )}
            </li> */}
          </ul>
        </aside>
        <div className="admin-dashboard-container">
          <h2 className="admin-dashboard-title">
            {activeSection === 'dashboard' && activeSubSection === 'visitor-dashboard' && 'Visitor Dashboard'}
            {activeSection === 'dashboard' && activeSubSection === 'hr-dashboard' && 'HR Dashboard'}
            {activeSection === 'visitor-logs' && 'Visitor Logs'}
            {activeSection === 'manage-users' && 'Manage Users & Privileges'}
            {activeSection === 'reports' && 'Reports & Analytics'}
            {activeSection === 'advanced-visitors' && 'Advanced Visitor Management'}
            {activeSection === 'system-admin' && 'System Administration'}
          </h2>
          {error && <p className="admin-dashboard-error">{error}</p>}
          {message && <div className="success-message">{message}</div>}

          {activeSection === 'dashboard' && activeSubSection === 'visitor-dashboard' && (
            <section>
              {activeSubSubSection === 'visitor-status-metrics' && (
                <div>
                  <h3>Visitor Status Metrics</h3>
                  <div className="dashboard-stats" style={{ marginBottom: '30px' }}>
                    <div className="stat-card" onClick={() => handleShowTotalVisitorsModal()} style={{ cursor: 'pointer' } } >
                      <h4>Total Visitors</h4>
                      <p>{visitorCounts.all}</p>
                      <small>All visitors (Check-in and Expected)</small>
                    </div>
                    <div className="stat-card" onClick={() => handleShowCheckedInVisitorsModal()} style={{ cursor: 'pointer' }}>
                      <h4>Checked-In Visitors</h4>
                      <p>{visitorCounts['checked-in']}</p>
                      <small>Currently inside premises</small>
                    </div>
                    <div className="stat-card" onClick={() => handleShowPendingVisitorsModal()} style={{ cursor: 'pointer' }}>
                      <h4>Pending Visitors</h4>
                      <p>{visitorCounts.pending}</p>
                      <small>Registered but not verified</small>
                    </div>
                    <div className="stat-card" onClick={() => handleShowExpectedVisitorsModal()} style={{ cursor: 'pointer' }}>
                      <h4>Expected Visitors</h4>
                      <p>{visitorCounts.expected}</p>
                      <small>Pre-registered/scheduled</small>
                    </div>
                    <div className="stat-card" onClick={() => handleShowCheckedOutVisitorsModal()} style={{ cursor: 'pointer' }}>
                      <h4>Checked-Out Visitors</h4>
                      <p>{visitorCounts['checked-out']}</p>
                      <small>Completed their visit</small>
                    </div>
                    <div className="stat-card" onClick={() => handleShowBlacklistedVisitorsModal()} style={{ cursor: 'pointer' }}>
                      <h4>Blacklisted Visitors</h4>
                      <p>{visitorCounts.blacklisted}</p>
                      <small>Restricted from entry</small>
                    </div>
                  </div>
                  <div className="dashboard-stats" style={{ marginBottom: '30px' }}>
                    <div className="stat-card">
                      <h4>Active Rate</h4>
                      <p>{visitorCounts.all > 0 ? Math.round((visitorCounts['checked-in'] / visitorCounts.all) * 100) : 0}%</p>
                      <small>Currently checked-in percentage</small>
                    </div>
                    <div className="stat-card">
                      <h4>Completion Rate</h4>
                      <p>{visitorCounts.all > 0 ? Math.round((visitorCounts['checked-out'] / visitorCounts.all) * 100) : 0}%</p>
                      <small>Successfully completed visits</small>
                    </div>
                    <div className="stat-card">
                      <h4>Pending Rate</h4>
                      <p>{visitorCounts.all > 0 ? Math.round((visitorCounts.pending / visitorCounts.all) * 100) : 0}%</p>
                      <small>Awaiting verification</small>
                    </div>
                    <div className="stat-card">
                      <h4>Security Issues</h4>
                      <p>{visitorCounts.blacklisted}</p>
                      <small>Visitors requiring attention</small>
                    </div>
                  </div>
                  <div className="statistics-summary">
                    <h4>Status Analytics Overview</h4>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <strong>Visit Flow Efficiency:</strong> {(() => {
                          const total = visitorCounts.all;
                          const efficient = visitorCounts['checked-in'] + visitorCounts['checked-out'];
                          const efficiency = total > 0 ? Math.round((efficient / total) * 100) : 0;
                          return `${efficiency}% (${efficient} of ${total} visitors processed efficiently)`;
                        })()}
                      </div>
                      <div className="summary-item">
                        <strong>Peak Capacity Status:</strong> {(() => {
                          const currentLoad = visitorCounts['checked-in'];
                          const capacity = 100;
                          const utilizationRate = Math.round((currentLoad / capacity) * 100);
                          return `${utilizationRate}% utilized (${currentLoad}/${capacity} capacity)`;
                        })()}
                      </div>
                      <div className="summary-item">
                        <strong>Visitor Turnover:</strong> {(() => {
                          const total = visitorCounts.all;
                          const completed = visitorCounts['checked-out'];
                          const turnoverRate = total > 0 ? Math.round((completed / total) * 100) : 0;
                          return `${turnoverRate}% completed visits (${completed} out of ${total})`;
                        })()}
                      </div>
                      <div className="summary-item">
                        <strong>Security Alert Level:</strong> {(() => {
                          const alertLevel = visitorCounts.blacklisted;
                          let level = 'LOW';
                          let color = 'green';
                          if (alertLevel > 5) { level = 'HIGH'; color = 'red'; }
                          else if (alertLevel > 2) { level = 'MEDIUM'; color = 'orange'; }
                          return `${level} (${alertLevel} Blacklist visitors)`;
                        })()}
                      </div>
                      <div className="summary-item">
                        <strong>Processing Efficiency:</strong> {(() => {
                          const processed = visitorCounts['checked-in'] + visitorCounts['checked-out'];
                          const pending = visitorCounts.pending + visitorCounts.expected;
                          const total = processed + pending;
                          const efficiency = total > 0 ? Math.round((processed / total) * 100) : 0;
                          return `${efficiency}% processed (${processed} processed, ${pending} pending)`;
                        })()}
                      </div>
                      <div className="summary-item">
                        <strong>Daily Target Progress:</strong> {(() => {
                          const dailyTarget = 50;
                          const current = visitorCounts.all;
                          const progress = Math.round((current / dailyTarget) * 100);
                          return `${progress}% of target (${current}/${dailyTarget} visitors)`;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeSubSubSection === 'visitor-statistics' && (
                <div className="visitor-statistics-content">
                  <h3>Visitor Statistics</h3>
                  <p>Daily/weekly/monthly statistics in graphical formats (bar charts)</p>
                  <div className="dashboard-stats" style={{ marginBottom: '30px' }}>
                    <div className="stat-card">
                      <h4>Last 30 Days Total</h4>
                      <p>{last30DaysVisits.length}</p>
                      <small>Total visitors in last 30 days</small>
                    </div>
                    <div className="stat-card">
                      <h4>Daily Average</h4>
                      <p>{Math.round(last30DaysVisits.length / 30)}</p>
                      <small>Average visitors per day</small>
                    </div>
                    <div className="stat-card">
                      <h4>Peak Day Visitors</h4>
                      <p>{(() => {
                        const dailyCounts = {};
                        last30DaysVisits.forEach(visit => {
                          const date = new Date(visit.check_in_time).toISOString().split('T')[0];
                          dailyCounts[date] = (dailyCounts[date] || 0) + 1;
                        });
                        return Math.max(...Object.values(dailyCounts), 0);
                      })()}</p>
                      <small>Highest single day count</small>
                    </div>
                    <div className="stat-card">
                      <h4>This Week</h4>
                      <p>{(() => {
                        const oneWeekAgo = new Date();
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                        return last30DaysVisits.filter(visit => 
                          new Date(visit.check_in_time) >= oneWeekAgo
                        ).length;
                      })()}</p>
                      <small>Visitors in last 7 days</small>
                    </div>
                    <div className="stat-card">
                      <h4>Today</h4>
                      <p>{(() => {
                        const today = new Date().toISOString().split('T')[0];
                        return last30DaysVisits.filter(visit => 
                          new Date(visit.check_in_time).toISOString().split('T')[0] === today
                        ).length;
                      })()}</p>
                      <small>Visitors today</small>
                    </div>
                    <div className="stat-card">
                      <h4>Growth Trend</h4>
                      <p>{(() => {
                        const firstHalf = last30DaysVisits.filter(visit => {
                          const visitDate = new Date(visit.check_in_time);
                          const fifteenDaysAgo = new Date();
                          fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          return visitDate >= thirtyDaysAgo && visitDate < fifteenDaysAgo;
                        }).length;
                        const secondHalf = last30DaysVisits.filter(visit => {
                          const visitDate = new Date(visit.check_in_time);
                          const fifteenDaysAgo = new Date();
                          fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
                          return visitDate >= fifteenDaysAgo;
                        }).length;
                        const growth = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;
                        return growth > 0 ? `+${growth}%` : `${growth}%`;
                      })()}</p>
                      <small>15-day comparison</small>
                    </div>
                  </div>
                  <div style={{ maxWidth: '800px', margin: '20px 0',height: '500px' }}>
                    <Bar data={getChartData()} options={chartOptions} />
                  </div>
                  <div className="statistics-summary">
                    <h4>Statistical Summary</h4>
                    <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '15px' }}>
                      <div className="summary-item">
                        <strong>Busiest Day:</strong> {(() => {
                          const dailyCounts = {};
                          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          last30DaysVisits.forEach(visit => {
                            const dayOfWeek = new Date(visit.check_in_time).getDay();
                            const dayName = dayNames[dayOfWeek];
                            dailyCounts[dayName] = (dailyCounts[dayName] || 0) + 1;
                          });
                          const busiestDay = Object.keys(dailyCounts).reduce((a, b) => 
                            dailyCounts[a] > dailyCounts[b] ? a : b, 'N/A'
                          );
                          return `${busiestDay} (${dailyCounts[busiestDay] || 0} visits)`;
                        })()}
                      </div>
                      <div className="summary-item">
                        <strong>Peak Hours:</strong> {(() => {
                          const hourCounts = {};
                          last30DaysVisits.forEach(visit => {
                            const hour = new Date(visit.check_in_time).getHours();
                            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                          });
                          const peakHour = Object.keys(hourCounts).reduce((a, b) => 
                            hourCounts[a] > hourCounts[b] ? a : b, 'N/A'
                          );
                          return peakHour !== 'N/A' ? `${peakHour}:00 - ${parseInt(peakHour) + 1}:00` : 'N/A';
                        })()}
                      </div>
                      <div className="summary-item">
                        <strong>Weekday Average:</strong> {(() => {
                          const weekdayVisits = last30DaysVisits.filter(visit => {
                            const dayOfWeek = new Date(visit.check_in_time).getDay();
                            return dayOfWeek >= 1 && dayOfWeek <= 5;
                          });
                          return Math.round(weekdayVisits.length / 22);
                        })()}
                      </div>
                      <div className="summary-item">
                        <strong>Weekend Average:</strong> {(() => {
                          const weekendVisits = last30DaysVisits.filter(visit => {
                            const dayOfWeek = new Date(visit.check_in_time).getDay();
                            return dayOfWeek === 0 || dayOfWeek === 6;
                          });
                          return Math.round(weekendVisits.length / 8);
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeSubSubSection === 'frequent-visitors' && (
                <div>
                  <h3>Most Frequent Visitors</h3>
                  <p>Visitors who have visited more than once, sorted by frequency</p>
                  {loading ? <p>Loading frequent visitors...</p> : (
                    <table className="admin-dashboard-table">
                      <thead>
                        <tr>
                          <th>Visitor Name</th>
                          <th>Email</th>
                          <th>Total Visits</th>
                          <th>Last Visit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Group visits by visitor email to count frequencies
                          const visitorFrequency = {};
                          
                          visits.forEach(visit => {
                            const email = visit.visitorEmail || visit.visitor_email;
                            const name = visit.visitorName || visit.visitor_name;
                            
                            if (email) {
                              if (!visitorFrequency[email]) {
                                visitorFrequency[email] = {
                                  name: name,
                                  email: email,
                                  count: 0,
                                  lastVisit: null
                                };
                              }
                              
                              visitorFrequency[email].count++;
                              
                              // Update last visit date
                              const visitDate = visit.check_in_time || visit.visit_date;
                              if (visitDate) {
                                const currentVisitDate = new Date(visitDate);
                                if (!visitorFrequency[email].lastVisit || currentVisitDate > visitorFrequency[email].lastVisit) {
                                  visitorFrequency[email].lastVisit = currentVisitDate;
                                }
                              }
                            }
                          });
                          
                          // Filter visitors with more than 1 visit and sort by frequency
                          const frequentVisitors = Object.values(visitorFrequency)
                            .filter(visitor => visitor.count > 1)
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 10); // Show top 10 frequent visitors
                          
                          if (frequentVisitors.length === 0) {
                            return (
                              <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                  No visitors with multiple visits found
                                </td>
                              </tr>
                            );
                          }
                          
                          return frequentVisitors.map((visitor, index) => (
                            <tr key={visitor.email}>
                              <td>{visitor.name || 'No name'}</td>
                              <td>{visitor.email}</td>
                              <td>
                                <span style={{ 
                                  fontWeight: 'bold', 
                                  color: visitor.count > 5 ? '#e74c3c' : visitor.count > 3 ? '#f39c12' : '#27ae60' 
                                }}>
                                  {visitor.count}
                                </span>
                              </td>
                              <td>
                                {visitor.lastVisit ? visitor.lastVisit.toLocaleDateString() : 'No date'}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
              {activeSubSubSection === 'visitor-type-data' && (
                <div className="visitor-type-data-content">
                  <h3>Visitor Type Data</h3>
                  <p>Visitor types such as Guest, Vendor, Interviewee, Contractor, etc.</p>
                  <div className="dashboard-stats" style={{ marginBottom: '30px' }}>
                    <div className="stat-card">
                      <h4>Guests</h4>
                      <p>{visitorTypeCounts.guests}</p>
                      <small>General visitors ({visitorCounts.all > 0 ? Math.round((visitorTypeCounts.guests / visitorCounts.all) * 100) : 0}%)</small>
                    </div>
                    <div className="stat-card">
                      <h4>Vendors</h4>
                      <p>{visitorTypeCounts.vendors}</p>
                      <small>Business vendors ({visitorCounts.all > 0 ? Math.round((visitorTypeCounts.vendors / visitorCounts.all) * 100) : 0}%)</small>
                    </div>
                    <div className="stat-card">
                      <h4>Interviewees</h4>
                      <p>{visitorTypeCounts.interviewees}</p>
                      <small>Job candidates ({visitorCounts.all > 0 ? Math.round((visitorTypeCounts.interviewees / visitorCounts.all) * 100) : 0}%)</small>
                    </div>
                    <div className="stat-card">
                      <h4>Contractors</h4>
                      <p>{visitorTypeCounts.contractors}</p>
                      <small>External workers ({visitorCounts.all > 0 ? Math.round((visitorTypeCounts.contractors / visitorCounts.all) * 100) : 0}%)</small>
                    </div>
                  </div>
                  <div className="dashboard-stats" style={{ marginBottom: '30px' }}>
                    <div className="stat-card">
                      <h4>Delivery Personnel</h4>
                      <p>{visitorTypeCounts.delivery}</p>
                      <small>Package & courier services ({visitorCounts.all > 0 ? Math.round((visitorTypeCounts.delivery / visitorCounts.all) * 100) : 0}%)</small>
                    </div>
                    <div className="stat-card">
                      <h4>Maintenance</h4>
                      <p>{visitorTypeCounts.maintenance}</p>
                      <small>Technical & service staff ({visitorCounts.all > 0 ? Math.round((visitorTypeCounts.maintenance / visitorCounts.all) * 100) : 0}%)</small>
                    </div>
                    <div className="stat-card">
                      <h4>Clients</h4>
                      <p>{visitorTypeCounts.clients}</p>
                      <small>Business meetings ({visitorCounts.all > 0 ? Math.round((visitorTypeCounts.clients / visitorCounts.all) * 100) : 0}%)</small>
                    </div>
                    <div className="stat-card">
                      <h4>Other</h4>
                      <p>{visitorTypeCounts.other + visitorTypeCounts.partners}</p>
                      <small>Miscellaneous visits ({visitorCounts.all > 0 ? Math.round(((visitorTypeCounts.other + visitorTypeCounts.partners) / visitorCounts.all) * 100) : 0}%)</small>
                    </div>
                  </div>
                  <div className="statistics-summary">
                    <h4>Visitor Type Analytics</h4>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <strong>Most Common Type:</strong> {(() => {
                          const types = [
                            { name: 'Guests', count: visitorTypeCounts.guests },
                            { name: 'Vendors', count: visitorTypeCounts.vendors },
                            { name: 'Interviewees', count: visitorTypeCounts.interviewees },
                            { name: 'Contractors', count: visitorTypeCounts.contractors },
                            { name: 'Delivery', count: visitorTypeCounts.delivery },
                            { name: 'Maintenance', count: visitorTypeCounts.maintenance },
                            { name: 'Clients', count: visitorTypeCounts.clients },
                            { name: 'Partners', count: visitorTypeCounts.partners }
                          ];
                          const mostCommon = types.reduce((max, type) => type.count > max.count ? type : max);
                          return mostCommon.count > 0 ? `${mostCommon.name} (${mostCommon.count} visitors)` : 'No data available';
                        })()}
                      </div>
                      <div className="summary-item">
                        <strong>Business vs Personal:</strong> {(() => {
                          const business = visitorTypeCounts.vendors + visitorTypeCounts.contractors + visitorTypeCounts.clients + visitorTypeCounts.partners + visitorTypeCounts.maintenance + visitorTypeCounts.interviewees;
                          const personal = visitorTypeCounts.guests + visitorTypeCounts.other;
                          return `${business} Business / ${personal} Personal`;
                        })()}
                      </div>
                      <div className="summary-item">
                        <strong>Average Visit Duration:</strong> {(() => {
                          const totalVisitors = visitorCounts.all;
                          if (totalVisitors === 0) return 'No visits recorded';
                          return 'Varies: Guests (2-4h), Vendors (1-3h), Interviews (1-2h), Contractors (4-8h)';
                        })()}
                      </div>
                      <div className="summary-item">
                        <strong>Peak Visit Categories:</strong> {(() => {
                          const categories = [
                            { name: 'Guests', count: visitorTypeCounts.guests },
                            { name: 'Business', count: visitorTypeCounts.vendors + visitorTypeCounts.clients },
                            { name: 'Service', count: visitorTypeCounts.contractors + visitorTypeCounts.maintenance + visitorTypeCounts.delivery }
                          ];
                          const sorted = categories.sort((a, b) => b.count - a.count);
                          return sorted.length > 0 ? `${sorted[0].name}: ${sorted[0].count}, ${sorted[1].name}: ${sorted[1].count}` : 'No data';
                        })()}
                      </div>
                      <div className="summary-item">
                        <strong>Security Clearance :</strong> {(() => {
                          const standard = visitorTypeCounts.guests + visitorTypeCounts.delivery + visitorTypeCounts.vendors;
                          const enhanced = visitorTypeCounts.contractors + visitorTypeCounts.maintenance + visitorTypeCounts.partners + visitorTypeCounts.clients;
                          const interview = visitorTypeCounts.interviewees;
                          return `Standard: ${standard}, Enhanced: ${enhanced}, Interview: ${interview}`;
                        })()}
                      </div>
                      <div className="summary-item">
                        <strong>Top Visitor Categories:</strong> {(() => {
                          const allTypes = [
                            { name: 'Guests', count: visitorTypeCounts.guests },
                            { name: 'Vendors', count: visitorTypeCounts.vendors },
                            { name: 'Contractors', count: visitorTypeCounts.contractors },
                            { name: 'Clients', count: visitorTypeCounts.clients },
                            { name: 'Interviews', count: visitorTypeCounts.interviewees }
                          ].sort((a, b) => b.count - a.count);
                          return allTypes.slice(0, 3).map(type => `${type.name}: ${type.count}`).join(', ') || 'No data';
                        })()}
                      </div>
                      <div className="summary-item">
                        <strong>Repeat Visit Rate:</strong> {(() => {
                          const repeatRate = 35;
                          return `${repeatRate}% (${Math.round(visitorCounts.all * 0.35)} returning visitors)`;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="statistics-summary" style={{ marginTop: '20px' }}>
                    <h4>Visit Purpose Distribution - Real Database Analytics</h4>
                    {(() => {
                      // Calculate real statistics from actual visit data
                      if (!visits || visits.length === 0) {
                        return (
                          <div style={{ padding: '20px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px' }}>
                            <p>No visit data available for analysis</p>
                          </div>
                        );
                      }

                      // Get real purpose counts from database
                      const purposeCounts = {};
                      const totalVisits = visits.length;
                      
                      visits.forEach(visit => {
                        const purpose = visit.reason || visit.purpose || visit.visit_purpose || 'Not Specified';
                        purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
                      });

                      // Sort by count descending
                      const sortedPurposes = Object.entries(purposeCounts)
                        .sort(([,a], [,b]) => b - a);

                      // Calculate additional statistics
                      const getVisitStatistics = () => {
                        const today = new Date();
                        const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                        
                        const weeklyVisits = visits.filter(visit => {
                          const visitDate = new Date(visit.visit_date || visit.check_in_time);
                          return visitDate >= thisWeek;
                        }).length;

                        const monthlyVisits = visits.filter(visit => {
                          const visitDate = new Date(visit.visit_date || visit.check_in_time);
                          return visitDate >= thisMonth;
                        }).length;

                        const checkedInVisits = visits.filter(visit => 
                          visit.check_in_time && !visit.check_out_time
                        ).length;

                        const completedVisits = visits.filter(visit => 
                          visit.check_in_time && visit.check_out_time
                        ).length;

                        return {
                          weekly: weeklyVisits,
                          monthly: monthlyVisits,
                          checkedIn: checkedInVisits,
                          completed: completedVisits,
                          completionRate: totalVisits > 0 ? ((completedVisits / totalVisits) * 100).toFixed(1) : 0
                        };
                      };

                      const stats = getVisitStatistics();

                      return (
                        <>
                          <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                            {sortedPurposes.slice(0, 8).map(([purpose, count], index) => {
                              const percentage = ((count / totalVisits) * 100).toFixed(1);
                              const colors = [
                                '#2E86AB', '#A23B72', '#F18F01', '#C73E1D',
                                '#1B998B', '#84A59D', '#F5853F', '#6C757D'
                              ];
                              const color = colors[index % colors.length];
                              
                              return (
                                <div key={purpose} className="summary-item" style={{ 
                                  background: '#f8f9fa', 
                                  padding: '15px', 
                                  borderRadius: '8px', 
                                  border: '1px solid #dee2e6',
                                  borderLeft: `4px solid ${color}` 
                                }}>
                                  <strong style={{ color: color }}>{purpose}:</strong> {count} visitors ({percentage}%)
                                  <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                                    Rank: #{index + 1} most common purpose
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Real Database Statistics */}
                          <div style={{ marginTop: '25px', padding: '20px', background: '#e3f2fd', borderRadius: '10px', border: '1px solid #bbdefb' }}>
                            <h5 style={{ color: '#1565c0', marginBottom: '15px' }}>📊 Real Database Statistics</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                              <div>
                                <strong>Total Visits Analyzed:</strong>
                                <div style={{ fontSize: '24px', color: '#1565c0', fontWeight: 'bold' }}>
                                  {totalVisits.toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <strong>Purpose Categories Found:</strong>
                                <div style={{ fontSize: '24px', color: '#1565c0', fontWeight: 'bold' }}>
                                  {Object.keys(purposeCounts).length}
                                </div>
                              </div>
                              <div>
                                <strong>This Week's Visits:</strong>
                                <div style={{ fontSize: '24px', color: '#1565c0', fontWeight: 'bold' }}>
                                  {stats.weekly}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                  {totalVisits > 0 ? ((stats.weekly / totalVisits) * 100).toFixed(1) : 0}% of total
                                </div>
                              </div>
                              <div>
                                <strong>Visit Completion Rate:</strong>
                                <div style={{ fontSize: '24px', color: '#1565c0', fontWeight: 'bold' }}>
                                  {stats.completionRate}%
                                </div>
                                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                  {stats.completed} completed / {totalVisits} total
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ marginTop: '15px', padding: '15px', background: '#ffffff', borderRadius: '8px' }}>
                              <strong>Most Common Purpose:</strong> 
                              {sortedPurposes.length > 0 && (
                                <span style={{ marginLeft: '8px', color: '#1565c0' }}>
                                  "{sortedPurposes[0][0]}" ({sortedPurposes[0][1]} visits - {((sortedPurposes[0][1] / totalVisits) * 100).toFixed(1)}%)
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <p style={{ marginTop: '30px', fontWeight: 'bold', color: '#0984e3' }}>
                    <strong>Busiest Hour:</strong> Peak time when highest number of visitors checked in - 
                    Usually between 9:00-11:00 AM for interviews and business meetings
                  </p>
                </div>
              )}
              {activeSubSubSection === 'visitor-type-chart' && (
                <div>
                  <h3>🥧 Visit Purpose Analytics</h3>
                  <p style={{ marginBottom: '30px', color: '#6c757d', fontSize: '16px' }}>
                    Live analysis of visitor purposes from your database - showing the distribution of visit reasons.
                  </p>
                  
                  {(() => {
                    const chartData = getVisitReasonsData();
                    if (!chartData || !chartData.labels || chartData.labels[0] === 'No Data Available') {
                      return (
                        <div style={{ 
                          padding: '60px', 
                          textAlign: 'center', 
                          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
                          borderRadius: '15px',
                          border: '1px solid #dee2e6',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
                          <h4 style={{ color: '#495057', fontSize: '24px', marginBottom: '10px' }}>No Visit Data Available</h4>
                          <p style={{ color: '#6c757d', fontSize: '16px' }}>No visits found in the database for analysis.</p>
                        </div>
                      );
                    }
                    
                    const total = chartData.datasets[0].data.reduce((sum, value) => sum + value, 0);
                    const topPurposes = chartData.labels; // Show all purposes
                    
                    return (
                      <div>
                        {/* Summary Stats */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '20px',
                          marginBottom: '40px'
                        }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '25px',
                            borderRadius: '15px',
                            textAlign: 'center',
                            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                          }}>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>{total}</div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Visits</div>
                          </div>
                          <div style={{
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            color: 'white',
                            padding: '25px',
                            borderRadius: '15px',
                            textAlign: 'center',
                            boxShadow: '0 8px 32px rgba(240, 147, 251, 0.3)'
                          }}>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>{chartData.labels.length}</div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>Unique Purposes</div>
                          </div>
                          <div style={{
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            color: 'white',
                            padding: '25px',
                            borderRadius: '15px',
                            textAlign: 'center',
                            boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)'
                          }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{chartData.labels[0]}</div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>Most Common</div>
                          </div>
                        </div>

                        {/* Chart and Top Purposes Side by Side */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 350px',
                          gap: '30px',
                          alignItems: 'start'
                        }}>
                          {/* Doughnut Chart */}
                          <div style={{
                            background: '#ffffff',
                            borderRadius: '20px',
                            padding: '30px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                            border: '1px solid #f0f0f0'
                          }}>
                            <div style={{ height: '400px', position: 'relative' }}>
                              <Doughnut 
                                data={chartData} 
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  cutout: '65%',
                                  plugins: {
                                    legend: {
                                      display: false
                                    },
                                    tooltip: {
                                      backgroundColor: 'rgba(255,255,255,0.95)',
                                      titleColor: '#2c3e50',
                                      bodyColor: '#2c3e50',
                                      borderColor: '#e0e0e0',
                                      borderWidth: 1,
                                      cornerRadius: 12,
                                      displayColors: true,
                                      titleFont: { size: 14, weight: 'bold' },
                                      bodyFont: { size: 13 },
                                      padding: 12,
                                      callbacks: {
                                        label: function(context) {
                                          const percentage = ((context.parsed / total) * 100).toFixed(1);
                                          return `${context.parsed} visits (${percentage}%)`;
                                        }
                                      }
                                    }
                                  },
                                  elements: {
                                    arc: {
                                      borderWidth: 0,
                                      hoverBorderWidth: 3,
                                      hoverBorderColor: '#ffffff',
                                      hoverOffset: 6
                                    }
                                  },
                                  animation: {
                                    animateRotate: true,
                                    duration: 1200
                                  }
                                }} 
                              />
                              {/* Center Text */}
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center',
                                pointerEvents: 'none'
                              }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2c3e50' }}>{total}</div>
                                <div style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '5px' }}>Total Visits</div>
                              </div>
                            </div>
                          </div>

                          {/* Top Purposes List */}
                          <div style={{
                            background: '#ffffff',
                            borderRadius: '20px',
                            padding: '30px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                            border: '1px solid #f0f0f0'
                          }}>
                            <h4 style={{ 
                              margin: '0 0 25px 0', 
                              color: '#2c3e50', 
                              fontSize: '18px',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <span style={{ marginRight: '10px' }}>🏆</span>
                              Top Visit Purposes
                            </h4>
                            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                              {topPurposes.map((label, index) => {
                                const value = chartData.datasets[0].data[index];
                                const percentage = ((value / total) * 100).toFixed(1);
                                const color = chartData.datasets[0].backgroundColor[index];
                                
                                return (
                                  <div key={label} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px 0',
                                    borderBottom: index < topPurposes.length - 1 ? '1px solid #f0f0f0' : 'none'
                                  }}>
                                    <div style={{
                                      width: '12px',
                                      height: '12px',
                                      borderRadius: '50%',
                                      backgroundColor: color,
                                      marginRight: '15px',
                                      flexShrink: 0
                                    }}></div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#2c3e50',
                                        marginBottom: '2px',
                                        truncate: 'ellipsis',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        {label}
                                      </div>
                                      <div style={{
                                        fontSize: '12px',
                                        color: '#7f8c8d'
                                      }}>
                                        {value} visits • {percentage}%
                                      </div>
                                    </div>
                                    <div style={{
                                      fontSize: '16px',
                                      fontWeight: 'bold',
                                      color: color,
                                      marginLeft: '10px'
                                    }}>
                                      #{index + 1}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {chartData.labels.length > 5 && (
                              <div style={{
                                textAlign: 'center',
                                marginTop: '15px',
                                padding: '10px',
                                background: '#f8f9fa',
                                borderRadius: '10px',
                                fontSize: '13px',
                                color: '#6c757d'
                              }}>
                                {/* +{chartData.labels.length - 5} more purposes */}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </section>
          )}
          {activeSection === 'dashboard' && activeSubSection === 'hr-dashboard' && (
            <section>
              <h3>HR Dashboard</h3>
              <p>Specifically designed for the IT industry with customizable options</p>
              {activeSubSubSection === 'guests-statistics' && (
                <div>
                  <h4>Guests Statistics</h4>
                  <div className="dashboard-stats">
                    <div className="stat-card">
                      <h4>Total Guests</h4>
                      <p>{visitorCounts.all}</p>
                      <small>All guests entered today</small>
                    </div>
                    <div className="stat-card">
                      <h4>Pending Guests</h4>
                      <p>{visitorCounts.pending}</p>
                      <small>Registered but not verified</small>
                    </div>
                    <div className="stat-card">
                      <h4>Awaiting Guests</h4>
                      <p>{visitorCounts.expected}</p>
                      <small>Waiting for host confirmation</small>
                    </div>
                    <div className="stat-card">
                      <h4>Onboarded Guests</h4>
                      <p>{visitorCounts['checked-in']}</p>
                      <small>Successfully arrived</small>
                    </div>
                  </div>
                  <div style={{ maxWidth: '800px', margin: '20px 0', height: '400px' }}>
                    <Bar data={getChartData()} options={chartOptions} />
                  </div>
                </div>
              )}
            </section>
          )}
          {activeSection === 'visitor-logs' && (
            <section className="admin-dashboard-section">
              {activeSubSection === 'visitor-dashboard-logs' && (
                <div>
                  <h3>Visitor Dashboard - {activeSubSubSection.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                  {companyInfo && (
                    <div className="company-info-card">
                      <h4>Viewing visitors for: {companyInfo.name || 'Loading...'}</h4>
                      <p className="info-text">This shows visitors who checked in with hosts from your company.</p>
                    </div>
                  )}
                  <form className="admin-dashboard-filter-form" onSubmit={handleFilterSubmit}>
                    <div className="filter-row">
                      <label>
                        Start Date:
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                      </label>
                      <label>
                        End Date:
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                      </label>
                      <label>
                        Visitor Name:
                        <input name="visitorName" value={filters.visitorName} onChange={handleFilterChange} placeholder="Search by visitor name" />
                      </label>
                      <label>
                        Visitor ID:
                        <input name="visitorId" value={filters.visitorId} onChange={handleFilterChange} placeholder="Search by visitor ID" />
                      </label>
                      <div className="filter-buttons">
                        <button type="submit">Apply Filters</button>
                        <button type="button" onClick={clearFilters} className="clear-filters-btn">Clear Filters</button>
                      </div>
                    </div>
                  </form>
                  {loading ? <p>Loading visits...</p> : (
                    <div className="visitor-table-container">
                      {(() => {
                        console.log('🔍 Render check:', {
                          filteredVisitsLength: filteredVisits.length,
                          activeSubSubSection,
                          loading
                        });
                        return null;
                      })()}
                      {filteredVisits.length === 0 ? (
                        <div className="no-data">
                          <p>No visitors found for the selected criteria.</p>
                          <small>Section: {activeSubSubSection} | Total Data: {visits.length} | Filtered: {filteredVisits.length}</small>
                          {activeSubSubSection === 'expected-visitors' && (
                            <div style={{marginTop: '10px', fontSize: '12px', color: '#666'}}>
                              <p><strong>Expected Visitors</strong> shows visitors with future or today's visit dates.</p>
                              <p>This includes both pre-registrations and regular visits scheduled for today or later.</p>
                            </div>
                          )}
                          {activeSubSubSection === 'pending-visitors' && (
                            <div style={{marginTop: '10px', fontSize: '12px', color: '#666'}}>
                              <p><strong>Pending Visitors</strong> shows visitors with past visit dates that haven't been completed.</p>
                              <p>This includes overdue visits and pre-registrations from previous dates.</p>
                            </div>
                          )}
                          {activeSubSubSection === 'blacklist-visitors' && (
                            <div style={{marginTop: '10px', fontSize: '12px', color: '#666'}}>
                              <p><strong>Blacklisted Visitors</strong> shows visitors who have been blacklisted.</p>
                              <p>This includes both regular visits and pre-registrations marked as blacklisted.</p>
                              <div style={{
                                backgroundColor: '#ffebee',
                                border: '1px solid #ffcdd2',
                                borderRadius: '4px',
                                padding: '10px',
                                marginTop: '10px',
                                fontSize: '14px'
                              }}>
                                <strong>🚫 Total Blacklisted Visitors: {visitorCounts.blacklisted}</strong>
                                <br />
                                <small>These visitors have been flagged and require approval for future visits.</small>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Pagination Info and Controls for Visitor Logs */}
                          <div style={{ 
                            marginBottom: '15px', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '10px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '5px',
                            border: '1px solid #dee2e6'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                              <p style={{ margin: 0, color: '#666', fontWeight: '500' }}>
                                {(() => {
                                  const filtered = filteredVisits.filter(visit => {
                                    switch(activeSubSubSection) {
                                      case 'total-visitors': return true;
                                      case 'checked-in-visitors': return getVisitorCategory(visit) === 'Checked-In';
                                      case 'pending-visitors': return getVisitorCategory(visit) === 'Pending';
                                      case 'expected-visitors': return getVisitorCategory(visit) === 'Expected';
                                      case 'checked-out-visitors': return getVisitorCategory(visit) === 'Checked-Out';
                                      case 'blacklist-visitors': return getVisitorCategory(visit) === 'Blacklisted';
                                      default: return true;
                                    }
                                  });
                                  const startIndex = ((visitorLogsCurrentPage - 1) * visitorLogsItemsPerPage) + 1;
                                  const endIndex = Math.min(visitorLogsCurrentPage * visitorLogsItemsPerPage, filtered.length);
                                  return `Showing ${startIndex} to ${endIndex} of ${filtered.length} visitors`;
                                })()}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ fontSize: '14px', color: '#666' }}>Records per page:</label>
                                <select
                                  value={visitorLogsItemsPerPage}
                                  onChange={(e) => {
                                    setVisitorLogsItemsPerPage(Number(e.target.value));
                                    setVisitorLogsCurrentPage(1); // Reset to first page when changing items per page
                                  }}
                                  style={{
                                    padding: '6px 10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    backgroundColor: '#fff'
                                  }}
                                >
                                  <option value="5">5</option>
                                  <option value="10">10</option>
                                </select>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button 
                                onClick={() => setVisitorLogsCurrentPage(Math.max(1, visitorLogsCurrentPage - 1))}
                                disabled={visitorLogsCurrentPage === 1}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #007bff',
                                  backgroundColor: visitorLogsCurrentPage === 1 ? '#f5f5f5' : '#007bff',
                                  color: visitorLogsCurrentPage === 1 ? '#999' : '#fff',
                                  cursor: visitorLogsCurrentPage === 1 ? 'not-allowed' : 'pointer',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  fontWeight: '500'
                                }}
                              >
                                ← Prev
                              </button>
                              <span style={{ 
                                padding: '6px 10px',
                                backgroundColor: '#e9ecef',
                                borderRadius: '4px',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#495057'
                              }}>
                                {(() => {
                                  const filtered = filteredVisits.filter(visit => {
                                    switch(activeSubSubSection) {
                                      case 'total-visitors': return true;
                                      case 'checked-in-visitors': return getVisitorCategory(visit) === 'Checked-In';
                                      case 'pending-visitors': return getVisitorCategory(visit) === 'Pending';
                                      case 'expected-visitors': return getVisitorCategory(visit) === 'Expected';
                                      case 'checked-out-visitors': return getVisitorCategory(visit) === 'Checked-Out';
                                      case 'blacklist-visitors': return getVisitorCategory(visit) === 'Blacklisted';
                                      default: return true;
                                    }
                                  });
                                  return `Page ${visitorLogsCurrentPage} of ${getTotalPages(filtered.length, visitorLogsItemsPerPage)}`;
                                })()}
                              </span>
                              <button 
                                onClick={() => {
                                  const filtered = filteredVisits.filter(visit => {
                                    switch(activeSubSubSection) {
                                      case 'total-visitors': return true;
                                      case 'checked-in-visitors': return getVisitorCategory(visit) === 'Checked-In';
                                      case 'pending-visitors': return getVisitorCategory(visit) === 'Pending';
                                      case 'expected-visitors': return getVisitorCategory(visit) === 'Expected';
                                      case 'checked-out-visitors': return getVisitorCategory(visit) === 'Checked-Out';
                                      case 'blacklist-visitors': return getVisitorCategory(visit) === 'Blacklisted';
                                      default: return true;
                                    }
                                  });
                                  setVisitorLogsCurrentPage(Math.min(getTotalPages(filtered.length, visitorLogsItemsPerPage), visitorLogsCurrentPage + 1));
                                }}
                                disabled={(() => {
                                  const filtered = filteredVisits.filter(visit => {
                                    switch(activeSubSubSection) {
                                      case 'total-visitors': return true;
                                      case 'checked-in-visitors': return getVisitorCategory(visit) === 'Checked-In';
                                      case 'pending-visitors': return getVisitorCategory(visit) === 'Pending';
                                      case 'expected-visitors': return getVisitorCategory(visit) === 'Expected';
                                      case 'checked-out-visitors': return getVisitorCategory(visit) === 'Checked-Out';
                                      case 'blacklist-visitors': return getVisitorCategory(visit) === 'Blacklisted';
                                      default: return true;
                                    }
                                  });
                                  return visitorLogsCurrentPage === getTotalPages(filtered.length, visitorLogsItemsPerPage);
                                })()}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #007bff',
                                  backgroundColor: (() => {
                                    const filtered = filteredVisits.filter(visit => {
                                      switch(activeSubSubSection) {
                                        case 'total-visitors': return true;
                                        case 'checked-in-visitors': return getVisitorCategory(visit) === 'Checked-In';
                                        case 'pending-visitors': return getVisitorCategory(visit) === 'Pending';
                                        case 'expected-visitors': return getVisitorCategory(visit) === 'Expected';
                                        case 'checked-out-visitors': return getVisitorCategory(visit) === 'Checked-Out';
                                        case 'blacklist-visitors': return getVisitorCategory(visit) === 'Blacklisted';
                                        default: return true;
                                      }
                                    });
                                    return visitorLogsCurrentPage === getTotalPages(filtered.length, visitorLogsItemsPerPage) ? '#f5f5f5' : '#007bff';
                                  })(),
                                  color: (() => {
                                    const filtered = filteredVisits.filter(visit => {
                                      switch(activeSubSubSection) {
                                        case 'total-visitors': return true;
                                        case 'checked-in-visitors': return getVisitorCategory(visit) === 'Checked-In';
                                        case 'pending-visitors': return getVisitorCategory(visit) === 'Pending';
                                        case 'expected-visitors': return getVisitorCategory(visit) === 'Expected';
                                        case 'checked-out-visitors': return getVisitorCategory(visit) === 'Checked-Out';
                                        case 'blacklist-visitors': return getVisitorCategory(visit) === 'Blacklisted';
                                        default: return true;
                                      }
                                    });
                                    return visitorLogsCurrentPage === getTotalPages(filtered.length, visitorLogsItemsPerPage) ? '#999' : '#fff';
                                  })(),
                                  cursor: (() => {
                                    const filtered = filteredVisits.filter(visit => {
                                      switch(activeSubSubSection) {
                                        case 'total-visitors': return true;
                                        case 'checked-in-visitors': return getVisitorCategory(visit) === 'Checked-In';
                                        case 'pending-visitors': return getVisitorCategory(visit) === 'Pending';
                                        case 'expected-visitors': return getVisitorCategory(visit) === 'Expected';
                                        case 'checked-out-visitors': return getVisitorCategory(visit) === 'Checked-Out';
                                        case 'blacklist-visitors': return getVisitorCategory(visit) === 'Blacklisted';
                                        default: return true;
                                      }
                                    });
                                    return visitorLogsCurrentPage === getTotalPages(filtered.length, visitorLogsItemsPerPage) ? 'not-allowed' : 'pointer';
                                  })(),
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  fontWeight: '500'
                                }}
                              >
                                Next →
                              </button>
                            </div>
                          </div>

                        <table className="admin-dashboard-table visitor-table">
                          <thead>
                            <tr>
                              <th>Visit Date</th>
                              <th>Picture</th>
                              <th>Person Name</th>
                              <th>Person to Meet</th>
                              <th>Visitor ID</th>
                              <th>Visit Reason</th>
                              {activeSubSubSection === 'checked-out-visitors' && <th key="feedback-header">Feedback</th>}
                              {activeSubSubSection === 'blacklist-visitors' && <th key="blacklist-reason-header">Reason to Blacklist</th>}
                              <th>Check-In</th>
                              <th>Check-Out</th>
                              {activeSubSubSection === 'checked-in-visitors' && <th key="overstay-header">Overstay Alert</th>}
                              {activeSubSubSection === 'blacklist-visitors' && <th key="actions-header">Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              console.log('🔍 Filtering data:', {
                                activeSubSubSection,
                                filteredVisitsCount: filteredVisits.length,
                                filteredVisits: filteredVisits
                              });
                              
                              const filtered = filteredVisits.filter(visit => {
                                let shouldShow = false;
                                const visitorCategory = getVisitorCategory(visit);
                                
                                switch(activeSubSubSection) {
                                  case 'total-visitors': 
                                    shouldShow = true;
                                    break;
                                  case 'checked-in-visitors': 
                                    // Show visitors with 'Checked-In' category
                                    shouldShow = visitorCategory === 'Checked-In';
                                    break;
                                  case 'pending-visitors': 
                                    // Show visitors with 'Pending' category (past visits not completed)
                                    shouldShow = visitorCategory === 'Pending';
                                    break;
                                  case 'expected-visitors': 
                                    // Show visitors with 'Expected' category (future/today's visits)
                                    shouldShow = visitorCategory === 'Expected';
                                    break;
                                  case 'checked-out-visitors': 
                                    // Show visitors with 'Checked-Out' category
                                    shouldShow = visitorCategory === 'Checked-Out';
                                    break;
                                  case 'blacklist-visitors': 
                                    shouldShow = visitorCategory === 'Blacklisted';
                                    if (shouldShow) {
                                      console.log('🚫 Showing blacklisted visitor:', {
                                        visitor: visit.visitorName || visit.visitor_name,
                                        email: visit.visitorEmail || visit.visitor_email,
                                        isPreRegistration: visit.isPreRegistration,
                                        isBlacklisted: visit.isBlacklisted || visit.is_blacklisted,
                                        category: visitorCategory,
                                        blacklistReason: visit.blacklist_reason || visit.reason_for_blacklist || 'No reason provided'
                                      });
                                    }
                                    break;
                                  default: 
                                    shouldShow = true;
                                }
                                
                                if (activeSubSubSection === 'expected-visitors' || activeSubSubSection === 'pending-visitors') {
                                  console.log('🎯 Category-based filter check:', {
                                    visitor: visit.visitorName || visit.visitor_name,
                                    isPreRegistration: visit.isPreRegistration,
                                    status: visit.status,
                                    visitDate: visit.visit_date,
                                    category: visitorCategory,
                                    section: activeSubSubSection,
                                    shouldShow
                                  });
                                }
                                
                                return shouldShow;
                              });
                              
                              console.log('✅ Filtered results:', {
                                section: activeSubSubSection,
                                filteredCount: filtered.length,
                                filtered
                              });
                              
                              return filtered;
                            })()
                              // Apply pagination here
                              .slice((visitorLogsCurrentPage - 1) * visitorLogsItemsPerPage, visitorLogsCurrentPage * visitorLogsItemsPerPage)
                              .map(visit => {
                                const overstayAlert = getOverstayAlert(visit);
                                return (
                                  <tr key={visit.id} className={overstayAlert ? `overstay-${overstayAlert}` : ''}>
                                    <td>{visit.check_in_time ? new Date(visit.check_in_time).toLocaleDateString() : 
                                         visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : 'N/A'}</td>
                                    <td>
                                      {visit.visitorPhoto || visit.photo ? (
                                        <img 
                                          src={visit.visitorPhoto || visit.photo} 
                                          alt="Visitor" 
                                          className="visitor-photo"
                                          style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                      ) : (
                                        <div className="no-photo">No Photo</div>
                                      )}
                                    </td>
                                    <td>
                                      <strong>{visit.visitorName || visit.visitor_name || 'Unknown'}</strong>
                                      {visit.isPreRegistration && (
                                        <span className="source-badge pre-registration" style={{
                                          marginLeft: '8px',
                                          padding: '2px 6px',
                                          fontSize: '10px',
                                          backgroundColor: '#e3f2fd',
                                          color: '#1976d2',
                                          borderRadius: '4px',
                                          border: '1px solid #bbdefb'
                                        }}>
                                          PRE-REG
                                        </span>
                                      )}
                                      {(visit.isBlacklisted || visit.is_blacklisted) && (
                                        <span className="source-badge blacklisted" style={{
                                          marginLeft: '8px',
                                          padding: '2px 6px',
                                          fontSize: '10px',
                                          backgroundColor: '#ffebee',
                                          color: '#d32f2f',
                                          borderRadius: '4px',
                                          border: '1px solid #ffcdd2'
                                        }}>
                                          🚫 BLACKLISTED
                                        </span>
                                      )}
                                      <br />
                                      <small>{visit.visitorEmail || visit.visitor_email || 'No email'}</small>
                                    </td>
                                    <td>
                                      <strong>{visit.hostName || visit.host_name || 'Unknown Host'}</strong>
                                      <br />
                                      <small>{visit.reason || visit.purpose || 'No reason specified'}</small>
                                    </td>
                                    <td>{visit.visitor_id || visit.id}</td>
                                    <td>
                                      <span className="reason-badge" style={{
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        backgroundColor: '#e3f2fd',
                                        color: '#1976d2',
                                        borderRadius: '4px',
                                        border: '1px solid #bbdefb'
                                      }}>
                                        {visit.reason || visit.purpose || 'No reason specified'}
                                      </span>
                                    </td>
                                    {activeSubSubSection === 'checked-out-visitors' && (
                                      <td key="feedback-cell">{visit.feedback || 'No feedback'}</td>
                                    )}
                                    {activeSubSubSection === 'blacklist-visitors' && (
                                      <td key="blacklist-reason-cell">
                                        <div style={{ maxWidth: '200px' }}>
                                          <strong>Reason:</strong> {visit.blacklist_reason || visit.reason_for_blacklist || 'No reason specified'}
                                          {visit.blacklisted_at && (
                                            <>
                                              <br />
                                              <small><strong>Blacklisted on:</strong> {new Date(visit.blacklisted_at).toLocaleDateString()}</small>
                                            </>
                                          )}
                                          {visit.blacklisted_by && (
                                            <>
                                              <br />
                                              <small><strong>By:</strong> {visit.blacklisted_by}</small>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    )}
                                    <td>
                                      {visit.check_in_time ? new Date(visit.check_in_time).toLocaleString() : 'Not Checked In'}
                                    </td>
                                    <td>
                                      {visit.check_out_time ? new Date(visit.check_out_time).toLocaleString() : 
                                       visit.check_in_time ? 'Still In' : 'Not Started'}
                                    </td>
                                    {activeSubSubSection === 'checked-in-visitors' && (
                                      <td key="overstay-cell">
                                        {overstayAlert && (
                                          <span className={`overstay-alert ${overstayAlert}`}>
                                            {overstayAlert === 'danger' ? '🚨 Overstay!' : '⚠️ Long Stay'}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {activeSubSubSection === 'blacklist-visitors' && (
                                      <td key="actions-cell">
                                        <button
                                          className="action-btn remove-blacklist"
                                          onClick={() => handleRemoveFromBlacklist(visit.visitor_id || visit.id)}
                                          title="Remove from blacklist"
                                          style={{
                                            backgroundColor: '#4caf50',
                                            color: 'white',
                                            border: 'none',
                                            padding: '5px 10px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                          }}
                                        >
                                          ✅ Remove
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              {activeSubSection === 'hr-dashboard-logs' && (
                <div>
                  <h3>Guest Management - {activeSubSubSection.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                  <form className="admin-dashboard-filter-form" onSubmit={handleFilterSubmit}>
                    <div className="filter-row">
                      <label>
                        Start Date:
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                      </label>
                      <label>
                        End Date:
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                      </label>
                      <label>
                        Guest Name:
                        <input name="visitorName" value={filters.visitorName} onChange={handleFilterChange} placeholder="Search by guest name" />
                      </label>
                      <label>
                        Guest ID:
                        <input name="visitorId" value={filters.visitorId} onChange={handleFilterChange} placeholder="Search by guest ID" />
                      </label>
                      <div className="filter-buttons">
                        <button type="submit">Apply Filters</button>
                        <button type="button" onClick={clearFilters} className="clear-filters-btn">Clear Filters</button>
                      </div>
                    </div>
                  </form>
                  {loading ? <p>Loading guests...</p> : (
                    <div className="visitor-table-container">
                      {filteredVisits.length === 0 ? (
                        <div className="no-data">No guests found for the selected criteria.</div>
                      ) : (
                        <table className="admin-dashboard-table visitor-table">
                          <thead>
                            <tr>
                              <th>Visit Date</th>
                              <th>Picture</th>
                              <th>Guest Name</th>
                              <th>Host</th>
                              <th>Guest ID</th>
                              <th>Status</th>
                              <th>Check-In</th>
                              <th>Check-Out</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredVisits
                              .filter(visit => {
                                switch(activeSubSubSection) {
                                  case 'total-guests': return true;
                                  case 'pending-guests': return !visit.check_in_time && visit.status === 'pending';
                                  case 'awaiting-guests': return !visit.check_in_time && new Date(visit.visit_date) >= new Date().setHours(0, 0, 0, 0);
                                  case 'onboarded-guests': return visit.check_in_time && !visit.check_out_time;
                                  default: return true;
                                }
                              })
                              .map(visit => (
                                <tr key={visit.id}>
                                  <td>{visit.check_in_time ? new Date(visit.check_in_time).toLocaleDateString() : 
                                       visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : 'N/A'}</td>
                                  <td>
                                    {visit.visitorPhoto || visit.photo ? (
                                      <img 
                                        src={visit.visitorPhoto || visit.photo} 
                                        alt="Guest" 
                                        className="visitor-photo"
                                        style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      <div className="no-photo">No Photo</div>
                                    )}
                                  </td>
                                  <td>
                                    <strong>{visit.visitorName || visit.visitor_name || 'Unknown'}</strong>
                                    <br />
                                    <small>{visit.visitorEmail || visit.visitor_email || 'No email'}</small>
                                  </td>
                                  <td>
                                    <strong>{visit.hostName || visit.host_name || 'Unknown Host'}</strong>
                                    <br />
                                    <small>{visit.reason || visit.purpose || 'No reason specified'}</small>
                                  </td>
                                  <td>{visit.visitor_id || visit.id}</td>
                                  <td>
                                    <span className="reason-badge" style={{
                                      padding: '4px 8px',
                                      fontSize: '12px',
                                      backgroundColor: '#e3f2fd',
                                      color: '#1976d2',
                                      borderRadius: '4px',
                                      border: '1px solid #bbdefb'
                                    }}>
                                      {visit.reason || visit.purpose || 'No reason specified'}
                                    </span>
                                  </td>
                                  <td>
                                    {visit.check_in_time ? new Date(visit.check_in_time).toLocaleString() : 'Not Checked In'}
                                  </td>
                                  <td>
                                    {visit.check_out_time ? new Date(visit.check_out_time).toLocaleString() : 
                                     visit.check_in_time ? 'Still In' : 'Not Started'}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
          {activeSection === 'manage-users' && (
            <section className="admin-dashboard-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Manage Users & Privileges</h3>
                <button 
                  onClick={async () => {
                    console.log('🔄 Manual refresh triggered');
                    try {
                      const usersData = await getUsers();
                      console.log('✅ Manual fetch successful:', usersData);
                      setUsers(usersData);
                    } catch (err) {
                      console.error('❌ Manual fetch failed:', err);
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🔄 Refresh Users Data
                </button>
              </div>
              
              {/* Data Status Summary */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '30px',
                border: '1px solid #dee2e6'
              }}>
                <h5 style={{ margin: '0 0 15px 0', color: '#495057' }}>📊 Current Data Status</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '5px' }}>
                    <strong>Users Loaded:</strong> {users.length}
                  </div>
                  <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '5px' }}>
                    <strong>User Role:</strong> {userRole || 'Not set'}
                  </div>
                  <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '5px' }}>
                    <strong>Company:</strong> {companyInfo?.name || 'Not set'}
                  </div>
                  {/* <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '5px' }}>
                    <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
                  </div> */}
                  {error && (
                    <div style={{ padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '5px', gridColumn: '1 / -1' }}>
                      <strong>Error:</strong> {error}
                    </div>
                  )}
                </div>
              </div>
              {activeSubSection === 'add-new-host' && (
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                    borderRadius: '20px',
                    padding: '40px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                      <div style={{ 
                        fontSize: '48px', 
                        marginBottom: '15px',
                        background: 'linear-gradient(45deg, #007bff, #28a745)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                        👤
                      </div>
                      <h4 style={{ 
                        fontSize: '28px', 
                        fontWeight: 'bold', 
                        color: '#2c3e50', 
                        margin: '0 0 10px 0' 
                      }}>
                        Add New Host
                      </h4>
                      <p style={{ 
                        color: '#6c757d', 
                        fontSize: '16px', 
                        margin: 0,
                        maxWidth: '500px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                      }}>
                        Create a new host account with all necessary information and privileges
                      </p>
                    </div>

                    <form className="admin-dashboard-form" onSubmit={handleCreateUser}>
                      {/* Personal Information Section */}
                      <div style={{ marginBottom: '35px' }}>
                        <h5 style={{ 
                          fontSize: '18px', 
                          fontWeight: 'bold', 
                          color: '#495057', 
                          marginBottom: '20px',
                          padding: '10px 0',
                          borderBottom: '2px solid #e9ecef',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <span style={{ marginRight: '10px', fontSize: '20px' }}>📋</span>
                          Personal Information
                        </h5>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                          gap: '25px' 
                        }}>
                          <div style={{ position: 'relative' }}>
                            <label style={{
                              display: 'block',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#495057',
                              marginBottom: '8px'
                            }}>
                              <span style={{ marginRight: '5px' }}>👤</span>
                              Full Name *
                            </label>
                            <input 
                              type="text" 
                              name="name" 
                              value={newUser.name} 
                              onChange={handleUserInputChange} 
                              required 
                              placeholder="Enter full name"
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e9ecef',
                                borderRadius: '12px',
                                fontSize: '16px',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#007bff'}
                              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                            />
                          </div>
                          
                          <div style={{ position: 'relative' }}>
                            <label style={{
                              display: 'block',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#495057',
                              marginBottom: '8px'
                            }}>
                              <span style={{ marginRight: '5px' }}>📧</span>
                              Email Address *
                            </label>
                            <input 
                              type="email" 
                              name="email" 
                              value={newUser.email} 
                              onChange={handleUserInputChange} 
                              required 
                              placeholder="Enter email address"
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e9ecef',
                                borderRadius: '12px',
                                fontSize: '16px',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#007bff'}
                              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                            />
                          </div>
                          
                          <div style={{ position: 'relative' }}>
                            <label style={{
                              display: 'block',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#495057',
                              marginBottom: '8px'
                            }}>
                              <span style={{ marginRight: '5px' }}>📱</span>
                              Mobile Number *
                            </label>
                            <input 
                              type="tel" 
                              name="mobile_number" 
                              value={newUser.mobile_number} 
                              onChange={handleUserInputChange} 
                              required 
                              placeholder="Enter mobile number"
                              pattern="[0-9]{10}"
                              title="Please enter a valid 10-digit mobile number"
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e9ecef',
                                borderRadius: '12px',
                                fontSize: '16px',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#007bff'}
                              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Account & Security Section */}
                      <div style={{ marginBottom: '35px' }}>
                        <h5 style={{ 
                          fontSize: '18px', 
                          fontWeight: 'bold', 
                          color: '#495057', 
                          marginBottom: '20px',
                          padding: '10px 0',
                          borderBottom: '2px solid #e9ecef',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <span style={{ marginRight: '10px', fontSize: '20px' }}>🔐</span>
                          Account & Security
                        </h5>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                          gap: '25px' 
                        }}>
                          <div style={{ position: 'relative' }}>
                            <label style={{
                              display: 'block',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#495057',
                              marginBottom: '8px'
                            }}>
                              <span style={{ marginRight: '5px' }}>🔑</span>
                              Password *
                            </label>
                            <input 
                              type="password" 
                              name="password" 
                              value={newUser.password} 
                              onChange={handleUserInputChange} 
                              required 
                              placeholder="Enter secure password"
                              minLength="6"
                              title="Password must be at least 6 characters long"
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e9ecef',
                                borderRadius: '12px',
                                fontSize: '16px',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#007bff'}
                              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                            />
                          </div>
                          
                          <div style={{ position: 'relative' }}>
                            <label style={{
                              display: 'block',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#495057',
                              marginBottom: '8px'
                            }}>
                              <span style={{ marginRight: '5px' }}>⚡</span>
                              User Role *
                            </label>
                            <select 
                              name="role" 
                              value={newUser.role} 
                              onChange={handleUserInputChange} 
                              required
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e9ecef',
                                borderRadius: '12px',
                                fontSize: '16px',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box',
                                cursor: 'pointer'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#007bff'}
                              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                            >
                              <option value="Host">Host</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Professional Details Section */}
                      <div style={{ marginBottom: '35px' }}>
                        <h5 style={{ 
                          fontSize: '18px', 
                          fontWeight: 'bold', 
                          color: '#495057', 
                          marginBottom: '20px',
                          padding: '10px 0',
                          borderBottom: '2px solid #e9ecef',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <span style={{ marginRight: '10px', fontSize: '20px' }}>🏢</span>
                          Professional Details
                        </h5>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                          gap: '25px' 
                        }}>
                          <div style={{ position: 'relative' }}>
                            <label style={{
                              display: 'block',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#495057',
                              marginBottom: '8px'
                            }}>
                              <span style={{ marginRight: '5px' }}>🏭</span>
                              Department *
                            </label>
                            <input 
                              type="text" 
                              name="department" 
                              value={newUser.department} 
                              onChange={handleUserInputChange} 
                              required 
                              placeholder="Enter department name"
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e9ecef',
                                borderRadius: '12px',
                                fontSize: '16px',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#007bff'}
                              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                            />
                          </div>
                          
                          <div style={{ position: 'relative' }}>
                            <label style={{
                              display: 'block',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#495057',
                              marginBottom: '8px'
                            }}>
                              <span style={{ marginRight: '5px' }}>💼</span>
                              Designation *
                            </label>
                            <input 
                              type="text" 
                              name="designation" 
                              value={newUser.designation} 
                              onChange={handleUserInputChange} 
                              required 
                              placeholder="Enter job title/designation"
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e9ecef',
                                borderRadius: '12px',
                                fontSize: '16px',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#007bff'}
                              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Submit Button */}
                      <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <button 
                          type="submit" 
                          disabled={loading} 
                          style={{
                            padding: '16px 40px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)',
                            transform: loading ? 'scale(0.98)' : 'scale(1)',
                            minWidth: '200px'
                          }}
                          onMouseEnter={(e) => {
                            if (!loading) {
                              e.target.style.backgroundColor = '#0056b3';
                              e.target.style.transform = 'scale(1.05)';
                              e.target.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!loading) {
                              e.target.style.backgroundColor = '#007bff';
                              e.target.style.transform = 'scale(1)';
                              e.target.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.3)';
                            }
                          }}
                        >
                          {loading ? (
                            <>
                              <span style={{ marginRight: '10px' }}>⏳</span>
                              Creating Host...
                            </>
                          ) : (
                            <>
                              <span style={{ marginRight: '10px' }}>✨</span>
                              Create Host Account
                            </>
                          )}
                        </button>
                      </div>
                      
                      {/* Auto-assignment Information 
                      <div style={{ 
                        marginTop: '30px', 
                        padding: '20px', 
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                        borderRadius: '15px', 
                        border: '1px solid #bbdefb'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginBottom: '15px' 
                        }}>
                          <span style={{ fontSize: '24px', marginRight: '10px' }}>ℹ️</span>
                          <strong style={{ fontSize: '16px', color: '#1976d2' }}>
                            Auto-Assignment Information
                          </strong>
                        </div>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                          gap: '15px',
                          fontSize: '14px', 
                          color: '#555' 
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #e1f5fe'
                          }}>
                            <span style={{ marginRight: '8px' }}>🆔</span>
                            <span><strong>ID:</strong> Auto-generated</span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #e1f5fe'
                          }}>
                            <span style={{ marginRight: '8px' }}>🏢</span>
                            <span><strong>Company:</strong> From your company</span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #e1f5fe'
                          }}>
                            <span style={{ marginRight: '8px' }}>⏰</span>
                            <span><strong>Last Login:</strong> Set on first login</span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #e1f5fe'
                          }}>
                            <span style={{ marginRight: '8px' }}>✅</span>
                            <span><strong>Verification:</strong> Auto-verified</span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #e1f5fe'
                          }}>
                            <span style={{ marginRight: '8px' }}>🟢</span>
                            <span><strong>Status:</strong> Auto-activated</span>
                          </div>
                        </div>
                      </div>
                        */}
                    </form>
                  </div>
                </div>
              )}
              <div className="user-list" style={{ marginTop: '20px' }}>
                <h4>Existing Users</h4>
                
                {users.length === 0 ? (
                  <p>No users found.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-dashboard-table" style={{ minWidth: '800px' }}>
                      <thead>
                        <tr>
                          <th style={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}>Name</th>
                          <th style={{ backgroundColor: '#f3e5f5', color: '#7b1fa2' }}>Email</th>
                          <th style={{ backgroundColor: '#e8f5e8', color: '#388e3c' }}>Role</th>
                          <th style={{ backgroundColor: '#fff3e0', color: '#f57c00' }}>📱 Mobile</th>
                          <th style={{ backgroundColor: '#fce4ec', color: '#c2185b' }}>🏭 Department</th>
                          <th style={{ backgroundColor: '#e0f2f1', color: '#00796b' }}>💼 Designation</th>
                          <th style={{ backgroundColor: '#f1f8e9', color: '#689f38' }}>✅ Status</th>
                          {/* <th>Actions</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user, index) => {
                          // Enhanced debugging for each user row
                          console.log(`🔍 Rendering user ${index + 1}:`, user);
                          return (
                            <tr key={user.id || index}>
                              <td style={{ fontWeight: 'bold' }}>
                                {user.name || user.firstName + ' ' + user.lastName || 'N/A'}
                              </td>
                              <td>{user.email || 'N/A'}</td>
                              <td>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  backgroundColor: user.role === 'admin' ? '#dc3545' : '#28a745',
                                  color: 'white'
                                }}>
                                  {user.role === 'admin' ? ' Admin' : ' Host'}
                                </span>
                              </td>
                              <td>
                                {user.mobile_number || user.mobile || user.phone || user.contact_number || 'N/A'}
                              </td>
                              <td>
                                {user.department || user.dept || user.section || 'N/A'}
                              </td>
                              <td>
                                {user.designation || user.position || user.title || user.job_title || 'N/A'}
                              </td>
                              <td>
                                <span style={{
                                  padding: '3px 6px',
                                  borderRadius: '10px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  backgroundColor: user.is_verified ? '#d4edda' : '#fff3cd',
                                  color: user.is_verified ? '#155724' : '#856404'
                                }}>
                                  {user.is_verified ? '✅ Verified' : '⏳ Pending'}
                                </span>
                              </td>
                              {/* <td>
                                <button className="action-btn">Edit</button>
                                <button className="action-btn delete">Delete</button>
                              </td> */}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}
          {activeSection === 'reports' && (
            <section className="admin-dashboard-section">
              <div className="reports-container">
                <div className="reports-header">
                  <h1>Reports & Analytics</h1>
                  <div className="reports-controls">
                    <div className="date-range-controls">
                      <input
                        type="date"
                        value={reportDateRange.startDate}
                        onChange={(e) => setReportDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                      <span>to</span>
                      <input
                        type="date"
                        value={reportDateRange.endDate}
                        onChange={(e) => setReportDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                    <div className="export-controls">
                      <div className="export-buttons-group">
                        <button 
                          onClick={() => handleExport('pdf')} 
                          className="export-btn pdf-btn" 
                          disabled={loading}
                          title="Export comprehensive PDF report with charts and analytics"
                        >
                          {loading ? '📄 Exporting...' : '📄 Export PDF'}
                        </button>
                        <button 
                          onClick={() => handleExport('excel')} 
                          className="export-btn excel-btn" 
                          disabled={loading}
                          title="Export detailed Excel spreadsheet with multiple sheets"
                        >
                          {loading ? '📊 Exporting...' : '📊 Export Excel'}
                        </button>
                        <div className="export-dropdown">
                          {/* <button 
                            className="export-btn dropdown-btn"
                            onClick={() => setShowExportDropdown(!showExportDropdown)}
                            disabled={loading}
                            title="More export options"
                          >
                            ⚙️ More {showExportDropdown ? '▲' : '▼'}
                          </button> */}
                          {showExportDropdown && (
                            <div className="export-dropdown-menu">
                              <button 
                                onClick={() => handleExport('csv')}
                                className="dropdown-item"
                                disabled={loading}
                              >
                                📋 Export CSV
                              </button>
                              <button 
                                onClick={() => handleExportSummary()}
                                className="dropdown-item"
                                disabled={loading}
                              >
                                📈 Summary Report
                              </button>
                              <button 
                                onClick={() => handleExportCustom()}
                                className="dropdown-item"
                                disabled={loading}
                              >
                                🎯 Custom Export
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="export-info">
                        <small>📊 Exports include visitor data, analytics, and host performance</small>
                      </div>
                    </div>
                  </div>
                </div>

                {error && <div className="reports-error">{error}</div>}
                {message && <div className="reports-success">{message}</div>}

                <div className="reports-tabs">
                  <button 
                    className={`report-tab ${activeReportTab === 'overview' ? 'active' : ''}`} 
                    onClick={() => setActiveReportTab('overview')}
                  >
                    Overview
                  </button>
                  <button 
                    className={`report-tab ${activeReportTab === 'visitors' ? 'active' : ''}`} 
                    onClick={() => setActiveReportTab('visitors')}
                  >
                    Visitor Analytics
                  </button>
                  <button 
                    className={`report-tab ${activeReportTab === 'hosts' ? 'active' : ''}`} 
                    onClick={() => setActiveReportTab('hosts')}
                  >
                    Host Performance
                  </button>
                  <button 
                    className={`report-tab ${activeReportTab === 'security' ? 'active' : ''}`} 
                    onClick={() => setActiveReportTab('security')}
                  >
                    Security Insights
                  </button>
                </div>

                <div className="reports-content">
                  <div className="reports-content-scrollable">
                    {activeReportTab === 'overview' && (
                      <div className="overview-tab">
                        {loading ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#666' }}>
                            <p>Loading overview data...</p>
                          </div>
                        ) : reportData ? (
                          <>
                            <div className="stats-grid">
                              {(() => {
                                const currentStats = overviewStats;
                                const previousStats = calculatePreviousStats();
                                const visitorChange = calculatePercentageChange(currentStats.totalVisitors, previousStats.totalVisitors);
                                const durationChange = calculatePercentageChange(currentStats.avgDuration, previousStats.avgDuration);
                                const incidentChange = calculatePercentageChange(currentStats.securityIncidents, previousStats.securityIncidents);
                                
                                return (
                                  <>
                                    <div className="stat-card">
                                      <h3>Total Visitors</h3>
                                      <div className="stat-number">{currentStats.totalVisitors}</div>
                                      <div className={`stat-change ${visitorChange >= 0 ? 'positive' : 'negative'}`}>
                                        {visitorChange >= 0 ? '+' : ''}{visitorChange}% from last period
                                      </div>
                                    </div>
                                    <div className="stat-card">
                                      <h3>Average Visit Duration</h3>
                                      <div className="stat-number">
                                        {formatDuration(currentStats.avgDuration)}
                                      </div>
                                      <div className={`stat-change ${durationChange >= 0 ? 'positive' : 'negative'}`}>
                                        {durationChange >= 0 ? '+' : ''}{durationChange}% from last period
                                      </div>
                                    </div>
                                    <div className="stat-card">
                                      <h3>Peak Hour</h3>
                                      <div className="stat-number">{currentStats.peakHour}</div>
                                      <div className="stat-change">Most busy time</div>
                                    </div>
                                    <div className="stat-card clickable-stat-card" onClick={handleShowSecurityIncidentsModal} style={{ cursor: 'pointer' }} title="Click to view detailed security incidents">
                                      <h3>Security Incidents</h3>
                                      <div className="stat-number">{currentStats.securityIncidents}</div>
                                      <div className={`stat-change ${incidentChange <= 0 ? 'positive' : 'negative'}`}>
                                        {incidentChange <= 0 ? (incidentChange === 0 ? '0' : incidentChange) : '+' + incidentChange}% from last period
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>

                            <div className="charts-grid">
                              {/* Visitor Status Distribution Chart */}
                              <div className="chart-container">
                                <h3>Visitor Status Distribution</h3>
                                {(() => {
                                  const statusData = {
                                    labels: ['Checked In', 'Checked Out', 'Pending', 'Expected', 'Blacklisted'],
                                    datasets: [{
                                      data: [
                                        visitorCounts['checked-in'] || 0,
                                        visitorCounts['checked-out'] || 0,
                                        visitorCounts.pending || 0,
                                        visitorCounts.expected || 0,
                                        visitorCounts.blacklisted || 0
                                      ],
                                      backgroundColor: [
                                        '#4CAF50', // Green for checked in
                                        '#2196F3', // Blue for checked out
                                        '#FF9800', // Orange for pending
                                        '#9C27B0', // Purple for expected
                                        '#F44336'  // Red for blacklisted
                                      ],
                                      borderColor: [
                                        '#45a049', '#1976D2', '#F57C00', '#7B1FA2', '#D32F2F'
                                      ],
                                      borderWidth: 2,
                                      hoverBorderWidth: 3
                                    }]
                                  };
                                  
                                  return (
                                    <div style={{ position: 'relative', height: '280px', width: '100%' }}>
                                      <Doughnut 
                                        data={statusData} 
                                        options={{
                                          responsive: true,
                                          maintainAspectRatio: false,
                                          plugins: {
                                            legend: {
                                              position: 'bottom',
                                              labels: {
                                                padding: 15,
                                                usePointStyle: true,
                                                font: { size: 12 }
                                              }
                                            },
                                            tooltip: {
                                              callbacks: {
                                                label: function(context) {
                                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                  const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                                                }
                                              }
                                            }
                                          },
                                          cutout: '50%'
                                        }} 
                                      />
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Visitor Trends Chart */}
                              <div className="chart-container">
                                <h3>Visitor Trends (Last 30 Days)</h3>
                                {visitorTrendData ? (
                                  <div style={{ position: 'relative', height: '280px', width: '100%' }}>
                                    <Line 
                                      data={{
                                        ...visitorTrendData,
                                        datasets: visitorTrendData.datasets.map(dataset => ({
                                          ...dataset,
                                          borderColor: '#2196F3',
                                          backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                          tension: 0.4,
                                          fill: true,
                                          pointBackgroundColor: '#2196F3',
                                          pointBorderColor: '#ffffff',
                                          pointBorderWidth: 2,
                                          pointRadius: 4,
                                          pointHoverRadius: 6
                                        }))
                                      }} 
                                      options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                          legend: {
                                            display: false
                                          },
                                          tooltip: {
                                            mode: 'index',
                                            intersect: false,
                                            backgroundColor: 'rgba(0,0,0,0.8)',
                                            titleColor: '#ffffff',
                                            bodyColor: '#ffffff'
                                          }
                                        },
                                        scales: {
                                          y: {
                                            beginAtZero: true,
                                            grid: {
                                              color: 'rgba(0,0,0,0.1)'
                                            },
                                            ticks: {
                                              stepSize: 1
                                            }
                                          },
                                          x: {
                                            grid: {
                                              color: 'rgba(0,0,0,0.1)'
                                            }
                                          }
                                        },
                                        interaction: {
                                          mode: 'nearest',
                                          axis: 'x',
                                          intersect: false
                                        }
                                      }} 
                                    />
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '280px', color: '#666' }}>
                                    <p>No data available for visitor trends</p>
                                  </div>
                                )}
                              </div>

                              {/* Hourly Traffic Distribution */}
                              <div className="chart-container">
                                <h3>Hourly Traffic Distribution</h3>
                                {(() => {
                                  const hourlyData = new Array(24).fill(0);
                                  filteredVisits.forEach(visit => {
                                    if (visit.check_in_time) {
                                      const hour = new Date(visit.check_in_time).getHours();
                                      hourlyData[hour]++;
                                    }
                                  });
                                  
                                  const chartData = {
                                    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                                    datasets: [{
                                      label: 'Visits by Hour',
                                      data: hourlyData,
                                      backgroundColor: 'rgba(76, 175, 80, 0.8)',
                                      borderColor: '#4CAF50',
                                      borderWidth: 1,
                                      borderRadius: 4
                                    }]
                                  };
                                  
                                  return (
                                    <div style={{ position: 'relative', height: '280px', width: '100%' }}>
                                      <Bar 
                                        data={chartData} 
                                        options={{
                                          responsive: true,
                                          maintainAspectRatio: false,
                                          plugins: {
                                            legend: {
                                              display: false
                                            },
                                            tooltip: {
                                              backgroundColor: 'rgba(0,0,0,0.8)',
                                              titleColor: '#ffffff',
                                              bodyColor: '#ffffff'
                                            }
                                          },
                                          scales: {
                                            y: {
                                              beginAtZero: true,
                                              grid: {
                                                color: 'rgba(0,0,0,0.1)'
                                              },
                                              ticks: {
                                                stepSize: 1
                                              }
                                            },
                                            x: {
                                              grid: {
                                                display: false
                                              }
                                            }
                                          }
                                        }} 
                                      />
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Visit Reasons Distribution */}
                              <div className="chart-container">
                                <h3>Visit Purposes Distribution</h3>
                                {visitReasonData ? (
                                  <div style={{ position: 'relative', height: '280px', width: '100%' }}>
                                    <Doughnut 
                                      data={{
                                        ...visitReasonData,
                                        datasets: visitReasonData.datasets.map(dataset => ({
                                          ...dataset,
                                          borderWidth: 2,
                                          hoverBorderWidth: 3
                                        }))
                                      }} 
                                      options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                          legend: { 
                                            position: 'bottom',
                                            labels: {
                                              padding: 15,
                                              usePointStyle: true,
                                              font: { size: 11 }
                                            }
                                          },
                                          tooltip: {
                                            callbacks: {
                                              label: function(context) {
                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                                return `${context.label}: ${context.parsed} visits (${percentage}%)`;
                                              }
                                            }
                                          }
                                        },
                                        cutout: '45%'
                                      }} 
                                    />
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '280px', color: '#666' }}>
                                    <p>No data available for visit purposes</p>
                                  </div>
                                )}
                              </div>

                              {/* Weekly Traffic Pattern */}
                              <div className="chart-container">
                                <h3>Weekly Traffic Pattern</h3>
                                {(() => {
                                  const weeklyData = new Array(7).fill(0);
                                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                  
                                  filteredVisits.forEach(visit => {
                                    if (visit.check_in_time) {
                                      const day = new Date(visit.check_in_time).getDay();
                                      weeklyData[day]++;
                                    }
                                  });
                                  
                                  const chartData = {
                                    labels: dayNames,
                                    datasets: [{
                                      label: 'Visits by Day',
                                      data: weeklyData,
                                      backgroundColor: [
                                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                                        '#9966FF', '#FF9F40', '#FF6384'
                                      ],
                                      borderColor: [
                                        '#FF4567', '#1976D2', '#FFC107', '#00BCD4',
                                        '#673AB7', '#FF5722', '#FF4567'
                                      ],
                                      borderWidth: 2,
                                      borderRadius: 4
                                    }]
                                  };
                                  
                                  return (
                                    <div style={{ position: 'relative', height: '280px', width: '100%' }}>
                                      <Bar 
                                        data={chartData} 
                                        options={{
                                          responsive: true,
                                          maintainAspectRatio: false,
                                          plugins: {
                                            legend: {
                                              display: false
                                            },
                                            tooltip: {
                                              backgroundColor: 'rgba(0,0,0,0.8)',
                                              titleColor: '#ffffff',
                                              bodyColor: '#ffffff'
                                            }
                                          },
                                          scales: {
                                            y: {
                                              beginAtZero: true,
                                              grid: {
                                                color: 'rgba(0,0,0,0.1)'
                                              },
                                              ticks: {
                                                stepSize: 1
                                              }
                                            },
                                            x: {
                                              grid: {
                                                display: false
                                              }
                                            }
                                          }
                                        }} 
                                      />
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Top Hosts Performance */}
                              <div className="chart-container">
                                <h3>Top Performing Hosts</h3>
                                {(() => {
                                  const hostStats = {};
                                  filteredVisits.forEach(visit => {
                                    const hostName = (visit.host_name || visit.hostName || 'Unknown').substring(0, 15);
                                    hostStats[hostName] = (hostStats[hostName] || 0) + 1;
                                  });
                                  
                                  const sortedHosts = Object.entries(hostStats)
                                    .sort(([,a], [,b]) => b - a)
                                    .slice(0, 8);
                                  
                                  const chartData = {
                                    labels: sortedHosts.map(([name]) => name),
                                    datasets: [{
                                      label: 'Visitor Count',
                                      data: sortedHosts.map(([,count]) => count),
                                      backgroundColor: 'rgba(156, 39, 176, 0.8)',
                                      borderColor: '#9C27B0',
                                      borderWidth: 1,
                                      borderRadius: 4
                                    }]
                                  };
                                  
                                  return (
                                    <div style={{ position: 'relative', height: '280px', width: '100%' }}>
                                      <Bar 
                                        data={chartData} 
                                        options={{
                                          responsive: true,
                                          maintainAspectRatio: false,
                                          indexAxis: 'y',
                                          plugins: {
                                            legend: {
                                              display: false
                                            },
                                            tooltip: {
                                              backgroundColor: 'rgba(0,0,0,0.8)',
                                              titleColor: '#ffffff',
                                              bodyColor: '#ffffff'
                                            }
                                          },
                                          scales: {
                                            x: {
                                              beginAtZero: true,
                                              grid: {
                                                color: 'rgba(0,0,0,0.1)'
                                              },
                                              ticks: {
                                                stepSize: 1
                                              }
                                            },
                                            y: {
                                              grid: {
                                                display: false
                                              }
                                            }
                                          }
                                        }} 
                                      />
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#666' }}>
                            <p>No report data available. Please select a date range and try again.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeReportTab === 'visitors' && (
                      <div className="visitors-tab">
                        {loading ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#666' }}>
                            <p>Loading visitor analytics...</p>
                          </div>
                        ) : reportData ? (
                          <div className="visitor-analytics">
                            {(() => {
                              const analytics = calculateVisitorAnalytics();
                              return (
                                <>
                                  <div className="chart-container">
                                    <h3>Daily Visitor Trends</h3>
                                    {visitorTrendData && visitorTrendData.labels && visitorTrendData.labels.length > 0 ? (
                                      <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                                        <Line 
                                          data={visitorTrendData} 
                                          options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: {
                                              y: {
                                                beginAtZero: true,
                                                title: {
                                                  display: true,
                                                  text: 'Number of Visitors'
                                                }
                                              },
                                              x: {
                                                title: {
                                                  display: true,
                                                  text: 'Date'
                                                }
                                              }
                                            },
                                            plugins: {
                                              legend: {
                                                display: true,
                                                position: 'top'
                                              },
                                              tooltip: {
                                                mode: 'index',
                                                intersect: false
                                              }
                                            },
                                            interaction: {
                                              mode: 'nearest',
                                              axis: 'x',
                                              intersect: false
                                            }
                                          }} 
                                        />
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#666' }}>
                                        <p>No visitor trend data available for the selected period</p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="visitor-metrics">
                                    <h3>Visitor Metrics</h3>
                                    <div className="metrics-grid">
                                      <div className="metric-item">
                                        <span>Total Visitors</span>
                                        <span className="metric-value">{analytics.totalVisitors}</span>
                                      </div>
                                      <div className="metric-item">
                                        <span>First-time Visitors</span>
                                        <span className="metric-value">{analytics.uniqueVisitors}</span>
                                      </div>
                                      <div className="metric-item">
                                        <span>Returning Visitors</span>
                                        <span className="metric-value">{analytics.returningVisitors}</span>
                                      </div>
                                      <div className="metric-item">
                                        <span>Average Duration</span>
                                        <span className="metric-value">{analytics.avgDuration} min</span>
                                      </div>
                                      <div className="metric-item">
                                        <span>Peak Hour</span>
                                        <span className="metric-value">{analytics.peakHour}</span>
                                      </div>
                                      <div className="metric-item">
                                        <span>No-shows</span>
                                        <span className="metric-value">{analytics.noShows}</span>
                                      </div>
                                      <div className="metric-item">
                                        <span>Check-in Rate</span>
                                        <span className="metric-value">{analytics.checkInRate}%</span>
                                      </div>
                                      <div className="metric-item">
                                        <span>Completed Visits</span>
                                        <span className="metric-value">{analytics.completedVisits}</span>
                                      </div>
                                      <div className="metric-item">
                                        <span>Busiest Day</span>
                                        <span className="metric-value">{analytics.busiestDay}</span>
                                      </div>
                                      {/* <div className="metric-item">
                                        <span>Top Visit Reason</span>
                                        <span className="metric-value">{analytics.topVisitReason}</span>
                                      </div>
                                      <div className="metric-item">
                                        <span>Most Visited Host</span>
                                        <span className="metric-value">{analytics.topHost}</span>
                                      </div> */}
                                    </div>
                                  </div>
                                  
                                  <div className="visitor-insights">
                                    <h3>Visitor Insights</h3>
                                    <div className="insights-grid">
                                      <div className="insight-card">
                                        <h4>Visit Patterns</h4>
                                        <ul>
                                          <li>Peak visiting hour: <strong>{analytics.peakHour}</strong></li>
                                          <li>Busiest day of week: <strong>{analytics.busiestDay}</strong></li>
                                          <li>Average visit duration: <strong>{analytics.avgDuration} minutes</strong></li>
                                          <li>Check-in completion rate: <strong>{analytics.checkInRate}%</strong></li>
                                        </ul>
                                      </div>
                                      
                                      {/* <div className="insight-card">
                                        <h4>Visitor Behavior</h4>
                                        <ul>
                                          <li>Total unique visitors: <strong>{analytics.uniqueVisitors}</strong></li>
                                          <li>Returning visitors: <strong>{analytics.returningVisitors}</strong></li>
                                          <li>No-show rate: <strong>{analytics.totalVisitors > 0 ? Math.round((analytics.noShows / analytics.totalVisitors) * 100) : 0}%</strong></li>
                                          <li>Most common visit reason: <strong>{analytics.topVisitReason}</strong></li>
                                        </ul>
                                      </div> */}
                                      
                                      {/* <div className="insight-card">
                                        <h4>Popular Destinations</h4>
                                        <ul>
                                          <li>Most visited host: <strong>{analytics.topHost}</strong></li>
                                          <li>Total hosts visited: <strong>{Object.keys(analytics.hostMeetings).length}</strong></li>
                                          <li>Visit reasons tracked: <strong>{Object.keys(analytics.visitReasons).length}</strong></li>
                                          <li>Active visiting days: <strong>{Object.keys(analytics.dayOfWeekCounts).length}</strong></li>
                                        </ul>
                                      </div> */}
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#666' }}>
                            <p>No visitor analytics data available. Please select a date range and try again.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeReportTab === 'hosts' && reportData && (
                      <div className="hosts-tab">
                        {(() => {
                          const hostPerformance = calculateHostPerformance();
                          return (
                            <>
                              <div className="host-performance">
                                <div className="chart-container">
                                  <h3>Host Activity</h3>
                                  {hostActivityData && <Bar data={hostActivityData} options={{
                                    scales: {
                                      y: { beginAtZero: true, title: { display: true, text: 'Number of Visitors' } },
                                      x: { title: { display: true, text: 'Host Name' } }
                                    },
                                    plugins: { title: { display: true, text: 'Host Activity' } }
                                  }} />}
                                </div>
                                
                                <div className="host-rankings">
                                  <h3>Top Performing Hosts</h3>
                                  <div className="rankings-list">
                                    {hostPerformance.slice(0, 5).map((host, index) => (
                                      <div key={index} className="ranking-item">
                                        <span className="rank">#{index + 1}</span>
                                        <span className="host-name">{host.host_name}</span>
                                        <span className="visitor-count">{host.visits} visitors</span>
                                        <span className="avg-duration">{host.averageDuration}min avg</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="host-detailed-metrics">
                                <h3>Host Performance Metrics</h3>
                                <div className="host-metrics-grid">
                                  {hostPerformance.slice(0, 10).map((host, index) => (
                                    <div key={index} className="host-metric-card">
                                      <h4>{host.host_name}</h4>
                                      <div className="host-stats">
                                        <div className="stat-row">
                                          <span>Total Visits:</span>
                                          <span className="stat-value">{host.visits}</span>
                                        </div>
                                        <div className="stat-row">
                                          <span>Completed Visits:</span>
                                          <span className="stat-value">{host.completedVisits}</span>
                                        </div>
                                        <div className="stat-row">
                                          <span>Average Duration:</span>
                                          <span className="stat-value">{host.averageDuration} min</span>
                                        </div>
                                        <div className="stat-row">
                                          <span>No-shows:</span>
                                          <span className="stat-value">{host.noShows}</span>
                                        </div>
                                        <div className="stat-row">
                                          <span>Peak Hour:</span>
                                          <span className="stat-value">{host.peakHour}</span>
                                        </div>
                                        <div className="stat-row">
                                          <span>Top Reason:</span>
                                          <span className="stat-value">{host.topReason}</span>
                                        </div>
                                        <div className="stat-row">
                                          <span>Last Visit:</span>
                                          <span className="stat-value">
                                            {host.lastVisit ? host.lastVisit.toLocaleDateString() : 'N/A'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {activeReportTab === 'security' && (
                      <div className="security-tab">
                        {(() => {
                          const security = securityStats;
                          return (
                            <div className="security-insights">
                              <div className="security-alerts">
                                <h3>Security Alerts</h3>
                                <div className="alerts-list">
                                  {security.blacklistedAttempts.length > 0 && (
                                    <div className="alert-item high">
                                      <div className="alert-time">Active</div>
                                      <div className="alert-message">
                                        {security.blacklistedAttempts.length} blacklisted visitor{security.blacklistedAttempts.length > 1 ? 's' : ''} detected
                                      </div>
                                      <div className="alert-status">Action Required</div>
                                    </div>
                                  )}
                                  {security.overstays.length > 0 && (
                                    <div className="alert-item high">
                                      <div className="alert-time">Active</div>
                                      <div className="alert-message">
                                        {security.overstays.length} overstay incident{security.overstays.length > 1 ? 's' : ''} detected
                                      </div>
                                      <div className="alert-status">Action Required</div>
                                    </div>
                                  )}
                                  {security.incompleteCheckouts.length > 0 && (
                                    <div className="alert-item medium">
                                      <div className="alert-time">24+ hours ago</div>
                                      <div className="alert-message">
                                        {security.incompleteCheckouts.length} visitor{security.incompleteCheckouts.length > 1 ? 's' : ''} never checked out
                                      </div>
                                      <div className="alert-status">Monitor</div>
                                    </div>
                                  )}
                                  {security.blacklistedAttempts.length === 0 && security.overstays.length === 0 && security.incompleteCheckouts.length === 0 && (
                                    <div className="alert-item low">
                                      <div className="alert-time">{new Date().toLocaleTimeString()}</div>
                                      <div className="alert-message">All security checks passed</div>
                                      <div className="alert-status">Normal</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                          <div className="compliance-metrics">
                            <h3>Compliance Metrics</h3>
                            <div className="compliance-grid">
                              <div className="compliance-item">
                                <span>ID Verification Rate</span>
                                <span>
                                  {(() => {
                                    const totalVisitors = filteredVisits.length;
                                    if (totalVisitors === 0) return '0%';
                                    const withIdCard = filteredVisits.filter(v => 
                                      v.idCardNumber && v.idCardNumber.trim() !== ''
                                    ).length;
                                    return `${Math.round((withIdCard / totalVisitors) * 100)}%`;
                                  })()}
                                </span>
                              </div>
                              <div className="compliance-item">
                                <span>Photo Capture Rate</span>
                                <span>
                                  {(() => {
                                    const totalVisitors = filteredVisits.length;
                                    if (totalVisitors === 0) return '0%';
                                    const withPhoto = filteredVisits.filter(v => 
                                      v.visitorPhoto && v.visitorPhoto.trim() !== ''
                                    ).length;
                                    return `${Math.round((withPhoto / totalVisitors) * 100)}%`;
                                  })()}
                                </span>
                              </div>
                              <div className="compliance-item">
                                <span>Complete Information Rate</span>
                                <span>
                                  {(() => {
                                    const totalVisitors = filteredVisits.length;
                                    if (totalVisitors === 0) return '0%';
                                    const complete = filteredVisits.filter(v => 
                                      v.visitor_name && v.visitor_name.trim() !== '' && 
                                      v.visitor_email && v.visitor_email.trim() !== '' && 
                                      v.visitor_phone && v.visitor_phone.trim() !== '' &&
                                      v.reason && v.reason.trim() !== ''
                                    ).length;
                                    return `${Math.round((complete / totalVisitors) * 100)}%`;
                                  })()}
                                </span>
                              </div>
                              <div className="compliance-item">
                                <span>Proper Checkout Rate</span>
                                <span>
                                  {(() => {
                                    const checkedIn = filteredVisits.filter(v => v.check_in_time && v.check_in_time.trim() !== '').length;
                                    if (checkedIn === 0) return '0%';
                                    const checkedOut = filteredVisits.filter(v => 
                                      v.check_in_time && v.check_in_time.trim() !== '' && 
                                      v.check_out_time && v.check_out_time.trim() !== ''
                                    ).length;
                                    return `${Math.round((checkedOut / checkedIn) * 100)}%`;
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="security-stats">
                            <div className="dashboard-stats">
                              <div className="stat-card clickable-stat-card" onClick={handleShowBlacklistedVisitorsModal} style={{ cursor: 'pointer' }}>
                                <h4>Blacklisted Visitors</h4>
                                <p>{security.blacklistedAttempts.length}</p>
                                <small>Restricted entries - Click to view details</small>
                              </div>
                              <div className="stat-card clickable-stat-card" onClick={handleShowOverstayModal} style={{ cursor: 'pointer' }}>
                                <h4>Overstay Incidents</h4>
                                <p>{security.overstays.length}</p>
                                <small>Visitors staying &gt;8 hours - Click to view details</small>
                              </div>
                              <div className="stat-card clickable-stat-card" onClick={handleShowIncompleteCheckoutsModal} style={{ cursor: 'pointer' }}>
                                <h4>Incomplete Checkouts</h4>
                                <p>{security.incompleteCheckouts.length}</p>
                                <small>Never checked out (24h+) - Click to view details</small>
                              </div>
                              <div className="stat-card">
                                <h4>After-hours Visits</h4>
                                <p>{security.afterHoursVisits.length}</p>
                                <small>Visits before 8AM or after 6PM</small>
                              </div>
                              <div className="stat-card">
                                <h4>Frequent Visitors</h4>
                                <p>{security.frequentVisitors.length}</p>
                                <small>5+ visits in period</small>
                              </div>
                              <div className="stat-card">
                                <h4>No-shows</h4>
                                <p>{security.noShows.length}</p>
                                <small>Scheduled but never arrived</small>
                              </div>
                              <div className="stat-card">
                                <h4>Security Score</h4>
                                <p>{security.securityScore}%</p>
                                <small>Overall compliance rate</small>
                              </div>
                              <div className="stat-card">
                                <h4>Risk Level</h4>
                                <p>{security.riskLevel}</p>
                                <small>System risk assessment</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                        })()}
                      </div>
                    )}

                    {loading && (
                      <div className="reports-loading">
                        <p>Loading report data...</p>
                      </div>
                    )}

                    {!reportData && !loading && (
                      <div className="no-data">
                        <p>No report data available for the selected date range.</p>
                        <button onClick={fetchReportData} className="retry-btn">Retry</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
          {activeSection === 'advanced-visitors' && (
            <section className="visitor-management-section">
              {/* <div className="advanced-visitor-header">
                <h3>Advanced Visitor Management</h3>
                <p>Pre-register visitors, generate QR codes, and manage recurring visits</p>
              </div> */}

              <div className="advanced-visitor-tabs">
                <button 
                  className={`tab ${activeTab === 'preregister' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('preregister')}
                >
                  Pre-Register Visitor
                </button>
                <button 
                  className={`tab ${activeTab === 'preregistrations' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('preregistrations')}
                >
                  Pre-Registrations
                </button>
                <button 
                  className={`tab ${activeTab === 'qrcode' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('qrcode')}
                >
                  View QR Code 
                </button>
                <button 
                  className={`tab ${activeTab === 'recurring' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('recurring')}
                >
                  Recurring Visits
                </button>
                <button 
                  className={`tab ${activeTab === 'history' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('history')}
                >
                  Visitor History
                </button>
              </div>

              <div className="advanced-visitor-content">
                {activeTab === 'preregister' && (
                  <div className="preregister-tab">
                    <h2>Pre-Register Visitor</h2>
                    <form onSubmit={handlePreRegSubmit} className="preregister-form">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Visitor Name *</label>
                          <input
                            type="text"
                            name="visitorName"
                            value={preRegForm.visitorName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Email *</label>
                          <input
                            type="email"
                            name="visitorEmail"
                            value={preRegForm.visitorEmail}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Phone</label>
                          <input
                            type="tel"
                            name="visitorPhone"
                            value={preRegForm.visitorPhone}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group">
                          <label>Company</label>
                          <input
                            type="text"
                            name="visitorCompany"
                            value={preRegForm.visitorCompany}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group">
                          <label>Meeting Person *</label>
                          <input
                            type="text"
                            name="hostName"
                            value={preRegForm.hostName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Visit Date *</label>
                          <input
                            type="date"
                            name="visitDate"
                            value={preRegForm.visitDate}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Visit Time *</label>
                          <input
                            type="time"
                            name="visitTime"
                            value={preRegForm.visitTime}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Expected Duration (hours)</label>
                          <input
                            type="number"
                            name="duration"
                            value={preRegForm.duration}
                            onChange={handleInputChange}
                            min="0.5"
                            step="0.5"
                          />
                        </div>
                        <div className="form-group">
                          <label>Number of Visitors</label>
                          <input
                            type="number"
                            name="numberOfVisitors"
                            value={preRegForm.numberOfVisitors}
                            onChange={handleInputChange}
                            min="1"
                          />
                        </div>
                        <div className="form-group">
                          <label>Vehicle Number</label>
                          <input
                            type="text"
                            name="vehicleNumber"
                            value={preRegForm.vehicleNumber}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="form-group full-width">
                        <label>Purpose of Visit *</label>
                        <select
                          name="purpose"
                          value={preRegForm.purpose}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Purpose</option>
                          <option value="Meeting">Meeting</option>
                          <option value="Interview">Interview</option>
                          <option value="Delivery">Delivery</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Training">Training</option>
                          <option value="Audit">Audit</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="form-group full-width">
                        <label>Emergency Contact</label>
                        <input
                          type="text"
                          name="emergencyContact"
                          value={preRegForm.emergencyContact}
                          onChange={handleInputChange}
                          placeholder="Name and phone number"
                        />
                      </div>

                      <div className="form-group full-width">
                        <label>Special Requirements</label>
                        <textarea
                          name="specialRequirements"
                          value={preRegForm.specialRequirements}
                          onChange={handleInputChange}
                          rows="3"
                          placeholder="Wheelchair access, dietary requirements, etc."
                        />
                      </div>

                      <div className="recurring-section">
                        <div className="form-group checkbox-group">
                          <label>
                            <input
                              type="checkbox"
                              name="isRecurring"
                              checked={preRegForm.isRecurring}
                              onChange={handleInputChange}
                            />
                            Recurring Visit
                          </label>
                        </div>

                        {preRegForm.isRecurring && (
                          <div className="recurring-options">
                            <div className="form-group">
                              <label>Recurring Pattern</label>
                              <select
                                name="recurringPattern"
                                value={preRegForm.recurringPattern}
                                onChange={handleInputChange}
                              >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>End Date</label>
                              <input
                                type="date"
                                name="recurringEndDate"
                                value={preRegForm.recurringEndDate}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? 'Processing...' : 'Pre-Register Visitor'}
                      </button>
                    </form>

                    {qrCodeData && (
                      <div className="qr-code-section">
                        <h3>QR Code Generated</h3>
                        <div className="qr-code-container">
                          <QRCodeSVG value={qrCodeData} size={200} />
                          <p>Share this QR code with the visitor for quick check-in</p>
                          <button onClick={() => window.print()} className="print-btn">
                            Print QR Code
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'preregistrations' && (
                  <div className="preregistrations-tab">
                    <h2>Pre-Registered Visitors</h2>
                    {loading ? (
                      <div className="loading">Loading...</div>
                    ) : (
                      <div className="preregistrations-list">
                        {preRegistrations.map(visit => (
                          <div key={visit.id} className="prereg-card">
                            <div className="prereg-header">
                              <h3>{visit.visitor_name}</h3>
                              <span className={`status ${formatVisitStatus(visit).toLowerCase()}`}>
                                {formatVisitStatus(visit)}
                              </span>
                            </div>
                            <div className="prereg-details">
                              <p><strong>Host:</strong> {visit.host_name}</p>
                              <p><strong>Date:</strong> {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : 'Invalid Date'}</p>
                              <p><strong>Time:</strong> {visit.visit_time}</p>
                              <p><strong>Purpose:</strong> {visit.purpose}</p>
                              {visit.visitor_company && (
                                <p><strong>Company:</strong> {visit.visitor_company}</p>
                              )}
                              {visit.visitor_phone && (
                                <p><strong>Phone:</strong> {visit.visitor_phone}</p>
                              )}
                              {visit.number_of_visitors > 1 && (
                                <p><strong>Visitors:</strong> {visit.number_of_visitors}</p>
                              )}
                            </div>
                            <div className="prereg-actions">
                              <button 
                                onClick={() => generateBadge(visit.id)} 
                                className="badge-btn"
                                disabled={loading}
                              >
                                {loading ? 'Generating...' : 'Generate Badge'}
                              </button>
                              {visit.qr_code && (
                                <button 
                                  onClick={() => showQRCode(visit)} 
                                  className="qr-btn"
                                >
                                  View QR Code
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'qrcode' && (
                  <div className="qrcode-tab">
                    <h2>View QR Code </h2>
                    <p>Generate QR codes for quick visitor check-in. Click "View QR Code" on any pre-registered visitor to see their QR code.</p>
                    
                    <div className="qr-instructions">
                      <h3>How to use QR Codes:</h3>
                      <ul>
                        <li>Each pre-registered visitor receives a unique QR code</li>
                        <li>Visitors can scan the QR code at reception for quick check-in</li>
                        <li>QR codes contain visitor information and visit details</li>
                        <li>Print QR codes and include them in visitor confirmation emails</li>
                      </ul>
                    </div>

                    {preRegistrations.length > 0 && (
                      <div className="qr-quick-access">
                        <h3>Quick QR Access:</h3>
                        <div className="qr-visitor-list">
                          {preRegistrations.slice(0, 5).map(visitor => (
                            <div key={visitor.id} className="qr-visitor-item">
                              <span>{visitor.visitor_name} - {visitor.visit_date}</span>
                              <button 
                                onClick={() => showQRCode(visitor)} 
                                className="qr-btn-small"
                              >
                                View QR
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'recurring' && (
                  <div className="recurring-tab">
                    <h2>Recurring Visits Management</h2>
                    {loading ? (
                      <div className="loading">Loading...</div>
                    ) : (
                      <div className="recurring-visits">
                        {recurringVisits.length === 0 ? (
                          <div className="no-data">
                            <p>No recurring visits found. Create a pre-registration with recurring pattern to see them here.</p>
                          </div>
                        ) : (
                          recurringVisits.map(visit => (
                            <div key={visit.id} className="recurring-card">
                              <div className="recurring-header">
                                <h3>{visit.visitor_name}</h3>
                                <span className={`recurring-status ${visit.recurring_status}`}>
                                  {visit.recurring_status}
                                </span>
                              </div>
                              <div className="recurring-details">
                                <p><strong>Email:</strong> {visit.visitor_email}</p>
                                <p><strong>Host:</strong> {visit.host_name}</p>
                                <p><strong>Purpose:</strong> {visit.purpose}</p>
                                <p><strong>Pattern:</strong> {visit.recurring_pattern}</p>
                                <p><strong>Original Date:</strong> {new Date(visit.visit_date).toLocaleDateString()}</p>
                                <p><strong>Time:</strong> {visit.visit_time}</p>
                                <p><strong>Next Visit:</strong> {new Date(visit.next_visit_date).toLocaleDateString()}</p>
                                <p><strong>End Date:</strong> {visit.recurring_end_date ? new Date(visit.recurring_end_date).toLocaleDateString() : 'No end date'}</p>
                                {visit.special_requirements && (
                                  <p><strong>Special Requirements:</strong> {visit.special_requirements}</p>
                                )}
                              </div>
                              <div className="recurring-actions">
                                <button 
                                  onClick={() => generateInstances(visit.id)} 
                                  className="generate-btn"
                                  disabled={loading}
                                >
                                  Generate Instances
                                </button>
                                <button 
                                  onClick={() => updateRecurringStatus(visit.id, 'paused')} 
                                  className="pause-btn"
                                  disabled={loading}
                                >
                                  Pause
                                </button>
                                <button 
                                  onClick={() => updateRecurringStatus(visit.id, 'stopped')} 
                                  className="stop-btn"
                                  disabled={loading}
                                >
                                  Stop Recurring
                                </button>
                                <button 
                                  onClick={() => showQRCode(visit)} 
                                  className="qr-btn"
                                >
                                  View QR Code
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="history-tab">
                    <h2>Visitor History</h2>
                    
                    {/* History Filters */}
                    <div className="history-filters">
                      <h3>Filter History</h3>
                      <div className="filter-row">
                        <div className="filter-item">
                          <label>Start Date:</label>
                          <input
                            type="date"
                            name="startDate"
                            value={historyFilters.startDate}
                            onChange={handleHistoryFilterChange}
                          />
                        </div>
                        <div className="filter-item">
                          <label>End Date:</label>
                          <input
                            type="date"
                            name="endDate"
                            value={historyFilters.endDate}
                            onChange={handleHistoryFilterChange}
                          />
                        </div>
                        <div className="filter-item">
                          <label>Visitor Email:</label>
                          <input
                            type="text"
                            name="visitorEmail"
                            value={historyFilters.visitorEmail}
                            onChange={handleHistoryFilterChange}
                            placeholder="Search by email..."
                          />
                        </div>
                        <div className="filter-item">
                          <label>Host Name:</label>
                          <input
                            type="text"
                            name="hostName"
                            value={historyFilters.hostName}
                            onChange={handleHistoryFilterChange}
                            placeholder="Search by host..."
                          />
                        </div>
                        <div className="filter-item">
                          <label>Records per page:</label>
                          <select
                            value={historyItemsPerPage}
                            onChange={(e) => {
                              setHistoryItemsPerPage(Number(e.target.value));
                              setHistoryCurrentPage(1); // Reset to first page when changing items per page
                            }}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '14px',
                              backgroundColor: '#fff'
                            }}
                          >
                            <option value="5">5 records</option>
                            <option value="10">10 records</option>
                          </select>
                        </div>
                        <div className="filter-item">
                          <button onClick={applyHistoryFilters} className="apply-filter-btn">
                            Apply Filters
                          </button>
                        </div>
                        <div className="filter-item">
                          <button onClick={clearHistoryFilters} className="clear-filter-btn">
                            Clear Filters
                          </button>
                        </div>
                      </div>
                    </div>

                    {loading ? (
                      <div className="loading">Loading...</div>
                    ) : (
                      <div className="history-table-container">
                        {visitorHistory.length === 0 ? (
                          <div className="no-data">
                            <p>No visitor history found for the selected criteria.</p>
                          </div>
                        ) : (
                          <>
                            {/* Pagination Info and Controls */}
                            <div className="history-pagination-info">
                              <p>
                                Showing {((historyCurrentPage - 1) * historyItemsPerPage) + 1} to {Math.min(historyCurrentPage * historyItemsPerPage, visitorHistory.length)} of {visitorHistory.length} visitor records
                              </p>
                              <div className="history-pagination-controls">
                                <button 
                                  onClick={() => setHistoryCurrentPage(Math.max(1, historyCurrentPage - 1))}
                                  disabled={historyCurrentPage === 1}
                                  className="history-pagination-button history-pagination-prev-next"
                                >
                                  ← Previous
                                </button>
                                <span className="history-pagination-page-info">
                                  Page {historyCurrentPage} of {getTotalPages(visitorHistory.length, historyItemsPerPage)}
                                </span>
                                <button 
                                  onClick={() => setHistoryCurrentPage(Math.min(getTotalPages(visitorHistory.length, historyItemsPerPage), historyCurrentPage + 1))}
                                  disabled={historyCurrentPage === getTotalPages(visitorHistory.length, historyItemsPerPage)}
                                  className="history-pagination-button history-pagination-prev-next"
                                >
                                  Next →
                                </button>
                              </div>
                            </div>

                            <table className="history-table">
                              <thead>
                                <tr>
                                  <th>Date & Time</th>
                                  <th>Visitor</th>
                                  <th>Email</th>
                                  <th>Company</th>
                                  <th>Host</th>
                                  <th>Purpose</th>
                                  <th>Duration</th>
                                  <th>Status</th>
                                  <th>Actions</th>
                                  <th>BlackList</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getPaginatedData(visitorHistory, historyCurrentPage, historyItemsPerPage).map(visit => (
                                <tr key={visit.id}>
                                  <td>
                                    <div className="datetime-cell">
                                      <div>{visit.check_in_time ? new Date(visit.check_in_time).toLocaleDateString() : 'N/A'}</div>
                                      <div className="time">{visit.check_in_time ? new Date(visit.check_in_time).toLocaleTimeString() : 'N/A'}</div>
                                    </div>
                                  </td>
                                  <td className="visitor-cell">
                                    <strong>{visit.visitor_name || visit.name || 'Unknown'}</strong>
                                    {visit.is_blacklisted && (
                                      <span className="blacklisted-indicator">🚫 Blacklisted</span>
                                    )}
                                  </td>
                                  <td>{visit.visitor_email || visit.email || 'N/A'}</td>
                                  <td>{visit.visitor_company || visit.company || 'N/A'}</td>
                                  <td>{visit.host_name || visit.name || 'Unknown'}</td>
                                  <td>{visit.purpose || visit.reason || 'N/A'}</td>
                                  <td>
                                    {visit.check_out_time && visit.check_in_time ? 
                                      Math.round((new Date(visit.check_out_time) - new Date(visit.check_in_time)) / (1000 * 60)) + ' min' :
                                      visit.check_in_time ? 'In Progress' : 'Not Started'
                                    }
                                  </td>
                                  <td>
                                    <span className={`status ${visit.status || 'unknown'}`}>
                                      {visit.status || 'Unknown'}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="history-actions">
                                      {visit.qr_code && (
                                        <button 
                                          onClick={() => showQRCode(visit)} 
                                          className="qr-btn-small"
                                          title="View QR Code"
                                        >
                                          QR
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => generateBadge(visit.id)} 
                                        className="badge-btn-small"
                                        title="Generate Badge"
                                      >
                                        Badge
                                      </button>
                                    </div>
                                  </td>
                                  <td>
                                    {visit.is_blacklisted ? ( 
                                      <button
                                        onClick={() => handleBlacklistUpdate(visit.visitor_id, false)}
                                        className="blacklist-btn unblacklist"
                                        disabled={loading || !visit.visitor_id}
                                        title={!visit.visitor_id ? 'Visitor ID not available' : `Remove ${visit.visitor_email || visit.email || 'this email'} from blacklist (affects all visits)`}
                                      >
                                        Unblacklist
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleBlacklistUpdate(visit.visitor_id, true)}
                                        className="blacklist-btn blacklist"
                                        disabled={loading || !visit.visitor_id}
                                        title={!visit.visitor_id ? 'Visitor ID not available' : `Blacklist ${visit.visitor_email || visit.email || 'this email'} (affects all visits)`}
                                      >
                                        Blacklist 
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Bottom Pagination Controls */}
                          <div className="history-bottom-pagination">
                            <button 
                              onClick={() => setHistoryCurrentPage(1)}
                              disabled={historyCurrentPage === 1}
                              className="history-pagination-button history-pagination-first-last"
                            >
                              First
                            </button>
                            <button 
                              onClick={() => setHistoryCurrentPage(Math.max(1, historyCurrentPage - 1))}
                              disabled={historyCurrentPage === 1}
                              className="history-pagination-button history-pagination-prev-next"
                            >
                              ← Prev
                            </button>
                            
                            {/* Page Numbers */}
                            {(() => {
                              const totalPages = getTotalPages(visitorHistory.length, historyItemsPerPage);
                              const maxVisiblePages = 5;
                              const pages = [];
                              
                              let startPage = Math.max(1, historyCurrentPage - Math.floor(maxVisiblePages / 2));
                              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                              
                              if (endPage - startPage + 1 < maxVisiblePages) {
                                startPage = Math.max(1, endPage - maxVisiblePages + 1);
                              }
                              
                              for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                  <button
                                    key={i}
                                    onClick={() => setHistoryCurrentPage(i)}
                                    className={`history-pagination-number ${i === historyCurrentPage ? 'active' : ''}`}
                                  >
                                    {i}
                                  </button>
                                );
                              }
                              
                              return pages;
                            })()}
                            
                            <button 
                              onClick={() => setHistoryCurrentPage(Math.min(getTotalPages(visitorHistory.length, historyItemsPerPage), historyCurrentPage + 1))}
                              disabled={historyCurrentPage === getTotalPages(visitorHistory.length, historyItemsPerPage)}
                              className="history-pagination-button history-pagination-prev-next"
                            >
                              Next →
                            </button>
                            <button 
                              onClick={() => setHistoryCurrentPage(getTotalPages(visitorHistory.length, historyItemsPerPage))}
                              disabled={historyCurrentPage === getTotalPages(visitorHistory.length, historyItemsPerPage)}
                              className="history-pagination-button history-pagination-first-last"
                            >
                              Last
                            </button>
                          </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
          {showVisitorDetails && selectedVisitor && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Visitor Details</h3>
                <button className="modal-close" onClick={() => setShowVisitorDetails(false)}>×</button>
                <div className="visitor-details">
                  <p><strong>Name:</strong> {selectedVisitor.visitorName || selectedVisitor.visitor_name}</p>
                  <p><strong>Email:</strong> {selectedVisitor.visitorEmail || selectedVisitor.visitor_email || 'N/A'}</p>
                  <p><strong>Host:</strong> {selectedVisitor.hostName || selectedVisitor.host_name}</p>
                  <p><strong>Purpose:</strong> {selectedVisitor.reason || selectedVisitor.purpose || 'N/A'}</p>
                  <p><strong>Visit Date:</strong> {selectedVisitor.check_in_time ? new Date(selectedVisitor.check_in_time).toLocaleString() : 
                                                  selectedVisitor.visit_date ? new Date(selectedVisitor.visit_date).toLocaleString() : 'N/A'}</p>
                  <p><strong>Check-In:</strong> {selectedVisitor.check_in_time ? new Date(selectedVisitor.check_in_time).toLocaleString() : 'Not Checked In'}</p>
                  <p><strong>Check-Out:</strong> {selectedVisitor.check_out_time ? new Date(selectedVisitor.check_out_time).toLocaleString() : 'Not Checked Out'}</p>
                  {selectedVisitor.photo && (
                    <p><strong>Photo:</strong><br />
                      <img src={selectedVisitor.photo} alt="Visitor" style={{ maxWidth: '100px', borderRadius: '5px' }} />
                    </p>
                  )}
                  <h4>Visit History</h4>
                  {selectedVisitor.history && selectedVisitor.history.length > 0 ? (
                    <table className="visitor-history-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Purpose</th>
                          <th>Host</th>
                          <th>Check-In</th>
                          <th>Check-Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVisitor.history.map(history => (
                          <tr key={history.id}>
                            <td>{new Date(history.check_in_time || history.visit_date).toLocaleDateString()}</td>
                            <td>{history.reason || history.purpose || 'N/A'}</td>
                            <td>{history.hostName || history.host_name || 'N/A'}</td>
                            <td>{history.check_in_time ? new Date(history.check_in_time).toLocaleString() : 'N/A'}</td>
                            <td>{history.check_out_time ? new Date(history.check_out_time).toLocaleString() : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No visit history available.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Total Visitors Modal */}
          {showTotalVisitorsModal && (
            <div className="modal-overlay" onClick={() => setShowTotalVisitorsModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95%', maxHeight: '90%' }}>
                <div className="modal-header">
                  <h3>👤 Total Visitors</h3>
                  <button className="modal-close" onClick={() => setShowTotalVisitorsModal(false)}>×</button>
                </div>
                
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <p>Loading visitors...</p>
                    </div>
                  ) : (() => {
                    // Use all master data for total visitors instead of filtered visits
                    const allVisitors = [...masterVisitsData, ...masterPreRegistrationsData];
                    return allVisitors.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        <p>📊 No visitors found.</p>
                        <p>No visitor data available for the current period.</p>
                      </div>
                    ) : (
                      <div className="total-visitors-content">
                        <div className="visitors-summary" style={{ 
                          backgroundColor: '#e3f2fd', 
                          border: '1px solid #1976d2', 
                          borderRadius: '8px', 
                          padding: '15px', 
                          marginBottom: '20px' 
                        }}>
                          <h4 style={{ color: '#1976d2', margin: '0 0 10px 0' }}>
                            📊 Total Visitors: {allVisitors.length}
                          </h4>
                          <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
                            <span>✅ Checked In: {allVisitors.filter(v => v.check_in_time && !v.check_out_time).length}</span>
                            <span>❌ Checked Out: {allVisitors.filter(v => v.check_out_time).length}</span>
                            <span>⏳ Pending: {allVisitors.filter(v => !v.check_in_time).length}</span>
                            <span>📋 Pre-Registrations: {masterPreRegistrationsData.length}</span>
                            <span>🚫 Blacklisted: {masterBlacklistedData.length}</span>
                          </div>
                        </div>

                        <div className="visitors-table-wrapper">
                          <table className="visitors-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f5f5f5' }}>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Photo</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Visitor Name</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Host</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Purpose</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Check-In</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Check-Out</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allVisitors.slice().reverse().map((visit, index) => (
                                <tr key={visit.id || index} style={{ borderBottom: '1px solid #eee' }}>
                                  <td style={{ padding: '12px' }}>
                                    {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : 
                                     visit.check_in_time ? new Date(visit.check_in_time).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    {visit.picture || visit.photo || visit.visitorPhoto ? (
                                    <img 
                                      src={visit.picture || visit.photo || visit.visitorPhoto} 
                                      alt="Visitor" 
                                      style={{ 
                                        width: '40px', 
                                        height: '40px', 
                                        borderRadius: '50%', 
                                        objectFit: 'cover',
                                        border: '1px solid #ddd'
                                      }} 
                                    />
                                  ) : (
                                    <div style={{ 
                                      width: '40px', 
                                      height: '40px', 
                                      borderRadius: '50%', 
                                      backgroundColor: '#f0f0f0', 
                                      border: '1px solid #ddd',
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      fontSize: '18px'
                                    }}>
                                      👤
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ fontWeight: 'bold' }}>
                                    {visit.person_name || visit.visitor_name || visit.visitorName || visit.name || 'N/A'}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#666' }}>
                                    {visit.visitor_id || visit.visitorEmail || visit.visitor_email || 'No ID'}
                                  </div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    backgroundColor: visit.isPreRegistration ? '#e3f2fd' : '#f3e5f5',
                                    color: visit.isPreRegistration ? '#1976d2' : '#7b1fa2'
                                  }}>
                                    {visit.isPreRegistration ? '📋 Pre-Reg' : '👤 Regular'}
                                  </span>
                                  {(visit.isBlacklisted || visit.is_blacklisted) && (
                                    <span style={{
                                      padding: '2px 6px',
                                      borderRadius: '10px',
                                      fontSize: '10px',
                                      fontWeight: 'bold',
                                      backgroundColor: '#ffebee',
                                      color: '#d32f2f',
                                      marginLeft: '5px'
                                    }}>
                                      🚫 Blacklisted
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  {visit.person_to_meet || visit.host_name || visit.hostName || 'N/A'}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  {visit.visit_reason || visit.purpose || visit.reason || 'N/A'}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  {visit.check_in_time ? 
                                    new Date(visit.check_in_time).toLocaleTimeString() : 
                                    '-'
                                  }
                                </td>
                                <td style={{ padding: '12px' }}>
                                  {visit.check_out_time ? 
                                    new Date(visit.check_out_time).toLocaleTimeString() : 
                                    '-'
                                  }
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    backgroundColor: visit.check_out_time ? '#e8f5e8' : 
                                                   visit.check_in_time ? '#fff3cd' : '#f8d7da',
                                    color: visit.check_out_time ? '#2d5a2d' : 
                                           visit.check_in_time ? '#856404' : '#721c24'
                                  }}>
                                    {visit.check_out_time ? '✅ Completed' : 
                                     visit.check_in_time ? '⏳ In Progress' : '📅 Pending'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    );
                  })()}
                </div>
                
                <div className="modal-footer" style={{ 
                  padding: '15px', 
                  borderTop: '1px solid #ddd', 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: '10px' 
                }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowTotalVisitorsModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Checked-In Visitors Modal */}
          {showCheckedInVisitorsModal && (
            <div className="modal-overlay" onClick={() => setShowCheckedInVisitorsModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95%', maxHeight: '95%' }}>
                <div className="modal-header">
                  <h3>✅ Checked-In Visitors</h3>
                  <button className="modal-close" onClick={() => setShowCheckedInVisitorsModal(false)}>×</button>
                </div>
                
                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <p>Loading checked-in visitors...</p>
                    </div>
                  ) : (
                    (() => {
                      // More inclusive filtering for checked-in visitors
                      const checkedInVisitors = [...masterVisitsData, ...masterPreRegistrationsData].filter(visitor => {
                        const isCheckedIn = visitor.check_in_time && !visitor.check_out_time;
                        return isCheckedIn;
                      });
                      
                      const checkedInFromRegular = masterVisitsData.filter(visitor => 
                        visitor.check_in_time && !visitor.check_out_time
                      ).length;
                      
                      const checkedInFromPreReg = masterPreRegistrationsData.filter(visitor => 
                        visitor.check_in_time && !visitor.check_out_time
                      ).length;

                      if (checkedInVisitors.length === 0) {
                        return (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
                            <h4 style={{ color: '#333', marginBottom: '10px' }}>No Checked-In Visitors</h4>
                            <p>All visitors have either checked out or are pending check-in.</p>
                          </div>
                        );
                      }

                      return (
                        <div>
                          {/* Enhanced Statistics */}
                          <div style={{ 
                            marginBottom: '20px', 
                            padding: '15px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '8px',
                            border: '1px solid #e9ecef'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <h4 style={{ margin: 0, color: '#333' }}>📊 Checked-In Statistics</h4>
                              <span style={{ 
                                background: '#28a745', 
                                color: 'white', 
                                padding: '4px 12px', 
                                borderRadius: '12px', 
                                fontSize: '14px', 
                                fontWeight: 'bold' 
                              }}>
                                {checkedInVisitors.length} Currently Checked-In
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>{checkedInFromRegular}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Walk-in Visitors</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>{checkedInFromPreReg}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Pre-registered</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffc107' }}>
                                  {checkedInVisitors.filter(v => {
                                    const checkInTime = new Date(v.check_in_time);
                                    const now = new Date();
                                    const diffMinutes = (now - checkInTime) / (1000 * 60);
                                    return diffMinutes > 60;
                                  }).length}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Staying &gt; 1 Hour</div>
                              </div>
                            </div>
                          </div>

                          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ margin: 0, color: '#666' }}>
                              Showing {Math.min(checkedInVisitors.length, visitorsPerPage)} of {checkedInVisitors.length} checked-in visitors
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button 
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #28a745',
                                  backgroundColor: currentPage === 1 ? '#f5f5f5' : '#28a745',
                                  color: currentPage === 1 ? '#999' : 'white',
                                  borderRadius: '4px',
                                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                ← Previous
                              </button>
                              <span style={{ fontSize: '14px', color: '#666' }}>
                                Page {currentPage} of {Math.ceil(checkedInVisitors.length / visitorsPerPage)}
                              </span>
                              <button 
                                onClick={() => setCurrentPage(Math.min(Math.ceil(checkedInVisitors.length / visitorsPerPage), currentPage + 1))}
                                disabled={currentPage === Math.ceil(checkedInVisitors.length / visitorsPerPage)}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #28a745',
                                  backgroundColor: currentPage === Math.ceil(checkedInVisitors.length / visitorsPerPage) ? '#f5f5f5' : '#28a745',
                                  color: currentPage === Math.ceil(checkedInVisitors.length / visitorsPerPage) ? '#999' : 'white',
                                  borderRadius: '4px',
                                  cursor: currentPage === Math.ceil(checkedInVisitors.length / visitorsPerPage) ? 'not-allowed' : 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                Next →
                              </button>
                            </div>
                          </div>
                          
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd', backgroundColor: 'white' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#28a745', color: 'white' }}>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Visitor Details</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Type</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Company</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Purpose</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Check-in Time</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Duration</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {checkedInVisitors
                                  .slice((currentPage - 1) * visitorsPerPage, currentPage * visitorsPerPage)
                                  .map((visitor, index) => {
                                    const isBlacklisted = masterBlacklistedData.some(b => 
                                      b.name?.toLowerCase() === visitor.visitor_name?.toLowerCase() ||
                                      b.phone === visitor.visitor_phone ||
                                      b.email?.toLowerCase() === visitor.visitor_email?.toLowerCase()
                                    );
                                    const checkInTime = new Date(visitor.check_in_time);
                                    const now = new Date();
                                    const durationMinutes = Math.floor((now - checkInTime) / (1000 * 60));
                                    const hours = Math.floor(durationMinutes / 60);
                                    const minutes = durationMinutes % 60;
                                    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                                    
                                    return (
                                      <tr key={index} style={{ 
                                        borderBottom: '1px solid #eee',
                                        backgroundColor: isBlacklisted ? '#fff5f5' : (index % 2 === 0 ? '#f8f9fa' : 'white')
                                      }}>
                                        <td style={{ padding: '12px' }}>
                                          <div>
                                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                              {visitor.visitor_name}
                                              {isBlacklisted && (
                                                <span style={{
                                                  marginLeft: '8px',
                                                  padding: '2px 6px',
                                                  backgroundColor: '#dc3545',
                                                  color: 'white',
                                                  borderRadius: '10px',
                                                  fontSize: '10px',
                                                  fontWeight: 'bold'
                                                }}>
                                                  ⚠️ BLACKLISTED
                                                </span>
                                              )}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>{visitor.visitor_phone}</div>
                                            {visitor.visitor_email && (
                                              <div style={{ fontSize: '11px', color: '#999' }}>{visitor.visitor_email}</div>
                                            )}
                                          </div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                          <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            backgroundColor: visitor.id ? '#e3f2fd' : '#f3e5f5',
                                            color: visitor.id ? '#1976d2' : '#7b1fa2'
                                          }}>
                                            {visitor.id ? '🚶 Walk-in' : '📋 Pre-reg'}
                                          </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>{visitor.visitor_company || visitor.company || 'N/A'}</td>
                                        <td style={{ padding: '12px' }}>{visitor.purpose || visitor.reason || 'N/A'}</td>
                                        <td style={{ padding: '12px' }}>
                                          <div>
                                            <div style={{ fontWeight: 'bold' }}>
                                              {checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#666' }}>
                                              {checkInTime.toLocaleDateString()}
                                            </div>
                                          </div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                          <span style={{
                                            color: durationMinutes > 60 ? '#ff6b35' : '#28a745',
                                            fontWeight: 'bold',
                                            fontSize: '12px'
                                          }}>
                                            {durationText}
                                          </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                          <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            backgroundColor: '#d4edda',
                                            color: '#155724'
                                          }}>
                                            ✅ Checked-In
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
                
                <div className="modal-footer" style={{ 
                  padding: '15px', 
                  borderTop: '1px solid #ddd', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    ✅ These visitors are currently on the premises
                  </div>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowCheckedInVisitorsModal(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Visitors Modal */}
          {showPendingVisitorsModal && (
            <div className="modal-overlay" onClick={() => setShowPendingVisitorsModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95%', maxHeight: '95%' }}>
                <div className="modal-header">
                  <h3>⏳ Pending Visitors</h3>
                  <button className="modal-close" onClick={() => setShowPendingVisitorsModal(false)}>×</button>
                </div>
                
                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <p>Loading pending visitors...</p>
                    </div>
                  ) : (
                    (() => {
                      const pendingVisitors = [...masterVisitsData, ...masterPreRegistrationsData].filter(visitor => {
                        const isPending = !visitor.check_in_time;
                        const visitDate = new Date(visitor.visit_date || visitor.created_at);
                        const today = new Date();
                        const isToday = visitDate.toDateString() === today.toDateString();
                        return isPending && isToday;
                      });
                      
                      const pendingFromRegular = masterVisitsData.filter(visitor => 
                        !visitor.check_in_time &&
                        new Date(visitor.visit_date || visitor.created_at).toDateString() === new Date().toDateString()
                      ).length;
                      
                      const pendingFromPreReg = masterPreRegistrationsData.filter(visitor => 
                        !visitor.check_in_time &&
                        new Date(visitor.visit_date).toDateString() === new Date().toDateString()
                      ).length;

                      const overduePending = pendingVisitors.filter(visitor => {
                        const visitDate = new Date(visitor.visit_date || visitor.created_at);
                        const now = new Date();
                        return visitDate < now;
                      }).length;

                      if (pendingVisitors.length === 0) {
                        return (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                            <h4 style={{ color: '#333', marginBottom: '10px' }}>No Pending Visitors</h4>
                            <p>All visitors have either checked in or are scheduled for future dates.</p>
                          </div>
                        );
                      }

                      return (
                        <div>
                          {/* Enhanced Statistics */}
                          <div style={{ 
                            marginBottom: '20px', 
                            padding: '15px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '8px',
                            border: '1px solid #e9ecef'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <h4 style={{ margin: 0, color: '#333' }}>📊 Pending Statistics</h4>
                              <span style={{ 
                                background: '#ffc107', 
                                color: '#212529', 
                                padding: '4px 12px', 
                                borderRadius: '12px', 
                                fontSize: '14px', 
                                fontWeight: 'bold' 
                              }}>
                                {pendingVisitors.length} Awaiting Check-in
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>{pendingFromRegular}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Walk-in Pending</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>{pendingFromPreReg}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Pre-registered</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc3545' }}>{overduePending}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Overdue</div>
                              </div>
                            </div>
                          </div>

                          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ margin: 0, color: '#666' }}>
                              Showing {Math.min(pendingVisitors.length, visitorsPerPage)} of {pendingVisitors.length} pending visitors
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button 
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #ffc107',
                                  backgroundColor: currentPage === 1 ? '#f5f5f5' : '#ffc107',
                                  color: currentPage === 1 ? '#999' : '#212529',
                                  borderRadius: '4px',
                                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                ← Previous
                              </button>
                              <span style={{ fontSize: '14px', color: '#666' }}>
                                Page {currentPage} of {Math.ceil(pendingVisitors.length / visitorsPerPage)}
                              </span>
                              <button 
                                onClick={() => setCurrentPage(Math.min(Math.ceil(pendingVisitors.length / visitorsPerPage), currentPage + 1))}
                                disabled={currentPage === Math.ceil(pendingVisitors.length / visitorsPerPage)}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #ffc107',
                                  backgroundColor: currentPage === Math.ceil(pendingVisitors.length / visitorsPerPage) ? '#f5f5f5' : '#ffc107',
                                  color: currentPage === Math.ceil(pendingVisitors.length / visitorsPerPage) ? '#999' : '#212529',
                                  borderRadius: '4px',
                                  cursor: currentPage === Math.ceil(pendingVisitors.length / visitorsPerPage) ? 'not-allowed' : 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                Next →
                              </button>
                            </div>
                          </div>
                          
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd', backgroundColor: 'white' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#ffc107', color: '#212529' }}>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Visitor Details</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Type</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Company</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Purpose</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Expected Time</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Priority</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pendingVisitors
                                  .slice((currentPage - 1) * visitorsPerPage, currentPage * visitorsPerPage)
                                  .map((visitor, index) => {
                                    const isBlacklisted = masterBlacklistedData.some(b => 
                                      b.name?.toLowerCase() === visitor.visitor_name?.toLowerCase() ||
                                      b.phone === visitor.visitor_phone ||
                                      b.email?.toLowerCase() === visitor.visitor_email?.toLowerCase()
                                    );
                                    const visitDate = new Date(visitor.visit_date || visitor.created_at);
                                    const now = new Date();
                                    const isOverdue = visitDate < now;
                                    
                                    return (
                                      <tr key={index} style={{ 
                                        borderBottom: '1px solid #eee',
                                        backgroundColor: isBlacklisted ? '#fff5f5' : (isOverdue ? '#fff3cd' : (index % 2 === 0 ? '#f8f9fa' : 'white'))
                                      }}>
                                        <td style={{ padding: '12px' }}>
                                          <div>
                                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                              {visitor.visitor_name}
                                              {isBlacklisted && (
                                                <span style={{
                                                  marginLeft: '8px',
                                                  padding: '2px 6px',
                                                  backgroundColor: '#dc3545',
                                                  color: 'white',
                                                  borderRadius: '10px',
                                                  fontSize: '10px',
                                                  fontWeight: 'bold'
                                                }}>
                                                  ⚠️ BLACKLISTED
                                                </span>
                                              )}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>{visitor.visitor_phone}</div>
                                            {visitor.visitor_email && (
                                              <div style={{ fontSize: '11px', color: '#999' }}>{visitor.visitor_email}</div>
                                            )}
                                          </div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                          <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            backgroundColor: visitor.id ? '#e3f2fd' : '#f3e5f5',
                                            color: visitor.id ? '#1976d2' : '#7b1fa2'
                                          }}>
                                            {visitor.id ? '🚶 Walk-in' : '📋 Pre-reg'}
                                          </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>{visitor.visitor_company || visitor.company || 'N/A'}</td>
                                        <td style={{ padding: '12px' }}>{visitor.purpose || visitor.reason || 'N/A'}</td>
                                        <td style={{ padding: '12px' }}>
                                          <div>
                                            <div style={{ fontWeight: 'bold' }}>
                                              {visitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#666' }}>
                                              {visitDate.toLocaleDateString()}
                                            </div>
                                          </div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                          <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            backgroundColor: isOverdue ? '#f8d7da' : '#d1ecf1',
                                            color: isOverdue ? '#721c24' : '#0c5460'
                                          }}>
                                            {isOverdue ? '� Overdue' : '🟡 On Time'}
                                          </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                          <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            backgroundColor: '#fff3cd',
                                            color: '#856404'
                                          }}>
                                            ⏳ Pending
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
                
                <div className="modal-footer" style={{ 
                  padding: '15px', 
                  borderTop: '1px solid #ddd', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    ⏳ Visitors awaiting check-in today
                  </div>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowPendingVisitorsModal(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Expected Visitors Modal */}
          {showExpectedVisitorsModal && (
            <div className="modal-overlay" onClick={() => setShowExpectedVisitorsModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95%', maxHeight: '95%' }}>
                <div className="modal-header">
                  <h3>📅 Expected Visitors</h3>
                  <button className="modal-close" onClick={() => setShowExpectedVisitorsModal(false)}>×</button>
                </div>
                
                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <p>Loading expected visitors...</p>
                    </div>
                  ) : (
                    (() => {
                      const expectedVisitors = [...masterVisitsData, ...masterPreRegistrationsData].filter(visitor => {
                        const visitDate = new Date(visitor.visit_date || visitor.created_at);
                        const today = new Date();
                        const isFuture = visitDate > today;
                        return isFuture && !visitor.check_in_time;
                      });
                      
                      const expectedFromRegular = masterVisitsData.filter(visitor => {
                        const visitDate = new Date(visitor.visit_date || visitor.created_at);
                        return visitDate > new Date() && !visitor.check_in_time;
                      }).length;
                      
                      const expectedFromPreReg = masterPreRegistrationsData.filter(visitor => {
                        const visitDate = new Date(visitor.visit_date);
                        return visitDate > new Date() && !visitor.check_in_time;
                      }).length;

                      const tomorrowExpected = expectedVisitors.filter(visitor => {
                        const visitDate = new Date(visitor.visit_date || visitor.created_at);
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        return visitDate.toDateString() === tomorrow.toDateString();
                      }).length;

                      if (expectedVisitors.length === 0) {
                        return (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📅</div>
                            <h4 style={{ color: '#333', marginBottom: '10px' }}>No Expected Visitors</h4>
                            <p>No visitors scheduled for future dates.</p>
                          </div>
                        );
                      }

                      return (
                        <div>
                          {/* Enhanced Statistics */}
                          <div style={{ 
                            marginBottom: '20px', 
                            padding: '15px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '8px',
                            border: '1px solid #e9ecef'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <h4 style={{ margin: 0, color: '#333' }}>📊 Expected Visitors Statistics</h4>
                              <span style={{ 
                                background: '#17a2b8', 
                                color: 'white', 
                                padding: '4px 12px', 
                                borderRadius: '12px', 
                                fontSize: '14px', 
                                fontWeight: 'bold' 
                              }}>
                                {expectedVisitors.length} Future Visits
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>{expectedFromRegular}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Walk-in Expected</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>{expectedFromPreReg}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Pre-registered</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fd7e14' }}>{tomorrowExpected}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Tomorrow</div>
                              </div>
                            </div>
                          </div>

                          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ margin: 0, color: '#666' }}>
                              Showing {Math.min(expectedVisitors.length, visitorsPerPage)} of {expectedVisitors.length} expected visitors
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button 
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #17a2b8',
                                  backgroundColor: currentPage === 1 ? '#f5f5f5' : '#17a2b8',
                                  color: currentPage === 1 ? '#999' : 'white',
                                  borderRadius: '4px',
                                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                ← Previous
                              </button>
                              <span style={{ fontSize: '14px', color: '#666' }}>
                                Page {currentPage} of {Math.ceil(expectedVisitors.length / visitorsPerPage)}
                              </span>
                              <button 
                                onClick={() => setCurrentPage(Math.min(Math.ceil(expectedVisitors.length / visitorsPerPage), currentPage + 1))}
                                disabled={currentPage === Math.ceil(expectedVisitors.length / visitorsPerPage)}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #17a2b8',
                                  backgroundColor: currentPage === Math.ceil(expectedVisitors.length / visitorsPerPage) ? '#f5f5f5' : '#17a2b8',
                                  color: currentPage === Math.ceil(expectedVisitors.length / visitorsPerPage) ? '#999' : 'white',
                                  borderRadius: '4px',
                                  cursor: currentPage === Math.ceil(expectedVisitors.length / visitorsPerPage) ? 'not-allowed' : 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                Next →
                              </button>
                            </div>
                          </div>
                          
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd', backgroundColor: 'white' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#17a2b8', color: 'white' }}>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Visitor Details</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Type</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Company</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Purpose</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Expected Date</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Days Until</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {expectedVisitors
                                  .slice((currentPage - 1) * visitorsPerPage, currentPage * visitorsPerPage)
                                  .map((visitor, index) => {
                                    const isBlacklisted = masterBlacklistedData.some(b => 
                                      b.name?.toLowerCase() === visitor.visitor_name?.toLowerCase() ||
                                      b.phone === visitor.visitor_phone ||
                                      b.email?.toLowerCase() === visitor.visitor_email?.toLowerCase()
                                    );
                                    const visitDate = new Date(visitor.visit_date || visitor.created_at);
                                    const today = new Date();
                                    const diffTime = visitDate - today;
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    
                                    return (
                                      <tr key={index} style={{ 
                                        borderBottom: '1px solid #eee',
                                        backgroundColor: isBlacklisted ? '#fff5f5' : (index % 2 === 0 ? '#f8f9fa' : 'white')
                                      }}>
                                        <td style={{ padding: '12px' }}>
                                          <div>
                                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                              {visitor.visitor_name}
                                              {isBlacklisted && (
                                                <span style={{
                                                  marginLeft: '8px',
                                                  padding: '2px 6px',
                                                  backgroundColor: '#dc3545',
                                                  color: 'white',
                                                  borderRadius: '10px',
                                                  fontSize: '10px',
                                                  fontWeight: 'bold'
                                                }}>
                                                  ⚠️ BLACKLISTED
                                                </span>
                                              )}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>{visitor.visitor_phone}</div>
                                            {visitor.visitor_email && (
                                              <div style={{ fontSize: '11px', color: '#999' }}>{visitor.visitor_email}</div>
                                            )}
                                          </div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                          <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            backgroundColor: visitor.id ? '#e3f2fd' : '#f3e5f5',
                                            color: visitor.id ? '#1976d2' : '#7b1fa2'
                                          }}>
                                            {visitor.id ? '🚶 Walk-in' : '📋 Pre-reg'}
                                          </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>{visitor.visitor_company || visitor.company || 'N/A'}</td>
                                        <td style={{ padding: '12px' }}>{visitor.purpose || visitor.reason || 'N/A'}</td>
                                        <td style={{ padding: '12px' }}>
                                          <div>
                                            <div style={{ fontWeight: 'bold' }}>
                                              {visitDate.toLocaleDateString()}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#666' }}>
                                              {visitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                          </div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                          <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            backgroundColor: diffDays === 1 ? '#fff3cd' : diffDays <= 7 ? '#d1ecf1' : '#e2e3e5',
                                            color: diffDays === 1 ? '#856404' : diffDays <= 7 ? '#0c5460' : '#6c757d'
                                          }}>
                                            {diffDays === 1 ? '📅 Tomorrow' : `${diffDays} days`}
                                          </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                          <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            backgroundColor: '#d1ecf1',
                                            color: '#0c5460'
                                          }}>
                                            📅 Expected
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
                
                <div className="modal-footer" style={{ 
                  padding: '15px', 
                  borderTop: '1px solid #ddd', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    📅 Visitors scheduled for future dates
                  </div>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowExpectedVisitorsModal(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Checked-Out Visitors Modal */}
          {showCheckedOutVisitorsModal && (
            <div className="modal-overlay" onClick={() => setShowCheckedOutVisitorsModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95%', maxHeight: '95%' }}>
                <div className="modal-header">
                  <h3>❌ Checked-Out Visitors</h3>
                  <button className="modal-close" onClick={() => setShowCheckedOutVisitorsModal(false)}>×</button>
                </div>
                
                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <p>Loading checked-out visitors...</p>
                    </div>
                  ) : (
                    (() => {
                      const checkedOutVisitors = [...masterVisitsData, ...masterPreRegistrationsData].filter(visitor => {
                        const isCheckedOut = visitor.check_in_time && visitor.check_out_time;
                        const isToday = new Date(visitor.check_out_time).toDateString() === new Date().toDateString();
                        return isCheckedOut && isToday;
                      });
                      
                      const checkedOutFromRegular = masterVisitsData.filter(visitor => 
                        visitor.check_in_time && visitor.check_out_time &&
                        new Date(visitor.check_out_time).toDateString() === new Date().toDateString()
                      ).length;
                      
                      const checkedOutFromPreReg = masterPreRegistrationsData.filter(visitor => 
                        visitor.check_in_time && visitor.check_out_time &&
                        new Date(visitor.check_out_time).toDateString() === new Date().toDateString()
                      ).length;

                      const averageVisitDuration = checkedOutVisitors.reduce((total, visitor) => {
                        const checkIn = new Date(visitor.check_in_time);
                        const checkOut = new Date(visitor.check_out_time);
                        const duration = (checkOut - checkIn) / (1000 * 60);
                        return total + duration;
                      }, 0) / (checkedOutVisitors.length || 1);

                      if (checkedOutVisitors.length === 0) {
                        return (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
                            <h4 style={{ color: '#333', marginBottom: '10px' }}>No Checked-Out Visitors</h4>
                            <p>No visitors have completed their visits today.</p>
                          </div>
                        );
                      }

                      return (
                        <div>
                          {/* Enhanced Statistics */}
                          <div style={{ 
                            marginBottom: '20px', 
                            padding: '15px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '8px',
                            border: '1px solid #e9ecef'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <h4 style={{ margin: 0, color: '#333' }}>📊 Completion Statistics</h4>
                              <span style={{ 
                                background: '#6c757d', 
                                color: 'white', 
                                padding: '4px 12px', 
                                borderRadius: '12px', 
                                fontSize: '14px', 
                                fontWeight: 'bold' 
                              }}>
                                {checkedOutVisitors.length} Completed Visits
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>{checkedOutFromRegular}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Walk-in Visitors</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>{checkedOutFromPreReg}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Pre-registered</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#17a2b8' }}>
                                  {Math.round(averageVisitDuration)}m
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Avg. Duration</div>
                              </div>
                            </div>
                          </div>

                          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ margin: 0, color: '#666' }}>
                              Showing {Math.min(checkedOutVisitors.length, visitorsPerPage)} of {checkedOutVisitors.length} checked-out visitors
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button 
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #6c757d',
                                  backgroundColor: currentPage === 1 ? '#f5f5f5' : '#6c757d',
                                  color: currentPage === 1 ? '#999' : 'white',
                                  borderRadius: '4px',
                                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                ← Previous
                              </button>
                              <span style={{ fontSize: '14px', color: '#666' }}>
                                Page {currentPage} of {Math.ceil(checkedOutVisitors.length / visitorsPerPage)}
                              </span>
                              <button 
                                onClick={() => setCurrentPage(Math.min(Math.ceil(checkedOutVisitors.length / visitorsPerPage), currentPage + 1))}
                                disabled={currentPage === Math.ceil(checkedOutVisitors.length / visitorsPerPage)}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #6c757d',
                                  backgroundColor: currentPage === Math.ceil(checkedOutVisitors.length / visitorsPerPage) ? '#f5f5f5' : '#6c757d',
                                  color: currentPage === Math.ceil(checkedOutVisitors.length / visitorsPerPage) ? '#999' : 'white',
                                  borderRadius: '4px',
                                  cursor: currentPage === Math.ceil(checkedOutVisitors.length / visitorsPerPage) ? 'not-allowed' : 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                Next →
                              </button>
                            </div>
                          </div>
                          
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd', backgroundColor: 'white' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#6c757d', color: 'white' }}>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Visitor Details</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Type</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Company</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Purpose</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Check-out Time</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Visit Duration</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {checkedOutVisitors
                                  .slice((currentPage - 1) * visitorsPerPage, currentPage * visitorsPerPage)
                                  .map((visitor, index) => {
                                    const isBlacklisted = masterBlacklistedData.some(b => 
                                      b.name?.toLowerCase() === visitor.visitor_name?.toLowerCase() ||
                                      b.phone === visitor.visitor_phone ||
                                      b.email?.toLowerCase() === visitor.visitor_email?.toLowerCase()
                                    );
                                    const checkInTime = new Date(visitor.check_in_time);
                                    const checkOutTime = new Date(visitor.check_out_time);
                                    const durationMinutes = Math.floor((checkOutTime - checkInTime) / (1000 * 60));
                                    const hours = Math.floor(durationMinutes / 60);
                                    const minutes = durationMinutes % 60;
                                    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                                    
                                    return (
                                      <tr key={index} style={{ 
                                        borderBottom: '1px solid #eee',
                                        backgroundColor: isBlacklisted ? '#fff5f5' : (index % 2 === 0 ? '#f8f9fa' : 'white')
                                      }}>
                                        <td style={{ padding: '12px' }}>
                                          <div>
                                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                              {visitor.visitor_name}
                                              {isBlacklisted && (
                                                <span style={{
                                                  marginLeft: '8px',
                                                  padding: '2px 6px',
                                                  backgroundColor: '#dc3545',
                                                  color: 'white',
                                                  borderRadius: '10px',
                                                  fontSize: '10px',
                                                  fontWeight: 'bold'
                                                }}>
                                                  ⚠️ BLACKLISTED
                                                </span>
                                              )}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>{visitor.visitor_phone}</div>
                                            {visitor.visitor_email && (
                                              <div style={{ fontSize: '11px', color: '#999' }}>{visitor.visitor_email}</div>
                                            )}
                                          </div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                          <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            backgroundColor: visitor.id ? '#e3f2fd' : '#f3e5f5',
                                            color: visitor.id ? '#1976d2' : '#7b1fa2'
                                          }}>
                                            {visitor.id ? '🚶 Walk-in' : '📋 Pre-reg'}
                                          </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>{visitor.visitor_company || visitor.company || 'N/A'}</td>
                                        <td style={{ padding: '12px' }}>{visitor.purpose || visitor.reason || 'N/A'}</td>
                                        <td style={{ padding: '12px' }}>
                                          <div>
                                            <div style={{ fontWeight: 'bold' }}>
                                              {checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#666' }}>
                                              {checkOutTime.toLocaleDateString()}
                                            </div>
                                          </div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                          <span style={{
                                            color: durationMinutes > 180 ? '#fd7e14' : durationMinutes > 60 ? '#ffc107' : '#28a745',
                                            fontWeight: 'bold',
                                            fontSize: '12px'
                                          }}>
                                            {durationText}
                                          </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                          <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            backgroundColor: '#d4edda',
                                            color: '#155724'
                                          }}>
                                            ✅ Completed
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
                
                <div className="modal-footer" style={{ 
                  padding: '15px', 
                  borderTop: '1px solid #ddd', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    ✅ Visitors who completed their visits today
                  </div>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowCheckedOutVisitorsModal(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Blacklisted Visitors Modal */}
          {showBlacklistedVisitorsModal && (
            <div className="modal-overlay" onClick={() => setShowBlacklistedVisitorsModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95%', maxHeight: '95%' }}>
                <div className="modal-header">
                  <h3>🚫 Blacklisted Visitors</h3>
                  <button className="modal-close" onClick={() => setShowBlacklistedVisitorsModal(false)}>×</button>
                </div>
                
                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <p>Loading blacklisted visitors...</p>
                    </div>
                  ) : (
                    (() => {
                      const blacklistedVisitors = masterBlacklistedData;
                      
                      // Get statistics about blacklisted visitors
                      const recentlyBlacklisted = blacklistedVisitors.filter(visitor => {
                        const createdDate = new Date(visitor.created_at || visitor.date_blacklisted);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return createdDate > weekAgo;
                      }).length;

                      const withReasons = blacklistedVisitors.filter(visitor => 
                        visitor.reason_for_blacklist || visitor.blacklist_reason || visitor.reason_to_blacklist
                      ).length;

                      if (blacklistedVisitors.length === 0) {
                        return (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
                            <h4 style={{ color: '#333', marginBottom: '10px' }}>No Blacklisted Visitors</h4>
                            <p>Your security status is clear.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="blacklisted-visitors-content">
                          {/* Security Alert Banner */}
                          <div style={{ 
                            backgroundColor: '#fff5f5', 
                            border: '2px solid #f5c6cb', 
                            borderRadius: '8px', 
                            padding: '15px', 
                            marginBottom: '20px' 
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <h4 style={{ color: '#721c24', margin: 0 }}>
                                ⚠️ Security Alert: {blacklistedVisitors.length} Blacklisted Visitor{blacklistedVisitors.length > 1 ? 's' : ''}
                              </h4>
                              <span style={{ 
                                background: '#dc3545', 
                                color: 'white', 
                                padding: '4px 12px', 
                                borderRadius: '12px', 
                                fontSize: '14px', 
                                fontWeight: 'bold' 
                              }}>
                                🚫 HIGH SECURITY
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #f5c6cb' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc3545' }}>{blacklistedVisitors.length}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Total Blacklisted</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #f5c6cb' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fd7e14' }}>{recentlyBlacklisted}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Recent (7 days)</div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #f5c6cb' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6c757d' }}>{withReasons}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>With Reasons</div>
                              </div>
                            </div>
                            <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
                              These visitors have been flagged and restricted from accessing the premises.
                            </p>
                          </div>

                          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ margin: 0, color: '#666' }}>
                              Showing {Math.min(blacklistedVisitors.length, visitorsPerPage)} of {blacklistedVisitors.length} blacklisted visitors
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button 
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #dc3545',
                                  backgroundColor: currentPage === 1 ? '#f5f5f5' : '#dc3545',
                                  color: currentPage === 1 ? '#999' : 'white',
                                  borderRadius: '4px',
                                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                ← Previous
                              </button>
                              <span style={{ fontSize: '14px', color: '#666' }}>
                                Page {currentPage} of {Math.ceil(blacklistedVisitors.length / visitorsPerPage)}
                              </span>
                              <button 
                                onClick={() => setCurrentPage(Math.min(Math.ceil(blacklistedVisitors.length / visitorsPerPage), currentPage + 1))}
                                disabled={currentPage === Math.ceil(blacklistedVisitors.length / visitorsPerPage)}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #dc3545',
                                  backgroundColor: currentPage === Math.ceil(blacklistedVisitors.length / visitorsPerPage) ? '#f5f5f5' : '#dc3545',
                                  color: currentPage === Math.ceil(blacklistedVisitors.length / visitorsPerPage) ? '#999' : 'white',
                                  borderRadius: '4px',
                                  cursor: currentPage === Math.ceil(blacklistedVisitors.length / visitorsPerPage) ? 'not-allowed' : 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                Next →
                              </button>
                            </div>
                          </div>

                          <div className="blacklisted-table-wrapper" style={{ overflowX: 'auto' }}>
                            <table className="blacklisted-visitors-table" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #ddd' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#dc3545', color: 'white' }}>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Photo</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Visitor Details</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Contact Info</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Host Met</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Last Visit</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Blacklist Reason</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {blacklistedVisitors
                                  .slice((currentPage - 1) * visitorsPerPage, currentPage * visitorsPerPage)
                                  .map((visitor, index) => (
                                  <tr key={visitor.visitor_id || visitor.id || index} style={{ 
                                    borderBottom: '1px solid #eee',
                                    backgroundColor: '#fff5f5'
                                  }}>
                                    <td style={{ padding: '12px' }}>
                                      {visitor.visitorPhoto || visitor.photo || visitor.picture ? (
                                        <img 
                                          src={visitor.visitorPhoto || visitor.photo || visitor.picture} 
                                          alt="Visitor" 
                                          style={{ 
                                            width: '50px', 
                                            height: '50px', 
                                            borderRadius: '50%', 
                                            objectFit: 'cover',
                                            border: '3px solid #dc3545'
                                          }} 
                                        />
                                      ) : (
                                        <div style={{ 
                                          width: '50px', 
                                          height: '50px', 
                                          borderRadius: '50%', 
                                          backgroundColor: '#fff5f5', 
                                          border: '3px solid #dc3545',
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center',
                                          fontSize: '20px'
                                        }}>
                                          👤
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                      <div>
                                        <div style={{ fontWeight: 'bold', color: '#dc3545', marginBottom: '4px' }}>
                                          {visitor.visitor_name || visitor.visitorName || visitor.person_name || visitor.name || 'N/A'}
                                        </div>
                                        <div style={{ 
                                          fontSize: '11px', 
                                          backgroundColor: '#dc3545', 
                                          color: 'white', 
                                          padding: '2px 6px', 
                                          borderRadius: '10px', 
                                          display: 'inline-block'
                                        }}>
                                          🚫 BLACKLISTED
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                      <div>
                                        <div style={{ fontSize: '13px', marginBottom: '2px' }}>
                                          📧 {visitor.visitor_email || visitor.visitorEmail || visitor.email || 'N/A'}
                                        </div>
                                        <div style={{ fontSize: '13px' }}>
                                          📞 {visitor.visitor_phone || visitor.visitorPhone || visitor.phone || 'N/A'}
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                      {visitor.host_name || visitor.hostName || visitor.person_to_meet || 'N/A'}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                      <div>
                                        {visitor.visit_date || visitor.check_in_time ? (
                                          <>
                                            <div style={{ fontWeight: 'bold' }}>
                                              {new Date(visitor.visit_date || visitor.check_in_time).toLocaleDateString()}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#666' }}>
                                              {new Date(visitor.visit_date || visitor.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                          </>
                                        ) : (
                                          'N/A'
                                        )}
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px', maxWidth: '250px' }}>
                                      <div style={{ 
                                        fontSize: '12px', 
                                        color: '#dc3545',
                                        backgroundColor: '#fff5f5',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '1px solid #f5c6cb',
                                        wordWrap: 'break-word'
                                      }}>
                                        {visitor.blacklist_reason || visitor.reason_for_blacklist || visitor.reason_to_blacklist || 'No reason specified'}
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                      <button
                                        onClick={() => {
                                          if (visitor.visitor_id) {
                                            handleRemoveFromBlacklist(visitor.visitor_id);
                                            setShowBlacklistedVisitorsModal(false);
                                          } else {
                                            setError('Cannot unblacklist: Visitor ID not found');
                                          }
                                        }}
                                        className="unblacklist-btn"
                                        disabled={!visitor.visitor_id}
                                        title={!visitor.visitor_id ? 'Visitor ID not available' : `Remove ${visitor.email || visitor.visitor_email || 'this visitor'} from blacklist`}
                                        style={{
                                          backgroundColor: '#28a745',
                                          color: 'white',
                                          border: 'none',
                                          padding: '6px 12px',
                                          borderRadius: '4px',
                                          cursor: visitor.visitor_id ? 'pointer' : 'not-allowed',
                                          fontSize: '12px',
                                          opacity: visitor.visitor_id ? 1 : 0.6,
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        ✅ Remove
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
                
                <div className="modal-footer" style={{ 
                  padding: '15px', 
                  borderTop: '1px solid #ddd', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: '#fff5f5'
                }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    🚫 Restricted visitors requiring security clearance
                  </div>
                  <button 
                    onClick={() => setShowBlacklistedVisitorsModal(false)}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overstay Incidents Modal */}
          {showOverstayModal && (
            <div className="modal-overlay" onClick={() => setShowOverstayModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '90%' }}>
                <div className="modal-header">
                  <h3>⏰ Overstay Incidents</h3>
                  <button className="modal-close" onClick={() => setShowOverstayModal(false)}>×</button>
                </div>
                
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {overstayVisitors.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      <p>✅ No overstay incidents found.</p>
                      <p>All visitors are following proper visit duration guidelines.</p>
                    </div>
                  ) : (
                    <div className="overstay-visitors-content">
                      <div className="overstay-summary" style={{ 
                        backgroundColor: '#fff3cd', 
                        border: '1px solid #ffeaa7', 
                        borderRadius: '8px', 
                        padding: '15px', 
                        marginBottom: '20px' 
                      }}>
                        <h4 style={{ color: '#856404', margin: '0 0 10px 0' }}>
                          ⚠️ Security Alert: {overstayVisitors.length} Overstay Incident{overstayVisitors.length > 1 ? 's' : ''}
                        </h4>
                        <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                          These visitors have been on the premises for more than 8 hours without checking out.
                        </p>
                      </div>

                      <div className="overstay-table-wrapper">
                        <table className="overstay-visitors-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Photo</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Visitor Name</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Host</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Check-In Time</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Duration</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {overstayVisitors.map((visitor, index) => {
                              const checkInTime = new Date(visitor.check_in_time);
                              const now = new Date();
                              const duration = Math.floor((now - checkInTime) / (1000 * 60 * 60)); // hours
                              
                              return (
                                <tr key={visitor.id || index} style={{ borderBottom: '1px solid #eee' }}>
                                  <td style={{ padding: '12px' }}>
                                    {visitor.visitorPhoto || visitor.photo ? (
                                      <img 
                                        src={visitor.visitorPhoto || visitor.photo} 
                                        alt="Visitor" 
                                        style={{ 
                                          width: '40px', 
                                          height: '40px', 
                                          borderRadius: '50%', 
                                          objectFit: 'cover',
                                          border: '2px solid #ffc107'
                                        }} 
                                      />
                                    ) : (
                                      <div style={{ 
                                        width: '40px', 
                                        height: '40px', 
                                        borderRadius: '50%', 
                                        backgroundColor: '#fff3cd', 
                                        border: '2px solid #ffc107',
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontSize: '18px'
                                      }}>
                                        👤
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    <div style={{ fontWeight: 'bold', color: '#856404' }}>
                                      {visitor.visitorName || visitor.visitor_name || 'N/A'}
                                    </div>
                                    <div style={{ 
                                      fontSize: '12px', 
                                      backgroundColor: '#fff3cd', 
                                      color: '#856404', 
                                      padding: '2px 6px', 
                                      borderRadius: '10px', 
                                      display: 'inline-block', 
                                      marginTop: '4px' 
                                    }}>
                                      ⏰ OVERSTAY
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    {visitor.visitorEmail || visitor.visitor_email || 'N/A'}
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    {visitor.hostName || visitor.host_name || 'N/A'}
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    {checkInTime.toLocaleString()}
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    <div style={{ 
                                      fontSize: '14px', 
                                      fontWeight: 'bold',
                                      color: duration > 12 ? '#dc3545' : '#ffc107'
                                    }}>
                                      {duration} hours
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                      {duration > 12 ? 'Critical' : 'Warning'}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    <div style={{ 
                                      fontSize: '13px', 
                                      color: '#856404',
                                      backgroundColor: '#fff3cd',
                                      padding: '6px 8px',
                                      borderRadius: '4px',
                                      border: '1px solid #ffeaa7',
                                      textAlign: 'center'
                                    }}>
                                      Still Checked In
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="modal-footer" style={{ 
                  padding: '15px', 
                  borderTop: '1px solid #eee', 
                  backgroundColor: '#f9f9f9', 
                  textAlign: 'right' 
                }}>
                  <button 
                    onClick={() => setShowOverstayModal(false)}
                    style={{
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Incomplete Checkouts Modal */}
          {showIncompleteCheckoutsModal && (
            <div className="modal-overlay" onClick={() => setShowIncompleteCheckoutsModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '90%' }}>
                <div className="modal-header">
                  <h3>🚪 Incomplete Checkouts</h3>
                  <button className="modal-close" onClick={() => setShowIncompleteCheckoutsModal(false)}>×</button>
                </div>
                
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {incompleteCheckoutVisitors.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      <p>✅ No incomplete checkouts found.</p>
                      <p>All visitors have properly checked out.</p>
                    </div>
                  ) : (
                    <div className="incomplete-checkout-visitors-content">
                      <div className="incomplete-checkout-summary" style={{ 
                        backgroundColor: '#e1f5fe', 
                        border: '1px solid #81d4fa', 
                        borderRadius: '8px', 
                        padding: '15px', 
                        marginBottom: '20px' 
                      }}>
                        <h4 style={{ color: '#0277bd', margin: '0 0 10px 0' }}>
                          ℹ️ System Alert: {incompleteCheckoutVisitors.length} Incomplete Checkout{incompleteCheckoutVisitors.length > 1 ? 's' : ''}
                        </h4>
                        <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                          These visitors checked in more than 24 hours ago but never checked out.
                        </p>
                      </div>

                      <div className="incomplete-checkout-table-wrapper">
                        <table className="incomplete-checkout-visitors-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Photo</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Visitor Name</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Host</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Check-In Time</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Days Ago</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {incompleteCheckoutVisitors.map((visitor, index) => {
                              const checkInTime = new Date(visitor.check_in_time);
                              const now = new Date();
                              const daysAgo = Math.floor((now - checkInTime) / (1000 * 60 * 60 * 24));
                              
                              return (
                                <tr key={visitor.id || index} style={{ borderBottom: '1px solid #eee' }}>
                                  <td style={{ padding: '12px' }}>
                                    {visitor.visitorPhoto || visitor.photo ? (
                                      <img 
                                        src={visitor.visitorPhoto || visitor.photo} 
                                        alt="Visitor" 
                                        style={{ 
                                          width: '40px', 
                                          height: '40px', 
                                          borderRadius: '50%', 
                                          objectFit: 'cover',
                                          border: '2px solid #03a9f4'
                                        }} 
                                      />
                                    ) : (
                                      <div style={{ 
                                        width: '40px', 
                                        height: '40px', 
                                        borderRadius: '50%', 
                                        backgroundColor: '#e1f5fe', 
                                        border: '2px solid #03a9f4',
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontSize: '18px'
                                      }}>
                                        👤
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    <div style={{ fontWeight: 'bold', color: '#0277bd' }}>
                                      {visitor.visitorName || visitor.visitor_name || 'N/A'}
                                    </div>
                                    <div style={{ 
                                      fontSize: '12px', 
                                      backgroundColor: '#e1f5fe', 
                                      color: '#0277bd', 
                                      padding: '2px 6px', 
                                      borderRadius: '10px', 
                                      display: 'inline-block', 
                                      marginTop: '4px' 
                                    }}>
                                      🚪 NO CHECKOUT
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    {visitor.visitorEmail || visitor.visitor_email || 'N/A'}
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    {visitor.hostName || visitor.host_name || 'N/A'}
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    {checkInTime.toLocaleString()}
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    <div style={{ 
                                      fontSize: '14px', 
                                      fontWeight: 'bold',
                                      color: daysAgo > 7 ? '#dc3545' : daysAgo > 3 ? '#ffc107' : '#03a9f4'
                                    }}>
                                      {daysAgo} day{daysAgo > 1 ? 's' : ''}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                      {daysAgo > 7 ? 'Critical' : daysAgo > 3 ? 'High' : 'Medium'}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    <div style={{ 
                                      fontSize: '13px', 
                                      color: '#0277bd',
                                      backgroundColor: '#e1f5fe',
                                      padding: '6px 8px',
                                      borderRadius: '4px',
                                      border: '1px solid #81d4fa',
                                      textAlign: 'center'
                                    }}>
                                      Missing Checkout
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="modal-footer" style={{ 
                  padding: '15px', 
                  borderTop: '1px solid #eee', 
                  backgroundColor: '#f9f9f9', 
                  textAlign: 'right' 
                }}>
                  <button 
                    onClick={() => setShowIncompleteCheckoutsModal(false)}
                    style={{
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* System Administration Section */}
          {activeSection === 'system-admin' && (
            <div className="system-admin-page">
              <div className="system-admin-tabs">
                <button 
                  className={`tab-btn ${systemAdminActiveTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setSystemAdminActiveTab('settings')}
                >
                  ⚙️ Settings
                </button>
                <button 
                  className={`tab-btn ${systemAdminActiveTab === 'users' ? 'active' : ''}`}
                  onClick={() => setSystemAdminActiveTab('users')}
                >
                  👥 Users
                </button>
                <button 
                  className={`tab-btn ${systemAdminActiveTab === 'audit' ? 'active' : ''}`}
                  onClick={() => setSystemAdminActiveTab('audit')}
                >
                  📋 Audit
                </button>
                <button 
                  className={`tab-btn ${systemAdminActiveTab === 'backup' ? 'active' : ''}`}
                  onClick={() => setSystemAdminActiveTab('backup')}
                >
                  💾 Backup
                </button>
                <button 
                  className={`tab-btn ${systemAdminActiveTab === 'maintenance' ? 'active' : ''}`}
                  onClick={() => setSystemAdminActiveTab('maintenance')}
                >
                  🔧 Maintenance
                </button>
              </div>

              <div className="system-admin-content">
                {/* System Settings Tab */}
                {systemAdminActiveTab === 'settings' && (
                  <div className="settings-tab">
                    <h2>System Settings</h2>
                    <form onSubmit={handleSettingsSubmit} className="settings-form">
                      <div className="settings-section">
                        <h3>Company Information</h3>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Company Name</label>
                            <input
                              type="text"
                              value={systemSettings.companyName || ''}
                              onChange={(e) => setSystemSettings(prev => ({
                                ...prev,
                                companyName: e.target.value
                              }))}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Company Email</label>
                            <input
                              type="email"
                              value={systemSettings.companyEmail || ''}
                              onChange={(e) => setSystemSettings(prev => ({
                                ...prev,
                                companyEmail: e.target.value
                              }))}
                              required
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Company Phone</label>
                            <input
                              type="tel"
                              value={systemSettings.companyPhone || ''}
                              onChange={(e) => setSystemSettings(prev => ({
                                ...prev,
                                companyPhone: e.target.value
                              }))}
                            />
                          </div>
                          <div className="form-group">
                            <label>Company Address</label>
                            <textarea
                              value={systemSettings.companyAddress || ''}
                              onChange={(e) => setSystemSettings(prev => ({
                                ...prev,
                                companyAddress: e.target.value
                              }))}
                              rows="3"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="settings-section">
                        <h3>Visit Management</h3>
                        <div className="form-row">
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={systemSettings.allowPreregistration || false}
                                onChange={(e) => setSystemSettings(prev => ({
                                  ...prev,
                                  allowPreregistration: e.target.checked
                                }))}
                              />
                              Allow Pre-registration
                            </label>
                          </div>
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={systemSettings.requireApproval || false}
                                onChange={(e) => setSystemSettings(prev => ({
                                  ...prev,
                                  requireApproval: e.target.checked
                                }))}
                              />
                              Require Host Approval
                            </label>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Maximum Visitor Duration (hours)</label>
                          <input
                            type="number"
                            min="1"
                            max="24"
                            value={systemSettings.maxVisitorDuration || 8}
                            onChange={(e) => setSystemSettings(prev => ({
                              ...prev,
                              maxVisitorDuration: parseInt(e.target.value)
                            }))}
                          />
                        </div>
                      </div>

                      <div className="settings-section">
                        <h3>Working Hours</h3>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Start Time</label>
                            <input
                              type="time"
                              value={systemSettings.workingHours?.start || '09:00'}
                              onChange={(e) => setSystemSettings(prev => ({
                                ...prev,
                                workingHours: {
                                  ...prev.workingHours,
                                  start: e.target.value
                                }
                              }))}
                            />
                          </div>
                          <div className="form-group">
                            <label>End Time</label>
                            <input
                              type="time"
                              value={systemSettings.workingHours?.end || '18:00'}
                              onChange={(e) => setSystemSettings(prev => ({
                                ...prev,
                                workingHours: {
                                  ...prev.workingHours,
                                  end: e.target.value
                                }
                              }))}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Working Days</label>
                          <div className="checkbox-group">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                              <label key={day}>
                                <input
                                  type="checkbox"
                                  checked={systemSettings.workingDays?.includes(day) || false}
                                  onChange={(e) => {
                                    const currentWorkingDays = systemSettings.workingDays || [];
                                    const workingDays = e.target.checked
                                      ? [...currentWorkingDays, day]
                                      : currentWorkingDays.filter(d => d !== day);
                                    setSystemSettings(prev => ({
                                      ...prev,
                                      workingDays
                                    }));
                                  }}
                                />
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="settings-section">
                        <h3>Notification Settings</h3>
                        <div className="form-row">
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={systemSettings.notificationSettings?.emailNotifications || false}
                                onChange={(e) => setSystemSettings(prev => ({
                                  ...prev,
                                  notificationSettings: {
                                    ...prev.notificationSettings,
                                    emailNotifications: e.target.checked
                                  }
                                }))}
                              />
                              Email Notifications
                            </label>
                          </div>
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={systemSettings.notificationSettings?.smsNotifications || false}
                                onChange={(e) => setSystemSettings(prev => ({
                                  ...prev,
                                  notificationSettings: {
                                    ...prev.notificationSettings,
                                    smsNotifications: e.target.checked
                                  }
                                }))}
                              />
                              SMS Notifications
                            </label>
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={systemSettings.notificationSettings?.hostNotification || false}
                                onChange={(e) => setSystemSettings(prev => ({
                                  ...prev,
                                  notificationSettings: {
                                    ...prev.notificationSettings,
                                    hostNotification: e.target.checked
                                  }
                                }))}
                              />
                              Notify Hosts
                            </label>
                          </div>
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={systemSettings.notificationSettings?.adminNotification || false}
                                onChange={(e) => setSystemSettings(prev => ({
                                  ...prev,
                                  notificationSettings: {
                                    ...prev.notificationSettings,
                                    adminNotification: e.target.checked
                                  }
                                }))}
                              />
                              Notify Admins
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="settings-section">
                        <h3>Security & Data</h3>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Security Level</label>
                            <select
                              value={systemSettings.securityLevel || 'medium'}
                              onChange={(e) => setSystemSettings(prev => ({
                                ...prev,
                                securityLevel: e.target.value
                              }))}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Data Retention (days)</label>
                            <input
                              type="number"
                              min="30"
                              max="3650"
                              value={systemSettings.dataRetentionDays || 365}
                              onChange={(e) => setSystemSettings(prev => ({
                                ...prev,
                                dataRetentionDays: parseInt(e.target.value)
                              }))}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Backup Frequency</label>
                            <select
                              value={systemSettings.backupFrequency || 'daily'}
                              onChange={(e) => setSystemSettings(prev => ({
                                ...prev,
                                backupFrequency: e.target.value
                              }))}
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={systemSettings.maintenanceMode || false}
                                onChange={(e) => setSystemSettings(prev => ({
                                  ...prev,
                                  maintenanceMode: e.target.checked
                                }))}
                              />
                              Maintenance Mode
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="form-actions">
                        <button type="submit" disabled={loading} className="save-btn">
                          {loading ? 'Saving...' : 'Save Settings'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* User Management Tab */}
                {systemAdminActiveTab === 'users' && (
                  <div className="users-tab">
                    <h2>User Management</h2>
                    
                    <div className="user-form-section">
                      <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
                      <form onSubmit={handleUserSubmit} className="user-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label>Name</label>
                            <input
                              type="text"
                              value={newAdminUser.name}
                              onChange={(e) => setNewAdminUser(prev => ({
                                ...prev,
                                name: e.target.value
                              }))}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Email</label>
                            <input
                              type="email"
                              value={newAdminUser.email}
                              onChange={(e) => setNewAdminUser(prev => ({
                                ...prev,
                                email: e.target.value
                              }))}
                              required
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Password</label>
                            <input
                              type="password"
                              value={newAdminUser.password}
                              onChange={(e) => setNewAdminUser(prev => ({
                                ...prev,
                                password: e.target.value
                              }))}
                              required={!editingUser}
                              placeholder={editingUser ? 'Leave blank to keep current password' : ''}
                            />
                          </div>
                          <div className="form-group">
                            <label>Phone</label>
                            <input
                              type="tel"
                              value={newAdminUser.phone}
                              onChange={(e) => setNewAdminUser(prev => ({
                                ...prev,
                                phone: e.target.value
                              }))}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Role</label>
                            <select
                              value={newAdminUser.role}
                              onChange={(e) => setNewAdminUser(prev => ({
                                ...prev,
                                role: e.target.value
                              }))}
                              required
                            >
                              <option value="host">Host</option>
                              <option value="admin">Admin</option>
                              {/* <option value="security">Security</option>
                              <option value="receptionist">Receptionist</option> */}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Department</label>
                            <input
                              type="text"
                              value={newAdminUser.department}
                              onChange={(e) => setNewAdminUser(prev => ({
                                ...prev,
                                department: e.target.value
                              }))}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={newAdminUser.isActive}
                              onChange={(e) => setNewAdminUser(prev => ({
                                ...prev,
                                isActive: e.target.checked
                              }))}
                            />
                            Active User
                          </label>
                        </div>
                        <div className="form-actions">
                          <button type="submit" disabled={loading} className="save-btn">
                            {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                          </button>
                          {editingUser && (
                            <button 
                              type="button" 
                              onClick={() => {
                                setEditingUser(null);
                                setNewAdminUser({
                                  name: '',
                                  email: '',
                                  password: '',
                                  role: 'host',
                                  department: '',
                                  phone: '',
                                  isActive: true
                                });
                              }}
                              className="cancel-btn"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    <div className="users-list">
                      <h3>Existing Users</h3>
                      <div className="users-table-container">
                        <table>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Role</th>
                              <th>Department</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {systemUsers.map(user => (
                              <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                  <span className={`role-badge ${user.role}`}>
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                  </span>
                                </td>
                                <td>{user.department || '-'}</td>
                                <td>
                                  <span className={`status-badge ${user.is_active !== false ? 'active' : 'inactive'}`}>
                                    {user.is_active !== false ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td>
                                  <div className="user-actions">
                                    <button onClick={() => handleEditUser(user)} className="edit-btn">
                                      Edit
                                    </button>
                                    <button onClick={() => handleDeleteUser(user.id)} className="delete-btn">
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Logs Tab */}
                {systemAdminActiveTab === 'audit' && (
                  <div className="audit-tab">
                    <h2>Audit Logs</h2>
                    
                    <div className="audit-filters">
                      <div className="filter-row">
                        <div className="filter-group">
                          <label>Start Date</label>
                          <input
                            type="date"
                            name="startDate"
                            value={auditFilters.startDate}
                            onChange={handleAuditFilterChange}
                          />
                        </div>
                        <div className="filter-group">
                          <label>End Date</label>
                          <input
                            type="date"
                            name="endDate"
                            value={auditFilters.endDate}
                            onChange={handleAuditFilterChange}
                          />
                        </div>
                        <div className="filter-group">
                          <label>Action</label>
                          <select
                            name="action"
                            value={auditFilters.action}
                            onChange={handleAuditFilterChange}
                          >
                            <option value="">All Actions</option>
                            <option value="login">Login</option>
                            <option value="logout">Logout</option>
                            <option value="user_created">User Created</option>
                            <option value="user_updated">User Updated</option>
                            <option value="user_deleted">User Deleted</option>
                            <option value="settings_updated">Settings Updated</option>
                            <option value="backup_created">Backup Created</option>
                            <option value="backup_restored">Backup Restored</option>
                          </select>
                        </div>
                        <div className="filter-group">
                          <label>Username</label>
                          <input
                            type="text"
                            name="username"
                            value={auditFilters.username}
                            onChange={handleAuditFilterChange}
                            placeholder="Filter by username"
                          />
                        </div>
                        <div className="filter-actions">
                          <button onClick={fetchAuditLogs} className="filter-btn">
                            Apply Filters
                          </button>
                          <button 
                            onClick={() => {
                              setAuditFilters({
                                startDate: '',
                                endDate: '',
                                action: '',
                                username: ''
                              });
                              fetchAuditLogs();
                            }}
                            className="clear-btn"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="audit-logs">
                      <div className="audit-table-container">
                        <table>
                          <thead>
                            <tr>
                              <th>Timestamp</th>
                              <th>User</th>
                              <th>Action</th>
                              <th>Details</th>
                              <th>IP Address</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditLogs.map(log => (
                              <tr key={log.id}>
                                <td>{new Date(log.timestamp).toLocaleString()}</td>
                                <td>{log.username}</td>
                                <td>
                                  <span className={`action-badge ${log.action.replace('_', '-')}`}>
                                    {log.action.replace('_', ' ').toUpperCase()}
                                  </span>
                                </td>
                                <td>{log.details}</td>
                                <td>{log.ipAddress}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Backup & Restore Tab */}
                {systemAdminActiveTab === 'backup' && (
                  <div className="backup-tab">
                    <h2>Backup & Restore</h2>
                    
                    <div className="backup-actions">
                      <div className="backup-create">
                        <h3>Create Backup</h3>
                        <p>Create a full system backup including all visitor data, settings, and user information.</p>
                        <button onClick={handleCreateBackup} disabled={loading} className="backup-btn">
                          {loading ? 'Creating Backup...' : 'Create Backup'}
                        </button>
                        
                        {backupProgress > 0 && (
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${backupProgress}%` }}
                            >
                              {backupProgress}%
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="data-export">
                        <h3>Data Export/Import</h3>
                        <p>Export or import system data in JSON format.</p>
                        <div className="export-import-actions">
                          <button onClick={handleExportData} className="export-btn">
                            Export Data
                          </button>
                          <label className="import-btn">
                            Import Data
                            <input
                              type="file"
                              accept=".json"
                              onChange={handleImportData}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="backups-list">
                      <h3>Available Backups</h3>
                      <div className="backups-table-container">
                        <table>
                          <thead>
                            <tr>
                              <th>Date Created</th>
                              <th>Size</th>
                              <th>Type</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {backups.map(backup => (
                              <tr key={backup.id}>
                                <td>{new Date(backup.createdAt).toLocaleString()}</td>
                                <td>{formatFileSize(backup.size)}</td>
                                <td>
                                  <span className="backup-type">{backup.type}</span>
                                </td>
                                <td>
                                  <span className={`backup-status ${backup.status}`}>
                                    {backup.status}
                                  </span>
                                </td>
                                <td>
                                  <div className="backup-actions">
                                    <button onClick={() => handleRestoreBackup(backup.id)} className="restore-btn">
                                      Restore
                                    </button>
                                    <a href={backup.downloadUrl} className="download-btn">
                                      Download
                                    </a>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Maintenance Tab */}
                {systemAdminActiveTab === 'maintenance' && (
                  <div className="maintenance-tab">
                    <h2>System Maintenance</h2>
                    
                    <div className="maintenance-grid">
                      <div className="maintenance-card">
                        <h3>Database Cleanup</h3>
                        <p>Remove old visitor records and optimize database performance.</p>
                        <button className="maintenance-action-btn">
                          Run Database Cleanup
                        </button>
                      </div>

                      <div className="maintenance-card">
                        <h3>Clear Cache</h3>
                        <p>Clear system cache to improve performance and resolve issues.</p>
                        <button className="maintenance-action-btn">
                          Clear System Cache
                        </button>
                      </div>

                      <div className="maintenance-card">
                        <h3>System Diagnostics</h3>
                        <p>Run comprehensive system health check and diagnostics.</p>
                        <button className="maintenance-action-btn">
                          Run Diagnostics
                        </button>
                      </div>

                      <div className="maintenance-card">
                        <h3>Update Check</h3>
                        <p>Check for system updates and security patches.</p>
                        <button className="maintenance-action-btn">
                          Check for Updates
                        </button>
                      </div>

                      <div className="maintenance-card">
                        <h3>Log Rotation</h3>
                        <p>Archive old log files and rotate current logs.</p>
                        <button className="maintenance-action-btn">
                          Rotate Logs
                        </button>
                      </div>

                      <div className="maintenance-card">
                        <h3>Performance Optimization</h3>
                        <p>Optimize database indexes and system performance.</p>
                        <button className="maintenance-action-btn">
                          Optimize Performance
                        </button>
                      </div>
                    </div>

                    <div className="system-info">
                      <h3>System Information</h3>
                      <div className="info-grid">
                        <div className="info-item">
                          <label>System Version:</label>
                          <span>v2.1.0</span>
                        </div>
                        <div className="info-item">
                          <label>Database Version:</label>
                          <span>MySQL 8.0.28</span>
                        </div>
                        <div className="info-item">
                          <label>Server Uptime:</label>
                          <span>15 days, 4 hours</span>
                        </div>
                        <div className="info-item">
                          <label>Memory Usage:</label>
                          <span>2.1 GB / 8 GB</span>
                        </div>
                        <div className="info-item">
                          <label>Disk Usage:</label>
                          <span>45 GB / 100 GB</span>
                        </div>
                        <div className="info-item">
                          <label>Active Sessions:</label>
                          <span>12</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QR Code Modal - Enhanced Design */}
          {showQRModal && selectedVisitor && (
            <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
              <div className="modal-content qr-modal-enhanced" onClick={(e) => e.stopPropagation()}>
                <div className="qr-modal-header">
                  <div className="header-content">
                    <div className="qr-icon">📱</div>
                    <div className="header-text">
                      <h2>QR Code Access</h2>
                      <p>Scan to check-in instantly</p>
                    </div>
                  </div>
                  <button onClick={() => setShowQRModal(false)} className="close-btn-enhanced">
                    ×
                  </button>
                </div>

                <div className="qr-modal-body">
                  {/* Visitor Card */}
                  <div className="visitor-card">
                    <div className="visitor-avatar">
                      <span>{(selectedVisitor.visitor_name || selectedVisitor.visitorName || 'V').charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="visitor-details">
                      <h3>{selectedVisitor.visitor_name || selectedVisitor.visitorName}</h3>
                      <div className="visitor-meta">
                        <span className="meta-item">
                          <i>🏢</i> {selectedVisitor.visitor_company || 'N/A'}
                        </span>
                        <span className="meta-item">
                          <i>📅</i> {selectedVisitor.visit_date ? new Date(selectedVisitor.visit_date).toLocaleDateString() : 'Invalid Date'}
                        </span>
                        <span className="meta-item">
                          <i>⏰</i> {selectedVisitor.visit_time || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="qr-code-section">
                    <div className="qr-code-wrapper">
                      <div className="qr-code-frame">
                        <QRCodeSVG 
                          className="qr-code-svg"
                          value={selectedVisitor.qr_code || JSON.stringify({
                            visitorId: selectedVisitor.visitor_id || selectedVisitor.id,
                            visitorName: selectedVisitor.visitor_name || selectedVisitor.visitorName,
                            visitDate: selectedVisitor.visit_date || selectedVisitor.check_in_time
                          })} 
                          size={260}
                          bgColor="#ffffff"
                          fgColor="#1a365d"
                          level="H"
                          includeMargin={true}
                        />
                        <div className="qr-overlay-corners">
                          <div className="corner top-left"></div>
                          <div className="corner top-right"></div>
                          <div className="corner bottom-left"></div>
                          <div className="corner bottom-right"></div>
                        </div>
                      </div>
                      <div className="qr-instructions">
                        <p>📲 Point your camera at the QR code to scan</p>
                        <div className="qr-code-id">ID: {selectedVisitor.visitor_id || selectedVisitor.id}</div>
                      </div>
                    </div>
                  </div>

                  {/* Visit Information */}
                  <div className="visit-info-card">
                    <h4>� Visit Details</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Host:</span>
                        <span className="value">{selectedVisitor.host_name || selectedVisitor.hostName || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Purpose:</span>
                        <span className="value">{selectedVisitor.purpose || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Status:</span>
                        <span className={`value status ${selectedVisitor.status || 'pending'}`}>
                          {selectedVisitor.status || 'Pending'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Visitors:</span>
                        <span className="value">{selectedVisitor.number_of_visitors || 1}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="qr-modal-actions">
                  <div className="primary-actions">
                    <button onClick={() => shareQRCode('download')} className="action-btn primary">
                      <span className="btn-icon">💾</span>
                      <span className="btn-text">{loading ? 'Downloading...' : 'Download QR'}</span>
                    </button>
                    <button onClick={() => shareQRCode('copy')} className="action-btn secondary">
                      <span className="btn-icon">📋</span>
                      <span className="btn-text">Copy Code</span>
                    </button>
                  </div>
                  
                  <div className="share-actions">
                    <span className="share-label">Share via:</span>
                    <div className="share-buttons">
                      <button onClick={() => shareQRCode('email')} className="share-btn-mini" title="Email">
                        �
                      </button>
                      <button onClick={() => shareQRCode('sms')} className="share-btn-mini" title="SMS">
                        💬
                      </button>
                      <button onClick={() => shareQRCode('whatsapp')} className="share-btn-mini" title="WhatsApp">
                        📱
                      </button>
                      <button onClick={() => window.print()} className="share-btn-mini" title="Print">
                        🖨️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Badge Modal */}
          {showBadgeModal && badgeData && (
            <div className="modal-overlay" onClick={() => setShowBadgeModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Visitor Badge Preview</h3>
                  <button onClick={() => setShowBadgeModal(false)} className="close-btn">
                    ×
                  </button>
                </div>
                <div className="badge-preview" dangerouslySetInnerHTML={{ __html: badgeData.html }} />
                <div className="modal-actions">
                  <button onClick={printBadge} className="print-btn">
                    🖨️ Print Badge
                  </button>
                  <button onClick={() => setShowBadgeModal(false)} className="cancel-btn">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Incidents Modal */}
          {showSecurityIncidentsModal && (
            <div className="modal-overlay" onClick={() => setShowSecurityIncidentsModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95%', maxHeight: '90%' }}>
                <div className="modal-header">
                  <h3>🔒 Security Incidents Report</h3>
                  <button className="modal-close" onClick={() => setShowSecurityIncidentsModal(false)}>×</button>
                </div>
                
                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  {securityIncidentsData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                      <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
                      <h4>No Security Incidents Found</h4>
                      <p>Your facility is currently secure with no active security incidents.</p>
                    </div>
                  ) : (
                    <div className="security-incidents-content">
                      <div className="incidents-summary" style={{ 
                        backgroundColor: '#fff3cd', 
                        border: '1px solid #ffeaa7', 
                        borderRadius: '8px', 
                        padding: '15px', 
                        marginBottom: '20px' 
                      }}>
                        <h4 style={{ color: '#856404', margin: '0 0 10px 0' }}>Security Summary</h4>
                        <div className="summary-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                              {securityIncidentsData.filter(incident => incident.severity === 'High').length}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>High Priority</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fd7e14' }}>
                              {securityIncidentsData.filter(incident => incident.severity === 'Medium').length}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Medium Priority</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                              {securityIncidentsData.filter(incident => incident.severity === 'Low').length}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Low Priority</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                              {securityIncidentsData.length}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Total Incidents</div>
                          </div>
                        </div>
                      </div>

                      <div className="incidents-list">
                        {getPaginatedData(securityIncidentsData, currentPage, visitorsPerPage).map((incident, index) => (
                          <div key={incident.id || index} className="incident-card" style={{ 
                            border: '1px solid #e9ecef', 
                            borderRadius: '8px', 
                            padding: '15px', 
                            marginBottom: '15px',
                            borderLeft: `4px solid ${
                              incident.severity === 'High' ? '#dc3545' : 
                              incident.severity === 'Medium' ? '#fd7e14' : '#ffc107'
                            }`
                          }}>
                            <div className="incident-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                  <span className="incident-type" style={{
                                    backgroundColor: incident.type === 'Blacklisted' ? '#dc3545' : 
                                                   incident.type === 'Overstay' ? '#fd7e14' : '#6c757d',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                  }}>
                                    {incident.type}
                                  </span>
                                  <span className="incident-severity" style={{
                                    backgroundColor: incident.severity === 'High' ? '#dc3545' : 
                                                   incident.severity === 'Medium' ? '#fd7e14' : '#ffc107',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                  }}>
                                    {incident.severity} Priority
                                  </span>
                                </div>
                                <h5 style={{ margin: '0', color: '#212529' }}>{incident.visitor_name || 'Unknown Visitor'}</h5>
                                <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>{incident.description}</p>
                              </div>
                              <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
                                <div>{new Date(incident.incident_time).toLocaleDateString()}</div>
                                <div>{new Date(incident.incident_time).toLocaleTimeString()}</div>
                              </div>
                            </div>
                            
                            <div className="incident-details" style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '6px' }}>
                              <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px' }}>
                                {incident.visitor_email && (
                                  <div>
                                    <strong>Email:</strong> {incident.visitor_email}
                                  </div>
                                )}
                                {incident.visitor_phone && (
                                  <div>
                                    <strong>Phone:</strong> {incident.visitor_phone}
                                  </div>
                                )}
                                {incident.host_name && (
                                  <div>
                                    <strong>Host:</strong> {incident.host_name}
                                  </div>
                                )}
                                <div>
                                  <strong>Source:</strong> {incident.source}
                                </div>
                              </div>
                              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', fontSize: '12px' }}>
                                <strong>Details:</strong> {incident.details}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {securityIncidentsData.length > visitorsPerPage && (
                        <div className="pagination" style={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          gap: '10px', 
                          marginTop: '20px',
                          padding: '15px',
                          borderTop: '1px solid #e9ecef'
                        }}>
                          <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: currentPage === 1 ? '#e9ecef' : '#007bff',
                              color: currentPage === 1 ? '#6c757d' : 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Previous
                          </button>
                          
                          <span style={{ padding: '0 15px', fontSize: '14px' }}>
                            Page {currentPage} of {getTotalPages(securityIncidentsData.length, visitorsPerPage)}
                          </span>
                          
                          <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages(securityIncidentsData.length, visitorsPerPage)))}
                            disabled={currentPage === getTotalPages(securityIncidentsData.length, visitorsPerPage)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: currentPage === getTotalPages(securityIncidentsData.length, visitorsPerPage) ? '#e9ecef' : '#007bff',
                              color: currentPage === getTotalPages(securityIncidentsData.length, visitorsPerPage) ? '#6c757d' : 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: currentPage === getTotalPages(securityIncidentsData.length, visitorsPerPage) ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="modal-footer" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '15px 20px',
                  borderTop: '1px solid #e9ecef',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Showing {securityIncidentsData.length} security incident{securityIncidentsData.length !== 1 ? 's' : ''}
                  </div>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowSecurityIncidentsModal(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <AdminFooter />
    </div>
  );
};


export default AdminDashboardPage;