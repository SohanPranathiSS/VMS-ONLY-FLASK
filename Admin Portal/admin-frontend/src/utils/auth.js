export function getToken() {
  return localStorage.getItem('jwt_token') || '';
}

export function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function isTokenValid(token) {
  const payload = parseJwt(token);
  if (!payload) return false;
  if (!payload.exp) return true; // if no exp, assume valid
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
}

export function hasRole(role) {
  const payload = parseJwt(getToken());
  if (!payload) return false;
  return payload.role === role || payload.role === 'super_admin';
}

export function hasAnyRole(roles = []) {
  const payload = parseJwt(getToken());
  if (!payload) return false;
  if (payload.role === 'super_admin') return true;
  return roles.includes(payload.role);
}

export function hasPerm(perm) {
  const payload = parseJwt(getToken());
  if (!payload) return false;
  if (payload.role === 'admin' || payload.role === 'super_admin') return true;
  const perms = payload.permissions || [];
  return perms.includes(perm);
}
