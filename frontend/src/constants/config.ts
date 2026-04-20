export const SESSION_TIMEOUT_MS = 30 * 60 * 1000  // 30 minutes
export const SESSION_WARN_MS   = 60 * 1000         // warn 1 minute before

export const MEDICAL_DOMAINS = [
  'Cardiology', 'Oncology', 'Radiology & Imaging', 'Neurology', 'Orthopedics',
  'Dermatology', 'Ophthalmology', 'Pediatrics', 'Psychiatry & Mental Health',
  'Emergency Medicine', 'Intensive Care (ICU)', 'Surgical Robotics',
  'Genomics & Precision Medicine', 'Rehabilitation & Physio', 'Clinical Pharmacy',
  'Public Health & Epidemiology', 'Pathology & Lab Diagnostics',
  'Endocrinology & Diabetes', 'Remote Patient Monitoring', 'Mental Health AI',
] as const

export const ENGINEERING_DOMAINS = [
  'Machine Learning / AI', 'Computer Vision', 'Natural Language Processing',
  'Embedded Systems / IoT', 'Biomedical Engineering', 'Backend / Cloud Engineering',
  'Frontend / UX Engineering', 'Data Engineering & Analytics',
  'Robotics & Mechatronics', 'Signal Processing', 'Healthcare Cybersecurity',
  'Regulatory Affairs (CE/FDA)',
] as const

export const EU_COUNTRIES = [
  'Austria', 'Belgium', 'Croatia', 'Czech Republic', 'Denmark', 'Estonia',
  'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy',
  'Latvia', 'Lithuania', 'Luxembourg', 'Netherlands', 'Norway', 'Poland',
  'Portugal', 'Romania', 'Spain', 'Sweden', 'Switzerland', 'Turkey',
  'Ukraine', 'United Kingdom',
] as const
