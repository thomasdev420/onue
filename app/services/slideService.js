import { getSupabase } from '../supabaseClient';

/**
 * Save slides to the database for a specific user
 * @param {string} userId - The user's email or ID
 * @param {Array} slides - Array of slide objects
 * @returns {Promise<Object>} The result of the save operation
 */
export async function saveSlides(userId, slides) {
  try {
    const supabase = getSupabase();
    // First, delete any existing slides for this user
    const { error: deleteError } = await supabase
      .from('slides')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // Then insert the new slides
    const slidesToInsert = slides.map((slide, index) => ({
      user_id: userId,
      slide_order: index,
      slide_data: slide,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('slides')
      .insert(slidesToInsert)
      .select();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error saving slides:', error);
    return { data: null, error };
  }
}

/**
 * Load slides from the database for a specific user
 * @param {string} userId - The user's email or ID
 * @returns {Promise<Array>} Array of slide objects
 */
export async function loadSlides(userId) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('slides')
      .select('*')
      .eq('user_id', userId)
      .order('slide_order', { ascending: true });

    if (error) throw error;

    // Extract the slide data from the database records
    const slides = data.map(record => record.slide_data);
    
    // If no slides found, return a default slide
    if (slides.length === 0) {
      return [{ id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`, image: null, texts: [], ratio: '9:16' }];
    }

    return slides;
  } catch (error) {
    console.error('Error loading slides:', error);
    // Return default slide on error
    return [{ id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`, image: null, texts: [], ratio: '9:16' }];
  }
}

/**
 * Auto-save slides with debouncing
 * @param {string} userId - The user's email or ID
 * @param {Array} slides - Array of slide objects
 * @param {Function} setSaveStatus - Function to update save status
 */
export async function autoSaveSlides(userId, slides, setSaveStatus) {
  try {
    setSaveStatus('saving');
    const { error } = await saveSlides(userId, slides);
    
    if (error) {
      setSaveStatus('error');
      console.error('Auto-save failed:', error);
    } else {
      setSaveStatus('saved');
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  } catch (error) {
    setSaveStatus('error');
    console.error('Auto-save error:', error);
  }
} 