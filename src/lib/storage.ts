import { supabase } from '@/lib/supabase';

/**
 * Uploads a plant image to the 'plant-images' bucket.
 * @param file The file object to upload.
 * @returns Promise resolving to the public URL of the uploaded image.
 */
export async function uploadPlantImage(file: File): Promise<string> {
    try {
        // 1. Sanitize filename and append timestamp for uniqueness
        const fileExt = file.name.split('.').pop();
        const fileName = `terravanta-image-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // Can add folders like `uploads/${fileName}` if desired

        // 2. Upload to Supabase
        const { error: uploadError } = await supabase.storage
            .from('plant-images')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        // 3. Get Public URL
        const { data } = supabase.storage
            .from('plant-images')
            .getPublicUrl(filePath);

        return data.publicUrl;

    } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error('Failed to upload image to garden storage.');
    }
}
