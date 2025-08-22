"""
Text Extraction Utilities
Contains functions for extracting various data types from text
"""

import re
from .config import PATTERNS, KEYWORDS, PUBLIC_EMAIL_DOMAINS

def extract_email(text):
    """Extracts email addresses using regex."""
    match = re.search(PATTERNS['email'], text)
    return match.group(0) if match else None

def extract_mobile_number(text):
    """Extracts a 10-digit mobile number, optionally with a +91 prefix."""
    for pattern in PATTERNS['mobile']:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            number = "".join(filter(None, match)).strip()
            if not re.search(r'(?:ext|extension|x|fax)\s*[:\s]*' + re.escape(number), text, re.IGNORECASE):
                return number
    return None

def extract_company_number(text):
    """Extracts a company landline number, potentially with context or an extension."""
    for pattern in PATTERNS['company_number']:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            full_number = "".join([g for g in match.groups() if g is not None]).strip()
            clean_number = re.sub(r'[^\d]', '', full_number)
            if len(clean_number) == 10 and clean_number.startswith(('6','7','8','9')):
                continue
            return full_number
    return None

def extract_website(text):
    """Extracts a website URL, improved to not misidentify email addresses."""
    match = re.search(PATTERNS['website'], text, re.IGNORECASE)
    if match:
        url = match.group(0)
        if '@' in url:
            return None
        if any(tld in url for tld in ['.com', '.in', '.org', '.net', '.co', '.io', '.tech']):
            return url
    return None

def extract_company_name(lines):
    """Extracts company name using a broader list of keywords."""
    for line in lines:
        if any(keyword in line.lower() for keyword in KEYWORDS['company']):
            return line.strip().title()
    for line in lines:
        if line.isupper() and 2 < len(line.split()) < 5:
            return line.title()
    return "Not Found"

def extract_name_and_designation(lines):
    """Extracts name and designation using a more robust filtering approach."""
    name = None
    designation = None
    
    candidates = []
    for line in lines:
        line_lower = line.lower()
        if not any(char.isdigit() for char in line) and not any(kw in line_lower for kw in KEYWORDS['non_name']):
            if 0 < len(line.split()) < 5:
                candidates.append(line.strip())

    remaining_candidates = []
    for line in candidates:
        if any(re.search(r'\b' + keyword + r'\b', line.lower()) for keyword in KEYWORDS['designation']):
            if not designation:
                designation = line.title()
        else:
            remaining_candidates.append(line)

    if remaining_candidates:
        name_candidates = [c for c in remaining_candidates if len(c.split()) in [2, 3]]
        if name_candidates:
            name = max(name_candidates, key=len).title()
        elif remaining_candidates:
            name = max(remaining_candidates, key=len).title()

    return name, designation

def extract_address(lines):
    """Extracts address by identifying generic address-related keywords."""
    address_parts = []
    
    cleaned_lines = []
    for line in lines:
        cleaned_line = line.strip()
        cleaned_line = re.sub(r'[Ii][Ii][lI](?=\s|,|$)', 'III', cleaned_line, flags=re.IGNORECASE)
        cleaned_line = cleaned_line.replace(';', ',')
        if cleaned_line:
            cleaned_lines.append(cleaned_line)
    
    start_index = -1
    for i, line in enumerate(cleaned_lines):
        if any(re.search(keyword, line.lower()) for keyword in KEYWORDS['address']):
            if not any(re.search(keyword, line.lower()) for keyword in KEYWORDS['non_address']):
                start_index = i
                break
    
    if start_index != -1:
        for i in range(start_index, len(cleaned_lines)):
            line = cleaned_lines[i].strip()
            line_lower = line.lower()
            if not line: continue
            if any(re.search(keyword, line_lower) for keyword in KEYWORDS['non_address']): break
            words = line.split()
            if len(words) in [2, 3] and all(word.isalpha() for word in words):
                if not any(re.search(keyword, line_lower) for keyword in KEYWORDS['address']):
                    continue
            address_parts.append(line)
            if len(address_parts) >= 2 and any(re.search(keyword, line_lower) for keyword in ['india', r'\b\d{5,6}\b']):
                break
    
    pincode = None
    for line in cleaned_lines:
        pincode_match = re.search(PATTERNS['pincode'], line)
        if pincode_match:
            pincode = pincode_match.group(1)
            break
    
    if pincode and not any(pincode in part for part in address_parts):
        address_parts.append(pincode)
        
    if address_parts:
        address = ', '.join(part for part in address_parts if part).strip()
        address = re.sub(r'\s*,\s*', ', ', address).replace(" ,", ",")
        
        address_parts_formatted = address.split(', ')
        final_parts = []
        for part in address_parts_formatted:
            formatted_part = part.title()
            formatted_part = re.sub(r'\bIii\b', 'III', formatted_part)
            words = formatted_part.split(' ')
            corrected_words = [word.upper() if len(word) == 2 and word.isalpha() else word for word in words]
            final_parts.append(' '.join(corrected_words))
        
        address = ', '.join(final_parts)
        address = re.sub(r'([A-Za-z]+)\s*-\s*(III)', r'\1-\2', address)
        address = re.sub(r',\s*(\d{5,6})$', r' - \1', address)
        return address

    return "Not Found"

def extract_text_and_numbers(image_np, reader):
    """Extracts text and numbers from an image using EasyOCR."""
    results = reader.readtext(image_np, detail=0, paragraph=False)
    full_text = ' '.join(results)
    
    # Extract Aadhar (12 digits, with optional spaces) and PAN (10 alphanumeric characters)
    aadhar_pattern = PATTERNS['aadhar']
    pan_pattern = PATTERNS['pan']
    numbers = re.findall(f'{aadhar_pattern}|{pan_pattern}', full_text)
    return numbers, results

def extract_custom_data(lines, prompt):
    """Extracts data based on the user prompt using EasyOCR results."""
    if not prompt:
        return None

    prompt = prompt.lower().strip()
    full_text = ' '.join(lines)
    result = {}

    # Define common fields and their extraction logic
    field_extractors = {
        'name': lambda: extract_name_and_designation(lines)[0],
        'designation': lambda: extract_name_and_designation(lines)[1],
        'company': lambda: extract_company_name(lines),
        'email': lambda: extract_email(full_text),
        'mobile': lambda: extract_mobile_number(full_text),
        'phone': lambda: extract_mobile_number(full_text),  # Alias for mobile
        'company number': lambda: extract_company_number(full_text),
        'company tel': lambda: extract_company_number(full_text),  # Alias
        'website': lambda: extract_website(full_text),
        'address': lambda: extract_address(lines),
        'items': lambda: ', '.join([line for line in lines if any(kw in line.lower() for kw in ['item', 'items', 'product', 'products'])])
    }

    # Parse prompt to identify requested fields
    requested_fields = []
    for field in field_extractors.keys():
        if field in prompt:
            requested_fields.append(field)

    # If no specific fields are mentioned, try to infer from context
    if not requested_fields:
        if 'receipt' in prompt:
            requested_fields = ['items', 'company', 'address']
        elif 'business card' in prompt:
            requested_fields = ['name', 'designation', 'company', 'email', 'mobile', 'company tel', 'website', 'address']
        else:
            requested_fields = list(field_extractors.keys())  # Default to all fields

    # Extract requested fields
    for field in requested_fields:
        result[field] = field_extractors[field]() or "Not Found"

    return result or {"message": "No relevant data extracted based on prompt"}
