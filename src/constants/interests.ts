export const STUDENT_INTERESTS = [
  'Academic',
  'Arts',
  'Career',
  'Community service',
  'Design',
  'Entrepreneurship',
  'Fitness',
  'Gaming',
  'Music',
  'Science & technology',
  'Sports',
  'Volunteering',
  'Writing',
] as const;

export type StudentInterest = (typeof STUDENT_INTERESTS)[number];
