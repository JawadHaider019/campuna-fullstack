/**
 * Client-side high-performance image compression utility
 * Prevents payload-too-large errors (413), slow uploads, and request timeouts.
 */

export async function compressImage(file, maxDimension = 1920, quality = 0.85) {
    if (!file || typeof window === 'undefined') return file;
    if (!file.type || !file.type.startsWith('image/')) return file;
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

    // If file is already smaller than 1.2 MB, no compression needed
    if (file.size <= 1.2 * 1024 * 1024) return file;

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                try {
                    let { width, height } = img;
                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = Math.round((height * maxDimension) / width);
                            width = maxDimension;
                        } else {
                            width = Math.round((width * maxDimension) / height);
                            height = maxDimension;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return resolve(file);

                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(
                        (blob) => {
                            if (blob && blob.size < file.size) {
                                const newName = file.name.replace(/\.[^.]+$/, '.jpg');
                                const compressedFile = new File([blob], newName, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                            } else {
                                resolve(file);
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                } catch (_) {
                    resolve(file);
                }
            };
            img.onerror = () => resolve(file);
            img.src = e.target?.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}

export async function compressImages(files) {
    if (!Array.isArray(files) || files.length === 0) return [];
    return Promise.all(files.map(f => compressImage(f)));
}
