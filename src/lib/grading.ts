// Default grading scale based on the template
export interface GradeScale {
  min: number;
  max: number;
  grade: string;
  remarks: string;
}

export const DEFAULT_GRADING_SCALE: GradeScale[] = [
  { min: 80, max: 100, grade: 'A', remarks: 'Excellent' },
  { min: 75, max: 79, grade: 'B+', remarks: 'Very Good' },
  { min: 70, max: 74, grade: 'B', remarks: 'Good' },
  { min: 60, max: 69, grade: 'C', remarks: 'Credit' },
  { min: 50, max: 59, grade: 'D', remarks: 'Pass' },
  { min: 0, max: 49, grade: 'F', remarks: 'Fail' },
];

export function calculateGrade(
  total: number,
  gradingScale: GradeScale[] = DEFAULT_GRADING_SCALE
): { grade: string; remarks: string } {
  const scale = gradingScale.find(
    (s) => total >= s.min && total <= s.max
  );
  return scale || { grade: 'F', remarks: 'Fail' };
}

export function calculateClassPosition(
  studentAverage: number,
  allAverages: number[]
): number {
  const sortedAverages = [...allAverages].sort((a, b) => b - a);
  return sortedAverages.indexOf(studentAverage) + 1;
}

export function calculateSubjectPosition(
  studentScore: number,
  allScores: number[]
): number {
  const sortedScores = [...allScores].sort((a, b) => b - a);
  return sortedScores.indexOf(studentScore) + 1;
}

// Class progression mapping
export const CLASS_PROGRESSION: Record<string, string> = {
  'Crèche': 'Pre-Nursery',
  'Pre-Nursery': 'Nursery 1',
  'Nursery 1': 'Nursery 2',
  'Nursery 2': 'Nursery 3',
  'Nursery 3': 'Primary 1',
  'Primary 1': 'Primary 2',
  'Primary 2': 'Primary 3',
  'Primary 3': 'Primary 4',
  'Primary 4': 'Primary 5',
  'Primary 5': 'Primary 6',
  'Primary 6': 'JSS 1',
  'JSS 1': 'JSS 2',
  'JSS 2': 'JSS 3',
  'JSS 3': 'SSS 1',
  'SSS 1': 'SSS 2',
  'SSS 2': 'SSS 3',
  'SSS 3': 'Graduate',
};

export function getNextClass(currentClass: string): string | null {
  return CLASS_PROGRESSION[currentClass] || null;
}

export function canBePromoted(averageScore: number, passingMark: number = 50): boolean {
  return averageScore >= passingMark;
}
