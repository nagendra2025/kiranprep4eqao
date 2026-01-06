/**
 * Detects the type of math question to determine which prompt template to use
 */
export type QuestionType = 
  | 'geometry_with_diagram'
  | 'algebra'
  | 'graph'
  | 'table'
  | 'fractions'
  | 'exponents'
  | 'equations'
  | 'percentage'
  | 'number_operations'
  | 'mixed';

export interface QuestionTypeAnalysis {
  type: QuestionType;
  hasVisual: boolean;
  concept: string;
  keywords: string[];
}

export function detectQuestionType(sourceQuestion: string, hasImage: boolean): QuestionTypeAnalysis {
  const questionLower = sourceQuestion.toLowerCase();
  
  // Check for visual elements
  const hasVisual = hasImage || 
    questionLower.includes('diagram') ||
    questionLower.includes('graph') ||
    questionLower.includes('table') ||
    questionLower.includes('chart') ||
    questionLower.includes('figure') ||
    questionLower.includes('shown');

  // Geometry keywords
  const geometryKeywords = [
    'triangle', 'circle', 'semicircle', 'rectangle', 'square', 'angle', 'degrees',
    'perimeter', 'area', 'volume', 'diameter', 'radius', 'inscribed', 'circumscribed',
    'parallel', 'perpendicular', 'congruent', 'similar', 'polygon', 'quadrilateral'
  ];

  // Algebra keywords
  const algebraKeywords = [
    'solve', 'equation', 'variable', 'x =', 'y =', 'linear', 'quadratic',
    'expression', 'simplify', 'factor', 'expand', 'substitute'
  ];

  // Graph keywords
  const graphKeywords = [
    'graph', 'plot', 'coordinate', 'axis', 'axes', 'slope', 'intercept',
    'line', 'curve', 'point', 'ordered pair'
  ];

  // Table keywords
  const tableKeywords = [
    'table', 'chart', 'data', 'frequency', 'mean', 'median', 'mode',
    'statistics', 'probability'
  ];

  // Fraction keywords
  const fractionKeywords = [
    'fraction', '/', 'numerator', 'denominator', 'divide', 'quotient'
  ];

  // Exponent keywords
  const exponentKeywords = [
    'exponent', 'power', 'squared', 'cubed', '^', 'raised to'
  ];

  // Percentage keywords
  const percentageKeywords = [
    'percent', '%', 'percentage', 'discount', 'tax', 'interest'
  ];

  // Count matches
  const geometryCount = geometryKeywords.filter(k => questionLower.includes(k)).length;
  const algebraCount = algebraKeywords.filter(k => questionLower.includes(k)).length;
  const graphCount = graphKeywords.filter(k => questionLower.includes(k)).length;
  const tableCount = tableKeywords.filter(k => questionLower.includes(k)).length;
  const fractionCount = fractionKeywords.filter(k => questionLower.includes(k)).length;
  const exponentCount = exponentKeywords.filter(k => questionLower.includes(k)).length;
  const percentageCount = percentageKeywords.filter(k => questionLower.includes(k)).length;

  // Determine type
  let type: QuestionType = 'mixed';
  let concept = 'general mathematics';
  const keywords: string[] = [];

  if (hasVisual && geometryCount > 0) {
    type = 'geometry_with_diagram';
    concept = 'geometry with visual diagrams';
    keywords.push(...geometryKeywords.filter(k => questionLower.includes(k)));
  } else if (graphCount > 0) {
    type = 'graph';
    concept = 'graph analysis';
    keywords.push(...graphKeywords.filter(k => questionLower.includes(k)));
  } else if (tableCount > 0) {
    type = 'table';
    concept = 'data analysis';
    keywords.push(...tableKeywords.filter(k => questionLower.includes(k)));
  } else if (geometryCount > 2) {
    type = 'geometry_with_diagram';
    concept = 'geometry';
    keywords.push(...geometryKeywords.filter(k => questionLower.includes(k)));
  } else if (algebraCount > 1) {
    type = 'algebra';
    concept = 'algebraic equations';
    keywords.push(...algebraKeywords.filter(k => questionLower.includes(k)));
  } else if (fractionCount > 1) {
    type = 'fractions';
    concept = 'fraction operations';
    keywords.push(...fractionKeywords.filter(k => questionLower.includes(k)));
  } else if (exponentCount > 0) {
    type = 'exponents';
    concept = 'exponent operations';
    keywords.push(...exponentKeywords.filter(k => questionLower.includes(k)));
  } else if (percentageCount > 0) {
    type = 'percentage';
    concept = 'percentage calculations';
    keywords.push(...percentageKeywords.filter(k => questionLower.includes(k)));
  }

  return {
    type,
    hasVisual,
    concept,
    keywords: [...new Set(keywords)], // Remove duplicates
  };
}

