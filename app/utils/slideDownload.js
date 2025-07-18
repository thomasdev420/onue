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
    
    // Set canvas size based on ratio (9:16 for social media) - HIGHER QUALITY
    const aspectRatio = slide.ratio === '16:9' ? 16/9 : slide.ratio === '4:3' ? 4/3 : slide.ratio === '1:1' ? 1 : 9/16;
    const width = 2160; // Double the resolution for high quality
    const height = Math.round(width / aspectRatio);
    
    canvas.width = width;
    canvas.height = height;
    
    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Load and draw the background image
    if (slide.image && slide.image.image_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = slide.image.image_url;
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
        const fontSize = parseInt(textItem.style.fontSize) || 18;
        const scaledFontSize = Math.round((fontSize / 400) * width); // Scale based on canvas width
        
        // Set text style to match slide exactly
        ctx.font = `${textItem.style.fontWeight || 'normal'} ${scaledFontSize}px ${textItem.style.fontFamily || 'Inter, sans-serif'}`;
        ctx.fillStyle = textItem.style.color || '#ffffff';
        ctx.textAlign = textItem.style.textAlign || 'center';
        ctx.textBaseline = 'middle';
        
        // Add text shadow if specified (matching slide styling)
        if (textItem.style.textShadow) {
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 8; // Increased for higher resolution
          ctx.shadowOffsetX = 4;
          ctx.shadowOffsetY = 4;
        }
        
        // Text wrapping to match slide width
        const maxWidth = width * 0.8; // 80% of canvas width for text
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
        
        // Calculate text dimensions for background
        const lineHeight = scaledFontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        
        // Add background padding behind text (matching slide styling)
        const padding = scaledFontSize * 0.5; // Proportional padding
        const bgWidth = maxLineWidth + (padding * 2);
        const bgHeight = totalHeight + (padding * 2);
        const bgX = x - (bgWidth / 2);
        const bgY = y - (bgHeight / 2);
        
        // Draw background with semi-transparent black
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
        
        // Reset text color
        ctx.fillStyle = textItem.style.color || '#ffffff';
        
        // Draw each line with proper spacing
        const startY = y - (totalHeight / 2) + (lineHeight / 2);
        
        lines.forEach((line, index) => {
          ctx.fillText(line, x, startY + (index * lineHeight));
        });
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      });
    }
    
    // Convert to blob and download
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, mimeType, quality);
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
        
        // Set canvas size - HIGHER QUALITY
        const aspectRatio = slide.ratio === '16:9' ? 16/9 : slide.ratio === '4:3' ? 4/3 : slide.ratio === '1:1' ? 1 : 9/16;
        const width = 2160; // Double resolution
        const height = Math.round(width / aspectRatio);
        
        canvas.width = width;
        canvas.height = height;
        
        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Load and draw background image
        if (slide.image && slide.image.image_url) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = slide.image.image_url;
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
            const fontSize = parseInt(textItem.style.fontSize) || 18;
            const scaledFontSize = Math.round((fontSize / 400) * width); // Scale based on canvas width
            
            // Set text style to match slide exactly
            ctx.font = `${textItem.style.fontWeight || 'normal'} ${scaledFontSize}px ${textItem.style.fontFamily || 'Inter, sans-serif'}`;
            ctx.fillStyle = textItem.style.color || '#ffffff';
            ctx.textAlign = textItem.style.textAlign || 'center';
            ctx.textBaseline = 'middle';
            
            // Text wrapping to match slide width
            const maxWidth = width * 0.8; // 80% of canvas width for text
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
            
            // Calculate text dimensions for background
            const lineHeight = scaledFontSize * 1.2;
            const totalHeight = lines.length * lineHeight;
            const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
            
            // Add background padding behind text (matching slide styling)
            const padding = scaledFontSize * 0.5; // Proportional padding
            const bgWidth = maxLineWidth + (padding * 2);
            const bgHeight = totalHeight + (padding * 2);
            const bgX = x - (bgWidth / 2);
            const bgY = y - (bgHeight / 2);
            
            // Draw background with semi-transparent black
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
            
            // Reset text color
            ctx.fillStyle = textItem.style.color || '#ffffff';
            
            // Add text shadow if specified (matching slide styling)
            if (textItem.style.textShadow) {
              ctx.shadowColor = 'rgba(0,0,0,0.8)';
              ctx.shadowBlur = 8; // Increased for higher resolution
              ctx.shadowOffsetX = 4;
              ctx.shadowOffsetY = 4;
            }
            
            // Draw each line with proper spacing
            const startY = y - (totalHeight / 2) + (lineHeight / 2);
            
            lines.forEach((line, index) => {
              ctx.fillText(line, x, startY + (index * lineHeight));
            });
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          });
        }
        
        // Add to zip
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          }, 'image/png', 0.95);
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
