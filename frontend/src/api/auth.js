import api from './client';

/**
 * Register a new user
 * @param {Object} userData 
 * @param {string} userData.email
 * @param {string} userData.password
 * @param {string} userData.confirm_password
 * @param {string} userData.account_type - 'PRIVATE' | 'COMMERCIAL'
 * @param {string} [userData.first_name]
 * @param {string} [userData.last_name]
 * @param {string} [userData.company_name]
 * @param {string} [userData.referred_by_code]
 */
export const registerUser = async (userData) => {
    return api.post('/register', userData);
};

export const checkVerificationStatus = async (email) => {
    return api.get(`/verify-status?email=${encodeURIComponent(email)}`);
};

export const loginUser = async (credentials) => {
    return api.post('/login', credentials);
};

export const logoutUser = async () => {
    return api.post('/logout');
};

export default {
    register: registerUser,
    login: loginUser,
    logout: logoutUser,
    checkVerificationStatus,
};
