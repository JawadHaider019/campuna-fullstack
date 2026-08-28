import api from './client.js';

/**
 * Uploads an image file to the backend.
 * Uses FormData to send the multi-part file request.
 * @param {File} file - The image file object to upload.
 */
export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData);
};

export default {
    uploadImage,
};
