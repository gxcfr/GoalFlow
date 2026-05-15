export function calculateProgressScore(
  targetValue: string, 
  actualValue: string | null | undefined, 
  uom: string, 
  targetDirection: string
): number | null {
  if (!actualValue || actualValue.trim() === '') return null;
  
  if (uom === 'Timeline') {
    const targetDate = new Date(targetValue).getTime();
    const actualDate = new Date(actualValue).getTime();
    if (isNaN(targetDate) || isNaN(actualDate)) return 0;
    return actualDate <= targetDate ? 100 : 0;
  }
  
  if (uom === 'Zero-based') {
    const actual = parseFloat(actualValue);
    if (isNaN(actual)) return 0;
    return actual === 0 ? 100 : 0;
  }

  // Numeric or Percentage
  const target = parseFloat(targetValue.replace(/[^0-9.-]/g, ''));
  const actual = parseFloat(actualValue.replace(/[^0-9.-]/g, ''));
  
  if (isNaN(target) || isNaN(actual)) return 0;
  if (target === 0 && actual === 0) return 100;
  if (target === 0) return 0;

  let score = 0;
  if (targetDirection === 'Maximize') {
    score = (actual / target) * 100;
  } else {
    // Minimize (Target / Achievement)
    if (actual === 0) return 100; // Perfect score if they hit 0
    score = (target / actual) * 100;
  }
  
  // Cap score between 0 and 150% for display purposes
  return Math.min(Math.max(score, 0), 150);
}

export function getStatusColor(status: string | null | undefined) {
  switch (status) {
    case 'Completed': return 'bg-green-500';
    case 'On Track': return 'bg-blue-500';
    case 'Behind': return 'bg-orange-500';
    case 'Not Started': return 'bg-gray-400';
    default: return 'bg-gray-200';
  }
}
