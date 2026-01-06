import { openai } from '@/lib/openai/client';

/**
 * Generate a diagram/image for a math question using DALL-E
 */
/**
 * Generate a simple 2D educational diagram for a math question using DALL-E
 * CRITICAL: Must be simple, clear, 2D educational diagrams - NOT 3D or complex technical drawings
 */
export async function generateQuestionDiagram(
  questionNumber: number,
  questionText: string,
  concept: string,
  questionType: string
): Promise<string | undefined> {
  try {
    // Generate images for geometry questions - check for geometry keywords
    const hasGeometry = questionText.toLowerCase().match(/(semicircle|triangle|circle|angle|diameter|radius|inscribed)/);
    if (questionType !== 'geometry_with_diagram' && !hasGeometry) {
      return undefined;
    }

    // Extract key elements from question for the diagram
    const hasSemicircle = questionText.toLowerCase().includes('semicircle');
    const hasTriangle = questionText.toLowerCase().includes('triangle');
    const hasCircle = questionText.toLowerCase().includes('circle');
    
    // Extract EXACT measurements and angles from question text - CRITICAL for matching
    // Look for diameter patterns: "diameter of 14 cm", "diameter 20 meters", etc.
    const diameterMatch = questionText.match(/diameter\s+(?:of\s+)?(\d+)\s*(cm|m|meters?|units?|feet?)/i);
    // Look for radius patterns
    const radiusMatch = questionText.match(/radius\s+(?:of\s+)?(\d+)\s*(cm|m|meters?|units?|feet?)/i);
    // Look for all angle mentions
    const angleMatches = questionText.match(/(\d+)\s*degrees?/g);
    // Look for specific angle mentions like "one angle is 45 degrees"
    const baseAngleMatch = questionText.match(/(?:base\s+angle|one\s+(?:base\s+)?angle|angle|one\s+of\s+the\s+angles?)\s+(?:is\s+|of\s+|measuring\s+)?(\d+)\s*degrees?/i);
    // Look for "x" or unknown angle
    const hasXAngle = questionText.toLowerCase().includes('angle x') || questionText.toLowerCase().includes('angle labeled x');
    
    // Get all angles mentioned - extract unique values
    const angles: string[] = [];
    const seenAngles = new Set<number>();
    
    if (angleMatches) {
      angleMatches.forEach(m => {
        const num = parseInt(m.match(/(\d+)/)?.[1] || '0');
        if (num > 0 && num <= 180 && !seenAngles.has(num)) {
          seenAngles.add(num);
          angles.push(`${num}°`);
        }
      });
    }
    if (baseAngleMatch) {
      const num = parseInt(baseAngleMatch[1]);
      if (num > 0 && num <= 180 && !seenAngles.has(num)) {
        seenAngles.add(num);
        angles.push(`${num}°`);
      }
    }
    if (hasXAngle && !angles.includes('x')) {
      angles.push('x');
    }
    
    // Get diameter/radius with unit - prioritize diameter
    let diameter = '';
    let unit = 'cm';
    if (diameterMatch) {
      diameter = diameterMatch[1];
      unit = diameterMatch[2] || 'cm';
    } else if (radiusMatch) {
      const radius = parseInt(radiusMatch[1]);
      diameter = (radius * 2).toString();
      unit = radiusMatch[2] || 'cm';
    }
    
    // Create a VERY SPECIFIC prompt for simple 2D educational diagrams
    // CRITICAL: Use EXACT values from the question text
    const diagramPrompt = `A very simple, small 2D line drawing geometry diagram for a Grade 9 math textbook question.

CRITICAL REQUIREMENTS - MUST FOLLOW EXACTLY:
- Extremely simple 2D line drawing - flat, NO 3D, NO perspective, NO depth, NO shading, NO texture
- Black thin lines ONLY on pure white background
- Small size - should fit in a small box next to text, NOT full screen
- Simple geometric shapes: ${hasSemicircle ? 'a semicircle' : ''} ${hasTriangle ? 'with a triangle inside' : ''}
${diameter ? `- Diameter MUST be labeled exactly: "${diameter} ${unit}"` : ''}
${angles.length > 0 ? `- Angles MUST be labeled exactly: ${angles.join(', ')}` : '- One angle labeled "x"'}
- Style: Like a tiny simple diagram in a math book - minimal, clean, educational
- NO decorative elements, NO tools, NO objects, NO background, NO grid, NO protractor markings
- NO complex patterns, NO technical drawings, NO blueprints
- Just the basic shape with labels matching the question text EXACTLY

The diagram must show EXACTLY what the question describes:
${hasSemicircle && hasTriangle ? `A semicircle${diameter ? ` with diameter labeled "${diameter} ${unit}"` : ''}. A triangle is inscribed with its base as the diameter.` : ''}
${angles.length > 0 ? `Angles labeled: ${angles.join(', ')}` : 'One angle labeled x'}
${diameter ? `The diameter measurement "${diameter} ${unit}" MUST be clearly visible in the diagram.` : ''}

Make it SMALL and SIMPLE - like a 2-inch square diagram that fits next to text in a textbook.

CRITICAL: The numbers and labels in the diagram MUST match the question text EXACTLY. If the question says "diameter of 14 cm", the diagram MUST show "14 cm". If the question says "one angle is 45 degrees", the diagram MUST show "45°".`;

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: diagramPrompt,
      size: '1024x1024', // DALL-E 3 only supports 1024x1024, 1024x1792, or 1792x1024
      quality: 'standard',
      n: 1,
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      console.warn(`Failed to generate image for question ${questionNumber}`);
      return undefined;
    }
    
    return imageUrl;
  } catch (error) {
    console.error(`Error generating diagram for question ${questionNumber}:`, error);
    // Don't fail the entire generation if image generation fails
    return undefined;
  }
}

/**
 * Download image from URL and convert to base64 data URL
 */
export async function downloadImageAsDataUrl(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    // Use Buffer in Node.js environment
    const base64 = typeof Buffer !== 'undefined' 
      ? Buffer.from(arrayBuffer).toString('base64')
      : btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const contentType = response.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

