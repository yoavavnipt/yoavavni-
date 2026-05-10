// מאגר הודעות WhatsApp לקליניקת יואב אבני

export interface MessageTemplate {
  id: string
  label: string
  icon: string
  getMessage: (params: MessageParams) => string
}

export interface MessageParams {
  patientName: string
  date?: string
  time?: string
  serviceType?: string
  price?: number
  therapistName?: string
  exerciseLinks?: string[]
  invoiceAmount?: number
  city?: string
}

const CLINIC_FOOTER = `
בברכה,
קליניקת יואב אבני 🏥
📍 רחוב התרשיש 8, גילון
🌐 https://www.yoav-avni-clinic.com
📸 https://www.instagram.com/yoavavni.pt`

function getPriceByService(serviceType: string, city?: string): number {
  const isLocal = city && (city.includes('גילון') || city.includes('צורית'))
  
  const prices: Record<string, number> = {
    'פיזיותרפיה': isLocal ? 330 : 350,
    'הידרותרפיה': 420,
    'ביקור בית': 550,
    'קבוצת ריצה': 480,
    'שיקום קבוצתי': 380,
    'אורתוטיקה': 850,
    'ייעוץ אונליין': 280,
    'שיקום ספורטיבי': 380,
  }
  return prices[serviceType] || 350
}

function getDuration(serviceType: string): string {
  const durations: Record<string, string> = {
    'פיזיותרפיה': '45-50 דקות',
    'הידרותרפיה': '60 דקות',
    'ביקור בית': '60 דקות',
    'קבוצת ריצה': '90 דקות',
    'שיקום קבוצתי': '60 דקות',
    'אורתוטיקה': '60 דקות',
    'ייעוץ אונליין': '30 דקות',
    'שיקום ספורטיבי': '45 דקות',
  }
  return durations[serviceType] || '45-50 דקות'
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'welcome_physio',
    label: 'ברוך הבא — פיזיותרפיה',
    icon: '👋',
    getMessage: ({ patientName, date, time, city }) => {
      const price = getPriceByService('פיזיותרפיה', city)
      const isLocal = city && (city.includes('גילון') || city.includes('צורית'))
      return `בוקר טוב ${patientName} 😊

קבענו טיפול פיזיותרפיה בתאריך ${date || '___'} בשעה ${time || '___'}
טיפול פיזיותרפיה אורך 45-50 דקות.
עלות ${price} ₪ לטיפול${isLocal ? ' לתושבי גילון וצורית' : ''}.

נא להביא מכתב רופא או כל אינפורמציה רפואית רלוונטית.
ביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.
נא להגיע עם בגדים נוחים.
${CLINIC_FOOTER}`
    }
  },
  {
    id: 'welcome_hydro',
    label: 'ברוך הבא — הידרותרפיה',
    icon: '💧',
    getMessage: ({ patientName, date, time }) => {
      return `בוקר טוב ${patientName} 😊

קבענו טיפול הידרותרפיה בתאריך ${date || '___'} בשעה ${time || '___'}
טיפול הידרותרפיה אורך 60 דקות.
עלות 420 ₪ לטיפול.

נא להביא:
🩱 בגד ים
🏊 כובע ים (חובה)
🧴 מגבת
נא להביא מכתב רופא או כל אינפורמציה רפואית רלוונטית.
ביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.
${CLINIC_FOOTER}`
    }
  },
  {
    id: 'welcome_home',
    label: 'ברוך הבא — ביקור בית',
    icon: '🏠',
    getMessage: ({ patientName, date, time }) => {
      return `בוקר טוב ${patientName} 😊

קבענו ביקור בית בתאריך ${date || '___'} בשעה ${time || '___'}
הטיפול אורך כ-60 דקות.
עלות 550 ₪ לטיפול.

אנא הכינו מקום נוח ומרווח לטיפול.
ביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.
${CLINIC_FOOTER}`
    }
  },
  {
    id: 'welcome_online',
    label: 'ברוך הבא — ייעוץ אונליין',
    icon: '💻',
    getMessage: ({ patientName, date, time }) => {
      return `בוקר טוב ${patientName} 😊

קבענו ייעוץ אונליין בתאריך ${date || '___'} בשעה ${time || '___'}
הייעוץ אורך כ-30 דקות.
עלות 280 ₪.

הפגישה תתקיים בוידאו — אשלח לך קישור לפני הפגישה.
ביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.
${CLINIC_FOOTER}`
    }
  },
  {
    id: 'reminder',
    label: 'תזכורת לתור',
    icon: '⏰',
    getMessage: ({ patientName, date, time, serviceType }) => {
      return `שלום ${patientName} 😊

תזכורת — יש לך תור ${serviceType ? `ל${serviceType}` : ''} מחר ${date || ''} בשעה ${time || '___'}.

📍 רחוב התרשיש 8, גילון
לשינוי או ביטול — עד הערב ב-10:00.

מחכים לך! 🙏
קליניקת יואב אבני`
    }
  },
  {
    id: 'payment_request',
    label: 'בקשת תשלום',
    icon: '💳',
    getMessage: ({ patientName, invoiceAmount, serviceType }) => {
      return `שלום ${patientName},

בקשת תשלום עבור טיפול ${serviceType || ''}.
סכום לתשלום: ₪${invoiceAmount || '___'}

ניתן לשלם באמצעות:
💵 מזומן בקליניקה
💳 אשראי בקליניקה
📱 ביט / פייבוקס למספר: 054-5953889

תודה! 🙏
קליניקת יואב אבני`
    }
  },
  {
    id: 'exercises',
    label: 'תרגילי בית',
    icon: '🏋️',
    getMessage: ({ patientName, exerciseLinks }) => {
      const links = exerciseLinks && exerciseLinks.length > 0
        ? '\n\nסרטוני התרגילים שלך:\n' + exerciseLinks.map((l, i) => `${i + 1}. ${l}`).join('\n')
        : ''
      return `שלום ${patientName} 😊

מצורפים תרגילי הבית שלך לביצוע עד הטיפול הבא.
חשוב לבצע אותם כפי שהסברתי — כל יום או יומיים!${links}

לשאלות — אני כאן 💪
קליניקת יואב אבני`
    }
  },
  {
    id: 'book_again',
    label: 'תזכורת לתור נוסף',
    icon: '📅',
    getMessage: ({ patientName }) => {
      return `שלום ${patientName} 😊

רציתי להזכיר — חשוב לשמור על רצף הטיפולים להחלמה מיטבית!

לקביעת תור נוסף:
📞 054-5953889
🌐 https://www.yoav-avni-clinic.com

נשמח לראותך בקרוב! 💪
קליניקת יואב אבני`
    }
  },
]
