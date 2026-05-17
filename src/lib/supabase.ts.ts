import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const CLINIC = {
  name: 'קליניקת יואב אבני',
  nameEn: 'YOAVAVNI',
  address: 'תרשיש 8, גילון',
  phone: '054-5953889',
  email: 'yoav@avni-clinic.co.il',
  businessNum: '305111551',
  ptLicense: '10-163580',
}

export const SERVICES = [
  { id: 'physio',        name_he: 'טיפול פרטי',               icon: '🦴', color: '#1e4a7a', price: 360,  duration: 45 },
  { id: 'physio_local',  name_he: 'פיזיותרפיה (גילון/צורית)', icon: '🦴', color: '#1e4a7a', price: 330,  duration: 45 },
  { id: 'hydro',         name_he: 'פיזיותרפיה במים',           icon: '💧', color: '#0891b2', price: 340,  duration: 60 },
  { id: 'home',          name_he: 'ביקור בית',                  icon: '🏠', color: '#0b8a5e', price: 400,  duration: 60 },
  { id: 'online',        name_he: 'טיפול אונליין',              icon: '💻', color: '#7c3aed', price: 360,  duration: 40 },
  { id: 'run_basic',     name_he: 'קבוצת ריצה — היברידית',     icon: '🏃', color: '#7c3aed', price: 650,  duration: 60 },
  { id: 'run_plus',      name_he: 'קבוצת ריצה — היברידית+',   icon: '🏃', color: '#6d28d9', price: 1000, duration: 60 },
  { id: 'run_premium',   name_he: 'קבוצת ריצה — פרמיום',       icon: '🏆', color: '#4c1d95', price: 1500, duration: 60 },
  { id: 'rehab_group',   name_he: 'שיקום קבוצתי',               icon: '👥', color: '#be185d', price: 140,  duration: 60 },
  { id: 'ortho',         name_he: 'מדרסים',                     icon: '🦿', color: '#854d0e', price: 1500, duration: 60 },
]

export const HMO_OPTIONS = [
  'כללית מושלם', 'כללית פלטינום', 'כללית', 
  'מכבי שלי', 'מכבי', 'מאוחדת', 'לאומית', 
  'ביטוח פרטי', 'ללא'
]

export const APPOINTMENT_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  confirmed: { label: 'אושר',    bg: '#d1fae5', color: '#065f46' },
  pending:   { label: 'ממתין',   bg: '#fef3c7', color: '#92400e' },
  arrived:   { label: 'הגיע',   bg: '#dbeafe', color: '#1e4a7a' },
  completed: { label: 'הושלם',  bg: '#f3e8ff', color: '#6b21a8' },
  cancelled: { label: 'בוטל',   bg: '#fee2e2', color: '#991b1b' },
  no_show:   { label: 'לא הגיע', bg: '#f1f5f9', color: '#475569' },
}
