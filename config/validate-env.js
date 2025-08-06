#!/usr/bin/env node
/**
 * Environment Variables Validation Script
 * Validates environment configuration for Visitor Management System
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Required environment variables by service
const requiredVars = {
    global: [
        'NODE_ENV',
        'FRONTEND_PORT',
        'BACKEND_PORT',
        'ML_PORT'
    ],
    frontend: [
        'REACT_APP_API_BASE_URL',
        'REACT_APP_ML_SERVICE_URL'
    ],
    backend: [
        'FLASK_HOST',
        'FLASK_PORT',
        'DB_HOST',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD',
        'JWT_SECRET',
        'SECRET_KEY'
    ],
    ml: [
        'ML_HOST',
        'ML_PORT',
        'GOOGLE_API_KEY',
        'UPLOAD_FOLDER'
    ]
};

// Security validation patterns
const securityPatterns = {
    SECRET_KEY: /^.{32,}$/, // At least 32 characters
    JWT_SECRET: /^.{32,}$/, // At least 32 characters
    GOOGLE_API_KEY: /^AIza[0-9A-Za-z-_]{35}$/, // Google API key pattern
    EMAIL_PASS: /^.{8,}$/ // At least 8 characters
};

// Environment files to check
const envFiles = {
    global: '.env',
    frontend: 'Frontend/.env',
    backend: 'Backend/.env',
    ml: 'ML/.env'
};

/**
 * Load environment variables from file
 */
function loadEnvFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const vars = {};
        
        content.split('\n').forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    vars[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
        
        return vars;
    } catch (error) {
        console.error(`${colors.red}Error reading ${filePath}:${colors.reset}`, error.message);
        return null;
    }
}

/**
 * Validate required variables
 */
function validateRequired(vars, required, serviceName) {
    const missing = [];
    const present = [];
    
    required.forEach(varName => {
        if (!vars[varName] || vars[varName] === 'your_value_here' || vars[varName] === 'CHANGE_THIS') {
            missing.push(varName);
        } else {
            present.push(varName);
        }
    });
    
    return { missing, present };
}

/**
 * Validate security patterns
 */
function validateSecurity(vars) {
    const issues = [];
    const passed = [];
    
    Object.entries(securityPatterns).forEach(([varName, pattern]) => {
        if (vars[varName]) {
            if (pattern.test(vars[varName])) {
                passed.push(varName);
            } else {
                issues.push({
                    variable: varName,
                    issue: getSecurityIssue(varName, vars[varName])
                });
            }
        }
    });
    
    return { issues, passed };
}

/**
 * Get specific security issue description
 */
function getSecurityIssue(varName, value) {
    switch (varName) {
        case 'SECRET_KEY':
        case 'JWT_SECRET':
            return 'Must be at least 32 characters long';
        case 'GOOGLE_API_KEY':
            return 'Invalid Google API key format';
        case 'EMAIL_PASS':
            return 'Password too short (minimum 8 characters)';
        default:
            return 'Security validation failed';
    }
}

/**
 * Check for development vs production settings
 */
function checkEnvironmentConsistency(vars) {
    const warnings = [];
    
    // Check for development settings in production
    if (vars.NODE_ENV === 'production') {
        if (vars.FLASK_DEBUG === 'true') {
            warnings.push('Flask debug mode enabled in production');
        }
        if (vars.DEBUG === 'true') {
            warnings.push('Debug mode enabled in production');
        }
        if (vars.SECRET_KEY && vars.SECRET_KEY.includes('dev')) {
            warnings.push('Development secret key used in production');
        }
    }
    
    // Check for missing production settings
    if (vars.NODE_ENV === 'production') {
        if (!vars.SSL_CERT_PATH && !vars.SSL_KEY_PATH) {
            warnings.push('SSL configuration missing for production');
        }
        if (!vars.SENTRY_DSN) {
            warnings.push('Error tracking (Sentry) not configured');
        }
    }
    
    return warnings;
}

/**
 * Validate a specific service
 */
