import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file to meet size and dimension constraints.
 * Target: Max 1280px width/height, Max 0.5MB size, WebP format.
 * @param file Original File object
 * @returns Promise resolving to compressed File
 */
export async function compressImage(file: File): Promise<File> {
    const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: 'image/webp', // Force WebP for better compression
        initialQuality: 0.8,
    };

    try {
        console.log(`[Compression] Original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

        const compressedFile = await imageCompression(file, options);

        console.log(`[Compression] Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`[Compression] Savings: ${((1 - compressedFile.size / file.size) * 100).toFixed(0)}%`);

        return compressedFile;
    } catch (error) {
        console.error('[Compression] Error:', error);
        throw error; // Propagate to caller
    }
}
