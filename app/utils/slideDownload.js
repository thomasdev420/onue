/**
 * Simple, reliable slide download - creates clean images like professional tools
 */
export const downloadSlide = async (slideElement, slideTitle = 'slide', format = 'png', quality = 0.95) => {
  try {
    console.log('Starting clean download for:', slideTitle);
    
    if (!slideElement) {
      throw new Error('Slide element not found');
    }

    // Get slide data from the element's data attributes or find the slide object
    const slideIndex = slideElement.getAttribute('data-slide-index');
    const slideData = slideElement.getAttribute('data-slide-data');
    
    if (!slideData) {
      throw new Error('Slide data not found');
    }
    
    const slide = JSON.parse(slideData);
    
    // Create a clean canvas with proper dimensions
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size based on ratio (9:16 for social media) - ULTRA HIGH QUALITY
    const aspectRatio = slide.ratio === '4:5' ? 4/5 : slide.ratio === '1:1' ? 1 : 9/16;
    const width = 3240; // Triple resolution for ultra high quality
    const height = Math.round(width / aspectRatio);
    
    canvas.width = width;
    canvas.height = height;
    
    // Ensure proper color space for social media compatibility
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Load and draw background image or color
    if (slide.backgroundColor) {
      // Draw color background
      ctx.fillStyle = slide.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    } else if (slide.image && slide.image.image_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        // Force high quality image loading
        const imageUrl = slide.image.image_url.includes('?') 
          ? `${slide.image.image_url}&quality=100&w=3240`
          : `${slide.image.image_url}?quality=100&w=3240`;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });
        
        // Calculate image dimensions to cover the canvas
        const imgAspect = img.width / img.height;
        const canvasAspect = width / height;
        
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
        
        if (imgAspect > canvasAspect) {
          // Image is wider than canvas
          drawHeight = height;
          drawWidth = height * imgAspect;
          offsetX = (width - drawWidth) / 2;
        } else {
          // Image is taller than canvas
          drawWidth = width;
          drawHeight = width / imgAspect;
          offsetY = (height - drawHeight) / 2;
        }
        
        // Draw the image
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
      } catch (error) {
        console.warn('Failed to load background image:', error);
        // Continue without background image
      }
    }
    
            // Draw text overlays with proper styling
        if (slide.texts && slide.texts.length > 0) {
          slide.texts.forEach(textItem => {
            if (!textItem.content || textItem.content.trim() === '') return;
            
            // Convert percentage positions to pixel positions
            const x = (textItem.position.x / 100) * width;
            const y = (textItem.position.y / 100) * height;
            
            // Parse font size (remove 'px' and convert to number)
            const fontSize = parseInt(textItem.style.fontSize) || 14;
            const scaledFontSize = Math.round((fontSize / 400) * width); // Scale based on canvas width
            
            // Determine font family - match TextOverlay logic exactly
            let fontFamily = 'Inter, sans-serif';
            if (textItem.style.caption !== false) {
              fontFamily = 'Montserrat, sans-serif';
            } else if (textItem.style.fontFamily) {
              fontFamily = textItem.style.fontFamily;
            }
            
            // Determine font weight - match TextOverlay logic exactly
            let fontWeight = 'bold'; // Always bold for all text (matching TextOverlay)
            
            // Determine font style (italic)
            const fontStyle = textItem.style.fontStyle || 'normal';
            
            // Set text style to match slide exactly
            ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${fontFamily}`;
            ctx.fillStyle = textItem.style.color || '#ffffff';
            ctx.textAlign = textItem.style.textAlign || 'center';
            ctx.textBaseline = 'middle';
            
            // Text wrapping to match slide width (matching TextOverlay behavior)
            const maxWidth = width * 0.87; // 87% of canvas width for text (matching TextOverlay maxWidth)
            const words = textItem.content.split(' ');
            const lines = [];
            let currentLine = words[0] || '';
            
            for (let i = 1; i < words.length; i++) {
              const word = words[i];
              const testLine = currentLine + ' ' + word;
              const testWidth = ctx.measureText(testLine).width;
              
              if (testWidth > maxWidth) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            lines.push(currentLine);
            
            // Calculate text dimensions and positioning
            const lineHeight = scaledFontSize * 1.3; // Match TextOverlay lineHeight
            const totalHeight = lines.length * lineHeight;
            const startY = y - (totalHeight / 2) + (lineHeight / 2);
            
            // Calculate text bounds for background
            const textBounds = {
              minX: x - (maxWidth / 2),
              maxX: x + (maxWidth / 2),
              minY: startY - (lineHeight / 2),
              maxY: startY + (totalHeight - lineHeight / 2)
            };
            
            // Draw caption background if enabled
            if (textItem.style.captionBackground) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
              const padding = Math.round(scaledFontSize * 0.5); // Scale padding with font size
              const borderRadius = Math.round(scaledFontSize * 0.3);
              
              // Draw rounded rectangle background
              const bgX = textBounds.minX - padding;
              const bgY = textBounds.minY - padding;
              const bgWidth = textBounds.maxX - textBounds.minX + (padding * 2);
              const bgHeight = textBounds.maxY - textBounds.minY + (padding * 2);
              
              // Draw rounded rectangle
              ctx.beginPath();
              ctx.roundRect(bgX, bgY, bgWidth, bgHeight, borderRadius);
              ctx.fill();
            }
            
            // Handle text rendering with proper styling
            // Render black outline first (EXTREMELY thick outline)
            ctx.fillStyle = '#000000';
            lines.forEach((line, index) => {
              const lineY = startY + (index * lineHeight);
              // Create EXTREMELY thick outline with maximum offset positions
              ctx.fillText(line, x-8, lineY-8);
              ctx.fillText(line, x-7, lineY-8);
              ctx.fillText(line, x-6, lineY-8);
              ctx.fillText(line, x-5, lineY-8);
              ctx.fillText(line, x-4, lineY-8);
              ctx.fillText(line, x-3, lineY-8);
              ctx.fillText(line, x-2, lineY-8);
              ctx.fillText(line, x-1, lineY-8);
              ctx.fillText(line, x+1, lineY-8);
              ctx.fillText(line, x+2, lineY-8);
              ctx.fillText(line, x+3, lineY-8);
              ctx.fillText(line, x+4, lineY-8);
              ctx.fillText(line, x+5, lineY-8);
              ctx.fillText(line, x+6, lineY-8);
              ctx.fillText(line, x+7, lineY-8);
              ctx.fillText(line, x+8, lineY-8);
              
              ctx.fillText(line, x-8, lineY-7);
              ctx.fillText(line, x+8, lineY-7);
              ctx.fillText(line, x-8, lineY-6);
              ctx.fillText(line, x+8, lineY-6);
              ctx.fillText(line, x-8, lineY-5);
              ctx.fillText(line, x+8, lineY-5);
              ctx.fillText(line, x-8, lineY-4);
              ctx.fillText(line, x+8, lineY-4);
              ctx.fillText(line, x-8, lineY-3);
              ctx.fillText(line, x+8, lineY-3);
              ctx.fillText(line, x-8, lineY-2);
              ctx.fillText(line, x+8, lineY-2);
              ctx.fillText(line, x-8, lineY-1);
              ctx.fillText(line, x+8, lineY-1);
              ctx.fillText(line, x-8, lineY+1);
              ctx.fillText(line, x+8, lineY+1);
              ctx.fillText(line, x-8, lineY+2);
              ctx.fillText(line, x+8, lineY+2);
              ctx.fillText(line, x-8, lineY+3);
              ctx.fillText(line, x+8, lineY+3);
              ctx.fillText(line, x-8, lineY+4);
              ctx.fillText(line, x+8, lineY+4);
              ctx.fillText(line, x-8, lineY+5);
              ctx.fillText(line, x+8, lineY+5);
              ctx.fillText(line, x-8, lineY+6);
              ctx.fillText(line, x+8, lineY+6);
              ctx.fillText(line, x-8, lineY+7);
              ctx.fillText(line, x+8, lineY+7);
              
              ctx.fillText(line, x-8, lineY+8);
              ctx.fillText(line, x-7, lineY+8);
              ctx.fillText(line, x-6, lineY+8);
              ctx.fillText(line, x-5, lineY+8);
              ctx.fillText(line, x-4, lineY+8);
              ctx.fillText(line, x-3, lineY+8);
              ctx.fillText(line, x-2, lineY+8);
              ctx.fillText(line, x-1, lineY+8);
              ctx.fillText(line, x+1, lineY+8);
              ctx.fillText(line, x+2, lineY+8);
              ctx.fillText(line, x+3, lineY+8);
              ctx.fillText(line, x+4, lineY+8);
              ctx.fillText(line, x+5, lineY+8);
              ctx.fillText(line, x+6, lineY+8);
              ctx.fillText(line, x+7, lineY+8);
              ctx.fillText(line, x+8, lineY+8);
            });
            
            // Then render white text on top
            ctx.fillStyle = textItem.style.color || '#ffffff';
            lines.forEach((line, index) => {
              const lineY = startY + (index * lineHeight);
              ctx.fillText(line, x, lineY);
            });
          });
        }
    
    // Convert to blob and download - optimized for social media
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, mimeType, format === 'jpeg' ? 0.92 : 1.0); // Higher quality for social media
    });

    // Download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slideTitle}.${format}`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('Download completed:', `${slideTitle}.${format}`);
    return { success: true, filename: `${slideTitle}.${format}` };
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error(`Download failed: ${error.message}`);
  }
};

/**
 * Download all slides as a zip
 */
export const downloadAllSlides = async (slideElements, projectName = 'slides') => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    for (let i = 0; i < slideElements.length; i++) {
      const slideElement = slideElements[i];
      
      if (!slideElement) continue;
      
      try {
        const slideData = slideElement.getAttribute('data-slide-data');
        if (!slideData) continue;
        
        const slide = JSON.parse(slideData);
        
        // Create canvas for this slide
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size - ULTRA HIGH QUALITY
        const aspectRatio = slide.ratio === '16/9' ? 16/9 : slide.ratio === '4:3' ? 4/3 : slide.ratio === '1:1' ? 1 : 9/16;
        const width = 3240; // Triple resolution for ultra high quality
        const height = Math.round(width / aspectRatio);
        
        canvas.width = width;
        canvas.height = height;
        
        // Ensure proper color space for social media compatibility
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Load and draw background image or color
        if (slide.backgroundColor) {
          // Draw color background
          ctx.fillStyle = slide.backgroundColor;
          ctx.fillRect(0, 0, width, height);
        } else if (slide.image && slide.image.image_url) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            // Force high quality image loading
            const imageUrl = slide.image.image_url.includes('?') 
              ? `${slide.image.image_url}&quality=100&w=3240`
              : `${slide.image.image_url}?quality=100&w=3240`;
            
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = imageUrl;
            });
            
            const imgAspect = img.width / img.height;
            const canvasAspect = width / height;
            
            let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
            
            if (imgAspect > canvasAspect) {
              drawHeight = height;
              drawWidth = height * imgAspect;
              offsetX = (width - drawWidth) / 2;
            } else {
              drawWidth = width;
              drawHeight = width / imgAspect;
              offsetY = (height - drawHeight) / 2;
            }
            
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            
          } catch (error) {
            console.warn(`Failed to load image for slide ${i + 1}:`, error);
          }
        }
        
        // Draw text overlays with proper styling
        if (slide.texts && slide.texts.length > 0) {
          slide.texts.forEach(textItem => {
            if (!textItem.content || textItem.content.trim() === '') return;
            
            // Convert percentage positions to pixel positions
            const x = (textItem.position.x / 100) * width;
            const y = (textItem.position.y / 100) * height;
            
            // Parse font size (remove 'px' and convert to number) - EXACT MATCH
            const fontSize = parseInt(textItem.style.fontSize) || 14;
            const scaledFontSize = Math.round((fontSize / 400) * width); // Scale based on canvas width
            
            // Determine font family - match TextOverlay logic exactly
            let fontFamily = 'Inter, sans-serif';
            if (textItem.style.caption !== false) {
              fontFamily = 'Montserrat, sans-serif';
            } else if (textItem.style.fontFamily) {
              fontFamily = textItem.style.fontFamily;
            }
            
            // Determine font weight - match TextOverlay logic exactly
            let fontWeight = 'bold'; // Always bold for all text (matching TextOverlay)
            
            // Determine font style (italic)
            const fontStyle = textItem.style.fontStyle || 'normal';
            
            // Set text style to match slide exactly
            ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${fontFamily}`;
            ctx.fillStyle = textItem.style.color || '#ffffff';
            ctx.textAlign = textItem.style.textAlign || 'center';
            ctx.textBaseline = 'middle';
            
            // Text wrapping to match slide width (matching TextOverlay behavior)
            const maxWidth = width * 0.87; // 87% of canvas width for text (matching TextOverlay maxWidth)
            const words = textItem.content.split(' ');
            const lines = [];
            let currentLine = words[0] || '';
            
            for (let i = 1; i < words.length; i++) {
              const word = words[i];
              const testLine = currentLine + ' ' + word;
              const testWidth = ctx.measureText(testLine).width;
              
              if (testWidth > maxWidth) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            lines.push(currentLine);
            
            // Calculate text dimensions and positioning
            const lineHeight = scaledFontSize * 1.3; // Match TextOverlay lineHeight
            const totalHeight = lines.length * lineHeight;
            const startY = y - (totalHeight / 2) + (lineHeight / 2);
            
            // Calculate text bounds for background
            const textBounds = {
              minX: x - (maxWidth / 2),
              maxX: x + (maxWidth / 2),
              minY: startY - (lineHeight / 2),
              maxY: startY + (totalHeight - lineHeight / 2)
            };
            
            // Draw caption background if enabled
            if (textItem.style.captionBackground) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
              const padding = Math.round(scaledFontSize * 0.5); // Scale padding with font size
              const borderRadius = Math.round(scaledFontSize * 0.3);
              
              // Draw rounded rectangle background
              const bgX = textBounds.minX - padding;
              const bgY = textBounds.minY - padding;
              const bgWidth = textBounds.maxX - textBounds.minX + (padding * 2);
              const bgHeight = textBounds.maxY - textBounds.minY + (padding * 2);
              
              // Draw rounded rectangle
              ctx.beginPath();
              ctx.roundRect(bgX, bgY, bgWidth, bgHeight, borderRadius);
              ctx.fill();
            }
            
            // Handle text rendering with proper styling
            // Render black outline first (EXTREMELY thick outline)
            ctx.fillStyle = '#000000';
            lines.forEach((line, index) => {
              const lineY = startY + (index * lineHeight);
              // Create EXTREMELY thick outline with maximum offset positions
              ctx.fillText(line, x-8, lineY-8);
              ctx.fillText(line, x-7, lineY-8);
              ctx.fillText(line, x-6, lineY-8);
              ctx.fillText(line, x-5, lineY-8);
              ctx.fillText(line, x-4, lineY-8);
              ctx.fillText(line, x-3, lineY-8);
              ctx.fillText(line, x-2, lineY-8);
              ctx.fillText(line, x-1, lineY-8);
              ctx.fillText(line, x+1, lineY-8);
              ctx.fillText(line, x+2, lineY-8);
              ctx.fillText(line, x+3, lineY-8);
              ctx.fillText(line, x+4, lineY-8);
              ctx.fillText(line, x+5, lineY-8);
              ctx.fillText(line, x+6, lineY-8);
              ctx.fillText(line, x+7, lineY-8);
              ctx.fillText(line, x+8, lineY-8);
              
              ctx.fillText(line, x-8, lineY-7);
              ctx.fillText(line, x+8, lineY-7);
              ctx.fillText(line, x-8, lineY-6);
              ctx.fillText(line, x+8, lineY-6);
              ctx.fillText(line, x-8, lineY-5);
              ctx.fillText(line, x+8, lineY-5);
              ctx.fillText(line, x-8, lineY-4);
              ctx.fillText(line, x+8, lineY-4);
              ctx.fillText(line, x-8, lineY-3);
              ctx.fillText(line, x+8, lineY-3);
              ctx.fillText(line, x-8, lineY-2);
              ctx.fillText(line, x+8, lineY-2);
              ctx.fillText(line, x-8, lineY-1);
              ctx.fillText(line, x+8, lineY-1);
              ctx.fillText(line, x-8, lineY+1);
              ctx.fillText(line, x+8, lineY+1);
              ctx.fillText(line, x-8, lineY+2);
              ctx.fillText(line, x+8, lineY+2);
              ctx.fillText(line, x-8, lineY+3);
              ctx.fillText(line, x+8, lineY+3);
              ctx.fillText(line, x-8, lineY+4);
              ctx.fillText(line, x+8, lineY+4);
              ctx.fillText(line, x-8, lineY+5);
              ctx.fillText(line, x+8, lineY+5);
              ctx.fillText(line, x-8, lineY+6);
              ctx.fillText(line, x+8, lineY+6);
              ctx.fillText(line, x-8, lineY+7);
              ctx.fillText(line, x+8, lineY+7);
              
              ctx.fillText(line, x-8, lineY+8);
              ctx.fillText(line, x-7, lineY+8);
              ctx.fillText(line, x-6, lineY+8);
              ctx.fillText(line, x-5, lineY+8);
              ctx.fillText(line, x-4, lineY+8);
              ctx.fillText(line, x-3, lineY+8);
              ctx.fillText(line, x-2, lineY+8);
              ctx.fillText(line, x-1, lineY+8);
              ctx.fillText(line, x+1, lineY+8);
              ctx.fillText(line, x+2, lineY+8);
              ctx.fillText(line, x+3, lineY+8);
              ctx.fillText(line, x+4, lineY+8);
              ctx.fillText(line, x+5, lineY+8);
              ctx.fillText(line, x+6, lineY+8);
              ctx.fillText(line, x+7, lineY+8);
              ctx.fillText(line, x+8, lineY+8);
            });
            
            // Then render white text on top
            ctx.fillStyle = textItem.style.color || '#ffffff';
            lines.forEach((line, index) => {
              const lineY = startY + (index * lineHeight);
              ctx.fillText(line, x, lineY);
                          });
          });
        }
        
        // Add to zip - optimized for social media
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          }, 'image/png', 1.0); // Maximum quality for social media
        });
        
        zip.file(`slide-${i + 1}.png`, blob);
        
      } catch (error) {
        console.warn(`Slide ${i + 1} failed:`, error);
      }
    }
    
    // Download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName}.zip`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to download slides: ${error.message}`);
  }
};
