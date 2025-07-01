import { UserRole } from './types';

export const APP_NAME = "Dental Care Connect";
export const LOGO_URL = "https://raw.githubusercontent.com/hereandnowai/images/refs/heads/main/logos/HNAI%20Title%20-Teal%20%26%20Golden%20Logo%20-%20DESIGN%203%20-%20Raj-07.png";

// Example doctor specialties
export const DOCTOR_SPECIALTIES = [
  "General Dentistry",
  "Orthodontics",
  "Periodontics",
  "Endodontics",
  "Oral Surgery",
  "Pediatric Dentistry"
];

// For UI, mapping roles to display names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.Patient]: "Patient",
  [UserRole.Doctor]: "Doctor",
  [UserRole.Bot]: "Caramel AI",
};

export const AI_BOT_ID = 'ai-bot';
export const AI_BOT_NAME = 'Caramel AI'; // Updated Bot Name

// HERE AND NOW AI Information
export const HNAI_NAME_SHORT = "HERE AND NOW AI";
export const HNAI_NAME_LONG = "HERE AND NOW AI - Artificial Intelligence Research Institute";
export const HNAI_WEBSITE = "https://hereandnowai.com";
export const HNAI_EMAIL = "info@hereandnowai.com";
export const HNAI_MOBILE = "+91 996 296 1000";

export const HNAI_SOCIAL_LINKS = {
  blog: "https://hereandnowai.com/blog",
  linkedin: "https://www.linkedin.com/company/hereandnowai/",
  instagram: "https://instagram.com/hereandnow_ai",
  github: "https://github.com/hereandnowai",
  x: "https://x.com/hereandnow_ai",
  youtube: "https://youtube.com/@hereandnow_ai"
};
