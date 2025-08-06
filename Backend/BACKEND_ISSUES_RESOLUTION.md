# Backend Issues Resolution Guide

## Issues Identified and Fixed

### ✅ 1. DateTime Deprecation Warning - FIXED
**Issue**: `datetime.datetime.utcnow() is deprecated`
**Solution**: Updated all occurrences to use `datetime.now(timezone.utc)`
**Files Modified**: `Backend/app.py`

### ⚠️ 2. WeasyPrint Installation Issue
**Issue**: `WeasyPrint could not import some external libraries`
**Root Cause**: WeasyPrint requires GTK+ libraries on Windows which are complex to install

**Solutions Available**:

#### Option A: Install GTK+ for Windows (Complex)
1. Download and install GTK+ runtime from: https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer
2. Add GTK+ to your system PATH
3. Restart your IDE/terminal

#### Option B: Use ReportLab Alternative (Recommended)
ReportLab has been installed as an alternative PDF generation library.

**Current Status**: The application gracefully handles WeasyPrint unavailability and falls back to HTML export that can be printed as PDF from browser.

### ⚠️ 3. Gmail Sending Limit Exceeded
**Issue**: `Daily user sending limit exceeded`
**Impact**: Email notifications are failing

**Solutions**:

#### Option A: Use App Password (Recommended)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password instead of your regular password

#### Option B: Use a Dedicated Email Service
Consider using:
- SendGrid
- Mailgun
- Amazon SES
- SMTP2GO

#### Option C: Increase Gmail Limits
- Upgrade to Google Workspace (higher sending limits)
- Use multiple Gmail accounts with load balancing

## Current Application Status

✅ **Working Features**:
- User registration and authentication
- Database connections
- Core visitor management functionality
- PDF export fallback (HTML → Print to PDF)

⚠️ **Limited Features**:
- PDF generation (using HTML fallback)
- Email notifications (hitting daily limits)

## Recommended Actions

### Immediate (High Priority):
1. **Set up App Password for Gmail** (fixes email issue)
2. **Configure environment variables** for email settings

### Short-term (Medium Priority):
1. **Install GTK+ runtime** if you need WeasyPrint PDF generation
2. **Set up dedicated email service** for production use

### Long-term (Low Priority):
1. **Implement email queue system** with retry logic
2. **Add multiple email provider support** for redundancy

## Environment Variables Setup

Create a `.env` file in the Backend directory with:

```bash
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_FROM=your-email@gmail.com

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=visitor_management
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# Application Configuration
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
DEBUG=True
```

## Testing the Fixes

1. **Start the backend server**:
   ```bash
   cd Backend
   python run.py
   ```

2. **Test user registration** (should work without datetime warnings)

3. **Test email functionality** (configure App Password first)

4. **Test PDF export** (will use HTML fallback if WeasyPrint unavailable)

## Additional Notes

- The application is designed to be resilient - it will continue working even if some optional features (like WeasyPrint) are unavailable
- All critical functionality (user management, visitor tracking) remains operational
- Email functionality can be restored by configuring proper authentication

## Need Help?

If you continue to experience issues:
1. Check the console logs for specific error messages
2. Verify your environment variables are correctly set
3. Ensure all dependencies are properly installed
4. Test individual components separately
