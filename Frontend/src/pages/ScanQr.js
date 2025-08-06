import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { qrCheckIn } from '../utils/apiService';
import jsQR from 'jsqr';
import '../styles/ScanQr.css';

const ScanQr = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'manual'
  const [userRole, setUserRole] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [debugMode, setDebugMode] = useState(false);

  // Check user role on component mount
  useEffect(() => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem('user'));
      if (loggedInUser && loggedInUser.role) {
        setUserRole(loggedInUser.role);
        // Only allow hosts and admins to access QR scanning
        if (loggedInUser.role !== 'host' && loggedInUser.role !== 'admin') {
          setError('Access denied. Only hosts and admins can scan QR codes.');
          setTimeout(() => navigate('/login'), 3000);
        }
      } else {
        setError('Please log in to access QR scanning.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (e) {
      setError('Authentication error. Please log in again.');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [navigate]);

  // QR Code Processing Function
  const processQRCode = async (qrData) => {
    if (!qrData || qrData === lastScannedCode) return;
    
    setLastScannedCode(qrData);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Parse QR data (could be JSON string or plain text)
      let qrCodeValue = qrData;
      try {
        const parsedData = JSON.parse(qrData);
        qrCodeValue = parsedData.qr_code || qrData;
      } catch (e) {
        // QR data is not JSON, use as is
      }

      console.log('Processing QR Code:', qrCodeValue);

      // Prepare the check-in data
      const checkInData = {
        qr_code: qrCodeValue,
        host_id: JSON.parse(localStorage.getItem('user')).id,
        check_in_time: new Date().toISOString(),
        scan_method: scanMode // Include scan method for tracking
      };

      // Call API to get visitor details from pre-registration
      const result = await qrCheckIn(checkInData);

      // Instead of direct check-in, navigate to visitor check-in form with pre-filled data
      setSuccess(`✅ QR Code verified! Redirecting to check-in form...`);
      
      // Navigate to visitor check-in page with pre-filled data
      setTimeout(() => {
        navigate('/checkin', {
          state: {
            fromQRScan: true,
            preRegData: {
              id: result.pre_registration_id,
              name: result.visitor_name,
              email: result.visitor_email,
              phone: result.visitor_phone,
              company: result.visitor_company,
              hostName: result.host_name,
              reason: result.purpose,
              qr_code: qrCodeValue
            }
          }
        });
      }, 1500);

    } catch (err) {
      console.error('QR processing error:', err);
      
      // Handle specific error types
      if (err.message.includes('API endpoint not available') || err.message.includes('Server response was not in the expected JSON format')) {
        setError('⚠️ Backend server not available. Please ensure the server is running on port 4000.');
      } else if (err.message.includes('Failed to fetch') || err.message.includes('Network error')) {
        setError('🌐 Network error. Please check your internet connection and backend server.');
      } else if (err.message.includes('QR code not found') || err.message.includes('Invalid QR code')) {
        setError('❌ Invalid QR code. Please ensure the QR code is valid and the visitor is pre-registered.');
      } else if (err.message.includes('already checked in')) {
        setError('⚠️ This visitor has already been checked in.');
      } else {
        setError(`❌ ${err.message || 'Error processing QR code. Please try again.'}`);
      }
      
      setTimeout(() => {
        setError('');
        setLastScannedCode('');
      }, 5000); // Show error longer for troubleshooting
    } finally {
      setLoading(false);
    }
  };

  // Start Camera
  const startCamera = async () => {
    try {
      setError('');
      setSuccess('📹 Starting camera...');
      setCapturedImage(null); // Clear any previous captured image
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          focusMode: 'continuous',
          exposureMode: 'continuous',
          whiteBalanceMode: 'continuous'
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setIsScanning(true);
            setSuccess('📷 Camera ready! Position QR code in view and click "Capture & Scan"');
          }).catch(err => {
            console.error('Video play error:', err);
            setError('Failed to start video playback');
          });
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('📷 Camera access denied. Please allow camera permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('📷 No camera found. Please use manual entry mode.');
      } else {
        setError('📷 Camera error: ' + err.message + '. Please try manual entry mode.');
      }
    }
  };

  // Capture Image and Scan QR Code
  const captureAndScanQR = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready. Please start camera first.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('📸 Capturing image and scanning for QR code...');

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for QR scanning
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Convert canvas to image for display
      const capturedImageDataUrl = canvas.toDataURL('image/png');
      setCapturedImage(capturedImageDataUrl);

      console.log('Captured image dimensions:', canvas.width, 'x', canvas.height);
      console.log('Image data length:', imageData.data.length);

      // Try multiple scanning approaches for better detection
      let code = null;
      
      // First attempt: Standard scan
      code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      // Second attempt: Try with inversion
      if (!code) {
        code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });
      }

      // Third attempt: Try with different inversion settings
      if (!code) {
        code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "invertFirst",
        });
      }

      // Fourth attempt: Enhance contrast and try again
      if (!code) {
        console.log('Trying enhanced image processing...');
        const enhancedImageData = enhanceImageContrast(imageData);
        code = jsQR(enhancedImageData.data, enhancedImageData.width, enhancedImageData.height, {
          inversionAttempts: "attemptBoth",
        });
      }

      if (code && code.data) {
        console.log('QR Code detected in captured image:', code.data);
        setSuccess('✅ QR Code found in captured image! Processing...');
        
        // Stop camera after successful capture
        stopCamera();
        
        // Process the QR code
        await processQRCode(code.data);
      } else {
        console.log('No QR code detected. Image size:', canvas.width, 'x', canvas.height);
        setError('❌ No QR code found in captured image. Try these tips:\n• Move QR code closer to camera\n• Ensure good lighting\n• Hold QR code steady\n• Try manual entry if camera scan fails');
        setSuccess('');
      }
    } catch (err) {
      console.error('Capture and scan error:', err);
      setError('❌ Error capturing or scanning image: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to enhance image contrast for better QR detection
  const enhanceImageContrast = (imageData) => {
    const data = new Uint8ClampedArray(imageData.data);
    const factor = 2.5; // Contrast enhancement factor
    const intercept = 128 * (1 - factor);

    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast enhancement to RGB channels
      data[i] = data[i] * factor + intercept;     // Red
      data[i + 1] = data[i + 1] * factor + intercept; // Green  
      data[i + 2] = data[i + 2] * factor + intercept; // Blue
      // Alpha channel (data[i + 3]) remains unchanged
    }

    return new ImageData(data, imageData.width, imageData.height);
  };

  // Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setSuccess('');
  };

  // Manual QR Code Entry
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processQRCode(manualCode.trim());
      setManualCode('');
    }
  };

  // Component cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="scan-qr-container">
      <div className="scan-qr-header">
        <h1>🔍 Scan Visitor QR Code</h1>
        <p>Scan or enter QR code to check in pre-registered visitors</p>
        <button 
          className="back-btn"
          onClick={() => navigate('/host')}
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="scan-modes">
        {/* <button 
          className={`mode-btn ${scanMode === 'camera' ? 'active' : ''}`}
          onClick={() => setScanMode('camera')}
        >
          📷 Camera Scan
        </button> */}
        <button 
          className={`mode-btn ${scanMode === 'manual' ? 'active' : ''}`}
          onClick={() => setScanMode('manual')}
        >
          ⌨️ Manual Entry
        </button>
      </div>
{/* 
      
      {scanMode === 'camera' && (
        <div className="camera-section">
          <div className="camera-container">
            <video 
              ref={videoRef} 
              className="camera-video"
              playsInline
              muted
            />
            <canvas 
              ref={canvasRef} 
              className="camera-canvas"
              style={{ display: 'none' }}
            />
            <div className="camera-overlay">
              <div className="scan-frame"></div>
              <p>Position QR code within the frame</p>
            </div>
          </div>
          
          <div className="camera-controls">
            {!isScanning ? (
              <button 
                className="camera-btn start-btn"
                onClick={startCamera}
                disabled={loading}
              >
                📹 Start Camera
              </button>
            ) : (
              <div className="camera-action-buttons">
                <button 
                  className="camera-btn capture-btn"
                  onClick={captureAndScanQR}
                  disabled={loading}
                >
                  {loading ? '🔄 Scanning...' : '📸 Capture & Scan QR'}
                </button>
                <button 
                  className="camera-btn stop-btn"
                  onClick={stopCamera}
                  disabled={loading}
                >
                  ⏹️ Stop Camera
                </button>
                <button 
                  className="camera-btn debug-btn"
                  onClick={() => setDebugMode(!debugMode)}
                  style={{ background: debugMode ? '#28a745' : '#6c757d' }}
                >
                  🔧 Debug {debugMode ? 'ON' : 'OFF'}
                </button>
              </div>
            )}
          </div>
          
      
          {capturedImage && (
            <div className="captured-image-section">
              <h4>📸 Captured Image:</h4>
              <img 
                src={capturedImage} 
                alt="Captured frame for QR scanning"
                className="captured-image"
                style={{
                  maxWidth: '300px',
                  maxHeight: '200px',
                  border: '2px solid #007bff',
                  borderRadius: '8px',
                  marginTop: '10px'
                }}
              />
              <p>QR scan performed on this captured image</p>
            </div>
          )}
          
      
          {debugMode && (
            <div className="debug-section" style={{ 
              background: '#f8f9fa', 
              padding: '15px', 
              margin: '10px 0', 
              borderRadius: '8px',
              border: '1px solid #dee2e6' 
            }}>
              <h4>🔧 Debug Information:</h4>
              <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                <p><strong>Camera Status:</strong> {isScanning ? 'Active' : 'Inactive'}</p>
                <p><strong>Video Dimensions:</strong> {videoRef.current ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` : 'N/A'}</p>
                <p><strong>Stream Active:</strong> {stream ? 'Yes' : 'No'}</p>
                <p><strong>Last Scanned:</strong> {lastScannedCode || 'None'}</p>
              </div>
              
              <div style={{ marginTop: '10px' }}>
                <h5>Test QR Code:</h5>
                <button 
                  onClick={() => processQRCode('TEST-QR-12345')}
                  style={{ 
                    padding: '5px 10px', 
                    background: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  Test with Sample QR
                </button>
              </div>
            </div>
          )}
        </div>
      )}

*/}

      {/* Manual Entry Mode */}
      {scanMode === 'manual' && (
        <div className="manual-section">
          <form onSubmit={handleManualSubmit} className="manual-form">
            <div className="input-group">
              <label htmlFor="qr-code">Enter QR Code:</label>
              <textarea
                id="qr-code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Paste or type the QR code data here..."
                rows="4"
                required
              />
            </div>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || !manualCode.trim()}
            >
              {loading ? '🔄 Processing...' : '✅ Check In Visitor'}
            </button>
          </form>
        </div>
      )}

      {/* Status Messages */}
      {loading && (
        <div className="status-message loading">
          <div className="spinner"></div>
          <p>🔄 Processing QR code...</p>
        </div>
      )}

      {error && (
        <div className="status-message error">
          <p>❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="status-message success">
          <p>{success}</p>
        </div>
      )}

      {/* Instructions 
      <div className="instructions">
        <h3>📋 Instructions:</h3>
        <ul>
          <li>📹 Click "Start Camera" to activate camera feed</li>
          <li>🎯 Position the visitor's QR code clearly within the camera view</li>
          <li>📸 Click "Capture & Scan QR" to take a photo and automatically scan for QR code</li>
          <li>✅ System will verify pre-registration and navigate to check-in form</li>
          <li>⏹️ Use "Stop Camera" to close camera without scanning</li>
          <li>⌨️ Alternatively, use "Manual Entry" to type/paste QR code directly</li>
          <li>🔒 Only pre-registered visitors with valid QR codes can be checked in</li>
        </ul>
        
        <h4>🔧 Troubleshooting QR Scan Issues:</h4>
        <ul style={{ fontSize: '14px', color: '#666' }}>
          <li>• Ensure QR code fills about 1/4 of the camera view</li>
          <li>• Make sure there's good lighting on the QR code</li>
          <li>• Hold the QR code steady (avoid shaking)</li>
          <li>• Try moving QR code closer or further from camera</li>
          <li>• Clean camera lens if image appears blurry</li>
          <li>• Use "Debug ON" to see technical information</li>
          <li>• If camera scan fails, use "Manual Entry" mode</li>
        </ul>
      </div>
      */}

      {/* QR Code Status 
      <div className="qr-status">
        <p>✅ <strong>QR Scanner Ready:</strong> jsQR library installed and active</p>
        <p>📱 Start camera → Position QR code → Capture & Scan</p>
      </div>
      */}
    </div>
  );
};

export default ScanQr;
