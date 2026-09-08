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

export const verifyEmailToken = async (token) => {
    return api.post('/verify-email', { token });
};

export const requestPasswordReset = async (email) => {
    return api.post('/forgot-password', { email });
};

export const verifyResetOtp = async (email, otp) => {
    return api.post('/verify-reset-otp', { email, otp });
};

export const resetPassword = async (email, reset_token, new_password) => {
    return api.post('/reset-password', { email, reset_token, new_password });
};

export default {
    register: registerUser,
    login: loginUser,
    logout: logoutUser,
    checkVerificationStatus,
    verifyEmailToken,
    requestPasswordReset,
    verifyResetOtp,
    resetPassword,
};
