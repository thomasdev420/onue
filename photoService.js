import { supabase } from './supabaseClient'

/**
 * Uploads a photo to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} userId - The ID of the user uploading the photo
 * @returns {Promise<string>} The file path where the photo was stored
 * @throws {Error} If the upload fails
 */
export async function uploadPhoto(file, userId) {
  try {
    const filePath = `${userId}/${file.name}`
    
    // Upload file to the bucket
    const { data, error } = await supabase.storage
      .from('user-photos')
      .upload(filePath, file)

    if (error) throw error

    // Save metadata to database
    await savePhotoMetadata(userId, filePath)

    return filePath
  } catch (error) {
    console.error('Error uploading photo:', error)
    throw error
  }
}

/**
 * Saves photo metadata to the database
 * @param {string} userId - The ID of the user
 * @param {string} filePath - The path of the file in storage
 * @returns {Promise<Object>} The saved metadata
 * @throws {Error} If the save fails
 */
export async function savePhotoMetadata(userId, filePath) {
  const { data, error } = await supabase
    .from('photos')
    .insert([{ user_id: userId, file_path: filePath }])

  if (error) throw error

  return data
}

/**
 * Fetches all photos for a user
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array<{url: string, path: string}>>} Array of photo objects with URLs and paths
 * @throws {Error} If the fetch fails
 */
export async function fetchUserPhotos(userId) {
  const { data, error } = await supabase
    .from('photos')
    .select('file_path')
    .eq('user_id', userId)

  if (error) throw error

  // Generate public URLs and return objects with both URL and path
  return data.map(photo => ({
    path: photo.file_path,
    url: supabase.storage.from('user-photos').getPublicUrl(photo.file_path).data.publicUrl
  }))
}

/**
 * Gets the public URL for a photo
 * @param {string} filePath - The path of the file in storage
 * @returns {string} The public URL of the photo
 */
export function getPhotoUrl(filePath) {
  const { data } = supabase.storage
    .from('user-photos')
    .getPublicUrl(filePath)
  
  return data.publicUrl
} 