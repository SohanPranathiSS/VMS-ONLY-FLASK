# Fix: Use Users Table for Host Company Name in Duplicate Check

## Problem
The duplicate check-in prevention was trying to use the companies table with company_id, but the requirement is to get the host's company name directly from the users table using the host_id foreign key in the visits table.

## Solution
Updated the duplicate check query to:
1. Use `visits.host_id` to join with `users` table
2. Get `company_name` from `users` table instead of `companies` table
3. Compare against the current host's company name

## Changes Made

### 1. Backend API Endpoint (`Backend/app.py`)
**Updated Query:**
```sql
-- NEW APPROACH
SELECT v.*, vis.name as existing_visitor_name, u.company_name as host_company_name
FROM visits v
JOIN visitors vis ON v.visitor_id = vis.id
JOIN users u ON v.host_id = u.id  -- Join with users table using host_id
WHERE vis.email = %s 
AND u.company_name = (SELECT company_name FROM users WHERE id = %s)  -- Compare company names
AND DATE(v.visit_date) = CURDATE()
AND v.status = 'checked-in'
```

**Parameters changed from:**
- `(visitor_email, company_id)` 
- **To:** `(visitor_email, host_id)`

### 2. Visit Model (`Backend/src/models/visit.py`)
**Updated method signature:**
```python
# Before
def check_duplicate_checkin(visitor_email, company_id):

# After  
def check_duplicate_checkin(visitor_email, host_id):
```

**Updated query to use users table:**
```sql
SELECT v.*, u.company_name as host_company_name
FROM visits v
JOIN visitors vis ON v.visitor_id = vis.id
JOIN users u ON v.host_id = u.id
WHERE vis.email = %s 
AND u.company_name = (SELECT company_name FROM users WHERE id = %s)
AND DATE(v.visit_date) = CURDATE()
AND v.status = 'checked-in'
```

### 3. Test Files Updated
- `test_duplicate_checkin.py`: Updated to use `host_id` instead of `company_id`
- Test method names updated to reflect "host" instead of "company"
- All test assertions updated for new parameter structure

## Database Schema Used

### Key Tables and Relationships:
```sql
-- visits table (main table)
visits {
    id INT PRIMARY KEY,
    visitor_id INT,  -- FK to visitors.id
    host_id INT,     -- FK to users.id (this is what we use)
    company_id INT,  -- Not used in this approach
    status ENUM('checked-in', 'checked-out', ...),
    visit_date DATE,
    ...
}

-- users table (contains host info and company)
users {
    id INT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    company_name VARCHAR(200),  -- This is what we retrieve
    role ENUM('admin', 'host', ...),
    ...
}

-- visitors table (contains visitor info)
visitors {
    id INT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    company VARCHAR(200),  -- Visitor's company (not used for duplicate check)
    ...
}
```

### Query Logic:
1. **visits.host_id** → **users.id** (join to get host info)
2. **users.company_name** → Host's company name (what we compare)
3. Compare with current host's company name using subquery

## Business Logic

### Duplicate Check Now Prevents:
- Same visitor email
- Same host company (from users.company_name)
- Same date
- Currently checked-in status

### Example Scenario:
```
Visitor: john@example.com
Host 1: Alice (company_name: "ABC Corp")
Host 2: Bob (company_name: "ABC Corp")  
Host 3: Charlie (company_name: "XYZ Ltd")

If john@example.com is already checked in with Alice:
- ❌ Cannot check in with Bob (same company: ABC Corp)
- ✅ Can check in with Charlie (different company: XYZ Ltd)
```

## Benefits of This Approach

### 1. **Simpler Database Structure**
- No need to maintain complex relationships with companies table
- Direct lookup via users table which always contains host info

### 2. **More Reliable**
- users.company_name is always populated for hosts
- No risk of missing company_id references

### 3. **Better Performance**
- One less JOIN operation
- Simpler query structure

### 4. **Clearer Logic**
- Direct relationship: visits → users (via host_id)
- Easy to understand and maintain

## Error Message Example

**Before Fix:**
> "You are already checked in for Pranathi (Software Services Pvt.Ltd., A subsidiary of Software Programming Group (USA)) today..."
> (Showed visitor's company)

**After Fix:**
> "You are already checked in for ABC Corporation today at 2025-08-15 06:41:05..."
> (Shows host's company from users.company_name)

## Testing

### Unit Tests Updated:
- Parameter change: `company_id` → `host_id`
- Query validation updated for users table join
- Test data reflects host-based logic

### Integration Testing:
- Manual test: Check in visitor with Host A
- Try to check in same visitor with Host B (same company) → Should fail
- Try to check in same visitor with Host C (different company) → Should succeed

## Files Modified:
1. `/Backend/app.py` - Updated duplicate check query
2. `/Backend/src/models/visit.py` - Updated method signature and query
3. `/Backend/test_duplicate_checkin.py` - Updated unit tests
4. `/docs/features/DUPLICATE_CHECKIN_PREVENTION.md` - Updated documentation

## Compatibility
✅ **Fully backward compatible** - uses existing database structure
✅ **No breaking changes** - same API endpoints
✅ **No migration required** - uses existing tables and relationships