function validateService(serviceName) {
    console.log(`\n${colors.cyan}${colors.bold}🔍 Validating ${serviceName.toUpperCase()} Service${colors.reset}`);
    console.log('='.repeat(50));
    
    const filePath = envFiles[serviceName];
    const vars = loadEnvFile(filePath);
    
    if (!vars) {
        console.log(`${colors.red}❌ Environment file not found: ${filePath}${colors.reset}`);
        console.log(`${colors.yellow}💡 Copy from: config/${serviceName}.env.template${colors.reset}`);
        return false;
    }
    
    // Check required variables
    const required = requiredVars[serviceName] || [];
    const { missing, present } = validateRequired(vars, required, serviceName);
    
    // Display present variables
    if (present.length > 0) {
        console.log(`${colors.green}✅ Required variables present (${present.length}):${colors.reset}`);
        present.forEach(varName => {
            console.log(`   ${colors.green}•${colors.reset} ${varName}`);
        });
    }
    
    // Display missing variables
    if (missing.length > 0) {
        console.log(`${colors.red}❌ Missing required variables (${missing.length}):${colors.reset}`);
        missing.forEach(varName => {
            console.log(`   ${colors.red}•${colors.reset} ${varName}`);
        });
    }
    
    // Security validation
    const { issues, passed } = validateSecurity(vars);
    
    if (passed.length > 0) {
        console.log(`${colors.green}🔒 Security checks passed (${passed.length}):${colors.reset}`);
        passed.forEach(varName => {
            console.log(`   ${colors.green}•${colors.reset} ${varName}`);
        });
    }
    
    if (issues.length > 0) {
        console.log(`${colors.red}🚨 Security issues found (${issues.length}):${colors.reset}`);
        issues.forEach(issue => {
            console.log(`   ${colors.red}•${colors.reset} ${issue.variable}: ${issue.issue}`);
        });
    }
    
    // Environment consistency
    const warnings = checkEnvironmentConsistency(vars);
    if (warnings.length > 0) {
        console.log(`${colors.yellow}⚠️  Environment warnings (${warnings.length}):${colors.reset}`);
        warnings.forEach(warning => {
            console.log(`   ${colors.yellow}•${colors.reset} ${warning}`);
        });
    }
    
    const isValid = missing.length === 0 && issues.length === 0;
    console.log(`\n${isValid ? colors.green + '✅ Validation PASSED' : colors.red + '❌ Validation FAILED'}${colors.reset}`);
    
    return isValid;
}

/**
 * Main validation function
 */
function main() {
    const args = process.argv.slice(2);
    const serviceFlag = args.find(arg => arg.startsWith('--service='));
    const specificService = serviceFlag ? serviceFlag.split('=')[1] : null;
    
    console.log(`${colors.magenta}${colors.bold}🔧 Visitor Management System - Environment Validation${colors.reset}`);
    console.log(`${colors.cyan}Date: ${new Date().toISOString()}${colors.reset}`);
    
    if (specificService) {
        if (!requiredVars[specificService]) {
            console.log(`${colors.red}❌ Unknown service: ${specificService}${colors.reset}`);
            console.log(`${colors.yellow}Available services: ${Object.keys(requiredVars).join(', ')}${colors.reset}`);
            process.exit(1);
        }
        
        const isValid = validateService(specificService);
        process.exit(isValid ? 0 : 1);
    } else {
        // Validate all services
        let allValid = true;
        
        Object.keys(requiredVars).forEach(serviceName => {
            const isValid = validateService(serviceName);
            allValid = allValid && isValid;
        });
        
        console.log(`\n${colors.bold}${'='.repeat(60)}${colors.reset}`);
        console.log(`${colors.bold}🎯 OVERALL VALIDATION RESULT${colors.reset}`);
        console.log(`${allValid ? colors.green + '✅ ALL SERVICES PASSED' : colors.red + '❌ SOME SERVICES FAILED'}${colors.reset}`);
        
        if (!allValid) {
            console.log(`\n${colors.yellow}💡 Quick Setup Commands:${colors.reset}`);
            console.log(`   cp config/.env.development .env`);
            console.log(`   cp config/frontend.env.template Frontend/.env`);
            console.log(`   cp config/backend.env.template Backend/.env`);
            console.log(`   cp config/ml.env.template ML/.env`);
        }
        
        process.exit(allValid ? 0 : 1);
    }
}

// Run validation
if (require.main === module) {
    main();
}

module.exports = { validateService, loadEnvFile };
