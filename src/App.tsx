import { useMemo, useState, useEffect } from 'react';
import {
  Home,
  Wallet,
  ReceiptText,
  CalendarDays,
  Menu,
  Bell,
  Plus,
  Flower2,
  Users,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock3,
  CircleAlert,
  Languages,
  Download,
  TrendingUp,
  HandCoins,
  Landmark,
  Search,
  X,
  ArrowLeft,
  CalendarCheck,
  Megaphone,
  ShieldCheck,
  WifiOff,
  CircleDollarSign,
  FileSpreadsheet,
  RotateCcw,
  UserCheck,
  Trash2,
  Check,
  Smartphone,
  CreditCard,
  LogOut,
  LogIn,
  UserPlus,
  Copy,
  AlertCircle,
  BellRing,
  Send,
  AlertTriangle,
  Eye,
  EyeOff,
  KeyRound,
  Award,
  Crown,
  Medal,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { translations } from './translations';
import {
  isLiveBackend,
  initCloudSession,
  subscribeToIncome,
  subscribeToBills,
  subscribeToUsers,
  fetchAllUsersFromFirestore,
  fetchUserByPhoneFromFirestore,
  fetchIncomeFromFirestore,
  fetchBillsFromFirestore,
  saveIncomeToFirestore,
  updateIncomeStatusInFirestore,
  saveBillToFirestore,
  updateBillStatusInFirestore,
  payBillInFirestore,
  saveUserToFirestore,
  updateUserPasswordInFirestore,
  updateUserCommitmentInFirestore,
  updateUserApprovalInFirestore,
  updateUserDesignationInFirestore,
} from './services/backendService';

export type Tab =
  | 'home'
  | 'income'
  | 'expenses'
  | 'calendar'
  | 'more'
  | 'members'
  | 'committee'
  | 'pronami'
  | 'request'
  | 'notifications'
  | 'contributions'
  | 'reconciliation'
  | 'report'
  | 'bill'
  | 'bkash-pay';

export type IncomeType = 'pronami' | 'contribution';
export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Bank';
export type IncomeStatus = 'Confirmed' | 'Pending' | 'Rejected';
export type MemberRole = 'Admin' | 'Member';
export type ApprovalStatus = 'Approved' | 'Pending' | 'Rejected';

export interface User {
  id: number;
  name: string;
  phone: string;
  role: MemberRole;
  password?: string;
  paid: boolean;
  active: boolean;
  monthlyCommitment?: number;
  approvalStatus?: ApprovalStatus;
  designation?: string;
  joinedAt?: string;
}

export const COMMITTEE_DESIGNATIONS = [
  'সভাপতি',
  'সহ-সভাপতি',
  'সাধারণ সম্পাদক',
  'যুগ্ম সাধারণ সম্পাদক',
  'কোষাধ্যক্ষ',
  'সাংগঠনিক সম্পাদক',
  'পূজা উদযাপন সম্পাদক',
  'সাংস্কৃতিক সম্পাদক',
  'প্রচার ও প্রকাশনা সম্পাদক',
  'আপ্যায়ন ও প্রসাদ সম্পাদক',
  'শৃঙ্খলা ও নিরাপত্তা সম্পাদক',
  'দপ্তর সম্পাদক',
  'উপদেষ্টা',
  'কার্যকরী সদস্য',
  'সাধারণ সদস্য'
] as const;

export interface Income {
  id: number;
  type: IncomeType;
  name: string;
  amount: number;
  day: string;
  method: PaymentMethod;
  status: IncomeStatus;
  date: string;
  publicName?: boolean;
  createdBy: string;
  trxId?: string;
  senderPhone?: string;
  month?: string;
  rejectReason?: string;
}

export interface Bill {
  id: number;
  vendor: string;
  description: string;
  category: string;
  total: number;
  paid: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  requester: string;
  type: 'Advance' | 'Reimbursement';
  dueDate?: string;
  createdAt?: string;
  rejectReason?: string;
}

export interface AppNotification {
  id: number;
  title: string;
  body: string;
  color: 'orange' | 'red' | 'gold' | 'green';
  read: boolean;
  time: string;
  entityType?: 'bill' | 'income' | 'general';
  entityId?: number;
}

export interface MerchantTransaction {
  id: string;
  trxId: string;
  amount: number;
  sender: string;
  date: string;
  claimedBy?: string;
  status: 'Unclaimed' | 'Claimed';
}

// Initial Seed Users (Clean State: Empty initially for production)
const defaultUsers: User[] = [];

export interface PujaMonth {
  id: string; // e.g. '2026-10'
  nameBn: string;
  nameEn: string;
  shortBn: string;
  shortEn: string;
}

export const PUJA_CYCLE_MONTHS: PujaMonth[] = [
  { id: '2026-10', nameBn: 'অক্টোবর ২০২৬ (আশ্বিন - পূজা মাস)', nameEn: 'October 2026 (Puja Month)', shortBn: 'অক্টোবর ২০২৬', shortEn: 'Oct 2026' },
  { id: '2026-09', nameBn: 'সেপ্টেম্বর ২০২৬ (ভাদ্র)', nameEn: 'September 2026', shortBn: 'সেপ্টেম্বর ২০২৬', shortEn: 'Sep 2026' },
  { id: '2026-08', nameBn: 'আগস্ট ২০২৬ (শ্রাবণ)', nameEn: 'August 2026', shortBn: 'আগস্ট ২০২৬', shortEn: 'Aug 2026' },
  { id: '2026-07', nameBn: 'জুলাই ২০২৬ (আষাঢ়)', nameEn: 'July 2026', shortBn: 'জুলাই ২০২৬', shortEn: 'Jul 2026' },
  { id: '2026-06', nameBn: 'জুন ২০২৬ (জ্যৈষ্ঠ)', nameEn: 'June 2026', shortBn: 'জুন ২০২৬', shortEn: 'Jun 2026' },
  { id: '2026-05', nameBn: 'মে ২০২৬ (বৈশাখ)', nameEn: 'May 2026', shortBn: 'মে ২০২৬', shortEn: 'May 2026' },
  { id: '2026-04', nameBn: 'এপ্রিল ২০২৬ (চৈত্র)', nameEn: 'April 2026', shortBn: 'এপ্রিল ২০২৬', shortEn: 'Apr 2026' },
  { id: '2026-03', nameBn: 'মার্চ ২০২৬ (ফাল্গুন)', nameEn: 'March 2026', shortBn: 'মার্চ ২০২৬', shortEn: 'Mar 2026' },
  { id: '2026-02', nameBn: 'ফেব্রুয়ারি ২০২৬ (মাঘ)', nameEn: 'February 2026', shortBn: 'ফেব্রুয়ারি ২০২৬', shortEn: 'Feb 2026' },
  { id: '2026-01', nameBn: 'জানুয়ারি ২০২৬ (পৌষ)', nameEn: 'January 2026', shortBn: 'জানুয়ারি ২০২৬', shortEn: 'Jan 2026' },
  { id: '2025-12', nameBn: 'ডিসেম্বর ২০২৫ (অগ্রহায়ণ)', nameEn: 'December 2025', shortBn: 'ডিসেম্বর ২০২৫', shortEn: 'Dec 2025' },
  { id: '2025-11', nameBn: 'নভেম্বর ২০২৫ (কার্তিক)', nameEn: 'November 2025', shortBn: 'নভেম্বর ২০২৫', shortEn: 'Nov 2025' },
];

const defaultIncome: Income[] = [];

const defaultBills: Bill[] = [];

const defaultNotifications: AppNotification[] = [];

const defaultMerchantTransactions: MerchantTransaction[] = [];

const COMMITTEE_BKASH_NUMBER = '01623919385';
const COMMITTEE_NAGAD_NUMBER = '01623919385';

// Helper to convert English digits to Bengali
const toBnDigits = (n: number | string): string => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).replace(/[0-9]/g, d => bn[Number(d)]);
};

const MONTH_NAMES_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];
const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const WEEKDAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_WEEKDAY_NAMES_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const FULL_WEEKDAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ==========================================
// PUJA FESTIVAL & CALENDAR ENGINE DATA
// ==========================================
export interface PujaTithiEvent {
  key: string;
  nameBn: string;
  nameEn: string;
  tithiBn: string;
  tithiEn: string;
  dateStr: string; // YYYY-MM-DD
  descBn: string;
  descEn: string;
  color: 'gold' | 'red';
  badgeDate: string;
  monthShortBn: string;
  monthShortEn: string;
  isMainDay?: boolean;
}

export interface PujaFestivalYear {
  year: number;
  titleBn: string;
  titleEn: string;
  shashthiDateStr: string;
  dashamiDateStr: string;
  events: PujaTithiEvent[];
}

export const PUJA_SCHEDULES: Record<number, PujaFestivalYear> = {
  2026: {
    year: 2026,
    titleBn: 'শারদীয় দুর্গাপূজা ২০২৬',
    titleEn: 'Durga Puja 2026',
    shashthiDateStr: '2026-10-17',
    dashamiDateStr: '2026-10-21',
    events: [
      { key: 'mahalaya-2026', nameBn: 'মহালয়া', nameEn: 'Mahalaya', tithiBn: 'দেবীপক্ষের সূচনা ও পিতৃপক্ষের অবসান', tithiEn: 'Beginning of Devi Paksha', dateStr: '2026-10-10', descBn: 'চণ্ডীপাঠ ও দেবী দুর্গার আবাহন', descEn: 'Chandi path & Invocation of Goddess Durga', color: 'gold', badgeDate: '১০', monthShortBn: 'অক্টো', monthShortEn: 'Oct' },
      { key: 'panchami-2026', nameBn: 'মহা পঞ্চমী', nameEn: 'Maha Panchami', tithiBn: 'আনন্দময়ীর আগমন বার্তা', tithiEn: 'Arrival of the Mother', dateStr: '2026-10-16', descBn: 'মণ্ডপ সজ্জা ও বোধনের পূর্বপ্রস্তুতি', descEn: 'Mandap preparation & festive eve', color: 'gold', badgeDate: '১৬', monthShortBn: 'অক্টো', monthShortEn: 'Oct' },
      { key: 'shashthi-2026', nameBn: 'মহা ষষ্ঠী', nameEn: 'Maha Shashthi', tithiBn: 'বোধন, আমন্ত্রণ ও অধিবাস', tithiEn: 'Bodhan, Amantran & Adhivasa', dateStr: '2026-10-17', descBn: 'বিল্ববৃক্ষ মূলে দেবীর বোধন ও ঘট স্থাপন', descEn: 'Formal awakening & commencement of Durga Puja', color: 'red', badgeDate: '১৭', monthShortBn: 'অক্টো', monthShortEn: 'Oct', isMainDay: true },
      { key: 'saptami-2026', nameBn: 'মহা সপ্তমী', nameEn: 'Maha Saptami', tithiBn: 'নবপত্রিকা প্রবেশ ও সপ্তমী বিহিত পূজা', tithiEn: 'Nabapatrika Pravesh & Saptami Puja', dateStr: '2026-10-18', descBn: 'কলাবউ স্নান ও দেবীর প্রাণ প্রতিষ্ঠা', descEn: 'Sacred Kolabou bath & offering of prasad', color: 'red', badgeDate: '১৮', monthShortBn: 'অক্টো', monthShortEn: 'Oct', isMainDay: true },
      { key: 'ashtami-2026', nameBn: 'মহা অষ্টমী', nameEn: 'Maha Ashtami', tithiBn: 'কুমারী পূজা ও মহা সন্ধিপূজা', tithiEn: 'Kumari Puja & Sandhi Puja', dateStr: '2026-10-19', descBn: 'সার্বজনীন পুষ্পাঞ্জলি ও সন্ধিক্ষণে ১০৮ প্রদীপ প্রজ্বলন', descEn: 'Mass pushpanjali, Kumari worship and Sandhi Puja', color: 'red', badgeDate: '১৯', monthShortBn: 'অক্টো', monthShortEn: 'Oct', isMainDay: true },
      { key: 'navami-2026', nameBn: 'মহা নবমী', nameEn: 'Maha Navami', tithiBn: 'নবমী বিহিত পূজা ও মহাযজ্ঞ', tithiEn: 'Navami Homa & Maha Arati', dateStr: '2026-10-20', descBn: 'নবমী যজ্ঞাহুতি, আরতি ও ধুনুচি নৃত্য', descEn: 'Sacred homa ritual, evening arati and festive celebration', color: 'red', badgeDate: '২০', monthShortBn: 'অক্টো', monthShortEn: 'Oct', isMainDay: true },
      { key: 'dashami-2026', nameBn: 'বিজয়া দশমী', nameEn: 'Vijaya Dashami', tithiBn: 'অপরাজিতা পূজা, সিঁদুর খেলা ও বিসর্জন', tithiEn: 'Sindoor Khela & Pratima Visarjan', dateStr: '2026-10-21', descBn: 'দেবী বরণ, মিষ্টিমুখ ও শুভ বিজয়ার কোলাকুলি', descEn: 'Sindoor ceremony, sweet distribution & immersion procession', color: 'red', badgeDate: '২১', monthShortBn: 'অক্টো', monthShortEn: 'Oct', isMainDay: true },
    ]
  },
  2027: {
    year: 2027,
    titleBn: 'শারদীয় দুর্গাপূজা ২০২৭',
    titleEn: 'Durga Puja 2027',
    shashthiDateStr: '2027-10-05',
    dashamiDateStr: '2027-10-10',
    events: [
      { key: 'mahalaya-2027', nameBn: 'মহালয়া', nameEn: 'Mahalaya', tithiBn: 'দেবীপক্ষের সূচনা ও পিতৃপক্ষের অবসান', tithiEn: 'Beginning of Devi Paksha', dateStr: '2027-10-01', descBn: 'শুভ মহালয়া ও মায়ের আগমন বার্তা', descEn: 'Chandi path & invocation', color: 'gold', badgeDate: '০১', monthShortBn: 'অক্টো', monthShortEn: 'Oct' },
      { key: 'panchami-2027', nameBn: 'মহা পঞ্চমী', nameEn: 'Maha Panchami', tithiBn: 'বোধন পূর্বপ্রস্তুতি', tithiEn: 'Festive Eve', dateStr: '2027-10-04', descBn: 'মহাসমারোহে পূজার শুভ সূচনা', descEn: 'Mandap preparations & festive lighting', color: 'gold', badgeDate: '০৪', monthShortBn: 'অক্টো', monthShortEn: 'Oct' },
      { key: 'shashthi-2027', nameBn: 'মহা ষষ্ঠী', nameEn: 'Maha Shashthi', tithiBn: 'বোধন, আমন্ত্রণ ও অধিবাস', tithiEn: 'Bodhan, Amantran & Adhivasa', dateStr: '2027-10-05', descBn: 'বিল্ববৃক্ষ মূলে দেবীর বোধন ও আনুষ্ঠানিক সূচনা', descEn: 'Formal commencement of Durga Puja', color: 'red', badgeDate: '০৫', monthShortBn: 'অক্টো', monthShortEn: 'Oct', isMainDay: true },
      { key: 'saptami-2027', nameBn: 'মহা সপ্তমী', nameEn: 'Maha Saptami', tithiBn: 'নবপত্রিকা প্রবেশ ও সপ্তমী বিহিত পূজা', tithiEn: 'Nabapatrika Pravesh', dateStr: '2027-10-06', descBn: 'নবপত্রিকা স্নান ও বিশেষ ভোগ নিবেদন', descEn: 'Sacred Kolabou bath & offering', color: 'red', badgeDate: '০৬', monthShortBn: 'অক্টো', monthShortEn: 'Oct', isMainDay: true },
      { key: 'ashtami-2027', nameBn: 'মহা অষ্টমী', nameEn: 'Maha Ashtami', tithiBn: 'কুমারী পূজা ও মহা সন্ধিপূজা', tithiEn: 'Kumari Puja & Sandhi Puja', dateStr: '2027-10-07', descBn: 'সার্বজনীন পুষ্পাঞ্জলি ও ১০৮ প্রদীপ প্রজ্বলন', descEn: 'Mass pushpanjali & Sandhi Puja', color: 'red', badgeDate: '০৭', monthShortBn: 'অক্টো', monthShortEn: 'Oct', isMainDay: true },
      { key: 'navami-2027', nameBn: 'মহা নবমী', nameEn: 'Maha Navami', tithiBn: 'নবমী বিহিত পূজা ও মহাযজ্ঞ', tithiEn: 'Navami Homa & Arati', dateStr: '2027-10-09', descBn: 'মহাযজ্ঞাহুতি ও ধুনুচি নৃত্য', descEn: 'Sacred homa ritual & arati', color: 'red', badgeDate: '০৯', monthShortBn: 'অক্টো', monthShortEn: 'Oct', isMainDay: true },
      { key: 'dashami-2027', nameBn: 'বিজয়া দশমী', nameEn: 'Vijaya Dashami', tithiBn: 'সিঁদুর খেলা ও প্রতিমা বিসর্জন', tithiEn: 'Sindoor Khela & Immersion', dateStr: '2027-10-10', descBn: 'দেবী বিদায় ও শুভ বিজয়ার কোলাকুলি', descEn: 'Sindoor ceremony & immersion procession', color: 'red', badgeDate: '১০', monthShortBn: 'অক্টো', monthShortEn: 'Oct', isMainDay: true },
    ]
  }
};

export interface CommitteeCalendarEvent {
  id: string;
  title: string;
  dateStr: string; // YYYY-MM-DD
  time?: string;
  type: 'meeting' | 'reminder' | 'deadline' | 'puja';
  desc?: string;
}

const defaultCommitteeEvents: CommitteeCalendarEvent[] = [
  { id: 'ev-1', title: 'মণ্ডপ সজ্জা চূড়ান্ত পরিদর্শন ও লাইটিং টেস্ট', dateStr: '2026-10-15', time: 'সন্ধ্যা ৭:০০', type: 'reminder', desc: 'সকল উপকমিটি আহ্বায়কদের উপস্থিতি আবশ্যক।' },
  { id: 'ev-2', title: 'ভোগ প্রসাদ প্রস্তুতি ও বিতরণ সভা', dateStr: '2026-10-18', time: 'দুপুর ১২:০০', type: 'meeting', desc: 'অষ্টমীর সার্বজনীন ভোগ বিতরণের প্রস্তুতি সভা।' },
  { id: 'ev-3', title: 'জরুরি সাধারণ সভা ও আয়-ব্যয়ের পর্যালোচনা', dateStr: '2026-10-25', time: 'সন্ধ্যা ৬:০০', type: 'meeting', desc: 'মণ্ডপ প্রাঙ্গণে সকল সদস্যের অংশগ্রহণে হিসাব পর্যালোচনা।' },
  { id: 'ev-4', title: 'ডেকোরেটর ও সাউন্ড ভেন্ডর বিল নিষ্পত্তি', dateStr: '2026-11-26', time: 'বিকাল ৪:০০', type: 'deadline', desc: 'পূজার সকল বকেয়া বিল চূড়ান্তভাবে পরিশোধ ও রসিদ গ্রহণ।' }
];

// Helper to calculate days difference from today to target YYYY-MM-DD
const getDaysRemainingCount = (targetDateStr: string): number => {
  const parts = targetDateStr.split('-').map(Number);
  if (parts.length < 3) return 0;
  const target = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export default function App() {
  // Persistence states
  const [lang, setLang] = useState<'bn' | 'en'>(() => {
    return (localStorage.getItem('puja_fund_lang') as 'bn' | 'en') || 'bn';
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('puja_fund_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('puja_fund_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [income, setIncome] = useState<Income[]>(() => {
    try {
      const saved = localStorage.getItem('puja_fund_income');
      if (saved) {
        return JSON.parse(saved) as Income[];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    try {
      const saved = localStorage.getItem('puja_fund_bills');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('puja_fund_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [merchantLedger, setMerchantLedger] = useState<MerchantTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('puja_fund_merchant_ledger');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to local storage
  useEffect(() => { localStorage.setItem('puja_fund_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('puja_fund_users', JSON.stringify(users)); }, [users]);
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('puja_fund_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('puja_fund_current_user');
    }
  }, [currentUser]);
  useEffect(() => { localStorage.setItem('puja_fund_income', JSON.stringify(income)); }, [income]);
  useEffect(() => { localStorage.setItem('puja_fund_bills', JSON.stringify(bills)); }, [bills]);
  useEffect(() => { localStorage.setItem('puja_fund_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('puja_fund_merchant_ledger', JSON.stringify(merchantLedger)); }, [merchantLedger]);

  const t = translations[lang] as Record<string, any>;
  const role: MemberRole = currentUser ? currentUser.role : 'Member';

  // Navigation and UI state
  const [tab, setTab] = useState<Tab>('home');
  const [toast, setToast] = useState('');
  const [addMenu, setAddMenu] = useState(false);

  // Cloud Sync & Auth Form State
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [authMonthlyCommitment, setAuthMonthlyCommitment] = useState(1000);
  const [customCommitmentInput, setCustomCommitmentInput] = useState('');

  // Manual Admin Verification & Committee State
  const [signupPendingInfo, setSignupPendingInfo] = useState<{ name: string; phone: string } | null>(null);
  const [memberSectionTab, setMemberSectionTab] = useState<'approved' | 'pending'>('approved');
  const [editingDesignationUser, setEditingDesignationUser] = useState<User | null>(null);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('');
  const [customDesignationInput, setCustomDesignationInput] = useState<string>('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [committeeFilter, setCommitteeFilter] = useState<'all' | 'top' | 'secretaries' | 'general'>('all');

  // Change monthly limit modal state
  const [showChangeLimitModal, setShowChangeLimitModal] = useState(false);
  const [tempLimitChoice, setTempLimitChoice] = useState<number>(currentUser?.monthlyCommitment || 1000);
  const [customLimitInput, setCustomLimitInput] = useState('');

  // Form states for Pronami
  const [amount, setAmount] = useState('500');
  const [giver, setGiver] = useState('');
  const [day, setDay] = useState('অষ্টমী');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [publicName, setPublicName] = useState(false);

  // Form states for Bill Request
  const [vendor, setVendor] = useState('মেসার্স শাপলা ডেকোরেটর');
  const [customVendor, setCustomVendor] = useState('');
  const [description, setDescription] = useState('');
  const [billCategory, setBillCategory] = useState('সাজসজ্জা');
  const [billAmount, setBillAmount] = useState('');
  const [billPaidAmount, setBillPaidAmount] = useState('');
  const [requestType, setRequestType] = useState<'Reimbursement' | 'Advance'>('Advance');
  const [dueDate, setDueDate] = useState('');

  // Form states for Member
  const [memberQuery, setMemberQuery] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<MemberRole>('Member');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // bKash & Nagad Chada Payment & Verification Screen state
  const [chadaMethod, setChadaMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [chadaAmountInput, setChadaAmountInput] = useState('1000');
  const [verifyPhone, setVerifyPhone] = useState(currentUser?.phone || '');
  const [inputTrxId, setInputTrxId] = useState('');
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string; receipt?: any } | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<'bKash' | 'Nagad' | null>(null);

  // Bill payment & settlement state
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [payAmountInput, setPayAmountInput] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [settleNote, setSettleNote] = useState('');
  const [expenseTab, setExpenseTab] = useState<'spending' | 'due' | 'pending'>('spending');
  const [expenseQuery, setExpenseQuery] = useState('');

  // Income filters and detail modal
  const [incomeSection, setIncomeSection] = useState<'chada' | 'pronami'>('chada');
  const [incomeTypeFilter, setIncomeTypeFilter] = useState<'all' | 'pronami' | 'contribution'>('all');
  const [incomeStatusFilter, setIncomeStatusFilter] = useState<'all' | 'Confirmed' | 'Pending' | 'Rejected'>('all');
  const [incomeMonthFilter, setIncomeMonthFilter] = useState<string>('2026-10');
  const [chadaMemberFilter, setChadaMemberFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [pronamiDayFilter, setPronamiDayFilter] = useState<string>('all');
  const [selectedChadaMonth, setSelectedChadaMonth] = useState<string>('2026-10');
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [selectedReviewBill, setSelectedReviewBill] = useState<Bill | null>(null);

  // Announcement modal
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [announcementColor, setAnnouncementColor] = useState<'orange' | 'red' | 'gold' | 'green'>('green');

  // Calendar & Festival Countdown State
  const today = useMemo(() => new Date(), []);
  const todayDateStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const [calendarYear, setCalendarYear] = useState<number>(() => today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(() => today.getMonth()); // 0-11
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Selected festival schedule for countdown (defaults to 2027 if past Oct 21 2026)
  const defaultPujaYear = useMemo(() => {
    return today.getFullYear() > 2026 || (today.getFullYear() === 2026 && today.getMonth() >= 9 && today.getDate() > 21) ? 2027 : 2026;
  }, [today]);

  const [selectedPujaYear, setSelectedPujaYear] = useState<number>(defaultPujaYear);

  // Committee Events in Calendar
  const [committeeEvents, setCommitteeEvents] = useState<CommitteeCalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('puja_fund_custom_events');
      return saved ? JSON.parse(saved) : defaultCommitteeEvents;
    } catch {
      return defaultCommitteeEvents;
    }
  });

  useEffect(() => {
    localStorage.setItem('puja_fund_custom_events', JSON.stringify(committeeEvents));
  }, [committeeEvents]);

  // Modal to add calendar event
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('সন্ধ্যা ৭:০০');
  const [newEventType, setNewEventType] = useState<'meeting' | 'reminder' | 'deadline'>('meeting');
  const [newEventDesc, setNewEventDesc] = useState('');

  // Active puja festival schedule
  const activePujaSchedule = PUJA_SCHEDULES[selectedPujaYear] || PUJA_SCHEDULES[2027];
  
  // Dynamic countdown calculation to Maha Shashthi
  const daysToShashthi = useMemo(() => {
    return getDaysRemainingCount(activePujaSchedule.shashthiDateStr);
  }, [activePujaSchedule]);

  const daysToDashami = useMemo(() => {
    return getDaysRemainingCount(activePujaSchedule.dashamiDateStr);
  }, [activePujaSchedule]);

  // Is festival ongoing right now?
  const isFestivalOngoing = daysToShashthi <= 0 && daysToDashami >= 0;

  // ==========================================
  // MONTHLY CHADA DEADLINE & MOBILE NOTIFICATION ENGINE
  // ==========================================
  // Rule: Every member is supposed to provide monthly chada within the first 10 days of every month
  const currentDayOfMonth = today.getDate(); // 1 - 31
  const isChadaWindowActive = currentDayOfMonth >= 1 && currentDayOfMonth <= 10;
  const daysLeftInChadaWindow = 10 - currentDayOfMonth; // 0 = today is 10th
  const isChadaOverdue = currentDayOfMonth > 10;
  const unpaidMembersCount = useMemo(() => users.filter(u => !u.paid).length, [users]);
  const pendingMembersCount = useMemo(() => users.filter(u => u.approvalStatus === 'Pending').length, [users]);

  // Mobile Push Notification Permission State
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Request Mobile Notification Permission
  const requestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      notify(lang === 'bn' ? 'এই ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই।' : 'Notifications not supported in this browser.');
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        notify(lang === 'bn' ? 'মোবাইল স্ক্রিন নোটিফিকেশন সফলভাবে চালু হয়েছে!' : 'Mobile screen notifications enabled!');
        sendDeviceNotification(
          lang === 'bn' ? '✅ উৎসব সঞ্চয় — নোটিফিকেশন চালু হয়েছে' : '✅ Utsab Sonchay — Notifications Active',
          lang === 'bn'
            ? 'প্রতি মাসের ১-১০ তারিখের মধ্যে চাঁদার রিমাইন্ডার সরাসরি আপনার মোবাইল স্ক্রিনে পৌঁছে যাবে।'
            : 'You will receive monthly chada reminders (1st - 10th) directly on your screen.'
        );
        return true;
      } else {
        notify(lang === 'bn' ? 'নোটিফিকেশন পারমিশন দেওয়া হয়নি।' : 'Notification permission not granted.');
        return false;
      }
    } catch (e) {
      console.error('Error requesting notification permission:', e);
      return false;
    }
  };

  // Helper to dispatch device notification to mobile screen
  const sendDeviceNotification = (title: string, body: string, tag = 'chada-reminder') => {
    if (typeof window === 'undefined') return;

    // 1. Try Service Worker showNotification (pops up on mobile screen even outside the app)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        (registration as any).showNotification(title, {
          body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag,
          vibrate: [200, 100, 200, 100, 200],
          requireInteraction: true,
          data: { url: '/#bkash-pay' },
        }).catch((err: any) => {
          console.warn('SW notification failed, trying fallback:', err);
          fallbackNativeNotification(title, body, tag);
        });
      }).catch(() => {
        fallbackNativeNotification(title, body, tag);
      });
    } else {
      fallbackNativeNotification(title, body, tag);
    }
  };

  const fallbackNativeNotification = (title: string, body: string, tag: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/icon.svg',
          tag,
          requireInteraction: true
        });
      } catch (err) {
        console.warn('Native notification fallback failed:', err);
      }
    }
  };

  // Auto-check for monthly chada reminder on load/mount (if member is unpaid)
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser) return;
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const reminderKey = `chada_reminder_sent_${currentUser.id}_${currentMonthKey}_day_${currentDayOfMonth}`;
    
    if (!currentUser.paid && pushPermission === 'granted') {
      const alreadySentToday = localStorage.getItem(reminderKey);
      if (!alreadySentToday) {
        if (isChadaWindowActive) {
          sendDeviceNotification(
            lang === 'bn' ? '📢 মাসিক চাঁদা রিমাইন্ডার (১ - ১০ তারিখ)' : '📢 Monthly Chada Reminder (1st - 10th)',
            lang === 'bn'
              ? `প্রতি মাসের ১-১০ তারিখের মধ্যে চাঁদা প্রদান আবশ্যক। ${currentDayOfMonth === 10 ? 'আজ ১০ তারিখ — চাঁদা দেওয়ার শেষ দিন!' : `আর ${toBnDigits(daysLeftInChadaWindow)} দিন বাকি (১০ তারিখ শেষ সময়)।`} অনুগ্রহ করে আপনার ৳১,০০০ চাঁদা জমা দিন।`
              : `Monthly chada must be paid within 1st-10th. ${currentDayOfMonth === 10 ? 'Today is the 10th — Last day!' : `${daysLeftInChadaWindow} days left.`} Please pay your contribution.`
          );
        } else if (isChadaOverdue) {
          sendDeviceNotification(
            lang === 'bn' ? '⚠️ বকেয়া চাঁদা রিমাইন্ডার' : '⚠️ Overdue Chada Reminder',
            lang === 'bn'
              ? 'চলতি মাসের ১০ তারিখের সময়সীমা অতিক্রান্ত হয়েছে। আপনার ৳১,০০০ চাঁদা এখনও বকেয়া রয়েছে। বিলম্ব না করে দ্রুত পরিশোধ করুন।'
              : 'The 10th deadline has passed. Your ৳1,000 monthly chada is still unpaid. Please pay as soon as possible.'
          );
        }
        localStorage.setItem(reminderKey, 'true');
      }
    }
  }, [currentUser?.id, currentUser?.paid, currentDayOfMonth, isChadaWindowActive, isChadaOverdue, pushPermission]);

  // Live Cloud Firestore Synchronizer (Active when Firebase credentials are configured)
  useEffect(() => {
    if (!isLiveBackend()) {
      setIsInitialSyncDone(true);
      return;
    }

    initCloudSession();

    // 1. Initial direct load for instant UI responsiveness across all browsers & incognito tabs
    Promise.all([
      fetchAllUsersFromFirestore().then(liveUsers => {
        if (liveUsers.length > 0) setUsers(liveUsers);
      }),
      fetchIncomeFromFirestore().then(liveIncome => {
        if (liveIncome.length > 0) setIncome(liveIncome);
      }),
      fetchBillsFromFirestore().then(liveBills => {
        if (liveBills.length > 0) setBills(liveBills);
      }),
    ]).finally(() => {
      setIsInitialSyncDone(true);
    });

    // 2. Real-time subscriptions for reactive live updates
    const unsubIncome = subscribeToIncome(liveIncomes => {
      setIncome(liveIncomes);
    });
    const unsubBills = subscribeToBills(liveBills => {
      setBills(liveBills);
    });
    const unsubUsers = subscribeToUsers(liveUsers => {
      setUsers(liveUsers);
    });

    return () => {
      unsubIncome();
      unsubBills();
      unsubUsers();
    };
  }, []);

  // Admin Broadcast mobile notification to all unpaid members
  const sendChadaReminderToUnpaid = () => {
    const unpaidMembers = users.filter(u => !u.paid);
    if (unpaidMembers.length === 0) {
      notify(lang === 'bn' ? 'সকল সদস্য ইতিমধ্যে চলতি মাসের চাঁদা পরিশোধ করেছেন!' : 'All members have already paid their chada!');
      return;
    }

    const title = isChadaWindowActive
      ? (lang === 'bn' ? '📢 মাসিক চাঁদার রিমাইন্ডার (১-১০ তারিখ)' : '📢 Monthly Chada Reminder (1st-10th)')
      : (lang === 'bn' ? '⚠️ বকেয়া চাঁদা রিমাইন্ডার' : '⚠️ Overdue Chada Reminder');

    const body = isChadaWindowActive
      ? (lang === 'bn'
          ? `প্রতি মাসের ১-১০ তারিখের মধ্যে চাঁদা জমা দেওয়া নিয়ম। ${currentDayOfMonth === 10 ? 'আজ ১০ তারিখ — শেষ দিন!' : `আর মাত্র ${toBnDigits(daysLeftInChadaWindow)} দিন বাকি।`} অনুগ্রহ করে আপনার ৳১,০০০ চাঁদা বিকাশ বা নগদে দিন।`
          : `Monthly chada due within 1st-10th. ${currentDayOfMonth === 10 ? 'Today is the 10th — Last day!' : `${daysLeftInChadaWindow} days left.`} Please pay via bKash/Nagad.`)
      : (lang === 'bn'
          ? 'চলতি মাসের ১০ তারিখের সময়সীমা অতিক্রান্ত হয়েছে। আপনার ৳১,০০০ চাঁদা এখনও বাকি আছে। অবিলম্বে পরিশোধ করুন।'
          : 'The 10th deadline has passed. Your ৳1,000 contribution is overdue. Please pay now.');

    // 1. Fire native mobile notification to device screen
    sendDeviceNotification(title, body, 'admin-broadcast');

    // 2. Add to in-app notification center for all members
    const newNotif: AppNotification = {
      id: Date.now(),
      title,
      body,
      color: isChadaWindowActive ? 'orange' : 'red',
      read: false,
      time: lang === 'bn' ? 'এইমাত্র' : 'Just now'
    };
    setNotifications(prev => [newNotif, ...prev]);

    notify(
      lang === 'bn'
        ? `📢 ${toBnDigits(unpaidMembers.length)} জন বকেয়া সদস্যের মোবাইলে ১-১০ তারিখের চাঁদার নোটিফিকেশন পাঠানো হয়েছে!`
        : `📢 Reminder sent to ${unpaidMembers.length} unpaid members' mobile screens!`
    );
  };

  // Computed Financial Totals (0 dummy reserve - pure ledger calculation)
  const startingFund = 0;
  const collected = useMemo(() => {
    return income.filter(x => x.status === 'Confirmed').reduce((s, x) => s + x.amount, 0) + startingFund;
  }, [income]);

  const paidBillsTotal = useMemo(() => {
    return bills.filter(b => b.status === 'Approved').reduce((s, b) => s + b.paid, 0);
  }, [bills]);

  const committed = useMemo(() => {
    return bills.filter(b => b.status === 'Approved').reduce((s, b) => s + b.total, 0);
  }, [bills]);

  const due = Math.max(0, committed - paidBillsTotal);
  const available = collected - paidBillsTotal;
  const projected = collected - committed;

  const approvedBillsCount = useMemo(() => bills.filter(b => b.status === 'Approved').length, [bills]);
  const billsWithDueCount = useMemo(() => bills.filter(b => b.status === 'Approved' && b.total - b.paid > 0).length, [bills]);
  const pendingBillsCount = useMemo(() => bills.filter(b => b.status === 'Pending').length, [bills]);

  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      // 3 Featured Categories: Spending List, Due Bills, Pending Approvals
      if (expenseTab === 'spending') {
        if (b.status !== 'Approved') return false;
      } else if (expenseTab === 'due') {
        if (b.status !== 'Approved' || (b.total - b.paid <= 0)) return false;
      } else if (expenseTab === 'pending') {
        if (b.status !== 'Pending') return false;
      }

      if (expenseQuery.trim()) {
        const q = expenseQuery.trim().toLowerCase();
        const match =
          b.vendor.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.requester.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [bills, expenseTab, expenseQuery]);

  const getMonthLabel = (monthId?: string, isShort = false) => {
    if (!monthId) return lang === 'bn' ? 'অক্টোবর ২০২৬' : 'Oct 2026';
    const found = PUJA_CYCLE_MONTHS.find(m => m.id === monthId || m.nameBn.includes(monthId) || m.shortBn === monthId);
    if (!found) return monthId;
    if (isShort) return lang === 'bn' ? found.shortBn : found.shortEn;
    return lang === 'bn' ? found.nameBn : found.nameEn;
  };

  const filteredChadaTotal = useMemo(() => {
    return income
      .filter(x => x.type === 'contribution' && x.status === 'Confirmed')
      .filter(x => {
        if (incomeMonthFilter === 'all') return true;
        const itemMonth = x.month || '2026-10';
        return itemMonth === incomeMonthFilter;
      })
      .reduce((s, x) => s + x.amount, 0);
  }, [income, incomeMonthFilter]);

  const filteredChadaCount = useMemo(() => {
    return income
      .filter(x => x.type === 'contribution')
      .filter(x => {
        if (incomeMonthFilter === 'all') return true;
        const itemMonth = x.month || '2026-10';
        return itemMonth === incomeMonthFilter;
      }).length;
  }, [income, incomeMonthFilter]);

  const targetChadaMonth = incomeMonthFilter === 'all' ? '2026-10' : incomeMonthFilter;

  const monthConfirmedChada = useMemo(() => {
    return income
      .filter(x => x.type === 'contribution' && x.status === 'Confirmed' && (incomeMonthFilter === 'all' ? true : (x.month === incomeMonthFilter || (incomeMonthFilter === '2026-10' && !x.month))))
      .reduce((s, x) => s + x.amount, 0);
  }, [income, incomeMonthFilter]);

  const monthPaidMembersCount = useMemo(() => {
    return users.filter(m =>
      income.some(x => x.type === 'contribution' && x.status === 'Confirmed' && x.name === m.name && (targetChadaMonth === 'all' ? true : (x.month === targetChadaMonth || (targetChadaMonth === '2026-10' && !x.month))))
    ).length;
  }, [income, users, targetChadaMonth]);

  const annualChadaTotal = useMemo(() => {
    return income
      .filter(x => x.type === 'contribution' && x.status === 'Confirmed')
      .reduce((s, x) => s + x.amount, 0);
  }, [income]);

  const totalPronamiCollected = useMemo(() => {
    return income
      .filter(x => x.type === 'pronami' && x.status === 'Confirmed')
      .reduce((s, x) => s + x.amount, 0);
  }, [income]);

  const filteredPronamiList = useMemo(() => {
    return income.filter(x => {
      if (x.type !== 'pronami') return false;
      if (pronamiDayFilter !== 'all' && x.day !== pronamiDayFilter) return false;
      if (incomeStatusFilter !== 'all' && x.status !== incomeStatusFilter) return false;
      return true;
    });
  }, [income, pronamiDayFilter, incomeStatusFilter]);

  const filteredIncome = useMemo(() => {
    return income.filter(x => {
      if (incomeTypeFilter !== 'all' && x.type !== incomeTypeFilter) return false;
      if (incomeStatusFilter !== 'all' && x.status !== incomeStatusFilter) return false;
      if (incomeMonthFilter !== 'all') {
        const itemMonth = x.month || '2026-10';
        if (itemMonth !== incomeMonthFilter) return false;
      }
      return true;
    });
  }, [income, incomeTypeFilter, incomeStatusFilter, incomeMonthFilter]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Toast helper
  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3200);
  };

  // Format currency
  const fmt = (n: number) => {
    if (lang === 'bn') {
      return '৳' + toBnDigits(n.toLocaleString('en-US'));
    }
    return '৳' + n.toLocaleString('en-US');
  };

  // ================= AUTH HANDLERS =================
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = authPhone.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      notify(lang === 'bn' ? 'সঠিক মোবাইল নম্বর লিখুন' : 'Enter mobile number');
      return;
    }
    if (!authPassword) {
      notify(lang === 'bn' ? 'পাসওয়ার্ড বা পিন দিন' : 'Enter PIN or password');
      return;
    }

    setIsLoggingIn(true);

    // 1. Check in-memory users state first
    let user: User | null | undefined = users.find(u => {
      const p = u.phone.replace(/[^0-9]/g, '');
      return p === cleanPhone || (p.length >= 10 && cleanPhone.endsWith(p)) || (cleanPhone.length >= 10 && p.endsWith(cleanPhone));
    });

    // 2. If not found in state (e.g. Incognito or fresh session), query Firestore directly!
    if (!user && isLiveBackend()) {
      try {
        const cloudUser = await fetchUserByPhoneFromFirestore(cleanPhone);
        if (cloudUser) {
          user = cloudUser;
          setUsers(prev => {
            const exists = prev.some(u => u.id === cloudUser.id);
            return exists ? prev : [cloudUser, ...prev];
          });
        }
      } catch (err) {
        console.warn('Cloud login fetch error:', err);
      }
    }

    setIsLoggingIn(false);

    if (!user) {
      notify(lang === 'bn' ? 'এই মোবাইল নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি' : 'User not found with this phone number');
      return;
    }
    if (user.password && user.password !== authPassword) {
      notify(lang === 'bn' ? 'ভুল পাসওয়ার্ড বা পিন' : 'Incorrect PIN or password');
      return;
    }

    // Manual Admin Approval Verification
    if (user.approvalStatus === 'Pending') {
      notify(
        lang === 'bn'
          ? '⏳ আপনার অ্যাকাউন্টটি এখনও প্রধান অ্যাডমিনের অনুমোদনের অপেক্ষায় আছে। অ্যাডমিন অনুমোদন দিলে আপনি লগইন করতে পারবেন।'
          : '⏳ Your account is pending Admin approval. You can log in once approved.'
      );
      return;
    }

    if (user.approvalStatus === 'Rejected') {
      notify(
        lang === 'bn'
          ? '❌ আপনার নিবন্ধনের আবেদনটি অনুমোদিত হয়নি। অনুগ্রহ করে প্রধান অ্যাডমিনের সাথে যোগাযোগ করুন।'
          : '❌ Your account registration was not approved. Please contact the Admin.'
      );
      return;
    }

    setCurrentUser(user);
    setVerifyPhone(user.phone);
    setChadaAmountInput(String(user.monthlyCommitment || 1000));
    setTempLimitChoice(user.monthlyCommitment || 1000);
    setAuthPhone('');
    setAuthPassword('');
    notify(lang === 'bn' ? `স্বাগতম, ${user.name}!` : `Welcome, ${user.name}!`);
  };

  // Direct Signup Handler (Manual Admin Verification, 100% Free - 0 OTP / $0 Cost)
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName.trim()) {
      notify(lang === 'bn' ? 'আপনার নাম লিখুন' : 'Enter your name');
      return;
    }
    const cleanPhone = authPhone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      notify(lang === 'bn' ? 'সঠিক মোবাইল নম্বর দিন (কমপক্ষে ১০ ডিজিট)' : 'Enter a valid phone number');
      return;
    }
    if (!authPassword || authPassword.length < 4) {
      notify(lang === 'bn' ? 'কমপক্ষে ৪ ডিজিটের পাসওয়ার্ড বা পিন দিন' : 'Enter at least 4 digits for PIN/password');
      return;
    }

    setIsSigningUp(true);

    // Verify against latest Firestore users to guarantee 0 duplicates and accurate Admin role
    let allLiveUsers = users;
    if (isLiveBackend()) {
      try {
        const cloudUsers = await fetchAllUsersFromFirestore();
        if (cloudUsers.length > 0) {
          allLiveUsers = cloudUsers;
          setUsers(cloudUsers);
        }
      } catch (err) {
        console.warn('Cloud signup check error:', err);
      }
    }

    if (allLiveUsers.some(u => {
      const p = u.phone.replace(/[^0-9]/g, '');
      return p === cleanPhone || (p.length >= 10 && cleanPhone.endsWith(p)) || (cleanPhone.length >= 10 && p.endsWith(cleanPhone));
    })) {
      setIsSigningUp(false);
      notify(lang === 'bn' ? 'এই মোবাইল নম্বরটি আগেই নিবন্ধিত হয়েছে' : 'This phone number is already registered');
      return;
    }

    const finalCommitment = customCommitmentInput ? (Number(customCommitmentInput) || 1000) : (authMonthlyCommitment || 1000);
    const isFirstUser = allLiveUsers.length === 0 || !allLiveUsers.some(u => u.role === 'Admin');

    if (isFirstUser) {
      // First person signed up is automatically the Main Admin (Approved instantly)
      const adminUser: User = {
        id: Date.now(),
        name: authName.trim(),
        phone: authPhone.trim(),
        role: 'Admin',
        password: authPassword,
        paid: false,
        active: true,
        monthlyCommitment: finalCommitment,
        approvalStatus: 'Approved',
        designation: 'সভাপতি ও প্রধান অ্যাডমিন',
        joinedAt: new Date().toLocaleDateString('bn-BD')
      };

      setUsers(prev => [adminUser, ...prev.filter(u => u.id !== adminUser.id)]);
      await saveUserToFirestore(adminUser).catch(err => console.warn('Cloud save admin user failed:', err));
      setIsSigningUp(false);
      setCurrentUser(adminUser);
      setVerifyPhone(adminUser.phone);
      setChadaAmountInput(String(finalCommitment));
      setTempLimitChoice(finalCommitment);
      setAuthName('');
      setAuthPhone('');
      setAuthPassword('');
      setCustomCommitmentInput('');
      notify(lang === 'bn' ? '🎉 অভিনন্দন! আপনি প্রথম নিবন্ধিত ব্যক্তি হিসেবে প্রধান অ্যাডমিন ক্ষমতা পেয়েছেন।' : '🎉 Congratulations! You are registered as Main Admin.');
    } else {
      // Subsequent registrations go to Pending state for Admin Manual Verification
      const pendingUser: User = {
        id: Date.now(),
        name: authName.trim(),
        phone: authPhone.trim(),
        role: 'Member',
        password: authPassword,
        paid: false,
        active: true,
        monthlyCommitment: finalCommitment,
        approvalStatus: 'Pending',
        designation: 'সাধারণ সদস্য',
        joinedAt: new Date().toLocaleDateString('bn-BD')
      };

      setUsers(prev => [pendingUser, ...prev.filter(u => u.id !== pendingUser.id)]);
      await saveUserToFirestore(pendingUser).catch(err => console.warn('Cloud save pending user failed:', err));
      setIsSigningUp(false);

      // Notification for Admin
      const adminNotif: AppNotification = {
        id: Date.now(),
        title: lang === 'bn' ? '👤 নতুন সদস্য অনুমোদনের আবেদন' : '👤 New Member Approval Request',
        body: `${pendingUser.name} (${pendingUser.phone}) নতুন আবেদন করেছেন। চাঁদার লক্ষ্য: ৳${toBnDigits(finalCommitment)}/মাস। সদস্য তালিকা থেকে যাচাই করে অনুমোদন করুন।`,
        color: 'gold',
        read: false,
        time: lang === 'bn' ? 'এইমাত্র' : 'Just now',
        entityType: 'general'
      };
      setNotifications(prev => [adminNotif, ...prev]);

      setSignupPendingInfo({ name: pendingUser.name, phone: pendingUser.phone });
      setAuthName('');
      setAuthPhone('');
      setAuthPassword('');
      setCustomCommitmentInput('');
      notify(lang === 'bn' ? 'আবেদন জমা হয়েছে! প্রধান অ্যাডমিনের অনুমোদনের পর আপনি লগইন করতে পারবেন।' : 'Submitted! Awaiting admin approval.');
    }
  };

  // Direct Cost-Free Password Reset (0 SMS, 100% Spark Free)
  const handleResetPasswordDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = forgotPhone.trim().replace(/[^0-9]/g, '');
    let user: User | null | undefined = users.find(u => {
      const p = u.phone.replace(/[^0-9]/g, '');
      return p === cleanPhone || (p.length >= 10 && cleanPhone.endsWith(p)) || (cleanPhone.length >= 10 && p.endsWith(cleanPhone));
    });

    if (!user && isLiveBackend()) {
      user = await fetchUserByPhoneFromFirestore(cleanPhone);
    }

    if (!user) {
      notify(lang === 'bn' ? 'এই মোবাইল নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি' : 'No account found with this phone number');
      return;
    }
    if (!newResetPassword || newResetPassword.length < 4) {
      notify(lang === 'bn' ? 'কমপক্ষে ৪ ডিজিটের নতুন পাসওয়ার্ড দিন' : 'Enter at least 4 digits for new password');
      return;
    }

    const updatedUser = { ...user, password: newResetPassword };
    setUsers(prev => prev.map(u => u.id === user!.id ? updatedUser : u));
    await updateUserPasswordInFirestore(user.id, newResetPassword).catch(err => console.warn('Cloud password update error:', err));
    setForgotPhone('');
    setNewResetPassword('');
    setForgotSuccess(true);
    notify(lang === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! নতুন পাসওয়ার্ড দিয়ে লগইন করুন।' : 'Password updated successfully! Please log in.');
  };

  // Admin Member Approval Handlers
  const approveMember = (userId: number) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const updated = { ...target, approvalStatus: 'Approved' as ApprovalStatus };
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    updateUserApprovalInFirestore(userId, 'Approved').catch(err => console.warn('Cloud approval error:', err));
    notify(lang === 'bn' ? `✅ ${target.name}-এর অ্যাকাউন্ট অনুমোদিত হয়েছে!` : `✅ ${target.name} approved!`);
  };

  const rejectMember = (userId: number) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const updated = { ...target, approvalStatus: 'Rejected' as ApprovalStatus };
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    updateUserApprovalInFirestore(userId, 'Rejected').catch(err => console.warn('Cloud reject error:', err));
    notify(lang === 'bn' ? `❌ ${target.name}-এর আবেদন বাতিল করা হয়েছে` : `❌ ${target.name} rejected`);
  };

  // Designation Update Handler
  const updateMemberDesignation = (userId: number, designation: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const updated = { ...target, designation };
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    if (currentUser?.id === userId) {
      setCurrentUser(updated);
    }
    updateUserDesignationInFirestore(userId, designation).catch(err => console.warn('Cloud designation update error:', err));
    setEditingDesignationUser(null);
    setSelectedDesignation('');
    setCustomDesignationInput('');
    notify(lang === 'bn' ? `🎖️ ${target.name}-এর পদবী '${designation}' নির্ধারণ করা হয়েছে` : `Designation updated to '${designation}'`);
  };

  // Update Member's Monthly Commitment
  const updateUserCommitment = (newAmount: number) => {
    if (!currentUser || newAmount <= 0) return;
    const updatedUser: User = { ...currentUser, monthlyCommitment: newAmount };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setChadaAmountInput(String(newAmount));
    setTempLimitChoice(newAmount);
    setShowChangeLimitModal(false);
    setCustomLimitInput('');
    updateUserCommitmentInFirestore(currentUser.id, newAmount).catch(err => console.warn('Cloud update commitment error:', err));
    notify(lang === 'bn' ? `আপনার মাসিক চাঁদা ৳${toBnDigits(newAmount)} নির্ধারণ করা হয়েছে!` : `Monthly commitment updated to ৳${newAmount}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setTab('home');
    notify(lang === 'bn' ? 'লগআউট সফল হয়েছে' : 'Logged out successfully');
  };

  // ================= CHADA PAYMENT SUBMISSION (MANUAL STATEMENT VERIFICATION) =================
  const submitChadaPayment = () => {
    const cleanTrx = inputTrxId.trim().toUpperCase();
    if (!cleanTrx) {
      notify(lang === 'bn' ? 'সঠিক Transaction ID (TrxID) লিখুন' : 'Enter Transaction ID (TrxID)');
      return;
    }

    const cleanSender = verifyPhone.trim();
    if (cleanSender.length < 10) {
      notify(lang === 'bn' ? 'টাকা পাঠানোর মোবাইল নম্বর দিন (কমপক্ষে ১০ ডিজিট)' : 'Enter sender phone number');
      return;
    }

    const nAmount = Number(chadaAmountInput) || 1000;

    // Check duplicate confirmed TrxID
    const duplicate = income.find(
      x => x.trxId && x.trxId.toUpperCase() === cleanTrx && x.status === 'Confirmed'
    );
    if (duplicate) {
      setVerificationResult({
        success: false,
        message: lang === 'bn'
          ? `এই TrxID (${cleanTrx}) ইতিমধ্যে অন্য এক সদস্যের চাঁদা হিসেবে নিশ্চিত হয়েছে!`
          : `This TrxID (${cleanTrx}) has already been confirmed!`
      });
      return;
    }

    const newId = Date.now();
    const newIncome: Income = {
      id: newId,
      type: 'contribution',
      name: currentUser?.name || 'Member',
      amount: nAmount,
      day: '—',
      method: chadaMethod,
      status: 'Pending', // Pending admin verification
      date: lang === 'bn' ? 'এইমাত্র' : 'Just now',
      createdBy: currentUser?.name || 'Member',
      trxId: cleanTrx,
      senderPhone: cleanSender,
      month: selectedChadaMonth
    };

    setIncome(prev => [newIncome, ...prev]);
    saveIncomeToFirestore(newIncome).catch(err => console.warn('Cloud save income failed:', err));

    // Admin Notification
    setNotifications(prev => [
      {
        id: Date.now(),
        title: lang === 'bn' ? 'নতুন চাঁদা যাচাই প্রয়োজন' : 'New Chada Verification Needed',
        body: `${currentUser?.name || 'সদস্য'} - ${fmt(nAmount)} (${chadaMethod}, TrxID: ${cleanTrx}, ${getMonthLabel(selectedChadaMonth, true)})। স্টেটমেন্ট মিলিয়ে অনুমোদন করুন।`,
        color: 'gold',
        read: false,
        time: lang === 'bn' ? 'এইমাত্র' : 'Just now',
        entityType: 'income',
        entityId: newId
      },
      ...prev
    ]);

    setVerificationResult({
      success: true,
      message: lang === 'bn'
        ? 'আপনার চাঁদার TrxID সফলভাবে জমা হয়েছে! অ্যাডমিন স্টেটমেন্ট যাচাই করে অনুমোদন করলে চাঁদা নিশ্চিত হবে।'
        : 'TrxID submitted! Awaiting Admin verification against statement.',
      receipt: {
        name: currentUser?.name,
        phone: cleanSender,
        amount: nAmount,
        method: chadaMethod,
        trxId: cleanTrx,
        month: getMonthLabel(selectedChadaMonth, true),
        date: new Date().toLocaleString()
      }
    });

    setInputTrxId('');
    notify(lang === 'bn' ? 'TrxID জমা হয়েছে! অ্যাডমিন স্টেটমেন্ট যাচাই করে অনুমোদন করবেন।' : 'Submitted for admin verification!');
  };

  // Handle Notification Click (make approval requests functional)
  const handleNotificationClick = (n: AppNotification) => {
    setNotifications(p => p.map(x => x.id === n.id ? { ...x, read: true } : x));

    if (n.entityType === 'bill' && n.entityId) {
      const found = bills.find(b => b.id === n.entityId);
      if (found) {
        setSelectedReviewBill(found);
        return;
      }
    }
    if (n.entityType === 'income' && n.entityId) {
      const found = income.find(i => i.id === n.entityId);
      if (found) {
        setSelectedIncome(found);
        return;
      }
    }

    // Match bill from notification text
    if (n.title.includes('বিল') || n.title.includes('খরচ') || n.title.includes('আবেদন') || n.body.includes('বাকি')) {
      const matched = bills.find(b => n.body.includes(b.vendor) || n.body.includes(b.description))
        || bills.find(b => b.status === 'Pending')
        || bills[0];
      if (matched) {
        setSelectedReviewBill(matched);
        return;
      }
    }

    // Match income from notification text
    if (n.title.includes('প্রণামী') || n.title.includes('চাঁদা')) {
      const matched = income.find(i => n.body.includes(i.name))
        || income.find(i => i.status === 'Pending')
        || income[0];
      if (matched) {
        setSelectedIncome(matched);
        return;
      }
    }

    notify(`${n.title}: ${n.body}`);
  };

  // Approve income or bill
  const approve = (id: number) => {
    let contributionMember = '';
    let contributionAmount = 0;
    let isContribution = false;

    setIncome(prev => prev.map(x => {
      if (x.id === id) {
        if (x.type === 'contribution') {
          contributionMember = x.name;
          contributionAmount = x.amount;
          isContribution = true;
        }
        return { ...x, status: 'Confirmed' };
      }
      return x;
    }));

    if (isContribution && contributionMember) {
      setUsers(prev => prev.map(u => u.name === contributionMember ? { ...u, paid: true } : u));
      if (currentUser && currentUser.name === contributionMember) {
        setCurrentUser(prev => prev ? { ...prev, paid: true } : null);
      }
    }

    setBills(prev => prev.map(x => x.id === id ? { ...x, status: 'Approved' } : x));
    setSelectedReviewBill(prev => prev && prev.id === id ? { ...prev, status: 'Approved' } : prev);
    setSelectedIncome(prev => prev && prev.id === id ? { ...prev, status: 'Confirmed' } : prev);
    updateIncomeStatusInFirestore(id, 'Confirmed', undefined, currentUser?.name).catch(err => console.warn('Cloud approve income error:', err));
    updateBillStatusInFirestore(id, 'Approved').catch(err => console.warn('Cloud approve bill error:', err));

    setNotifications(prev => [
      {
        id: Date.now(),
        title: lang === 'bn' ? 'অনুমোদন সম্পন্ন' : 'Approval Completed',
        body: isContribution
          ? (lang === 'bn' ? `${contributionMember} এর চাঁদা (${fmt(contributionAmount)}) স্টেটমেন্ট যাচাই শেষে নিশ্চিত করা হয়েছে।` : `Contribution confirmed for ${contributionMember}.`)
          : (lang === 'bn' ? 'খরচের আবেদন অনুমোদিত হয়েছে এবং সিস্টেমে হিসাবভুক্ত হয়েছে।' : 'Approved and calculated into system funds.'),
        color: 'green',
        read: false,
        time: lang === 'bn' ? 'এইমাত্র' : 'Just now'
      },
      ...prev
    ]);
    notify(lang === 'bn' ? 'আবেদন অনুমোদিত ও তহবিলে নিশ্চিত হয়েছে!' : 'Approved and confirmed into fund!');
  };

  // Reject income or bill
  const reject = (id: number, reason: string = 'অ্যাডমিন কর্তৃক বাতিল / স্টেটমেন্ট মেলেনি') => {
    setIncome(prev => prev.map(x => x.id === id ? { ...x, status: 'Rejected', rejectReason: reason } : x));
    setBills(prev => prev.map(x => x.id === id ? { ...x, status: 'Rejected', rejectReason: reason } : x));
    setSelectedReviewBill(prev => prev && prev.id === id ? { ...prev, status: 'Rejected', rejectReason: reason } : prev);
    setSelectedIncome(prev => prev && prev.id === id ? { ...prev, status: 'Rejected', rejectReason: reason } : prev);
    updateIncomeStatusInFirestore(id, 'Rejected', reason, currentUser?.name).catch(err => console.warn('Cloud reject income error:', err));
    updateBillStatusInFirestore(id, 'Rejected', reason).catch(err => console.warn('Cloud reject bill error:', err));
    notify(lang === 'bn' ? 'আবেদনটি বাতিল করা হয়েছে' : 'Rejected');
  };

  // Modify Bill Status directly (Admin full control)
  const modifyBillStatus = (billId: number, newStatus: 'Pending' | 'Approved' | 'Rejected') => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, status: newStatus } : b));
    setSelectedReviewBill(prev => prev && prev.id === billId ? { ...prev, status: newStatus } : prev);
    updateBillStatusInFirestore(billId, newStatus).catch(err => console.warn('Cloud update bill status error:', err));
    const label = newStatus === 'Approved' ? 'অনুমোদিত (হিসাবে যুক্ত)' : newStatus === 'Pending' ? 'অনুমোদনের অপেক্ষায়' : 'বাতিল';
    notify(lang === 'bn' ? `স্ট্যাটাস পরিবর্তন: ${label}` : `Status updated to ${newStatus}`);
  };

  // Add Pronami entry
  const addPronami = () => {
    const n = Number(amount);
    if (!Number.isInteger(n) || n<= 0) {
      notify(lang === 'bn' ? 'সঠিক টাকার পরিমাণ দিন' : 'Enter a valid amount');
      return;
    }

    const donorName = giver.trim() || (lang === 'bn' ? 'অজ্ঞাতনামা' : 'Anonymous');

    const newEntry: Income = {
      id: Date.now(),
      type: 'pronami',
      name: donorName,
      amount: n,
      day,
      method,
      status: role === 'Admin' ? 'Confirmed' : 'Pending', // Volunteer actions by members require admin approval or confirmed by admin
      date: lang === 'bn' ? 'এইমাত্র' : 'Just now',
      publicName,
      createdBy: currentUser?.name || 'Member'
    };

    setIncome(prev => [newEntry, ...prev]);
    saveIncomeToFirestore(newEntry).catch(err => console.warn('Cloud save pronami failed:', err));

    setNotifications(prev => [
      {
        id: Date.now(),
        title: lang === 'bn' ? 'নতুন প্রণামী এন্ট্রি' : 'New Pronami Recorded',
        body: `${donorName} - ${fmt(n)} (${method})`,
        color: 'gold',
        read: false,
        time: lang === 'bn' ? 'এইমাত্র' : 'Just now'
      },
      ...prev
    ]);

    setAmount('500');
    setGiver('');
    notify(t.saved);
    setTab('income');
  };

  // Add Bill Request with 3-Option Spending (Total Bill, Paid So Far, Remaining Due)
  const addBill = () => {
    const total = Number(billAmount);
    const paid = Number(billPaidAmount) || 0;
    const finalVendor = vendor === 'নতুন ভেন্ডর' ? (customVendor.trim() || 'অন্যান্য ভেন্ডর') : vendor;

    if (!description.trim() || !Number.isInteger(total) || total <= 0) {
      notify(lang === 'bn' ? 'বিবরণ ও সঠিক মোট বিলের পরিমাণ দিন' : 'Enter description and valid total bill');
      return;
    }
    if (paid < 0 || paid > total) {
      notify(lang === 'bn' ? 'পরিশোধের পরিমাণ ০ থেকে মোট বিলের মধ্যে হতে হবে' : 'Paid amount must be between 0 and total bill');
      return;
    }

    const billId = Date.now();
    // All requests made from this form start as Pending so they appear in "অনুমোদনের অপেক্ষায়" for Admin approval!
    const newBill: Bill = {
      id: billId,
      vendor: finalVendor,
      description: description.trim(),
      category: billCategory,
      total,
      paid,
      status: 'Pending',
      requester: currentUser?.name || 'সদস্য',
      type: requestType,
      dueDate: dueDate || undefined,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    setBills(prev => [newBill, ...prev]);
    saveBillToFirestore(newBill).catch(err => console.warn('Cloud save bill failed:', err));
    setNotifications(prev => [
      {
        id: Date.now(),
        title: lang === 'bn' ? 'নতুন খরচের আবেদন (অনুমোদনের অপেক্ষায়)' : 'New Expense Request (Needs Approval)',
        body: `${finalVendor}: মোট ${fmt(total)}, পরিশোধিত ${fmt(paid)}, বাকি ${fmt(total - paid)} (${currentUser?.name})`,
        color: 'red',
        read: false,
        time: lang === 'bn' ? 'এইমাত্র' : 'Just now',
        entityType: 'bill',
        entityId: billId
      },
      ...prev
    ]);

    setDescription('');
    setBillAmount('');
    setBillPaidAmount('');
    setCustomVendor('');
    setDueDate('');
    setTab('home');
    notify(lang === 'bn' ? 'আবেদন জমা হয়েছে এবং "অনুমোদনের অপেক্ষায়" তালিকায় যুক্ত হয়েছে।' : 'Request submitted and added to Pending Approvals.');
  };

  // Settle Remaining Due / Pay towards bill
  const executeBillPayment = () => {
    if (!payingBill) return;
    const n = Number(payAmountInput);
    const maxDue = payingBill.total - payingBill.paid;

    if (!Number.isInteger(n) || n <= 0 || n > maxDue) {
      notify(lang === 'bn' ? `১ থেকে ${fmt(maxDue)} এর মধ্যে পরিশোধ করুন` : `Enter amount up to ${fmt(maxDue)}`);
      return;
    }

    setBills(prev => prev.map(b => {
      if (b.id === payingBill.id) {
        return {
          ...b,
          paid: b.paid + n,
          status: 'Approved' // Ensure it is approved when settled
        };
      }
      return b;
    }));
    payBillInFirestore(payingBill.id, n).catch(err => console.warn('Cloud pay bill failed:', err));

    setSelectedReviewBill(prev => {
      if (prev && prev.id === payingBill.id) {
        return {
          ...prev,
          paid: prev.paid + n,
          status: 'Approved'
        };
      }
      return prev;
    });

    const isFullyPaid = (payingBill.paid + n) >= payingBill.total;

    setNotifications(prev => [
      {
        id: Date.now(),
        title: isFullyPaid
          ? (lang === 'bn' ? 'বিল সম্পূর্ণ পরিশোধ ও নিষ্পত্তি' : 'Bill Fully Settled')
          : (lang === 'bn' ? 'বকেয়া আংশিক পরিশোধ' : 'Partial Due Settled'),
        body: `${payingBill.vendor} কে ${fmt(n)} পরিশোধ করা হয়েছে (${lang === 'bn' ? 'ম্যানুয়াল ট্রান্সফার / সশরীরে' : 'Manual Transfer'})${settleNote ? ` · নোট: ${settleNote}` : ''}`,
        color: 'green',
        read: false,
        time: lang === 'bn' ? 'এইমাত্র' : 'Just now',
        entityType: 'bill',
        entityId: payingBill.id
      },
      ...prev
    ]);

    notify(
      isFullyPaid
        ? (lang === 'bn' ? 'বকেয়া সম্পূর্ণ পরিশোধ সম্পন্ন হয়েছে!' : 'Bill fully settled!')
        : (lang === 'bn' ? `${fmt(n)} বকেয়া পরিশোধ সফল হয়েছে` : `Settled ${fmt(n)} toward due`)
    );
    setPayingBill(null);
    setPayAmountInput('');
    setSettleNote('');
  };

  // Export CSV Financial Report
  const exportCsvReport = () => {
    let csv = 'Type,Name/Vendor,Category/Day,Amount,Status,Method,Date,Reference\n';
    income.forEach(inc => {
      csv += `Income - ${inc.type},"${inc.name}","${inc.day}",${inc.amount},${inc.status},${inc.method},"${inc.date}","${inc.trxId || ''}"\n`;
    });
    bills.forEach(b => {
      csv += `Expense,"${b.vendor}","${b.category}",${b.paid}/${b.total},${b.status},Cash/Bank,"${b.dueDate || ''}","${b.description}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `puja-fund-financial-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify(lang === 'bn' ? 'CSV ফাইল ডাউনলোড শুরু হয়েছে' : 'CSV download started');
  };

  // Download ICS Calendar with dynamic accurate dates
  const downloadIcs = () => {
    const eventsIcs = activePujaSchedule.events.map(ev => {
      const cleanDate = ev.dateStr.replace(/-/g, '');
      const parts = ev.dateStr.split('-').map(Number);
      const nextDay = new Date(parts[0], parts[1] - 1, parts[2] + 1);
      const cleanNextDate = `${nextDay.getFullYear()}${String(nextDay.getMonth() + 1).padStart(2, '0')}${String(nextDay.getDate()).padStart(2, '0')}`;
      return `BEGIN:VEVENT
UID:${ev.key}-${activePujaSchedule.year}
DTSTART;VALUE=DATE:${cleanDate}
DTEND;VALUE=DATE:${cleanNextDate}
SUMMARY:${lang === 'bn' ? ev.nameBn : ev.nameEn} — ${activePujaSchedule.titleBn}
DESCRIPTION:${lang === 'bn' ? ev.descBn : ev.descEn} (${ev.tithiBn})
END:VEVENT`;
    }).join('\n');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Utsab Sonchay//BN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${activePujaSchedule.titleBn}
${eventsIcs}
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `durga-puja-${activePujaSchedule.year}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    notify(lang === 'bn' ? `${activePujaSchedule.titleBn}-এর ক্যালেন্ডার ডাউনলোড হয়েছে` : 'Calendar file downloaded');
  };

  // Publish announcement
  const publishAnnouncement = () => {
    if (!announcementTitle.trim() || !announcementBody.trim()) {
      notify(lang === 'bn' ? 'শিরোনাম ও বিবরণ দিন' : 'Enter title and description');
      return;
    }
    setNotifications(prev => [
      {
        id: Date.now(),
        title: announcementTitle.trim(),
        body: announcementBody.trim(),
        color: announcementColor,
        read: false,
        time: lang === 'bn' ? 'এইমাত্র' : 'Just now'
      },
      ...prev
    ]);
    setShowAnnouncementModal(false);
    setAnnouncementTitle('');
    setAnnouncementBody('');
    notify(lang === 'bn' ? 'ঘোষণা সফলভাবে প্রচারিত হয়েছে' : 'Announcement published');
  };

  // Copy Payment Account Number
  const copyPaymentNumber = (method: 'bKash' | 'Nagad', num: string) => {
    const cleanDigits = num.replace(/[^0-9]/g, '');
    navigator.clipboard?.writeText(cleanDigits);
    setCopiedAccount(method);
    setTimeout(() => setCopiedAccount(null), 2200);
    notify(lang === 'bn' ? `${method} নম্বর (${cleanDigits}) কপি করা হয়েছে!` : `${method} number copied!`);
  };

  // Bottom Navigation config
  const nav: [Tab, string, any][] = [
    ['home', t.home, Home],
    ['income', t.income, Wallet],
    ['expenses', t.expenses, ReceiptText],
    ['calendar', t.calendar, CalendarDays],
    ['more', t.more, Menu]
  ];

  const screenTitle = () => {
    const titles: Record<Tab, string> = {
      home: t.home,
      income: incomeSection === 'chada' ? (lang === 'bn' ? 'মাসিক চাঁদা' : 'Monthly Chada') : (lang === 'bn' ? 'পূজার প্রণামী' : 'Festival Pronami'),
      expenses: t.expensesTitle,
      calendar: t.calendarTitle,
      more: t.moreTitle,
      committee: lang === 'bn' ? 'পূজা কমিটি' : 'Puja Committee',
      members: t.members,
      pronami: t.addPronami,
      request: t.newRequest,
      notifications: t.notifications,
      contributions: t.contribution,
      reconciliation: t.reconciliation,
      report: t.financialReport,
      'bkash-pay': t.payChadaBkash,
      bill: 'বিলের বিবরণ'
    };
    return titles[tab] || t.home;
  };

  // ===================== RENDER: AUTH SCREEN (IF NOT LOGGED IN) =====================
  if (!currentUser) {
    return (
      <div className="app-shell" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#fff8ec' }}>
        <div className="auth-wrapper" style={{ width: '100%' }}>
          {/* Invisible Firebase reCAPTCHA container for Phone Auth SMS dispatch */}
          <div id="recaptcha-container"></div>

          <div className="auth-logo">
            <div className="brand-mark">
              <Flower2 size={32} />
            </div>
            <h1>{lang === 'bn' ? 'উৎসব সঞ্চয়' : 'Utsab Sonchay'}</h1>
            <p>{t.festival} — {lang === 'bn' ? 'তহবিল ও চাঁদা ব্যবস্থাপনা' : 'Community Fund & Contribution'}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: '3px 10px', marginTop: 8, fontSize: 11, color: '#15803d', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
              {lang === 'bn' ? 'ক্লাউড সার্ভার সক্রিয়' : 'Cloud Server Active'}
            </div>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('login');
                setSignupPendingInfo(null);
                setForgotSuccess(false);
              }}
            >
              <LogIn size={15} style={{ display: 'inline', marginRight: 5, verticalAlign: -2 }} /> {t.login}
            </button>
            <button
              className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signup');
                setSignupPendingInfo(null);
                setForgotSuccess(false);
              }}
            >
              <UserPlus size={15} style={{ display: 'inline', marginRight: 5, verticalAlign: -2 }} /> {t.signup}
            </button>
          </div>

          <div className="form-card">
            {/* If a new user just registered and is pending approval */}
            {signupPendingInfo ? (
              <div style={{ textAlign: 'center', padding: '12px 6px' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#b45309' }}>
                  <Clock3 size={32} />
                </div>
                <h2 style={{ fontSize: 19, color: '#8d1717', margin: '0 0 8px' }}>
                  {lang === 'bn' ? 'আবেদন জমা হয়েছে!' : 'Application Submitted!'}
                </h2>
                <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 14, padding: '14px 16px', margin: '14px 0 20px', textAlign: 'left', lineHeight: 1.6, fontSize: 13, color: '#78350f' }}>
                  <p style={{ margin: '0 0 8px' }}>
                    {lang === 'bn'
                      ? `ধন্যবাদ, ${signupPendingInfo.name}! আপনার সদস্য নিবন্ধনের আবেদনটি প্রধান অ্যাডমিনের অনুমোদনের জন্য জমা হয়েছে।`
                      : `Thank you, ${signupPendingInfo.name}! Your member registration request has been submitted for Admin approval.`}
                  </p>
                  <p style={{ margin: 0 }}>
                    {lang === 'bn'
                      ? `প্রধান অ্যাডমিন আবেদন যাচাই ও অনুমোদন করার পর আপনি আপনার মোবাইল নম্বর (${signupPendingInfo.phone}) ও পাসওয়ার্ড দিয়ে সরাসরি লগইন করতে পারবেন।`
                      : `Once the Admin verifies and approves your request, you can log in using your phone (${signupPendingInfo.phone}) and password.`}
                  </p>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setSignupPendingInfo(null);
                    setAuthMode('login');
                  }}
                >
                  <LogIn size={18} /> {lang === 'bn' ? 'লগইন পেজে যান' : 'Go to Login'}
                </button>
              </div>
            ) : authMode === 'login' ? (
              <form onSubmit={handleLogin}>
                <h2 style={{ fontSize: 18, margin: '0 0 6px', color: '#8d1717' }}>{t.welcomeBack}</h2>
                <p style={{ fontSize: 12, color: '#776', margin: '0 0 16px' }}>{t.loginSubtitle}</p>

                <label>{t.phone}</label>
                <input
                  className="field"
                  value={authPhone}
                  onChange={e => setAuthPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  inputMode="tel"
                  required
                />

                <label>{t.password}</label>
                <div className="password-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="field"
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="••••"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    title={showPassword ? 'লুকান' : 'দেখুন'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => {
                    setAuthMode('forgot');
                    setForgotPhone(authPhone);
                    setForgotSuccess(false);
                  }}
                >
                  {t.forgotPassword}
                </button>

                <button type="submit" className="primary-button" disabled={isLoggingIn}>
                  <LogIn size={18} /> {isLoggingIn ? (lang === 'bn' ? 'লগইন যাচাই হচ্ছে...' : 'Verifying...') : t.login}
                </button>

                <button
                  type="button"
                  className="auth-switch"
                  onClick={() => {
                    setAuthMode('signup');
                    setSignupPendingInfo(null);
                  }}
                >
                  {t.noAccount}
                </button>
              </form>
            ) : authMode === 'signup' ? (
              <form onSubmit={handleSignup}>
                <h2 style={{ fontSize: 18, margin: '0 0 6px', color: '#8d1717' }}>{t.signup}</h2>
                <p style={{ fontSize: 12, color: '#776', margin: '0 0 16px' }}>{t.signupSubtitle}</p>

                <label>{t.name}</label>
                <input
                  className="field"
                  value={authName}
                  onChange={e => setAuthName(e.target.value)}
                  placeholder="যেমন: অনিল রায়"
                  required
                />

                <label>{t.phone}</label>
                <input
                  className="field"
                  value={authPhone}
                  onChange={e => setAuthPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  inputMode="tel"
                  required
                />

                {/* Monthly Contribution Limit Choice */}
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{t.setMonthlyLimit}</span>
                  <strong style={{ color: '#a61f1f' }}>
                    {fmt(customCommitmentInput ? (Number(customCommitmentInput) || 1000) : authMonthlyCommitment)}/{lang === 'bn' ? 'মাস' : 'mo'}
                  </strong>
                </label>
                <div className="monthly-choice-grid">
                  {[500, 1000, 1500, 2000, 3000, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      className={`monthly-choice-pill ${authMonthlyCommitment === amt && !customCommitmentInput ? 'active' : ''}`}
                      onClick={() => {
                        setAuthMonthlyCommitment(amt);
                        setCustomCommitmentInput('');
                      }}
                    >
                      ৳{toBnDigits(amt.toLocaleString())}
                    </button>
                  ))}
                </div>
                <input
                  className="field"
                  style={{ marginTop: -4, marginBottom: 12 }}
                  placeholder={lang === 'bn' ? 'অথবা কাস্টম টাকার পরিমাণ লিখুন (যেমন: ২৫০০)' : 'Or enter custom amount (e.g. 2500)'}
                  value={customCommitmentInput}
                  onChange={e => setCustomCommitmentInput(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                />

                <label>{t.password}</label>
                <div className="password-input-wrap">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    className="field"
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="৪-৬ ডিজিটের পিন বা পাসওয়ার্ড"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    tabIndex={-1}
                    title={showSignupPassword ? 'লুকান' : 'দেখুন'}
                  >
                    {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {users.length === 0 ? (
                  <div className="info-note" style={{ marginTop: 14, background: '#fef3c7', borderColor: '#f59e0b', color: '#92400e' }}>
                    <ShieldCheck size={18} />{' '}
                    <span>
                      {lang === 'bn'
                        ? 'প্রথম নিবন্ধিত ব্যক্তি স্বয়ংক্রিয়ভাবে প্রধান অ্যাডমিন (Admin) ক্ষমতা পাবেন।'
                        : 'First person to register will automatically become the Main Admin.'}
                    </span>
                  </div>
                ) : (
                  <div className="info-note" style={{ marginTop: 14 }}>
                    <ShieldCheck size={16} />{' '}
                    {lang === 'bn'
                      ? 'নিবন্ধন সম্পন্ন হলে আবেদনটি প্রধান অ্যাডমিনের অনুমোদনের জন্য যাবে।'
                      : 'Submitted registrations require Main Admin verification.'}
                  </div>
                )}

                <button type="submit" className="primary-button" style={{ marginTop: 16 }} disabled={isSigningUp}>
                  <UserPlus size={18} /> {isSigningUp ? (lang === 'bn' ? 'নিবন্ধন করা হচ্ছে...' : 'Registering...') : (lang === 'bn' ? 'নিবন্ধন সম্পন্ন করুন' : 'Complete Registration')}
                </button>

                <button
                  type="button"
                  className="auth-switch"
                  onClick={() => setAuthMode('login')}
                >
                  {t.haveAccount}
                </button>
              </form>
            ) : (
              /* Forgot Password Screen - 100% Free / $0 SMS Cost */
              <div>
                {forgotSuccess ? (
                  <div style={{ textAlign: 'center', padding: '12px 6px' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#16a34a' }}>
                      <CheckCircle2 size={30} />
                    </div>
                    <h2 style={{ fontSize: 18, color: '#15803d', margin: '0 0 8px' }}>
                      {lang === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!' : 'Password Reset Successful!'}
                    </h2>
                    <p style={{ fontSize: 13, color: '#4b5563', margin: '0 0 18px', lineHeight: 1.5 }}>
                      {lang === 'bn' ? 'আপনার নতুন পাসওয়ার্ড সংরক্ষিত হয়েছে। এখন লগইন করুন।' : 'Your new password has been saved. Please log in.'}
                    </p>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        setForgotSuccess(false);
                        setAuthMode('login');
                      }}
                    >
                      <LogIn size={18} /> {t.login}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPasswordDirect}>
                    <h2 style={{ fontSize: 18, margin: '0 0 6px', color: '#8d1717' }}>{t.resetPassword}</h2>
                    <p style={{ fontSize: 12, color: '#776', margin: '0 0 16px' }}>{t.resetPasswordSubtitle}</p>

                    <label>{t.phone}</label>
                    <input
                      className="field"
                      value={forgotPhone}
                      onChange={e => setForgotPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      inputMode="tel"
                      required
                      autoFocus
                    />

                    <label>{t.newPassword}</label>
                    <div className="password-input-wrap">
                      <input
                        type={showResetPassword ? 'text' : 'password'}
                        className="field"
                        value={newResetPassword}
                        onChange={e => setNewResetPassword(e.target.value)}
                        placeholder="নতুন ৪-৬ ডিজিটের পিন বা পাসওয়ার্ড"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        tabIndex={-1}
                        title={showResetPassword ? 'লুকান' : 'দেখুন'}
                      >
                        {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    <button type="submit" className="primary-button" style={{ marginTop: 14 }}>
                      <CheckCircle2 size={18} /> {lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password'}
                    </button>

                    <button
                      type="button"
                      className="auth-switch"
                      onClick={() => setAuthMode('login')}
                    >
                      ← {lang === 'bn' ? 'লগইন পৃষ্ঠায় ফিরে যান' : 'Back to Login'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {toast && (
          <div className="toast">
            <CheckCircle2 size={18} />
            {toast}
          </div>
        )}
      </div>
    );
  }

  // ===================== RENDER: MAIN APP =====================
  return (
    <div className="app-shell">
      {/* Top Header */}
      <header className="topbar">
        <div className="brand" onClick={() => setTab('home')} role="button" tabIndex={0}>
          <div className="brand-mark">
            <Flower2 size={21} />
          </div>
          <div>
            <strong>{lang === 'bn' ? 'উৎসব সঞ্চয়' : 'Utsab Sonchay'}</strong>
            <small>{currentUser.name} ({role})</small>
          </div>
        </div>
        <div className="top-actions">
          <button
            className="icon-button"
            aria-label="Notifications"
            onClick={() => setTab('notifications')}
          >
            <Bell size={21} />
            {unreadCount > 0 && <i>{unreadCount > 9 ? '9+' : unreadCount}</i>}
          </button>
          <button
            className="avatar"
            title={`${currentUser.name} (${role})`}
            onClick={() => setTab('more')}
          >
            {currentUser.name.slice(0, 1)}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {tab !== 'home' && (
          <div className="page-heading" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="back-button" onClick={() => setTab('home')} aria-label="Back">
                <ArrowLeft size={20} />
              </button>
              <h1>{screenTitle()}</h1>
            </div>

            {/* Top-Right Month Filter Dropdown as requested */}
            {((tab === 'income' && incomeSection === 'chada') || tab === 'contributions') && (
              <div className="month-dropdown-wrapper">
                <select
                  className="month-select-dropdown"
                  value={incomeMonthFilter}
                  onChange={e => setIncomeMonthFilter(e.target.value)}
                  aria-label="Filter by month"
                >
                  <option value="all">📅 {lang === 'bn' ? 'সব মাস' : 'All Months'}</option>
                  {PUJA_CYCLE_MONTHS.map(m => {
                    const count = income.filter(x => x.type === 'contribution' && (x.month === m.id || x.month === m.shortBn)).length;
                    return (
                      <option key={m.id} value={m.id}>
                        {lang === 'bn' ? m.shortBn : m.shortEn} {count > 0 ? `(${toBnDigits(count)})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {tab === 'income' && incomeSection === 'pronami' && (
              <button
                className="primary-small"
                onClick={() => setTab('pronami')}
                style={{ padding: '7px 12px', fontSize: 11 }}
              >
                <Plus size={15} /> {lang === 'bn' ? 'নতুন প্রণামী' : 'Add Pronami'}
              </button>
            )}
          </div>
        )}

        {/* ===================== TAB: HOME ===================== */}
        {tab === 'home' && (
          <>
            {/* Festival Banner */}
            <section className="festival-banner">
              <div className="banner-flower">✿</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span className="eyebrow">{lang === 'bn' ? 'শারদীয় শুভেচ্ছা' : 'Sharodiya Greetings'}</span>
                  <div className="calendar-year-pills" style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}>
                    <button
                      className={`calendar-year-pill ${selectedPujaYear === 2026 ? 'active' : ''}`}
                      onClick={() => setSelectedPujaYear(2026)}
                      style={{ padding: '2px 7px' }}
                    >
                      {lang === 'bn' ? '২০২৬' : '2026'}
                    </button>
                    <button
                      className={`calendar-year-pill ${selectedPujaYear === 2027 ? 'active' : ''}`}
                      onClick={() => setSelectedPujaYear(2027)}
                      style={{ padding: '2px 7px' }}
                    >
                      {lang === 'bn' ? '২০২৭' : '2027'}
                    </button>
                  </div>
                </div>
                <h1>{lang === 'bn' ? activePujaSchedule.titleBn : activePujaSchedule.titleEn}</h1>
                <p>
                  {isFestivalOngoing ? (
                    lang === 'bn' ? 'আজ দুর্গাপূজার মহাউৎসব চলছে!' : 'Durga Puja Celebration is ongoing!'
                  ) : daysToShashthi > 0 ? (
                    <>
                      {t.countdown}{' '}
                      <b>{lang === 'bn' ? toBnDigits(daysToShashthi) : daysToShashthi} {t.daysRemaining}</b>
                    </>
                  ) : (
                    <span>{lang === 'bn' ? `উৎসব সমাপ্ত (${toBnDigits(Math.abs(daysToDashami))} দিন আগে)` : `Celebration ended (${Math.abs(daysToDashami)} days ago)`}</span>
                  )}
                </p>
              </div>
              <div
                className="countdown"
                style={{
                  background: isFestivalOngoing ? '#15803d' : daysToShashthi > 0 ? '#a61f1f' : '#64748b',
                  cursor: 'pointer'
                }}
                onClick={() => setTab('calendar')}
                title={lang === 'bn' ? 'ক্যালেন্ডার দেখুন' : 'View Calendar'}
              >
                {isFestivalOngoing ? (
                  <>
                    <strong style={{ fontSize: 16 }}>{lang === 'bn' ? 'উৎসব' : 'Fest'}</strong>
                    <span>{lang === 'bn' ? 'চলছে' : 'Live'}</span>
                  </>
                ) : daysToShashthi > 0 ? (
                  <>
                    <strong>{lang === 'bn' ? toBnDigits(daysToShashthi) : daysToShashthi}</strong>
                    <span>{t.daysRemaining}</span>
                  </>
                ) : (
                  <>
                    <strong style={{ fontSize: 16 }}>{lang === 'bn' ? 'সম্পন্ন' : 'Done'}</strong>
                    <span>{lang === 'bn' ? 'পূজা' : 'Puja'}</span>
                  </>
                )}
              </div>
            </section>

            {/* MONTHLY CHADA 1st-10th DEADLINE BANNER */}
            <section className={`chada-window-card ${currentUser?.paid ? 'paid' : isChadaWindowActive ? 'active-window' : 'overdue'}`}>
              <div className="chada-window-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarDays size={16} color={currentUser?.paid ? '#15803d' : isChadaWindowActive ? '#b45309' : '#be123c'} />
                  <strong style={{ fontSize: 13, color: currentUser?.paid ? '#15803d' : isChadaWindowActive ? '#92400e' : '#9f1239' }}>
                    {t.chadaDeadlineTitle}
                  </strong>
                </div>
                <span className={`chada-window-badge ${currentUser?.paid ? 'badge-window-paid' : isChadaWindowActive ? 'badge-window-active' : 'badge-window-overdue'}`}>
                  {currentUser?.paid
                    ? (lang === 'bn' ? 'পরিশোধিত ✓' : 'Paid ✓')
                    : isChadaWindowActive
                    ? (lang === 'bn' ? (currentDayOfMonth === 10 ? 'আজই শেষ দিন!' : `আর ${toBnDigits(daysLeftInChadaWindow)} দিন বাকি`) : (currentDayOfMonth === 10 ? 'Last Day!' : `${daysLeftInChadaWindow}d left`))
                    : (lang === 'bn' ? 'সময়সীমা শেষ (বকেয়া)' : 'Overdue')}
                </span>
              </div>

              <div className={`chada-window-content ${currentUser?.paid ? 'paid' : isChadaWindowActive ? 'active-window' : 'overdue'}`}>
                <h3>
                  {currentUser?.paid
                    ? (lang === 'bn' ? 'আপনার চলতি মাসের চাঁদা সফলভাবে জমা হয়েছে' : 'Monthly contribution successfully paid')
                    : isChadaWindowActive
                    ? (lang === 'bn' ? 'চলতি মাসের চাঁদা প্রদানের সময় চলছে (১ - ১০ তারিখ)' : 'Monthly chada payment window is open (1st - 10th)')
                    : (lang === 'bn' ? '১০ তারিখের সময়সীমা অতিক্রান্ত হয়েছে!' : '10th deadline has passed!')}
                </h3>
                <p>
                  {currentUser?.paid
                    ? (lang === 'bn' ? 'ধন্যবাদ! আপনার ৳১,০০০ চাঁদা পূজা তহবিলে হিসাবভুক্ত হয়েছে।' : 'Thank you! Your ৳1,000 contribution has been credited.')
                    : isChadaWindowActive
                    ? (lang === 'bn' ? `প্রতি মাসের ১ থেকে ১০ তারিখের মধ্যে চাঁদা প্রদান নিয়ম। ${currentDayOfMonth === 10 ? 'আজ ১০ তারিখ — চাঁদা দেওয়ার শেষ দিন!' : `১০ তারিখ শেষ সময়, আর মাত্র ${toBnDigits(daysLeftInChadaWindow)} দিন বাকি।`} অনুগ্রহ করে আপনার ৳১,০০০ চাঁদা বিকাশ বা নগদে জমা দিন।` : `Chada must be paid within 1st-10th. ${daysLeftInChadaWindow} days remaining.`)
                    : (lang === 'bn' ? `চলতি মাসের ১০ তারিখের সময়সীমা শেষ হয়েছে (${toBnDigits(currentDayOfMonth - 10)} দিন অতিক্রান্ত)। আপনার ৳১,০০০ চাঁদা এখনও বাকি আছে। অনুগ্রহ করে দ্রুত পরিশোধ করুন।` : 'Monthly deadline of 10th has passed. Your ৳1,000 is overdue. Please pay now.')}
                </p>

                <div className="chada-window-action">
                  {!currentUser?.paid ? (
                    <button
                      className="chada-pay-btn"
                      onClick={() => setTab('bkash-pay')}
                    >
                      <Wallet size={15} /> {t.payChadaNow}
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: '#166534', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <CheckCircle2 size={15} /> {lang === 'bn' ? 'রসিদ ও হিসাব সংরক্ষিত আছে' : 'Receipt & record saved'}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* MOBILE SCREEN PUSH NOTIFICATION PROMPT / ACTIVE BANNER */}
            {pushPermission !== 'granted' ? (
              <section className="push-permission-card">
                <div className="push-permission-inner">
                  <div className="push-icon-box">
                    <BellRing size={22} />
                  </div>
                  <div className="push-info">
                    <strong>{t.enablePushTitle}</strong>
                    <p>{t.enablePushDesc}</p>
                    <button className="push-enable-btn" onClick={requestPushPermission}>
                      <Bell size={13} /> {t.enablePushBtn}
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <div className="push-active-banner">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BellRing size={16} color="#15803d" />
                  {t.pushActiveBadge} (১-১০ তারিখের রিমাইন্ডার সক্রিয়)
                </span>
              </div>
            )}

            {/* ADMIN MOBILE BROADCAST CARD */}
            {role === 'Admin' && (
              <section className="admin-reminder-card">
                <div className="admin-reminder-head">
                  <h4>
                    <Send size={15} /> {lang === 'bn' ? 'চাঁদা রিমাইন্ডার ও পুশ নোটিফিকেশন কন্ট্রোল' : 'Push Notification Control'}
                  </h4>
                  <span style={{ fontSize: 11, color: '#9a3412', fontWeight: 700 }}>
                    {lang === 'bn' ? `বকেয়া: ${toBnDigits(unpaidMembersCount)} জন` : `Unpaid: ${unpaidMembersCount}`}
                  </span>
                </div>
                <p>
                  {lang === 'bn'
                    ? '১ থেকে ১০ তারিখের মধ্যে চাঁদা প্রদানের জন্য সকল বকেয়া সদস্যের মোবাইল স্ক্রিনে সরাসরি পুশ নোটিফিকেশন পাঠান।'
                    : 'Send immediate mobile screen push notifications reminding unpaid members about the 1st-10th chada deadline.'}
                </p>
                <div className="admin-reminder-actions">
                  <button
                    className="primary-small"
                    style={{ background: '#ea580c', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px' }}
                    onClick={sendChadaReminderToUnpaid}
                  >
                    <Send size={13} /> {t.sendReminderToAll}
                  </button>
                </div>
              </section>
            )}

            {/* Member's Personal Monthly Chada Status Card */}
            <section
              style={{
                background: currentUser.paid
                  ? 'linear-gradient(135deg, #e3f5e6, #d2f0d7)'
                  : 'linear-gradient(135deg, #fff2f6, #ffe1ec)',
                border: currentUser.paid ? '1px solid #c2e8c8' : '1px solid #f6bed3',
                borderRadius: 20,
                padding: '16px 18px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: currentUser.paid ? '#206b40' : '#e2136e' }}>
                    {lang === 'bn' ? 'আমার মাসিক চাঁদা (চলতি মাস)' : 'My Monthly Chada (Current Month)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempLimitChoice(currentUser.monthlyCommitment || 1000);
                      setCustomLimitInput('');
                      setShowChangeLimitModal(true);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.8)',
                      border: '1px solid #e0b0c5',
                      borderRadius: 8,
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#a00e4f',
                      padding: '2px 7px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      cursor: 'pointer'
                    }}
                    title={lang === 'bn' ? 'মাসিক চাঁদার পরিমাণ পরিবর্তন করুন' : 'Change monthly limit'}
                  >
                    ✏️ {lang === 'bn' ? 'চাঁদা পরিবর্তন' : 'Change Limit'}
                  </button>
                </div>
                <h3 style={{ margin: '4px 0', fontSize: 17, color: currentUser.paid ? '#195533' : '#a00e4f' }}>
                  {currentUser.paid ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={18} color="#25774a" /> {lang === 'bn' ? `পরিশোধিত (${fmt(currentUser.monthlyCommitment || 1000)})` : `Paid (${fmt(currentUser.monthlyCommitment || 1000)})`}
                    </span>
                  ) : (
                    <span>{lang === 'bn' ? `বাকি আছে (${fmt(currentUser.monthlyCommitment || 1000)})` : `Unpaid (${fmt(currentUser.monthlyCommitment || 1000)})`}</span>
                  )}
                </h3>
                <small style={{ color: '#665' }}>
                  {currentUser.paid
                    ? (lang === 'bn' ? 'ধন্যবাদ! আপনার চাঁদা তহবিলে জমা হয়েছে।' : 'Thank you! Contribution credited.')
                    : (lang === 'bn' ? 'বিকাশের মাধ্যমে সরাসরি চাঁদা পরিশোধ করুন' : 'Pay via bKash and verify TrxID')}
                </small>
              </div>

              {!currentUser.paid && (
                <button
                  className="primary-small"
                  style={{ background: '#e2136e', padding: '10px 14px', borderRadius: 12, whiteSpace: 'nowrap' }}
                  onClick={() => {
                    setChadaAmountInput(String(currentUser.monthlyCommitment || 1000));
                    setTab('bkash-pay');
                  }}
                >
                  <Smartphone size={16} /> {lang === 'bn' ? 'বিকাশে চাঁদা দিন' : 'Pay via bKash'}
                </button>
              )}
            </section>

            {/* Financial Stats Grid */}
            <section className="stats-grid">
              <Stat icon={<HandCoins />} label={t.collected} value={fmt(collected)} tint="orange" />
              <Stat icon={<Wallet />} label={t.paid} value={fmt(paidBillsTotal)} tint="red" />
              <Stat icon={<ReceiptText />} label={t.committed} value={fmt(committed)} tint="gold" />
              <Stat icon={<Landmark />} label={t.due} value={fmt(due)} tint="green" />
            </section>

            {/* Balance Card */}
            <section className="balance-card">
              <div>
                <span>{t.available}</span>
                <h2>{fmt(available)}</h2>
                <small>
                  <TrendingUp size={14} /> {t.totalCollected}
                </small>
              </div>
              <div className="balance-side">
                <span>{t.projected}</span>
                <strong className={projected < 0 ? 'negative' : ''}>{fmt(projected)}</strong>
              </div>
            </section>

            {/* Admin Alert: Pending Member Registrations */}
            {role === 'Admin' && pendingMembersCount > 0 && (
              <div
                onClick={() => {
                  setTab('members');
                  setMemberSectionTab('pending');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#fef3c7',
                  border: '1.5px solid #f59e0b',
                  borderRadius: 16,
                  padding: '12px 14px',
                  marginBottom: 16,
                  cursor: 'pointer',
                  color: '#78350f',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)'
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                  <UserPlus size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 13.5, display: 'block', color: '#92400e' }}>
                    {lang === 'bn' ? `${toBnDigits(pendingMembersCount)} জন নতুন সদস্য অনুমোদনের অপেক্ষায়` : `${pendingMembersCount} new member approvals pending`}
                  </strong>
                  <span style={{ fontSize: 11, color: '#a16207' }}>
                    {lang === 'bn' ? 'সদস্য তালিকা থেকে যাচাই করে অনুমোদন করুন' : 'Tap to review and approve'}
                  </span>
                </div>
                <ChevronRight size={18} color="#b45309" />
              </div>
            )}

            {/* Quick Actions (All members have volunteer privileges by default) */}
            <section className="section-block">
              <div className="section-title">
                <h2>{t.quick}</h2>
                <span className="demo-pill">
                  <span /> {role} {lang === 'bn' ? 'মোড' : 'Mode'}
                </span>
              </div>
              <div className="quick-grid">
                <Quick
                  icon={<Smartphone />}
                  label={t.payChadaBkash}
                  color="red"
                  onClick={() => setTab('bkash-pay')}
                />
                <Quick
                  icon={<HandCoins />}
                  label={t.pronami}
                  color="orange"
                  onClick={() => { setTab('pronami'); setAddMenu(false); }}
                />
                <Quick
                  icon={<Crown />}
                  label={lang === 'bn' ? 'পূজা কমিটি' : 'Committee'}
                  color="gold"
                  onClick={() => setTab('committee')}
                />
                <Quick
                  icon={<Users />}
                  label={t.members}
                  color="green"
                  onClick={() => { setTab('members'); setMemberSectionTab('approved'); }}
                />
                <Quick
                  icon={<ReceiptText />}
                  label={t.request}
                  color="gold"
                  onClick={() => setTab('request')}
                />
                <Quick
                  icon={<FileSpreadsheet />}
                  label={t.financialReport}
                  color="orange"
                  onClick={() => setTab('report')}
                />
              </div>
            </section>

            {/* Pending Approvals Section */}
            <section className="section-block">
              <div className="section-title">
                <h2>{t.pending}</h2>
                <button
                  className="text-link"
                  onClick={() => setTab(bills.some(b => b.status === 'Pending') ? 'expenses' : 'income')}
                >
                  {t.viewAll} <ChevronRight size={15} />
                </button>
              </div>
              <div className="panel">
                {income.filter(x => x.status === 'Pending').map(x => (
                  <div
                    className="activity-row"
                    key={x.id}
                    onClick={() => setSelectedIncome(x)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="activity-icon orange-bg">
                      <HandCoins size={18} />
                    </div>
                    <div className="activity-copy">
                      <strong>{x.name}</strong>
                      <span>{x.type === 'pronami' ? (lang === 'bn' ? 'প্রণামী' : 'Pronami') : (lang === 'bn' ? 'চাঁদা' : 'Contribution')} · {x.date}</span>
                    </div>
                    <div className="activity-end">
                      <b>{fmt(x.amount)}</b>
                      <StatusBadge status={x.status} lang={lang} />
                    </div>
                    {role === 'Admin' && (
                      <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                        <button className="mini-approve" onClick={() => approve(x.id)} title={t.approve}>
                          <CheckCircle2 size={18} />
                        </button>
                        <button className="mini-approve danger-btn" onClick={() => reject(x.id)} title={t.reject}>
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {bills.filter(x => x.status === 'Pending').map(x => (
                  <div
                    className="activity-row"
                    key={x.id}
                    onClick={() => setSelectedReviewBill(x)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="activity-icon red-bg">
                      <ReceiptText size={18} />
                    </div>
                    <div className="activity-copy">
                      <strong>{x.vendor}</strong>
                      <span>{x.description} · আবেদনকারী: <b>{x.requester}</b></span>
                      <small style={{ color: '#887b70', marginTop: 4 }}>
                        ১. মোট বিল: <b>{fmt(x.total)}</b> | ২. দেওয়া: <b style={{ color: '#25774a' }}>{fmt(x.paid)}</b> | ৩. বাকি: <b style={{ color: '#b32323' }}>{fmt(x.total - x.paid)}</b>
                      </small>
                    </div>
                    <div className="activity-end">
                      <StatusBadge status={x.status} lang={lang} />
                      <small style={{ fontSize: 9, color: '#a05a16' }}>যাচাই করতে ট্যাপ করুন</small>
                    </div>
                    {role === 'Admin' && (
                      <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                        <button className="mini-approve" onClick={() => approve(x.id)} title={t.approve}>
                          <CheckCircle2 size={18} />
                        </button>
                        <button className="mini-approve danger-btn" onClick={() => reject(x.id)} title={t.reject}>
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {income.filter(x => x.status === 'Pending').length === 0 &&
                  bills.every(x => x.status !== 'Pending') && (
                    <p className="empty-small">{t.noData}</p>
                  )}
              </div>
            </section>

            {/* Recent Confirmed Collections */}
            <section className="section-block">
              <div className="section-title">
                <h2>{t.recent}</h2>
                <button className="text-link" onClick={() => setTab('income')}>
                  {t.viewAll} <ChevronRight size={15} />
                </button>
              </div>
              <div className="panel">
                {income.filter(x => x.status === 'Confirmed').slice(0, 4).map(x => (
                  <div className="activity-row" key={x.id} onClick={() => setSelectedIncome(x)} style={{ cursor: 'pointer' }}>
                    <div className={'activity-icon ' + (x.type === 'pronami' ? 'gold-bg' : 'green-bg')}>
                      {x.type === 'pronami' ? <Flower2 size={18} /> : <Wallet size={18} />}
                    </div>
                    <div className="activity-copy">
                      <strong>{x.name}</strong>
                      <span>
                        {x.type === 'pronami' ? (lang === 'bn' ? `প্রণামী · ${x.day}` : `Pronami · ${x.day}`) : (lang === 'bn' ? 'চাঁদা' : 'Contribution')} · {x.method}
                      </span>
                    </div>
                    <div className="activity-end">
                      <b>{fmt(x.amount)}</b>
                      <StatusBadge status={x.status} lang={lang} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ===================== TAB: BKASH & NAGAD PAY & VERIFY ===================== */}
        {tab === 'bkash-pay' && (
          <section className="form-card">
            <div className="form-intro">
              <div className="big-icon" style={{ background: chadaMethod === 'bKash' ? '#ffe4ee' : '#ffe9dc', color: chadaMethod === 'bKash' ? '#e2136e' : '#ea580c' }}>
                <Smartphone size={26} />
              </div>
              <div>
                <h2>{t.trxVerifyTitle}</h2>
                <p>{t.trxVerifySubtitle}</p>
              </div>
            </div>

            {/* Committee Accounts Box: bKash & Nagad (Personal / Send Money) */}
            <div className="payment-accounts-grid">
              {/* bKash Account Box */}
              <div className="payment-account-box bkash">
                <div>
                  <div className="account-badge-row">
                    <span className="account-brand-title bkash">bKash বিকাশ</span>
                    <span className="date-badge" style={{ background: '#fce3ed', color: '#b31256', fontSize: 10 }}>Personal</span>
                  </div>
                  <div className="account-phone-val">{COMMITTEE_BKASH_NUMBER}</div>
                  <small style={{ fontSize: 11, color: '#776', display: 'block', marginBottom: 8 }}>
                    {lang === 'bn' ? 'Send Money করুন' : 'Send Money'}
                  </small>
                </div>
                <button
                  type="button"
                  className="copy-pill"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => copyPaymentNumber('bKash', COMMITTEE_BKASH_NUMBER)}
                >
                  {copiedAccount === 'bKash' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedAccount === 'bKash' ? t.copied : (lang === 'bn' ? 'বিকাশ নম্বর কপি' : 'Copy bKash')}
                </button>
              </div>

              {/* Nagad Account Box */}
              <div className="payment-account-box nagad">
                <div>
                  <div className="account-badge-row">
                    <span className="account-brand-title nagad">Nagad নগদ</span>
                    <span className="date-badge" style={{ background: '#feebd9', color: '#c2410c', fontSize: 10 }}>Personal</span>
                  </div>
                  <div className="account-phone-val">{COMMITTEE_NAGAD_NUMBER}</div>
                  <small style={{ fontSize: 11, color: '#776', display: 'block', marginBottom: 8 }}>
                    {lang === 'bn' ? 'Send Money করুন' : 'Send Money'}
                  </small>
                </div>
                <button
                  type="button"
                  className="copy-pill nagad"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => copyPaymentNumber('Nagad', COMMITTEE_NAGAD_NUMBER)}
                >
                  {copiedAccount === 'Nagad' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedAccount === 'Nagad' ? t.copied : (lang === 'bn' ? 'নগদ নম্বর কপি' : 'Copy Nagad')}
                </button>
              </div>
            </div>

            {/* Steps Instructions */}
            <div className="steps-box">
              <strong style={{ display: 'block', color: '#8d1717', marginBottom: 6 }}>
                {lang === 'bn' ? 'কীভাবে বিকাশ বা নগদে চাঁদা পরিশোধ করবেন:' : 'How to pay chada:'}
              </strong>
              <ol>
                <li>{lang === 'bn' ? 'আপনার বিকাশ বা নগদ অ্যাপ ওপেন করে "Send Money" অপশনে যান।' : 'Open bKash or Nagad app and select "Send Money".'}</li>
                <li>{lang === 'bn' ? `উপরের কমিটির বিকাশ (${COMMITTEE_BKASH_NUMBER}) বা নগদ (${COMMITTEE_NAGAD_NUMBER}) নম্বরে চাঁদার টাকা পাঠান।` : `Send money to committee bKash or Nagad number.`}</li>
                <li>{lang === 'bn' ? 'ফিরতি SMS থেকে Transaction ID (TrxID) কপি করুন।' : 'Copy the Transaction ID (TrxID) from the confirmation SMS.'}</li>
                <li>{lang === 'bn' ? 'নিচের ফর্মে TrxID ও প্রেরক নম্বর লিখে জমা দিন — অ্যাডমিন স্টেটমেন্ট মিলিয়ে অনুমোদন করবেন।' : 'Submit your TrxID below — Admin will verify statement and approve.'}</li>
              </ol>
            </div>

            {/* Method Selection Tabs */}
            <label>{lang === 'bn' ? '১. কোন মাধ্যমে টাকা পাঠিয়েছেন?' : '1. Which payment method did you use?'}</label>
            <div className="chada-method-tabs">
              <button
                type="button"
                className={`chada-method-btn ${chadaMethod === 'bKash' ? 'selected-bkash' : ''}`}
                onClick={() => setChadaMethod('bKash')}
              >
                <Smartphone size={16} /> bKash বিকাশ
              </button>
              <button
                type="button"
                className={`chada-method-btn ${chadaMethod === 'Nagad' ? 'selected-nagad' : ''}`}
                onClick={() => setChadaMethod('Nagad')}
              >
                <Smartphone size={16} /> Nagad নগদ
              </button>
            </div>

            {/* Month Selection */}
            <label>{lang === 'bn' ? '২. কোন মাসের চাঁদা পরিশোধ করছেন?' : '2. For which month are you paying Chada?'}</label>
            <select
              className="field"
              value={selectedChadaMonth}
              onChange={e => setSelectedChadaMonth(e.target.value)}
            >
              {PUJA_CYCLE_MONTHS.map(m => (
                <option key={m.id} value={m.id}>
                  {lang === 'bn' ? m.nameBn : m.nameEn}
                </option>
              ))}
            </select>

            {/* Amount Input */}
            <label>{lang === 'bn' ? '৩. চাঁদার পরিমাণ' : '3. Chada Amount'}</label>
            <div className="amount-display">
              <span>৳</span>
              <input
                value={chadaAmountInput}
                onChange={e => setChadaAmountInput(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                placeholder="1000"
              />
            </div>

            {/* Sender Phone */}
            <label>{lang === 'bn' ? '৪. প্রেরকের মোবাইল নম্বর' : '4. Sender Phone Number'}</label>
            <input
              className="field"
              value={verifyPhone}
              onChange={e => setVerifyPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              inputMode="tel"
            />

            {/* TrxID Input */}
            <label style={{ margin: '16px 0 8px', display: 'block' }}>
              {lang === 'bn' ? '৫. ট্রানজ্যাকশন আইডি (TrxID)' : '5. Transaction ID (TrxID)'}
            </label>
            <input
              className="field"
              value={inputTrxId}
              onChange={e => setInputTrxId(e.target.value)}
              placeholder={chadaMethod === 'bKash' ? 'যেমন: BK8Y9921' : 'যেমন: NG7X2219'}
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}
            />

            <button
              type="button"
              className="primary-button"
              style={{ background: chadaMethod === 'bKash' ? 'linear-gradient(110deg, #e2136e, #c00f5c)' : 'linear-gradient(110deg, #ea580c, #c2410c)' }}
              onClick={submitChadaPayment}
            >
              <CheckCircle2 size={18} /> {lang === 'bn' ? 'চাঁদার TrxID জমা দিন' : 'Submit Chada TrxID'}
            </button>

            {/* Verification Result / Receipt Display */}
            {verificationResult && (
              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  borderRadius: 14,
                  background: verificationResult.success ? '#f3fbf5' : '#fff5f5',
                  border: verificationResult.success ? '1.5px solid #28764b' : '1.5px solid #e06060'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: verificationResult.success ? '#28764b' : '#b32323' }}>
                  {verificationResult.success ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
                  <strong style={{ fontSize: 13, lineHeight: 1.5 }}>{verificationResult.message}</strong>
                </div>

                {verificationResult.receipt && (
                  <div className="receipt-card">
                    <span style={{ fontSize: 11, color: '#25774a', fontWeight: 800 }}>
                      শারদীয় দুর্গাপূজা — চাঁদা জমা প্রাপ্তি স্লিপ
                    </span>
                    <h2 style={{ fontSize: 24, color: '#25774a', margin: '8px 0' }}>{fmt(verificationResult.receipt.amount)}</h2>
                    <div style={{ fontSize: 12, color: '#443', textAlign: 'left', marginTop: 10, lineHeight: 1.8 }}>
                      <div><b>সদস্য:</b> {verificationResult.receipt.name}</div>
                      <div><b>মাধ্যম:</b> {verificationResult.receipt.method}</div>
                      <div><b>মাস:</b> {verificationResult.receipt.month}</div>
                      <div><b>প্রেরক নম্বর:</b> {verificationResult.receipt.phone}</div>
                      <div><b>TrxID:</b> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{verificationResult.receipt.trxId}</span></div>
                      <div><b>স্ট্যাটাস:</b> <span className="date-badge" style={{ background: '#fff0ce', color: '#a76b09', fontWeight: 700 }}>🕒 অ্যাডমিন স্টেটমেন্ট যাচাইয়ের অপেক্ষায়</span></div>
                      <div><b>তারিখ:</b> {verificationResult.receipt.date}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ===================== TAB: PRONAMI (VOLUNTEER ACTION) ===================== */}
        {tab === 'pronami' && (
          <section className="form-card">
            <div className="form-intro">
              <div className="big-icon orange-bg">
                <Flower2 size={24} />
              </div>
              <div>
                <h2>{t.addPronami}</h2>
                <p>{t.noReceipt}</p>
              </div>
            </div>

            <label>{t.amount}</label>
            <div className="amount-display">
              <span>৳</span>
              <input
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                aria-label={t.amount}
                placeholder="0"
              />
            </div>
            <div className="amount-chips">
              {[100, 200, 500, 1000, 2000, 5000].map(n => (
                <button key={n} onClick={() => setAmount(String(n))}>
                  ৳{lang === 'bn' ? toBnDigits(n) : n}
                </button>
              ))}
            </div>

            <label>{t.giver}</label>
            <input
              className="field"
              value={giver}
              onChange={e => setGiver(e.target.value)}
              placeholder={lang === 'bn' ? 'নাম না দিলেও হবে (অজ্ঞাতনামা)' : 'Optional (defaults to Anonymous)'}
            />

            <label>{t.pujaDay}</label>
            <div className="choice-row" style={{ flexWrap: 'wrap' }}>
              {['মহালয়া', 'ষষ্ঠী', 'সপ্তমী', 'অষ্টমী', 'নবমী', 'দশমী'].map(d => (
                <button
                  key={d}
                  className={day === d ? 'selected' : ''}
                  onClick={() => setDay(d)}
                >
                  {d}
                </button>
              ))}
            </div>

            <label>{t.method}</label>
            <div className="choice-row methods">
              {(['Cash', 'bKash', 'Nagad', 'Bank'] as PaymentMethod[]).map(m => (
                <button
                  key={m}
                  className={method === m ? 'selected' : ''}
                  onClick={() => setMethod(m)}
                >
                  {m === 'Cash' ? t.cash : m === 'bKash' ? t.bkash : m === 'Nagad' ? t.nagad : t.bank}
                </button>
              ))}
            </div>

            <button className="toggle-row" onClick={() => setPublicName(!publicName)}>
              <span>
                <strong>{lang === 'bn' ? 'নাম প্রকাশ করা যাবে' : 'Public Donor Name'}</strong>
                <small>{lang === 'bn' ? 'সার্বজনীন প্রণামী তালিকায় দেখাবে' : 'Will display in public donors board'}</small>
              </span>
              <span className={'toggle ' + (publicName ? 'on' : '')} />
            </button>

            {role !== 'Admin' && (
              <div className="info-note">
                <Clock3 size={16} />{' '}
                {lang === 'bn'
                  ? 'আপনার এন্ট্রি অ্যাডমিন অনুমোদন না করা পর্যন্ত Pending থাকবে।'
                  : 'Your entry will remain Pending until approved by an admin.'}
              </div>
            )}

            <button className="primary-button" onClick={addPronami}>
              {t.saveNext} <Plus size={18} />
            </button>
          </section>
        )}

        {/* ===================== TAB: INCOME ===================== */}
        {tab === 'income' && (
          <>
            {/* Top Segmented Switcher: Chada (Primary Focus) vs Pronami (Festival Event) */}
            <div className="income-section-tabs">
              <button
                className={`income-section-tab ${incomeSection === 'chada' ? 'active' : ''}`}
                onClick={() => setIncomeSection('chada')}
              >
                <Wallet size={16} />
                <span>{lang === 'bn' ? '১. মাসিক চাঁদা (প্রধান খাতা)' : '1. Monthly Chada (Core)'}</span>
              </button>
              <button
                className={`income-section-tab ${incomeSection === 'pronami' ? 'active' : ''}`}
                onClick={() => setIncomeSection('pronami')}
              >
                <Flower2 size={16} />
                <span>{lang === 'bn' ? '২. পূজার প্রণামী (উৎসবকালীন)' : '2. Festival Pronami'}</span>
              </button>
            </div>

            {/* SECTION 1: MONTHLY CHADA (CORE RECURRING COLLECTION) */}
            {incomeSection === 'chada' && (
              <>
                {/* Month Summary KPI Banner */}
                <div style={{ background: '#fdf9f4', border: '1.5px solid #ebdccb', borderRadius: 18, padding: '16px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#8d1717', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CalendarDays size={16} />
                      {incomeMonthFilter === 'all'
                        ? (lang === 'bn' ? '১২ মাসের সর্বমোট চাঁদা' : 'All 12 Months Total')
                        : `${getMonthLabel(incomeMonthFilter, true)} এর চাঁদা`}
                    </span>
                    <span className="demo-pill" style={{ background: '#faeade', color: '#8d1717', fontWeight: 700 }}>
                      {incomeMonthFilter === 'all' ? (lang === 'bn' ? '১২ মাসের চক্র' : '12-Month Cycle') : (lang === 'bn' ? 'চলতি মাস' : 'Month')}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'white', borderRadius: 14, padding: '12px 14px', border: '1px solid #ebd9c5' }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#7a6a5d', display: 'block', fontWeight: 600 }}>
                        {lang === 'bn' ? 'আদায়কৃত চাঁদা' : 'Collected'}
                      </span>
                      <strong style={{ fontSize: 20, color: '#25774a', fontWeight: 800, display: 'block', marginTop: 2 }}>
                        {fmt(monthConfirmedChada)}
                      </strong>
                    </div>
                    <div style={{ borderLeft: '1px solid #eee5d9', paddingLeft: 12 }}>
                      <span style={{ fontSize: 11, color: '#7a6a5d', display: 'block', fontWeight: 600 }}>
                        {lang === 'bn' ? 'পরিশোধ অগ্রগতি' : 'Progress'}
                      </span>
                      <strong style={{ fontSize: 17, color: '#8d1717', fontWeight: 800, display: 'block', marginTop: 2 }}>
                        {toBnDigits(monthPaidMembersCount)} / {toBnDigits(users.length)} জন
                      </strong>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="progress" style={{ marginTop: 12, height: 7 }}>
                    <i style={{ width: `${Math.min(100, Math.round((monthPaidMembersCount / Math.max(1, users.length)) * 100))}%` }} />
                  </div>
                </div>

                {/* Quick bKash Payment Banner */}
                <div style={{ marginBottom: 16 }}>
                  <button
                    className="primary-button"
                    style={{ background: 'linear-gradient(110deg, #e2136e, #c00f5c)', margin: 0 }}
                    onClick={() => setTab('bkash-pay')}
                  >
                    <Smartphone size={18} /> {lang === 'bn' ? 'বিকাশে মাসিক চাঁদা পরিশোধ করুন' : 'Pay Monthly Chada via bKash'}
                  </button>
                </div>

                {/* Section Title & Sub-Filter for Member Payment Status */}
                <div className="section-title inner-title" style={{ marginTop: 10 }}>
                  <div>
                    <h2 style={{ fontSize: 15 }}>
                      {lang === 'bn' ? `${getMonthLabel(incomeMonthFilter, true)} — সদস্যদের চাঁদা তালিকা` : `Members Register — ${getMonthLabel(incomeMonthFilter, true)}`}
                    </h2>
                    <p style={{ fontSize: 11, color: '#776', margin: '3px 0 0' }}>
                      {lang === 'bn' ? 'সকল সদস্য প্রতি মাসে চাঁদা প্রদান করবেন' : 'All members pay contribution monthly'}
                    </p>
                  </div>
                </div>

                {/* Member Status Filter Chips */}
                <div className="sub-filter-row" style={{ marginBottom: 12 }}>
                  <button
                    className={`sub-chip ${chadaMemberFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setChadaMemberFilter('all')}
                  >
                    {t.all} ({users.length})
                  </button>
                  <button
                    className={`sub-chip ${chadaMemberFilter === 'paid' ? 'active' : ''}`}
                    onClick={() => setChadaMemberFilter('paid')}
                  >
                    ✓ {lang === 'bn' ? 'পরিশোধিত' : 'Paid'} ({monthPaidMembersCount})
                  </button>
                  <button
                    className={`sub-chip ${chadaMemberFilter === 'unpaid' ? 'active' : ''}`}
                    onClick={() => setChadaMemberFilter('unpaid')}
                    style={chadaMemberFilter !== 'unpaid' && (users.length - monthPaidMembersCount) > 0 ? { borderColor: '#e05a47', color: '#b32323', fontWeight: 700 } : {}}
                  >
                    🕒 {lang === 'bn' ? 'বকেয়া আছে' : 'Due'} ({users.length - monthPaidMembersCount})
                  </button>
                </div>

                {/* Member Chada Register List */}
                <div className="panel list-panel">
                  {users
                    .filter(m => {
                      const isPaid = income.some(
                        x => x.type === 'contribution' && x.status === 'Confirmed' && x.name === m.name && (targetChadaMonth === 'all' ? true : (x.month === targetChadaMonth || (targetChadaMonth === '2026-10' && !x.month)))
                      );
                      if (chadaMemberFilter === 'paid' && !isPaid) return false;
                      if (chadaMemberFilter === 'unpaid' && isPaid) return false;
                      return true;
                    })
                    .map(m => {
                      const confirmedEntry = income.find(
                        x => x.type === 'contribution' && x.status === 'Confirmed' && x.name === m.name && (targetChadaMonth === 'all' ? true : (x.month === targetChadaMonth || (targetChadaMonth === '2026-10' && !x.month)))
                      );
                      const pendingEntry = income.find(
                        x => x.type === 'contribution' && x.status === 'Pending' && x.name === m.name && (targetChadaMonth === 'all' ? true : (x.month === targetChadaMonth || (targetChadaMonth === '2026-10' && !x.month)))
                      );
                      const isPaid = !!confirmedEntry;

                      return (
                        <div
                          className="activity-row"
                          key={m.id}
                          onClick={() => {
                            if (pendingEntry) setSelectedIncome(pendingEntry);
                            else if (confirmedEntry) setSelectedIncome(confirmedEntry);
                          }}
                          style={{ cursor: pendingEntry || confirmedEntry ? 'pointer' : 'default' }}
                        >
                          <div className={'person-avatar ' + (isPaid ? '' : pendingEntry ? 'gold-bg' : 'orange-bg')} style={isPaid ? {} : { color: '#a05a16' }}>
                            {m.name.slice(0, 1)}
                          </div>
                          <div className="activity-copy">
                            <strong>
                              {m.name} {m.id === currentUser?.id && <span style={{ color: '#a61f1f' }}>(আমি)</span>}
                            </strong>
                            <span>
                              {m.phone} · <span className="role-badge">{m.role}</span> · <span style={{ fontSize: 10, color: '#7a5a3a' }}>মাসিক: {fmt(m.monthlyCommitment || 1000)}</span>
                            </span>
                            <small>
                              {isPaid
                                ? `${confirmedEntry.method} · ${confirmedEntry.date}${confirmedEntry.trxId ? ` · Trx: ${confirmedEntry.trxId}` : ''}`
                                : pendingEntry
                                ? `🕒 ${pendingEntry.method} TrxID: ${pendingEntry.trxId} (অ্যাডমিন স্টেটমেন্ট যাচাই প্রয়োজন)`
                                : (lang === 'bn' ? 'এই মাসের চাঁদা এখনো জমা হয়নি' : 'Pending for this month')}
                            </small>
                          </div>
                          <div className="activity-end">
                            <b>{fmt(m.monthlyCommitment || 1000)}</b>
                            {isPaid ? (
                              <StatusBadge status="Confirmed" lang={lang} />
                            ) : pendingEntry ? (
                              <StatusBadge status="Pending" lang={lang} />
                            ) : (
                              <span className="status pending" style={{ background: '#f5f0ea', color: '#887a6d' }}>
                                {lang === 'bn' ? 'বকেয়া' : 'Due'}
                              </span>
                            )}
                          </div>
                          {role === 'Admin' && pendingEntry && (
                            <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                              <button
                                className="mini-approve"
                                title={lang === 'bn' ? 'স্টেটমেন্ট মিলিয়ে অনুমোদন করুন' : 'Approve'}
                                onClick={() => approve(pendingEntry.id)}
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button
                                className="mini-approve danger-btn"
                                title={lang === 'bn' ? 'বাতিল করুন' : 'Reject'}
                                onClick={() => reject(pendingEntry.id, 'স্টেটমেন্ট মেলেনি')}
                              >
                                <X size={18} />
                              </button>
                            </div>
                          )}
                          {role === 'Admin' && !isPaid && !pendingEntry && (
                            <button
                              className="mini-approve"
                              title={lang === 'bn' ? 'নগদ চাঁদা গ্রহণ' : 'Record Cash'}
                              onClick={e => {
                                e.stopPropagation();
                                setIncome(p => [
                                  {
                                    id: Date.now(),
                                    type: 'contribution',
                                    name: m.name,
                                    amount: m.monthlyCommitment || 1000,
                                    day: '—',
                                    method: 'Cash',
                                    status: 'Confirmed',
                                    date: lang === 'bn' ? 'আজ' : 'Today',
                                    createdBy: 'Admin',
                                    month: targetChadaMonth
                                  },
                                  ...p
                                ]);
                                if (m.id === currentUser?.id) {
                                  setCurrentUser(prev => prev ? { ...prev, paid: true } : null);
                                }
                                notify(lang === 'bn' ? `${m.name} এর ${getMonthLabel(targetChadaMonth, true)} চাঁদা নিশ্চিত হয়েছে` : `Contribution confirmed for ${m.name}`);
                              }}
                            >
                              <CheckCircle2 size={18} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* 12-Month Annual Chada Grand Total Strip */}
                <div style={{ background: '#fffaf3', border: '1px dashed #d9c4af', borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#6e5a4c', fontWeight: 600 }}>
                    {lang === 'bn' ? '১২ মাসের সর্বমোট আদায়কৃত চাঁদা:' : '12-Month Total Chada:'}
                  </span>
                  <strong style={{ fontSize: 16, color: '#25774a', fontWeight: 800 }}>
                    {fmt(annualChadaTotal)}
                  </strong>
                </div>
              </>
            )}

            {/* SECTION 2: FESTIVAL PRONAMI (OFFERINGS DURING PUJA DAYS) */}
            {incomeSection === 'pronami' && (
              <>
                {/* Festival Days Notice */}
                <div style={{ background: '#fff9eb', border: '1.5px solid #f6dbab', borderRadius: 16, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Flower2 size={24} color="#ad790e" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: 13, color: '#875608', display: 'block' }}>
                      {lang === 'bn' ? 'শারদীয় উৎসবকালীন প্রণামী ও দান' : 'Festival Days Offerings'}
                    </strong>
                    <span style={{ fontSize: 11, color: '#7a6036', display: 'block', marginTop: 2 }}>
                      {lang === 'bn'
                        ? 'পূজার ৪-৫ দিন (সপ্তমী, অষ্টমী, নবমী ও দশমী) মণ্ডপে দর্শনার্থী ও ভক্তদের প্রদত্ত প্রণামী।'
                        : 'Devotee offerings during festival days (Saptami, Ashtami, Navami, Dashami).'}
                    </span>
                  </div>
                </div>

                {/* Pronami Summary & Add Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: 14, padding: '14px', marginBottom: 14, border: '1px solid #ebd9c5' }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#7a6a5d', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>
                      {lang === 'bn' ? 'মোট সংগৃহীত প্রণামী' : 'Total Pronami'}
                    </span>
                    <strong style={{ fontSize: 22, color: '#b32323', fontWeight: 800, display: 'block', marginTop: 2 }}>
                      {fmt(totalPronamiCollected)}
                    </strong>
                  </div>
                  <button
                    className="primary-small"
                    onClick={() => setTab('pronami')}
                    style={{ padding: '9px 14px', fontSize: 12 }}
                  >
                    <Plus size={16} /> {lang === 'bn' ? 'প্রণামী এন্ট্রি করুন' : 'Record Pronami'}
                  </button>
                </div>

                {/* Puja Day Filter Chips */}
                <div className="sub-filter-row" style={{ overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
                  <button
                    className={`sub-chip ${pronamiDayFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setPronamiDayFilter('all')}
                  >
                    {lang === 'bn' ? 'সব দিন' : 'All Days'}
                  </button>
                  {['সপ্তমী', 'অষ্টমী', 'নবমী', 'দশমী'].map(dayName => (
                    <button
                      key={dayName}
                      className={`sub-chip ${pronamiDayFilter === dayName ? 'active' : ''}`}
                      onClick={() => setPronamiDayFilter(dayName)}
                    >
                      {dayName} ({income.filter(x => x.type === 'pronami' && x.day === dayName).length})
                    </button>
                  ))}
                </div>

                {/* Status Filter for Pronami */}
                <div className="sub-filter-row" style={{ marginBottom: 14 }}>
                  <button
                    className={`sub-chip ${incomeStatusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setIncomeStatusFilter('all')}
                  >
                    {t.all}
                  </button>
                  <button
                    className={`sub-chip ${incomeStatusFilter === 'Confirmed' ? 'active' : ''}`}
                    onClick={() => setIncomeStatusFilter('Confirmed')}
                  >
                    {lang === 'bn' ? 'নিশ্চিত' : 'Confirmed'} ({income.filter(x => x.type === 'pronami' && x.status === 'Confirmed').length})
                  </button>
                  <button
                    className={`sub-chip ${incomeStatusFilter === 'Pending' ? 'active' : ''}`}
                    onClick={() => setIncomeStatusFilter('Pending')}
                  >
                    {lang === 'bn' ? 'অপেক্ষায়' : 'Pending'} ({income.filter(x => x.type === 'pronami' && x.status === 'Pending').length})
                  </button>
                </div>

                {/* Pronami List */}
                <div className="panel list-panel">
                  {filteredPronamiList.map(x => (
                    <div className="activity-row" key={x.id} onClick={() => setSelectedIncome(x)} style={{ cursor: 'pointer' }}>
                      <div className="activity-icon gold-bg">
                        <Flower2 size={18} />
                      </div>
                      <div className="activity-copy">
                        <strong>{x.name}</strong>
                        <span>
                          {lang === 'bn' ? `পূজার দিন: ${x.day}` : `Puja Day: ${x.day}`} · {x.method}
                        </span>
                        <small>
                          {x.date} · আদায়কারী: {x.createdBy} {x.trxId ? `· Trx: ${x.trxId}` : ''}
                        </small>
                      </div>
                      <div className="activity-end">
                        <b style={{ color: '#8d1717', fontSize: 13 }}>{fmt(x.amount)}</b>
                        <StatusBadge status={x.status} lang={lang} />
                        {role === 'Admin' && x.status === 'Pending' && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 4 }} onClick={e => e.stopPropagation()}>
                            <button className="approve-text" onClick={() => approve(x.id)}>
                              {t.approve}
                            </button>
                            <button
                              className="approve-text danger-btn"
                              onClick={() => reject(x.id)}
                            >
                              {t.reject}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredPronamiList.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '36px 16px', color: '#8c7d71' }}>
                      <Flower2 size={36} style={{ opacity: 0.4, margin: '0 auto 8px', display: 'block' }} />
                      <p style={{ fontWeight: 700, margin: '0 0 6px', fontSize: 14 }}>
                        {lang === 'bn' ? 'কোনো প্রণামীর এন্ট্রি পাওয়া যায়নি' : 'No pronami records found'}
                      </p>
                      <button
                        className="primary-small"
                        onClick={() => setTab('pronami')}
                        style={{ marginTop: 8 }}
                      >
                        <Plus size={15} /> {lang === 'bn' ? 'প্রণামী যোগ করুন' : 'Add Pronami'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ===================== TAB: CONTRIBUTIONS ===================== */}
        {tab === 'contributions' && (() => {
          const currentTargetMonth = incomeMonthFilter === 'all' ? '2026-10' : incomeMonthFilter;
          const monthContributions = income.filter(x => x.type === 'contribution' && x.status === 'Confirmed' && (x.month === currentTargetMonth || (currentTargetMonth === '2026-10' && !x.month)));
          const monthCollected = monthContributions.reduce((s, x) => s + x.amount, 0);
          const monthPaidCount = users.filter(m => income.some(x => x.type === 'contribution' && x.status === 'Confirmed' && x.name === m.name && (x.month === currentTargetMonth || (currentTargetMonth === '2026-10' && !x.month)))).length;

          return (
            <>
              <div className="summary-strip">
                <div>
                  <span>{getMonthLabel(currentTargetMonth, true)} এর চাঁদা</span>
                  <strong style={{ color: '#25774a' }}>{fmt(monthCollected)}</strong>
                </div>
                <div>
                  <span>{lang === 'bn' ? 'পরিশোধের অগ্রগতি' : 'Paid Ratio'}</span>
                  <strong>
                    {lang === 'bn'
                      ? `${toBnDigits(monthPaidCount)}/${toBnDigits(users.length)} জন`
                      : `${monthPaidCount}/${users.length}`}
                  </strong>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <button
                  className="primary-button"
                  style={{ background: 'linear-gradient(110deg, #e2136e, #c00f5c)', margin: 0 }}
                  onClick={() => setTab('bkash-pay')}
                >
                  <Smartphone size={18} /> {t.payChadaBkash}
                </button>
              </div>

              <div className="section-title inner-title">
                <h2>{getMonthLabel(currentTargetMonth, true)} — {lang === 'bn' ? 'সদস্যদের চাঁদা তালিকা' : 'Member Contributions'}</h2>
              </div>

              <div className="panel list-panel">
                {users.map(m => {
                  const isPaidMonth = income.some(
                    x => x.type === 'contribution' && x.status === 'Confirmed' && x.name === m.name && (x.month === currentTargetMonth || (currentTargetMonth === '2026-10' && !x.month))
                  );

                  return (
                    <div className="activity-row" key={m.id}>
                      <div className="person-avatar">{m.name.slice(0, 1)}</div>
                      <div className="activity-copy">
                        <strong>{m.name} {m.id === currentUser?.id && <span style={{ color: '#a61f1f' }}>(আমি)</span>}</strong>
                        <span>{m.phone} · <span className="role-badge">{m.role}</span> · <span style={{ fontSize: 10, color: '#7a5a3a' }}>মাসিক: {fmt(m.monthlyCommitment || 1000)}</span></span>
                      </div>
                      <div className="activity-end">
                        <b style={{ marginRight: 6 }}>{fmt(m.monthlyCommitment || 1000)}</b>
                        {isPaidMonth ? (
                          <StatusBadge status="Confirmed" lang={lang} />
                        ) : (
                          <StatusBadge status="Pending" lang={lang} />
                        )}
                      </div>
                      {role === 'Admin' && !isPaidMonth && (
                        <button
                          className="mini-approve"
                          title={lang === 'bn' ? 'নগদ চাঁদা গ্রহণ' : 'Record Cash'}
                          onClick={() => {
                            setIncome(p => [
                              {
                                id: Date.now(),
                                type: 'contribution',
                                name: m.name,
                                amount: m.monthlyCommitment || 1000,
                                day: '—',
                                method: 'Cash',
                                status: 'Confirmed',
                                date: lang === 'bn' ? 'আজ' : 'Today',
                                createdBy: 'Admin',
                                month: currentTargetMonth
                              },
                              ...p
                            ]);
                            if (m.id === currentUser?.id) {
                              setCurrentUser(prev => prev ? { ...prev, paid: true } : null);
                            }
                            notify(lang === 'bn' ? `${m.name} এর ${getMonthLabel(currentTargetMonth, true)} চাঁদা নিশ্চিত হয়েছে` : `Contribution confirmed for ${m.name}`);
                          }}
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {/* ===================== TAB: EXPENSES ===================== */}
        {tab === 'expenses' && (
          <>
            <div className="summary-strip">
              <div>
                <span>{lang === 'bn' ? 'অনুমোদিত মোট বিল' : 'Committed Bills'}</span>
                <strong>{fmt(committed)}</strong>
              </div>
              <div>
                <span>{lang === 'bn' ? 'মোট পরিশোধ' : 'Total Paid'}</span>
                <strong style={{ color: '#25774a' }}>{fmt(paidBillsTotal)}</strong>
              </div>
              <div>
                <span>{lang === 'bn' ? 'মোট বকেয়া' : 'Total Due'}</span>
                <strong className={due > 0 ? 'negative' : ''}>{fmt(due)}</strong>
              </div>
            </div>

            <div className="section-title inner-title">
              <h2>{t.expensesTitle}</h2>
              <button className="primary-small" onClick={() => setTab('request')}>
                <Plus size={16} /> {lang === 'bn' ? 'নতুন আবেদন' : 'New Request'}
              </button>
            </div>

            {/* Search Input */}
            <div className="search-bar" style={{ marginBottom: 12 }}>
              <Search size={18} />
              <input
                value={expenseQuery}
                onChange={e => setExpenseQuery(e.target.value)}
                placeholder={t.searchExpenses || (lang === 'bn' ? 'খরচ, ভেন্ডর বা ক্যাটাগরি খুঁজুন...' : 'Search expense, vendor, category...')}
              />
              {expenseQuery && (
                <button
                  type="button"
                  onClick={() => setExpenseQuery('')}
                  aria-label="Clear search"
                  style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 4 }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* 3 FEATURED EXPENSE CATEGORIES TABS */}
            <div className="expense-category-tabs">
              <button
                className={`expense-tab-btn ${expenseTab === 'spending' ? 'active' : ''}`}
                onClick={() => setExpenseTab('spending')}
              >
                <div className="expense-tab-title">
                  <ReceiptText size={15} />
                  <span>{t.spendingTab}</span>
                </div>
                <span className="expense-tab-pill">
                  {toBnDigits(approvedBillsCount)}
                </span>
              </button>

              <button
                className={`expense-tab-btn ${expenseTab === 'due' ? 'active due-tab' : ''}`}
                onClick={() => setExpenseTab('due')}
              >
                <div className="expense-tab-title">
                  <AlertTriangle size={15} />
                  <span>{t.dueTab}</span>
                </div>
                <span className={`expense-tab-pill ${billsWithDueCount > 0 ? 'has-due' : ''}`}>
                  {toBnDigits(billsWithDueCount)}
                </span>
              </button>

              <button
                className={`expense-tab-btn ${expenseTab === 'pending' ? 'active pending-tab' : ''}`}
                onClick={() => setExpenseTab('pending')}
              >
                <div className="expense-tab-title">
                  <Clock3 size={15} />
                  <span>{t.pendingTab}</span>
                </div>
                <span className={`expense-tab-pill ${pendingBillsCount > 0 ? 'has-pending' : ''}`}>
                  {toBnDigits(pendingBillsCount)}
                </span>
              </button>
            </div>

            {/* Contextual Category Notice Banners */}
            {expenseTab === 'due' && (
              <div className="expense-due-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={16} />
                  <span>
                    {lang === 'bn' ? 'মোট বকেয়া বিলের পরিমাণ:' : 'Total Outstanding Dues:'}{' '}
                    <strong style={{ color: '#b91c1c', fontSize: 13 }}>{fmt(due)}</strong>
                  </span>
                </div>
                <small style={{ color: '#9a3412', fontWeight: 700 }}>
                  {toBnDigits(billsWithDueCount)} {lang === 'bn' ? 'টি বিল বকেয়া' : 'bills with due'}
                </small>
              </div>
            )}

            {expenseTab === 'pending' && (
              <div className="expense-pending-banner">
                <Clock3 size={18} style={{ flexShrink: 0 }} />
                <span>
                  {lang === 'bn'
                    ? 'সদস্যদের নতুন আবেদন এখানে জমা থাকে। অ্যাডমিন অনুমোদন দিলেই কেবল এটি সিস্টেমের মূল ব্যয়ে হিসাবভুক্ত হবে।'
                    : 'Requests submitted by members remain here. Once approved by Admin, they are credited to the fund expenses.'}
                </span>
              </div>
            )}

            <div className="panel list-panel">
              {filteredBills.map(b => (
                <div
                  className="bill-card"
                  key={b.id}
                  onClick={() => setSelectedReviewBill(b)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="bill-head">
                    <div className="activity-icon red-bg">
                      <ReceiptText size={18} />
                    </div>
                    <div className="activity-copy">
                      <strong>{b.vendor}</strong>
                      <span>{b.description} · <span className="date-badge">{b.category}</span></span>
                    </div>
                    <StatusBadge status={b.status} lang={lang} />
                  </div>

                  <div className="bill-numbers">
                    <div>
                      <span>১. {t.total}</span>
                      <b>{fmt(b.total)}</b>
                    </div>
                    <div>
                      <span>২. {lang === 'bn' ? 'দেওয়া হয়েছে' : 'Paid'}</span>
                      <b className="green-text">{fmt(b.paid)}</b>
                    </div>
                    <div>
                      <span>৩. {lang === 'bn' ? 'বাকি দিতে হবে' : 'Due'}</span>
                      <b className={b.total - b.paid > 0 ? 'negative' : ''}>
                        {fmt(Math.max(0, b.total - b.paid))}
                      </b>
                    </div>
                  </div>

                  <div className="progress">
                    <i style={{ width: `${Math.min(100, Math.round((b.paid / b.total) * 100))}%` }} />
                  </div>

                  {b.status === 'Pending' && (
                    <div style={{ background: '#fff8f2', border: '1px dashed #f2ba9d', borderRadius: 10, padding: '7px 10px', fontSize: 11, color: '#a64218', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock3 size={15} style={{ flexShrink: 0 }} />
                      <span>{lang === 'bn' ? 'অ্যাডমিন অনুমোদনের অপেক্ষায় — অনুমোদনের পরেই এটি সিস্টেমের তহবিলে হিসাবভুক্ত হবে।' : 'Pending Admin approval — will be calculated into system totals once approved.'}</span>
                    </div>
                  )}

                  {b.status === 'Approved' && b.paid >= b.total && (
                    <div style={{ background: '#f2faf4', border: '1px solid #c2e8cb', borderRadius: 10, padding: '6px 10px', fontSize: 11, color: '#1e753f', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                      <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                      <span>{lang === 'bn' ? 'পরিশোধ সম্পন্ন ✓ কোনো বাকি নেই' : 'Fully Paid ✓ No due remaining'}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                    <small className="bill-foot" style={{ margin: 0 }}>
                      {b.requester} · {b.type === 'Advance' ? t.advance : t.reimbursement}
                      {b.dueDate ? ` · শেষ: ${b.dueDate}` : ''}
                    </small>

                    {/* Settle Due Button - Available whenever there is a remaining due */}
                    {b.total - b.paid > 0 && (
                      <button
                        className="settle-due-btn"
                        onClick={e => {
                          e.stopPropagation();
                          setPayingBill(b);
                          setPayAmountInput(String(b.total - b.paid));
                        }}
                      >
                        <CreditCard size={14} />
                        <span>{lang === 'bn' ? 'বকেয়া মেটান' : 'Settle Due'} ({fmt(b.total - b.paid)})</span>
                      </button>
                    )}
                  </div>

                  {/* Admin Direct Status Modifier */}
                  {role === 'Admin' && (
                    <div className="status-modify-row" onClick={e => e.stopPropagation()}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#6d5a4c' }}>
                        {lang === 'bn' ? 'স্ট্যাটাস সংশোধন:' : 'Modify Status:'}
                      </label>
                      <select
                        className="status-modify-select"
                        value={b.status}
                        onChange={e => {
                          e.stopPropagation();
                          modifyBillStatus(b.id, e.target.value as 'Pending' | 'Approved' | 'Rejected');
                        }}
                      >
                        <option value="Pending">🕒 {t.pending} (অনুমোদনের অপেক্ষায়)</option>
                        <option value="Approved">✓ {t.approved} (অনুমোদিত ও যুক্ত)</option>
                        <option value="Rejected">✕ {t.rejected} (বাতিল)</option>
                      </select>
                    </div>
                  )}

                  {role === 'Admin' && b.status === 'Pending' && (
                    <div className="bill-actions" onClick={e => e.stopPropagation()} style={{ marginTop: 8 }}>
                      <button
                        className="outline-button"
                        onClick={() => reject(b.id)}
                      >
                        {t.reject}
                      </button>
                      <button className="primary-small" onClick={() => approve(b.id)}>
                        {t.approve}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {filteredBills.length === 0 && (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#8c7d71' }}>
                  {expenseTab === 'due' ? (
                    <>
                      <CheckCircle2 size={44} style={{ color: '#16a34a', margin: '0 auto 10px', display: 'block' }} />
                      <p style={{ fontWeight: 800, margin: '0 0 6px', fontSize: 15, color: '#166534' }}>
                        {t.noDueTitle}
                      </p>
                      <p style={{ fontSize: 12, margin: 0, color: '#526e5a' }}>
                        {t.noDueDesc}
                      </p>
                    </>
                  ) : expenseTab === 'pending' ? (
                    <>
                      <ShieldCheck size={44} style={{ color: '#15803d', margin: '0 auto 10px', display: 'block' }} />
                      <p style={{ fontWeight: 800, margin: '0 0 6px', fontSize: 15, color: '#166534' }}>
                        {t.noPendingTitle}
                      </p>
                      <p style={{ fontSize: 12, margin: 0, color: '#526e5a' }}>
                        {t.noPendingDesc}
                      </p>
                    </>
                  ) : (
                    <>
                      <ReceiptText size={40} style={{ opacity: 0.4, margin: '0 auto 10px', display: 'block' }} />
                      <p style={{ fontWeight: 700, margin: '0 0 6px', fontSize: 14 }}>
                        {t.noSpendingTitle}
                      </p>
                      <p style={{ fontSize: 12, margin: 0 }}>
                        {expenseQuery
                          ? (lang === 'bn' ? 'সার্চ মুছে আবার চেষ্টা করুন' : 'Clear search and try again')
                          : (lang === 'bn' ? 'নতুন আবেদন করতে উপরের "নতুন আবেদন" বাটনে চাপ দিন' : 'Create a new request using button above')}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ===================== TAB: REQUEST (VOLUNTEER ACTION) ===================== */}
        {tab === 'request' && (
          <section className="form-card">
            <div className="form-intro">
              <div className="big-icon red-bg">
                <ReceiptText size={24} />
              </div>
              <div>
                <h2>{t.newRequest}</h2>
                <p>{lang === 'bn' ? 'অ্যাডমিন অনুমোদনের পর বিল কার্যকর হবে' : 'Bill activates after Admin approval'}</p>
              </div>
            </div>

            <label>{t.vendor}</label>
            <select
              className="field"
              value={vendor}
              onChange={e => setVendor(e.target.value)}
            >
              <option>মেসার্স শাপলা ডেকোরেটর</option>
              <option>মা দুর্গা মৃৎশিল্প</option>
              <option>রামকৃষ্ণ ভাণ্ডার</option>
              <option>সুরঝংকার সাউন্ড</option>
              <option>নতুন ভেন্ডর</option>
            </select>

            {vendor === 'নতুন ভেন্ডর' && (
              <input
                className="field"
                style={{ marginTop: 8 }}
                value={customVendor}
                onChange={e => setCustomVendor(e.target.value)}
                placeholder={lang === 'bn' ? 'ভেন্ডর বা দোকানের নাম লিখুন' : 'Enter vendor name'}
              />
            )}

            <label>{t.description}</label>
            <input
              className="field"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={lang === 'bn' ? 'যেমন: প্যান্ডেল নির্মাণ ও সাউন্ড সিস্টেম' : 'e.g. Stage decoration and lighting'}
            />

            <label>{t.category}</label>
            <select
              className="field"
              value={billCategory}
              onChange={e => setBillCategory(e.target.value)}
            >
              <option value="সাজসজ্জা">{lang === 'bn' ? 'সাজসজ্জা ও প্যান্ডেল' : 'Decoration & Pandel'}</option>
              <option value="প্রতিমা">{lang === 'bn' ? 'প্রতিমা নির্মাণ' : 'Idol Making'}</option>
              <option value="ভোগ / খাবার">{lang === 'bn' ? 'ভোগ ও প্রসাদ' : 'Prasad & Food'}</option>
              <option value="পুরোহিত">{lang === 'bn' ? 'পুরোহিত ও আচার' : 'Priest & Rituals'}</option>
              <option value="সাউন্ড / লাইট">{lang === 'bn' ? 'সাউন্ড ও আলোকসজ্জা' : 'Sound & Lighting'}</option>
              <option value="পরিবহন">{lang === 'bn' ? 'পরিবহন' : 'Transportation'}</option>
              <option value="অন্যান্য">{lang === 'bn' ? 'অন্যান্য' : 'Other'}</option>
            </select>

            {/* 1. মোট বিল (Total Bill) */}
            <label>{t.total}</label>
            <div className="amount-display">
              <span>৳</span>
              <input
                value={billAmount}
                onChange={e => setBillAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                placeholder="0"
              />
            </div>
            <div className="amount-chips">
              {[5000, 10000, 25000, 50000].map(n => (
                <button key={n} type="button" onClick={() => setBillAmount(String(n))}>
                  ৳{lang === 'bn' ? toBnDigits(n) : n}
                </button>
              ))}
            </div>

            {/* 2. ইতিমধ্যে কত পরিশোধ করা হয়েছে (How much paid so far) */}
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t.paidSoFar}</span>
              <small style={{ color: '#25774a', fontWeight: 700 }}>
                {Number(billAmount) > 0 && billPaidAmount ? `${Math.round(Math.min(100, (Number(billPaidAmount) / Number(billAmount)) * 100))}% দেওয়া হয়েছে` : ''}
              </small>
            </label>
            <div className="amount-display" style={{ background: '#f5fbf7', borderColor: '#bce4c8' }}>
              <span style={{ color: '#25774a' }}>৳</span>
              <input
                value={billPaidAmount}
                onChange={e => setBillPaidAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                placeholder="0"
                style={{ color: '#25774a' }}
              />
            </div>
            <div className="amount-chips">
              <button type="button" onClick={() => setBillPaidAmount('0')}>
                {lang === 'bn' ? '৳০ (বাকি)' : '৳0 (Unpaid)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const tot = Number(billAmount) || 0;
                  setBillPaidAmount(String(Math.round(tot * 0.25)));
                }}
              >
                ২৫%
              </button>
              <button
                type="button"
                onClick={() => {
                  const tot = Number(billAmount) || 0;
                  setBillPaidAmount(String(Math.round(tot * 0.5)));
                }}
              >
                ৫০%
              </button>
              <button
                type="button"
                onClick={() => {
                  const tot = Number(billAmount) || 0;
                  setBillPaidAmount(String(tot));
                }}
              >
                {lang === 'bn' ? 'সম্পূর্ণ (১০০%)' : '100% (Full)'}
              </button>
            </div>

            {/* 3. বাকি কত দিতে হবে (How much we need to pay - Due) Realtime Computed */}
            <div className="spending-breakdown-card">
              <span style={{ fontSize: 11, fontWeight: 800, color: '#8d1717', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {lang === 'bn' ? '৩টি ধাপের খরচের হিসাব ও বকেয়া' : '3-Part Spending Breakdown'}
              </span>
              <div className="spending-grid-3">
                <div>
                  <span>১. {t.total}</span>
                  <strong style={{ color: '#332' }}>
                    {fmt(Number(billAmount) || 0)}
                  </strong>
                </div>
                <div>
                  <span>২. {lang === 'bn' ? 'দেওয়া হয়েছে' : 'Paid'}</span>
                  <strong style={{ color: '#25774a' }}>
                    {fmt(Number(billPaidAmount) || 0)}
                  </strong>
                </div>
                <div>
                  <span>৩. {lang === 'bn' ? 'বাকি দিতে হবে' : 'Due'}</span>
                  <strong style={{ color: '#b32323' }}>
                    {fmt(Math.max(0, (Number(billAmount) || 0) - (Number(billPaidAmount) || 0)))}
                  </strong>
                </div>
              </div>

              <div className="pending-badge-notice">
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>
                  {t.calculationNotice}
                </span>
              </div>
            </div>

            <label>{lang === 'bn' ? 'আবেদনের ধরন' : 'Request Type'}</label>
            <div className="choice-row">
              <button
                type="button"
                className={requestType === 'Advance' ? 'selected' : ''}
                onClick={() => setRequestType('Advance')}
              >
                {t.advance}
              </button>
              <button
                type="button"
                className={requestType === 'Reimbursement' ? 'selected' : ''}
                onClick={() => setRequestType('Reimbursement')}
              >
                {t.reimbursement}
              </button>
            </div>

            <label>{t.dueDate}</label>
            <input
              type="date"
              className="field"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />

            <button className="primary-button" onClick={addBill}>
              {role === 'Admin' ? (
                <>
                  <CheckCircle2 size={18} /> {lang === 'bn' ? 'বিল অনুমোদন ও সিস্টেমে যুক্ত করুন' : 'Approve & Record Bill'}
                </>
              ) : (
                <>
                  {t.submit} <ChevronRight size={18} />
                </>
              )}
            </button>
          </section>
        )}

        {/* ===================== TAB: MEMBERS ===================== */}
        {tab === 'members' && (() => {
          const approvedMembers = users.filter(u => u.approvalStatus !== 'Pending' && u.approvalStatus !== 'Rejected');
          const pendingMembers = users.filter(u => u.approvalStatus === 'Pending');

          const displayedList = memberSectionTab === 'pending' && role === 'Admin' ? pendingMembers : approvedMembers;

          const filteredList = displayedList.filter(m => {
            if (memberQuery.trim()) {
              const q = memberQuery.toLowerCase();
              return m.name.toLowerCase().includes(q) || m.phone.includes(q) || (m.designation && m.designation.toLowerCase().includes(q));
            }
            return true;
          });

          return (
            <>
              {/* Admin Member Tab Selector */}
              {role === 'Admin' && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button
                    type="button"
                    className={`filter-chip ${memberSectionTab === 'approved' ? 'active' : ''}`}
                    onClick={() => setMemberSectionTab('approved')}
                    style={{ flex: 1, padding: '9px 12px', fontSize: 12.5, fontWeight: 700 }}
                  >
                    <Users size={15} style={{ verticalAlign: -2, marginRight: 5 }} />
                    {lang === 'bn' ? `অনুমোদিত সদস্য (${toBnDigits(approvedMembers.length)})` : `Approved (${approvedMembers.length})`}
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${memberSectionTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setMemberSectionTab('pending')}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      background: memberSectionTab === 'pending' ? '#b45309' : (pendingMembers.length > 0 ? '#fef3c7' : undefined),
                      color: memberSectionTab === 'pending' ? '#fff' : (pendingMembers.length > 0 ? '#92400e' : undefined),
                      borderColor: pendingMembers.length > 0 ? '#f59e0b' : undefined
                    }}
                  >
                    <Clock3 size={15} style={{ verticalAlign: -2, marginRight: 5 }} />
                    {lang === 'bn' ? `অনুমোদনের অপেক্ষায় (${toBnDigits(pendingMembers.length)})` : `Pending (${pendingMembers.length})`}
                  </button>
                </div>
              )}

              <div className="search-bar">
                <Search size={18} />
                <input
                  value={memberQuery}
                  onChange={e => setMemberQuery(e.target.value)}
                  placeholder={memberSectionTab === 'pending' && role === 'Admin' ? (lang === 'bn' ? 'আবেদনকারী খুঁজুন...' : 'Search applicants...') : t.search}
                />
                {role === 'Admin' && memberSectionTab === 'approved' && (
                  <button onClick={() => setShowAddMember(true)} aria-label="Add Member">
                    <Plus size={19} />
                  </button>
                )}
              </div>

              {/* Pending Applicants List (For Admin) */}
              {memberSectionTab === 'pending' && role === 'Admin' ? (
                <div className="panel list-panel">
                  {filteredList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: '#78350f' }}>
                      <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 10px', display: 'block' }} />
                      <strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>
                        {lang === 'bn' ? 'কোনো পেন্ডিং আবেদন নেই' : 'No Pending Requests'}
                      </strong>
                      <span style={{ fontSize: 12, color: '#8c7b70' }}>
                        {lang === 'bn' ? 'সকল নতুন সদস্যের আবেদন ইতিমধ্যে যাচাই ও নিষ্পত্তি করা হয়েছে।' : 'All registrations have been reviewed.'}
                      </span>
                    </div>
                  ) : (
                    filteredList.map(m => (
                      <div className="member-row" key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px', borderBottom: '1px solid #f2e9de', background: '#fffdfa' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="person-avatar" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 800 }}>
                            {m.name.slice(0, 1)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: 15, color: '#431407' }}>{m.name}</strong>
                            <div style={{ fontSize: 12, color: '#78350f', marginTop: 2 }}>
                              📞 {m.phone}
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, background: '#fdf2f8', color: '#9d174d', padding: '2px 7px', borderRadius: 6, fontWeight: 700 }}>
                                {lang === 'bn' ? `চাঁদার প্রতিশ্রুতি: ৳${toBnDigits(m.monthlyCommitment || 1000)}/মাস` : `Commitment: ৳${m.monthlyCommitment || 1000}/mo`}
                              </span>
                              {m.joinedAt && (
                                <span style={{ fontSize: 11, color: '#78716c' }}>
                                  📅 {m.joinedAt}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <button
                            type="button"
                            className="primary-button"
                            style={{ flex: 1, padding: '8px 12px', fontSize: 12.5, background: '#15803d' }}
                            onClick={() => approveMember(m.id)}
                          >
                            <CheckCircle2 size={16} /> {lang === 'bn' ? 'অনুমোদন করুন' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            className="secondary-button danger-btn"
                            style={{ flex: 1, padding: '8px 12px', fontSize: 12.5 }}
                            onClick={() => {
                              if (window.confirm(lang === 'bn' ? `${m.name}-এর আবেদন বাতিল করতে চান?` : `Reject ${m.name}?`)) {
                                rejectMember(m.id);
                              }
                            }}
                          >
                            <XCircle size={16} /> {lang === 'bn' ? 'বাতিল' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Approved Members List */
                <div className="panel list-panel">
                  {filteredList.map(m => (
                    <div className="member-row" key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderBottom: '1px solid #f2e9de' }}>
                      <div className="person-avatar">{m.name.slice(0, 1)}</div>
                      <div className="activity-copy">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <strong>{m.name} {!m.active && <span style={{ color: '#b32323', fontSize: 10 }}>(নিষ্ক্রিয়)</span>}</strong>
                          {m.designation && (
                            <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>
                              {m.designation}
                            </span>
                          )}
                        </div>
                        <span>{m.phone} · {fmt(m.monthlyCommitment || 1000)}/মাস</span>
                        <div className="role-chips">
                          <span>{m.role}</span>
                          <span style={{ marginLeft: 6, background: m.paid ? '#e2f5e5' : '#fff0d5', color: m.paid ? '#25774a' : '#8c5a16' }}>
                            {m.paid ? (lang === 'bn' ? 'চাঁদা পরিশোধিত' : 'Paid') : (lang === 'bn' ? 'চাঁদা বাকি' : 'Unpaid')}
                          </span>
                        </div>
                      </div>
                      {role === 'Admin' && (
                        <button
                          className="dots-button"
                          onClick={() => setSelectedUser(m)}
                          title="Options"
                        >
                          •••
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {/* ===================== TAB: PUJA COMMITTEE ===================== */}
        {tab === 'committee' && (() => {
          const approvedUsers = users.filter(u => u.approvalStatus !== 'Pending' && u.approvalStatus !== 'Rejected');

          // Executive Leadership (শীর্ষ পরিষদ)
          const isTopTier = (u: User) => {
            const desig = u.designation || '';
            return u.role === 'Admin' || desig.includes('সভাপতি') || (desig.includes('সম্পাদক') && (desig.includes('সাধারণ') || desig.includes('যুগ্ম'))) || desig.includes('কোষাধ্যক্ষ');
          };

          // Secretaries / Coordinators (সম্পাদকীয় পরিষদ)
          const isSecretaryTier = (u: User) => {
            const desig = u.designation || '';
            if (isTopTier(u)) return false;
            return desig.includes('সম্পাদক') || desig.includes('আহ্বায়ক') || desig.includes('সমন্বয়ক');
          };

          // General Members & Advisors (সাধারণ পরিষদ ও উপদেষ্টা)
          const isGeneralTier = (u: User) => {
            return !isTopTier(u) && !isSecretaryTier(u);
          };

          const displayedCommittee = approvedUsers.filter(u => {
            if (committeeFilter === 'top') return isTopTier(u);
            if (committeeFilter === 'secretaries') return isSecretaryTier(u);
            if (committeeFilter === 'general') return isGeneralTier(u);
            return true;
          });

          return (
            <>
              {/* Header Banner */}
              <div style={{ background: 'linear-gradient(135deg, #7c1212 0%, #b91c1c 100%)', borderRadius: 16, padding: '18px 16px', color: '#fff', marginBottom: 14, boxShadow: '0 4px 12px rgba(124, 18, 18, 0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Crown size={20} color="#fef08a" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 17, margin: 0, fontWeight: 800, color: '#fef9c3' }}>
                      {lang === 'bn' ? 'পূজা পরিচালনা ও কার্যকরী পরিষদ' : 'Puja Executive Committee'}
                    </h2>
                    <span style={{ fontSize: 11.5, opacity: 0.9 }}>
                      {lang === 'bn' ? 'শারদীয় দুর্গাপূজা ২০২৬/২০২৭ দায়িত্বপ্রাপ্ত নেতৃবৃন্দ ও সদস্যবৃন্দ' : 'Leadership, Coordinators & Members'}
                    </span>
                  </div>
                </div>

                {role === 'Admin' && (
                  <div style={{ marginTop: 10, background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '8px 10px', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={16} color="#fef08a" />
                    <span>{lang === 'bn' ? 'অ্যাডমিন ক্ষমতা: যে-কোনো সদস্যের পদবী পরিবর্তন করতে "পদবী নির্ধারণ" চাপুন।' : 'Admin: Tap "Assign Title" to customize designations.'}</span>
                  </div>
                )}
              </div>

              {/* Committee Filter Pills */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 }}>
                <button
                  type="button"
                  className={`filter-chip ${committeeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCommitteeFilter('all')}
                  style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
                >
                  {lang === 'bn' ? `সকল সদস্য (${toBnDigits(approvedUsers.length)})` : `All (${approvedUsers.length})`}
                </button>
                <button
                  type="button"
                  className={`filter-chip ${committeeFilter === 'top' ? 'active' : ''}`}
                  onClick={() => setCommitteeFilter('top')}
                  style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
                >
                  👑 {lang === 'bn' ? 'শীর্ষ পরিষদ' : 'Executive'}
                </button>
                <button
                  type="button"
                  className={`filter-chip ${committeeFilter === 'secretaries' ? 'active' : ''}`}
                  onClick={() => setCommitteeFilter('secretaries')}
                  style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
                >
                  📜 {lang === 'bn' ? 'সম্পাদকীয় পরিষদ' : 'Secretaries'}
                </button>
                <button
                  type="button"
                  className={`filter-chip ${committeeFilter === 'general' ? 'active' : ''}`}
                  onClick={() => setCommitteeFilter('general')}
                  style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
                >
                  🤝 {lang === 'bn' ? 'উপদেষ্টা ও সদস্য' : 'Members'}
                </button>
              </div>

              {/* Committee Members Cards */}
              <div className="panel list-panel">
                {displayedCommittee.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 16px', color: '#78350f' }}>
                    <p>{lang === 'bn' ? 'এই বিভাগে কোনো সদস্য পাওয়া যায়নি।' : 'No members found in this section.'}</p>
                  </div>
                ) : (
                  displayedCommittee.map(m => {
                    const isTop = isTopTier(m);
                    const desigText = m.designation || (m.role === 'Admin' ? 'সভাপতি ও প্রধান অ্যাডমিন' : 'সাধারণ সদস্য');

                    return (
                      <div
                        className="member-row"
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '13px',
                          borderBottom: '1px solid #f2e9de',
                          background: isTop ? '#fffdf7' : '#ffffff'
                        }}
                      >
                        <div
                          className="person-avatar"
                          style={{
                            background: isTop ? '#fef3c7' : '#f3f4f6',
                            color: isTop ? '#92400e' : '#374151',
                            fontWeight: 800,
                            border: isTop ? '1.5px solid #fde68a' : 'none'
                          }}
                        >
                          {m.name.slice(0, 1)}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: 14.5, color: '#1f2937' }}>{m.name}</strong>
                            {m.role === 'Admin' && (
                              <span style={{ fontSize: 10, background: '#fee2e2', color: '#991b1b', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                                Admin
                              </span>
                            )}
                          </div>

                          {/* Designation Badge */}
                          <div style={{ marginTop: 4 }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: isTop ? '#fef3c7' : '#f0fdf4',
                                color: isTop ? '#92400e' : '#166534',
                                border: `1px solid ${isTop ? '#fde68a' : '#bbf7d0'}`,
                                borderRadius: 6,
                                padding: '2px 8px',
                                fontSize: 12,
                                fontWeight: 700
                              }}
                            >
                              {isTop ? <Crown size={12} color="#b45309" /> : <Medal size={12} color="#15803d" />}
                              {desigText}
                            </span>
                          </div>

                          <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 3 }}>
                            📞 {m.phone} · মাসিক চাঁদা: ৳{toBnDigits(m.monthlyCommitment || 1000)}
                          </div>
                        </div>

                        {/* Admin Action: Change Title */}
                        {role === 'Admin' && (
                          <button
                            type="button"
                            className="secondary-button"
                            style={{
                              padding: '6px 10px',
                              fontSize: 11.5,
                              fontWeight: 700,
                              borderColor: '#f59e0b',
                              color: '#b45309',
                              background: '#fffbeb',
                              whiteSpace: 'nowrap'
                            }}
                            onClick={() => {
                              setEditingDesignationUser(m);
                              setSelectedDesignation(m.designation || '');
                              setCustomDesignationInput('');
                            }}
                          >
                            <Award size={14} /> {lang === 'bn' ? 'পদবী নির্ধারণ' : 'Assign Title'}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          );
        })()}

        {/* ===================== TAB: CALENDAR ===================== */}
        {tab === 'calendar' && (() => {
          // Compute Month Calendar Grid
          const daysInCurrentMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
          const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sun
          const prevMonthDaysCount = new Date(calendarYear, calendarMonth, 0).getDate();
          const totalGridCells = Math.ceil((firstDayOfWeek + daysInCurrentMonth) / 7) * 7;

          // All puja events from both 2026 & 2027
          const allPujaEvents = [
            ...PUJA_SCHEDULES[2026].events,
            ...PUJA_SCHEDULES[2027].events
          ];

          const gridCells = [];
          for (let i = 0; i < totalGridCells; i++) {
            let dayNum = 0;
            let monthNum = calendarMonth;
            let yearNum = calendarYear;
            let isCurrentMonth = true;

            if (i < firstDayOfWeek) {
              dayNum = prevMonthDaysCount - firstDayOfWeek + 1 + i;
              yearNum = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
              monthNum = calendarMonth === 0 ? 11 : calendarMonth - 1;
              isCurrentMonth = false;
            } else if (i < firstDayOfWeek + daysInCurrentMonth) {
              dayNum = i - firstDayOfWeek + 1;
              isCurrentMonth = true;
            } else {
              dayNum = i - (firstDayOfWeek + daysInCurrentMonth) + 1;
              yearNum = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
              monthNum = calendarMonth === 11 ? 0 : calendarMonth + 1;
              isCurrentMonth = false;
            }

            const dateStr = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dateStr === todayDateStr;
            const isSelected = dateStr === selectedDayStr;
            const pujaEvent = allPujaEvents.find(e => e.dateStr === dateStr);
            const billsDue = bills.filter(b => b.dueDate === dateStr && (b.total - b.paid) > 0);
            const dayEvents = committeeEvents.filter(e => e.dateStr === dateStr);

            gridCells.push({
              key: `${dateStr}-${i}`,
              dayNum,
              monthNum,
              yearNum,
              dateStr,
              isCurrentMonth,
              isToday,
              isSelected,
              pujaEvent,
              billsDue,
              dayEvents
            });
          }

          // Details for currently selected day
          const selectedParts = selectedDayStr.split('-').map(Number);
          const selectedDateObj = new Date(selectedParts[0], selectedParts[1] - 1, selectedParts[2]);
          const selectedDayOfWeek = selectedDateObj.getDay();
          const selectedDayPuja = allPujaEvents.find(e => e.dateStr === selectedDayStr);
          const selectedDayBills = bills.filter(b => b.dueDate === selectedDayStr && (b.total - b.paid) > 0);
          const selectedDayEvents = committeeEvents.filter(e => e.dateStr === selectedDayStr);
          const selectedDayDiff = getDaysRemainingCount(selectedDayStr);

          const formattedSelectedDate = lang === 'bn'
            ? `${toBnDigits(selectedParts[2])} ${MONTH_NAMES_BN[selectedParts[1] - 1]} ${toBnDigits(selectedParts[0])}, ${FULL_WEEKDAY_NAMES_BN[selectedDayOfWeek]}`
            : `${selectedParts[2]} ${MONTH_NAMES_EN[selectedParts[1] - 1]} ${selectedParts[0]}, ${FULL_WEEKDAY_NAMES_EN[selectedDayOfWeek]}`;

          const activeEvents = activePujaSchedule.events;

          return (
            <>
              {/* TOP HERO: REAL-TIME ACCURATE COUNTDOWN & SCHEDULE SELECTOR */}
              <div className="calendar-top-card">
                <div className="calendar-top-header">
                  <div className="calendar-top-title">
                    <Sparkles size={18} color="#a61f1f" />
                    <h2>{lang === 'bn' ? activePujaSchedule.titleBn : activePujaSchedule.titleEn}</h2>
                  </div>
                  <div className="calendar-year-pills">
                    <button
                      className={`calendar-year-pill ${selectedPujaYear === 2026 ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedPujaYear(2026);
                        setCalendarYear(2026);
                        setCalendarMonth(9);
                        setSelectedDayStr('2026-10-17');
                      }}
                    >
                      {lang === 'bn' ? '২০২৬' : '2026'}
                    </button>
                    <button
                      className={`calendar-year-pill ${selectedPujaYear === 2027 ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedPujaYear(2027);
                        setCalendarYear(2027);
                        setCalendarMonth(9);
                        setSelectedDayStr('2027-10-05');
                      }}
                    >
                      {lang === 'bn' ? '২০২৭' : '2027'}
                    </button>
                  </div>
                </div>

                <div className="calendar-countdown-display">
                  <span className="count-text">
                    {isFestivalOngoing
                      ? (lang === 'bn' ? 'আজ দুর্গাপূজার মহাউৎসব ও পুণ্যক্ষণ চলছে!' : 'Durga Puja Celebration is ongoing!')
                      : daysToShashthi > 0
                      ? (lang === 'bn' ? 'মহা ষষ্ঠী (পূজা শুরু) হতে বাকি:' : 'Days left until Maha Shashthi:')
                      : (lang === 'bn' ? 'উৎসব সম্পন্ন হয়েছে:' : 'Celebration concluded:')}
                  </span>
                  {isFestivalOngoing ? (
                    <span className="count-badge ongoing">
                      {lang === 'bn' ? 'আজ উৎসব চলছে!' : 'Festival Ongoing!'}
                    </span>
                  ) : daysToShashthi > 0 ? (
                    <span className="count-badge">
                      {lang === 'bn' ? `${toBnDigits(daysToShashthi)} দিন বাকি` : `${daysToShashthi} days left`}
                    </span>
                  ) : (
                    <span className="count-badge" style={{ background: '#64748b' }}>
                      {lang === 'bn' ? `${toBnDigits(Math.abs(daysToDashami))} দিন আগে` : `${Math.abs(daysToDashami)} days ago`}
                    </span>
                  )}
                </div>
              </div>

              {/* MONTH CARD: DYNAMIC CALENDAR NAVIGATION & GRID */}
              <div className="month-card">
                <div className="calendar-nav-bar">
                  <div className="calendar-nav-left">
                    <button
                      className="calendar-nav-btn"
                      onClick={() => {
                        if (calendarMonth === 0) {
                          setCalendarYear(y => y - 1);
                          setCalendarMonth(11);
                        } else {
                          setCalendarMonth(m => m - 1);
                        }
                      }}
                      title="Previous Month"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <h2 className="calendar-month-title">
                      {lang === 'bn'
                        ? `${MONTH_NAMES_BN[calendarMonth]} ${toBnDigits(calendarYear)}`
                        : `${MONTH_NAMES_EN[calendarMonth]} ${calendarYear}`}
                    </h2>
                    <button
                      className="calendar-nav-btn"
                      onClick={() => {
                        if (calendarMonth === 11) {
                          setCalendarYear(y => y + 1);
                          setCalendarMonth(0);
                        } else {
                          setCalendarMonth(m => m + 1);
                        }
                      }}
                      title="Next Month"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {/* Fast Jump Shortcuts */}
                  <div className="calendar-jump-group">
                    <button
                      className={`calendar-jump-btn ${calendarYear === today.getFullYear() && calendarMonth === today.getMonth() ? 'active' : ''}`}
                      onClick={() => {
                        setCalendarYear(today.getFullYear());
                        setCalendarMonth(today.getMonth());
                        setSelectedDayStr(todayDateStr);
                      }}
                    >
                      {t.todayBtn}
                    </button>
                    <button
                      className={`calendar-jump-btn ${calendarMonth === 9 ? 'active' : ''}`}
                      onClick={() => {
                        setCalendarYear(selectedPujaYear);
                        setCalendarMonth(9);
                        const shashthiStr = selectedPujaYear === 2026 ? '2026-10-17' : '2027-10-05';
                        setSelectedDayStr(shashthiStr);
                      }}
                    >
                      {t.pujaMonthBtn}
                    </button>
                  </div>
                </div>

                {/* Weekday Header */}
                <div className="calendar-grid" style={{ marginBottom: 4 }}>
                  {(lang === 'bn' ? WEEKDAY_NAMES_BN : WEEKDAY_NAMES_EN).map(d => (
                    <span className="weekday" key={d} style={{ fontWeight: 700 }}>
                      {d}
                    </span>
                  ))}
                </div>

                {/* 35 or 42 Days Dynamic Grid */}
                <div className="calendar-grid">
                  {gridCells.map(c => {
                    const hasPuja = !!c.pujaEvent;
                    const hasDue = c.billsDue.length > 0;
                    const hasEvent = c.dayEvents.length > 0;

                    return (
                      <button
                        key={c.key}
                        className={`calendar-grid-cell ${!c.isCurrentMonth ? 'faded' : ''} ${c.isToday ? 'today' : ''} ${c.isSelected ? 'selected' : ''} ${hasPuja ? 'puja-date' : ''}`}
                        onClick={() => {
                          setSelectedDayStr(c.dateStr);
                          if (!c.isCurrentMonth) {
                            setCalendarYear(c.yearNum);
                            setCalendarMonth(c.monthNum);
                          }
                        }}
                      >
                        <span className="day-num-label">
                          {lang === 'bn' ? toBnDigits(c.dayNum) : c.dayNum}
                        </span>
                        {(hasPuja || hasDue || hasEvent) && (
                          <div className="day-dots-row">
                            {hasPuja && <span className="day-dot puja" title={c.pujaEvent?.nameBn} />}
                            {hasDue && <span className="day-dot due" title="বিল বকেয়া শেষ তারিখ" />}
                            {hasEvent && <span className="day-dot event" title="কমিটি ইভেন্ট" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Calendar Legend */}
                <div className="calendar-legend" style={{ justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 12 }}>
                  <span><i style={{ background: '#dc2626' }} /> {lang === 'bn' ? 'পূজার তিথি' : 'Puja Day'}</span>
                  <span><i style={{ background: '#2563eb' }} /> {lang === 'bn' ? 'বিলের শেষ তারিখ' : 'Bill Due Date'}</span>
                  <span><i style={{ background: '#16a34a' }} /> {lang === 'bn' ? 'কমিটি ইভেন্ট' : 'Committee Event'}</span>
                  <span><i style={{ border: '2px solid #a61f1f', background: 'transparent' }} /> {lang === 'bn' ? 'আজ' : 'Today'}</span>
                </div>

                {/* DAY DETAILS PANEL (Interactive Day Selection) */}
                <div className="day-details-card">
                  <div className="day-details-head">
                    <div>
                      <div className="day-details-date">{formattedSelectedDate}</div>
                      <small style={{ color: '#8c7d70', fontSize: 11 }}>
                        {selectedDayStr === todayDateStr
                          ? (lang === 'bn' ? 'আজকের নির্বাচিত দিন' : 'Selected day: Today')
                          : (lang === 'bn' ? 'নির্বাচিত তারিখের কার্যক্রম' : 'Day schedule')}
                      </small>
                    </div>
                    {selectedDayStr === todayDateStr ? (
                      <span className="day-details-badge badge-countdown-live" style={{ background: '#dcfce7', color: '#15803d' }}>
                        📍 {t.todayBtn}
                      </span>
                    ) : selectedDayDiff > 0 ? (
                      <span className="day-details-badge badge-countdown-live">
                        ⏳ {lang === 'bn' ? `আর ${toBnDigits(selectedDayDiff)} দিন বাকি` : `${selectedDayDiff} days left`}
                      </span>
                    ) : (
                      <span className="day-details-badge badge-past-day">
                        ✓ {lang === 'bn' ? `${toBnDigits(Math.abs(selectedDayDiff))} দিন আগে` : `${Math.abs(selectedDayDiff)} days ago`}
                      </span>
                    )}
                  </div>

                  {/* 1. Sacred Puja Day Card (if any) */}
                  {selectedDayPuja && (
                    <div className="day-event-box puja-event">
                      <div className="day-event-icon">🌺</div>
                      <div className="day-event-content">
                        <div className="day-event-title" style={{ color: '#991b1b' }}>
                          {lang === 'bn' ? selectedDayPuja.nameBn : selectedDayPuja.nameEn} — {selectedDayPuja.tithiBn}
                        </div>
                        <div className="day-event-desc">
                          {lang === 'bn' ? selectedDayPuja.descBn : selectedDayPuja.descEn}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Bills Due on this Day */}
                  {selectedDayBills.map(b => (
                    <div className="day-event-box due-event" key={b.id}>
                      <div className="day-event-icon">💰</div>
                      <div className="day-event-content">
                        <div className="day-event-title" style={{ color: '#1e40af', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{b.vendor} ({b.category})</span>
                          <strong>বাকি: {fmt(b.total - b.paid)}</strong>
                        </div>
                        <div className="day-event-desc">
                          {b.description} · মোট বিল: {fmt(b.total)}, পরিশোধ: {fmt(b.paid)}
                        </div>
                        <button
                          className="primary-small"
                          style={{ marginTop: 6, padding: '4px 10px', fontSize: 11, background: '#1d4ed8' }}
                          onClick={() => {
                            setPayingBill(b);
                            setPayAmountInput(String(b.total - b.paid));
                          }}
                        >
                          {lang === 'bn' ? 'বকেয়া পরিশোধ ও নিষ্পত্তি করুন' : 'Settle Due Bill'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 3. Committee Events / Meetings */}
                  {selectedDayEvents.map(ev => (
                    <div className="day-event-box meeting-event" key={ev.id}>
                      <div className="day-event-icon">📅</div>
                      <div className="day-event-content">
                        <div className="day-event-title" style={{ color: '#166534', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{ev.title}</span>
                          {ev.time && <small style={{ color: '#15803d' }}>{ev.time}</small>}
                        </div>
                        {ev.desc && <div className="day-event-desc">{ev.desc}</div>}
                        {role === 'Admin' && (
                          <button
                            style={{ border: 0, background: 'transparent', color: '#dc2626', fontSize: 10, cursor: 'pointer', padding: '4px 0 0' }}
                            onClick={() => {
                              setCommitteeEvents(p => p.filter(x => x.id !== ev.id));
                              notify(lang === 'bn' ? 'ইভেন্ট মুছে ফেলা হয়েছে' : 'Event deleted');
                            }}
                          >
                            <Trash2 size={12} style={{ display: 'inline', verticalAlign: -2 }} /> {lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* If nothing scheduled on this day */}
                  {!selectedDayPuja && selectedDayBills.length === 0 && selectedDayEvents.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '16px 8px', color: '#8c7d70', fontSize: 12 }}>
                      <CalendarDays size={24} style={{ opacity: 0.5, marginBottom: 4 }} />
                      <div>{t.noEventsDay}</div>
                    </div>
                  )}

                  {/* Admin Add Event on this day */}
                  {role === 'Admin' && (
                    <button
                      className="outline-button"
                      style={{ marginTop: 10, width: '100%', fontSize: 12, padding: '8px' }}
                      onClick={() => setShowAddEventModal(true)}
                    >
                      + {lang === 'bn' ? 'এই তারিখে নতুন কমিটি ইভেন্ট / মিটিং লিখুন' : 'Add Committee Event on this Date'}
                    </button>
                  )}
                </div>
              </div>

              {/* UPCOMING PUJA SCHEDULE WITH ACCURATE DYNAMIC DAYS COUNT */}
              <section className="section-block">
                <div className="section-title">
                  <h2>{t.upcoming} ({lang === 'bn' ? activePujaSchedule.titleBn : activePujaSchedule.titleEn})</h2>
                </div>
                <div className="panel event-list">
                  {activeEvents.map(ev => {
                    const diff = getDaysRemainingCount(ev.dateStr);
                    const isToday = diff === 0;

                    return (
                      <div
                        className="event-row"
                        key={ev.key}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          const parts = ev.dateStr.split('-').map(Number);
                          setCalendarYear(parts[0]);
                          setCalendarMonth(parts[1] - 1);
                          setSelectedDayStr(ev.dateStr);
                        }}
                      >
                        <div className={`event-date ${ev.color === 'red' ? 'red' : ''}`}>
                          {lang === 'bn' ? ev.badgeDate : ev.badgeDate.replace(/[০-৯]/g, s => '0123456789'['০১২৩৪৫৬৭৮৯'.indexOf(s)])}
                          <small>{lang === 'bn' ? ev.monthShortBn : ev.monthShortEn}</small>
                        </div>
                        <div style={{ flex: 1, paddingRight: 8 }}>
                          <strong style={{ fontSize: 13, color: ev.color === 'red' ? '#8d1717' : '#332a25' }}>
                            {lang === 'bn' ? ev.nameBn : ev.nameEn}
                          </strong>
                          <span style={{ fontSize: 11, color: '#766' }}>
                            {ev.tithiBn}
                          </span>
                        </div>
                        <div>
                          {isToday ? (
                            <span className="event-countdown-pill today">
                              {lang === 'bn' ? 'আজ চলমান' : 'Today'}
                            </span>
                          ) : diff > 0 ? (
                            <span className="event-countdown-pill upcoming">
                              {lang === 'bn' ? `আর ${toBnDigits(diff)} দিন বাকি` : `${diff} days left`}
                            </span>
                          ) : (
                            <span className="event-countdown-pill past">
                              {lang === 'bn' ? `${toBnDigits(Math.abs(diff))} দিন আগে` : `${Math.abs(diff)}d ago`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button className="outline-button full" onClick={downloadIcs} style={{ marginTop: 12 }}>
                  <Download size={17} /> {t.calendarExport}
                </button>
              </section>
            </>
          );
        })()}

        {/* ===================== TAB: NOTIFICATIONS ===================== */}
        {tab === 'notifications' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#68574a' }}>
                {lang === 'bn' ? `মোট ${notifications.length}টি নোটিফিকেশন` : `${notifications.length} Notifications`}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="primary-small"
                  onClick={() => {
                    setNotifications(p => p.map(n => ({ ...n, read: true })));
                    notify(lang === 'bn' ? 'সব নোটিফিকেশন পড়া হিসেবে চিহ্নিত' : 'All marked as read');
                  }}
                >
                  <Check size={14} /> {t.markAllRead}
                </button>
                {role === 'Admin' && (
                  <>
                    <button
                      className="primary-small"
                      style={{ background: '#ea580c' }}
                      onClick={sendChadaReminderToUnpaid}
                      title="Send 1-10th Chada reminder to mobile screen of all unpaid members"
                    >
                      <Send size={14} /> {lang === 'bn' ? 'চাঁদার রিমাইন্ডার পুশ' : 'Push Reminder'}
                    </button>
                    <button className="primary-small" onClick={() => setShowAnnouncementModal(true)}>
                      <Megaphone size={14} /> {t.newAnnouncement}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Screen Push Status in Notification Tab */}
            {pushPermission !== 'granted' ? (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BellRing size={18} color="#ea580c" />
                  <span style={{ fontSize: 11.5, color: '#9a3412', fontWeight: 600 }}>
                    {lang === 'bn' ? 'ফোনের স্ক্রিনে ১-১০ তারিখের চাঁদার নোটিফিকেশন পেতে সক্রিয় করুন' : 'Enable to get 1st-10th reminders on mobile screen'}
                  </span>
                </div>
                <button
                  className="primary-small"
                  style={{ background: '#ea580c', padding: '5px 10px', fontSize: 11 }}
                  onClick={requestPushPermission}
                >
                  {t.enablePushBtn}
                </button>
              </div>
            ) : (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#166534', fontWeight: 600 }}>
                <span>✅ {t.pushActiveBadge}</span>
              </div>
            )}

            <div className="panel list-panel">
              {notifications.map(n => (
                <div
                  className="notification-row"
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{ cursor: 'pointer', background: n.read ? '#fff' : '#fffaf4' }}
                >
                  <div className={`activity-icon ${n.color}-bg`}>
                    <Bell size={18} />
                  </div>
                  <div className="activity-copy">
                    <strong>{n.title}</strong>
                    <span>{n.body}</span>
                    <small>{n.time}</small>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    {(n.title.includes('আবেদন') || n.title.includes('বিল') || n.title.includes('অনুমোদন')) && (
                      <span className="date-badge" style={{ fontSize: 9, background: '#ffeae5', color: '#b32323', border: '1px solid #f6c0b6' }}>
                        {lang === 'bn' ? 'যাচাই ও অনুমোদন' : 'Review'}
                      </span>
                    )}
                    {!n.read && <i className="unread-dot" />}
                  </div>
                </div>
              ))}
              {notifications.length === 0 && <p className="empty-small">{t.noData}</p>}
            </div>
          </>
        )}

        {/* ===================== TAB: MORE ===================== */}
        {tab === 'more' && (
          <>
            <div className="profile-card">
              <div className="profile-avatar">
                {currentUser.name.slice(0, 1)}
              </div>
              <div>
                <h2>{currentUser.name}</h2>
                <p>{currentUser.phone}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  <span className="role-badge" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                    👑 {currentUser.designation || (currentUser.role === 'Admin' ? 'সভাপতি ও প্রধান অ্যাডমিন' : 'সাধারণ সদস্য')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempLimitChoice(currentUser.monthlyCommitment || 1000);
                      setCustomLimitInput('');
                      setShowChangeLimitModal(true);
                    }}
                    style={{
                      background: '#fff0f3',
                      border: '1px solid #fbcfe8',
                      borderRadius: 6,
                      color: '#9d174d',
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 6px',
                      cursor: 'pointer'
                    }}
                  >
                    চাঁদা: {fmt(currentUser.monthlyCommitment || 1000)}/মাস (পরিবর্তন)
                  </button>
                </div>
              </div>
              <button
                className="action-icon-btn danger-btn"
                onClick={handleLogout}
                title={t.logout}
              >
                <LogOut size={16} />
              </button>
            </div>

            <div className="settings-list">
              <Setting
                icon={<Crown />}
                label={lang === 'bn' ? 'পূজা কমিটি' : 'Puja Committee'}
                detail={lang === 'bn' ? 'পূজা কমিটির পদবী ও দায়িত্বপ্রাপ্ত পরিষদ' : 'Committee hierarchy & designations'}
                onClick={() => setTab('committee')}
              />
              <Setting
                icon={<CircleDollarSign />}
                label={lang === 'bn' ? 'আমার মাসিক চাঁদার লক্ষ্য' : 'My Monthly Chada Limit'}
                detail={lang === 'bn' ? `বর্তমানে নির্ধারিত: ${fmt(currentUser.monthlyCommitment || 1000)} প্রতি মাসে (পরিবর্তন করতে চাপুন)` : `Current: ${fmt(currentUser.monthlyCommitment || 1000)}/mo (Click to edit)`}
                onClick={() => {
                  setTempLimitChoice(currentUser.monthlyCommitment || 1000);
                  setCustomLimitInput('');
                  setShowChangeLimitModal(true);
                }}
              />
              <Setting
                icon={<Smartphone />}
                label={t.payChadaBkash}
                detail={lang === 'bn' ? 'বিকাশের মাধ্যমে চাঁদা পরিশোধ ও TrxID যাচাই' : 'Pay monthly chada & verify TrxID'}
                onClick={() => setTab('bkash-pay')}
              />
              <Setting
                icon={<Users />}
                label={t.members}
                detail={lang === 'bn' ? 'পূজা কমিটির সদস্য তালিকা' : 'Member directory'}
                onClick={() => setTab('members')}
              />
              <Setting
                icon={<HandCoins />}
                label={t.contribution}
                detail={lang === 'bn' ? 'মাসিক চাঁদা পরিশোধ ও ইতিহাস' : 'Monthly contributions history'}
                onClick={() => setTab('contributions')}
              />
              <Setting
                icon={<Languages />}
                label={t.language}
                detail={lang === 'bn' ? 'বাংলা নির্বাচিত (Switch to English)' : 'English selected (বাংলায় দেখুন)'}
                onClick={() => {
                  const nextLang = lang === 'bn' ? 'en' : 'bn';
                  setLang(nextLang);
                  notify(nextLang === 'bn' ? 'বাংলা ভাষা নির্বাচন করা হয়েছে' : 'Switched to English');
                }}
              />
              <Setting
                icon={<FileSpreadsheet />}
                label={t.financialReport}
                detail={lang === 'bn' ? 'আয়-ব্যয়ের রিপোর্ট ও CSV ডাউনলোড' : 'View report & export CSV'}
                onClick={() => setTab('report')}
              />
              {role === 'Admin' && (
                <Setting
                  icon={<CircleDollarSign />}
                  label={t.reconciliation}
                  detail={lang === 'bn' ? 'বিকাশ মার্চেন্ট অ্যাকাউন্ট স্টেটমেন্ট ও ট্রানজেকশন' : 'bKash merchant ledger'}
                  onClick={() => setTab('reconciliation')}
                />
              )}
            </div>

            <button
              className="secondary-button"
              style={{ width: '100%', marginTop: 20 }}
              onClick={handleLogout}
            >
              <LogOut size={16} /> {t.logout}
            </button>
          </>
        )}

        {/* ===================== TAB: FINANCIAL REPORT ===================== */}
        {tab === 'report' && (
          <section className="form-card">
            <div className="form-intro">
              <div className="big-icon green-bg">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h2>{t.financialReport}</h2>
                <p>{lang === 'bn' ? 'শারদীয় দুর্গাপূজা ২০২৭ পূর্ণাঙ্গ অডিট সারসংক্ষেপ' : 'Full Financial Audit Summary 2027'}</p>
              </div>
            </div>

            <div className="report-row">
              <span>{t.totalCollected}</span>
              <strong>{fmt(collected)}</strong>
            </div>
            <div className="report-row">
              <span style={{ paddingLeft: 12 }}>- {lang === 'bn' ? 'প্রারম্ভিক তহবিল' : 'Starting Reserve'}</span>
              <span>{fmt(startingFund)}</span>
            </div>
            <div className="report-row">
              <span style={{ paddingLeft: 12 }}>- {lang === 'bn' ? 'প্রণামী সংগ্রহ' : 'Pronami Collections'}</span>
              <span>
                {fmt(
                  income
                    .filter(x => x.type === 'pronami' && x.status === 'Confirmed')
                    .reduce((s, x) => s + x.amount, 0)
                )}
              </span>
            </div>
            <div className="report-row">
              <span style={{ paddingLeft: 12 }}>- {lang === 'bn' ? 'মাসিক চাঁদা সংগ্রহ' : 'Monthly Contributions'}</span>
              <span>
                {fmt(
                  income
                    .filter(x => x.type === 'contribution' && x.status === 'Confirmed')
                    .reduce((s, x) => s + x.amount, 0)
                )}
              </span>
            </div>

            <div className="report-row" style={{ marginTop: 12, borderTop: '2px solid #e8ddd0', paddingTop: 10 }}>
              <span>{t.paid}</span>
              <strong style={{ color: '#b32323' }}>{fmt(paidBillsTotal)}</strong>
            </div>
            <div className="report-row">
              <span>{t.due}</span>
              <strong style={{ color: '#c36a0c' }}>{fmt(due)}</strong>
            </div>
            <div className="report-row" style={{ borderTop: '2px solid #e8ddd0', paddingTop: 10, fontSize: 16 }}>
              <span>{t.available}</span>
              <strong style={{ color: '#28764b' }}>{fmt(available)}</strong>
            </div>

            <button className="primary-button" onClick={exportCsvReport}>
              <Download size={18} /> {t.exportCsv}
            </button>
          </section>
        )}

        {/* ===================== TAB: RECONCILIATION (ADMIN ONLY) ===================== */}
        {tab === 'reconciliation' && (
          <section className="form-card">
            <div className="form-intro">
              <div className="big-icon gold-bg">
                <CircleDollarSign size={24} />
              </div>
              <div>
                <h2>{t.reconciliation}</h2>
                <p>{lang === 'bn' ? 'কমিটির বিকাশ মার্চেন্ট স্টেটমেন্টের সমস্ত লেনদেন' : 'Committee bKash Merchant Account Transactions'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: '#766' }}>
                {merchantLedger.filter(r => r.status === 'Claimed').length}/{merchantLedger.length}{' '}
                {lang === 'bn' ? 'দাবিদার চিহ্নিত' : 'Claimed'}
              </span>
            </div>

            {merchantLedger.map(r => (
              <div className="reconcile-card" key={r.id}>
                <div className="reconcile-row">
                  <strong>TrxID: {r.trxId}</strong>
                  <b style={{ color: '#e2136e' }}>{fmt(r.amount)}</b>
                </div>
                <div className="reconcile-row" style={{ color: '#776', fontSize: 11 }}>
                  <span>প্রেরক: {r.sender} · {r.date}</span>
                  <span className={`status ${r.status === 'Claimed' ? 'confirmed' : 'pending'}`}>
                    {r.status === 'Claimed' ? (lang === 'bn' ? `যাচাইকৃত (${r.claimedBy})` : `Claimed (${r.claimedBy})`) : (lang === 'bn' ? 'অদাবিকৃত' : 'Unclaimed')}
                  </span>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Floating Action Button for Quick Add Menu */}
      {tab !== 'pronami' && tab !== 'request' && tab !== 'bkash-pay' && (
        <button
          className="fab"
          aria-label="Quick add"
          onClick={() => setAddMenu(!addMenu)}
        >
          {addMenu ? <X size={25} /> : <Plus size={25} />}
        </button>
      )}

      {/* Contextual Quick Add Menu */}
      {addMenu && (
        <div className="quick-menu">
          <button
            onClick={() => {
              setTab('bkash-pay');
              setAddMenu(false);
            }}
          >
            <span className="activity-icon red-bg" style={{ background: '#ffe4ee', color: '#e2136e' }}>
              <Smartphone size={17} />
            </span>
            <span>{t.payChadaBkash}</span>
          </button>
          <button
            onClick={() => {
              setTab('pronami');
              setAddMenu(false);
            }}
          >
            <span className="activity-icon orange-bg">
              <Flower2 size={17} />
            </span>
            <span>{t.pronami}</span>
          </button>
          <button
            onClick={() => {
              setTab('request');
              setAddMenu(false);
            }}
          >
            <span className="activity-icon red-bg">
              <ReceiptText size={17} />
            </span>
            <span>{t.request}</span>
          </button>
        </div>
      )}

      {/* Persistent Bottom Navigation */}
      {['home', 'income', 'expenses', 'calendar', 'more'].includes(tab) && (
        <nav className="bottom-nav">
          {nav.map(([key, label, Icon]) => (
            <button
              key={key}
              className={tab === key ? 'active' : ''}
              onClick={() => setTab(key)}
            >
              <Icon size={21} strokeWidth={tab === key ? 2.5 : 1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* ===================== MODAL: ADD MEMBER ===================== */}
      {showAddMember && (
        <div className="modal-backdrop" onClick={() => setShowAddMember(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{t.addMember}</h2>
              <button onClick={() => setShowAddMember(false)}>
                <X />
              </button>
            </div>
            <label>{t.name}</label>
            <input
              className="field"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="যেমন: অনিল রায়"
            />
            <label>{t.phone}</label>
            <input
              className="field"
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              inputMode="tel"
            />
            <label>{t.role}</label>
            <select
              className="field"
              value={newMemberRole}
              onChange={e => setNewMemberRole(e.target.value as MemberRole)}
            >
              <option value="Member">Member (with volunteer actions)</option>
              <option value="Admin">Admin</option>
            </select>
            <button
              className="primary-button"
              onClick={() => {
                if (!newName.trim() || !newPhone.trim()) {
                  notify(lang === 'bn' ? 'নাম ও মোবাইল নম্বর দিন' : 'Enter name and phone');
                  return;
                }
                setUsers(p => [
                  ...p,
                  {
                    id: Date.now(),
                    name: newName.trim(),
                    phone: newPhone.trim(),
                    role: newMemberRole,
                    password: '123',
                    paid: false,
                    active: true
                  }
                ]);
                setNewName('');
                setNewPhone('');
                setShowAddMember(false);
                notify(t.saved);
              }}
            >
              {t.addMember}
            </button>
          </div>
        </div>
      )}

      {/* ===================== MODAL: MEMBER ACTIONS / EDIT ===================== */}
      {selectedUser && (
        <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{selectedUser.name}</h2>
              <button onClick={() => setSelectedUser(null)}>
                <X />
              </button>
            </div>
            <p style={{ margin: '4px 0 16px', fontSize: 12, color: '#776' }}>
              {selectedUser.phone} · ভূমিকা: {selectedUser.role}
            </p>

            <label>{lang === 'bn' ? 'ভূমিকা পরিবর্তন' : 'Change Role'}</label>
            <select
              className="field"
              value={selectedUser.role}
              onChange={e => {
                const updatedRole = e.target.value as MemberRole;
                setUsers(p => p.map(m => m.id === selectedUser.id ? { ...m, role: updatedRole } : m));
                setSelectedUser(prev => prev ? { ...prev, role: updatedRole } : null);
                notify(lang === 'bn' ? 'ভূমিকা আপডেট হয়েছে' : 'Role updated');
              }}
            >
              <option value="Member">Member</option>
              <option value="Admin">Admin</option>
            </select>

            <label style={{ marginTop: 12 }}>{lang === 'bn' ? 'কমিটির পদবী' : 'Committee Designation'}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="field"
                value={selectedUser.designation || ''}
                onChange={e => {
                  const desig = e.target.value;
                  setSelectedUser(prev => prev ? { ...prev, designation: desig } : null);
                }}
                placeholder="যেমন: কোষাধ্যক্ষ, প্রচার সম্পাদক..."
              />
              <button
                type="button"
                className="primary-button"
                style={{ width: 'auto', padding: '0 14px' }}
                onClick={() => {
                  if (selectedUser.designation) {
                    updateMemberDesignation(selectedUser.id, selectedUser.designation);
                  }
                }}
              >
                {lang === 'bn' ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                className="secondary-button"
                style={{ flex: 1 }}
                onClick={() => {
                  const newActive = !selectedUser.active;
                  setUsers(p => p.map(m => m.id === selectedUser.id ? { ...m, active: newActive } : m));
                  setSelectedUser(null);
                  notify(newActive ? 'সদস্য সক্রিয় করা হয়েছে' : 'সদস্য নিষ্ক্রিয় করা হয়েছে');
                }}
              >
                <UserCheck size={16} /> {selectedUser.active ? (lang === 'bn' ? 'নিষ্ক্রিয় করুন' : 'Deactivate') : (lang === 'bn' ? 'সক্রিয় করুন' : 'Activate')}
              </button>

              <button
                className="secondary-button danger-btn"
                style={{ flex: 1 }}
                onClick={() => {
                  if (window.confirm('এই সদস্যকে তালিকা থেকে মুছে ফেলতে চান?')) {
                    setUsers(p => p.filter(m => m.id !== selectedUser.id));
                    setSelectedUser(null);
                    notify('সদস্য মুছে ফেলা হয়েছে');
                  }
                }}
              >
                <Trash2 size={16} /> {lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EDIT COMMITTEE DESIGNATION ===================== */}
      {editingDesignationUser && (
        <div className="modal-backdrop" onClick={() => setEditingDesignationUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{lang === 'bn' ? 'কমিটির পদবী নির্ধারণ' : 'Assign Designation'}</h2>
              <button onClick={() => setEditingDesignationUser(null)}>
                <X />
              </button>
            </div>
            <p style={{ margin: '4px 0 16px', fontSize: 13, color: '#78350f' }}>
              <strong>{editingDesignationUser.name}</strong> ({editingDesignationUser.phone})
            </p>

            <label style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>
              {lang === 'bn' ? 'প্রচলিত পদবীসমূহ থেকে নির্বাচন করুন:' : 'Select Standard Title:'}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {COMMITTEE_DESIGNATIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  className={`filter-chip ${selectedDesignation === d && !customDesignationInput ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedDesignation(d);
                    setCustomDesignationInput('');
                  }}
                  style={{ fontSize: 11.5, padding: '5px 9px' }}
                >
                  {d}
                </button>
              ))}
            </div>

            <label>{lang === 'bn' ? 'অথবা নিজস্ব পদবী লিখুন:' : 'Or Enter Custom Title:'}</label>
            <input
              className="field"
              value={customDesignationInput}
              onChange={e => setCustomDesignationInput(e.target.value)}
              placeholder={lang === 'bn' ? 'যেমন: প্রধান সমন্বয়ক, সাংস্কৃতিক সম্পাদক...' : 'e.g. Chief Coordinator'}
            />

            <button
              className="primary-button"
              style={{ marginTop: 14 }}
              onClick={() => {
                const final = customDesignationInput.trim() || selectedDesignation || 'সাধারণ সদস্য';
                updateMemberDesignation(editingDesignationUser.id, final);
              }}
            >
              <CheckCircle2 size={18} /> {lang === 'bn' ? 'পদবী সংরক্ষণ করুন' : 'Save Designation'}
            </button>
          </div>
        </div>
      )}

      {/* ===================== MODAL: PAY BILL ===================== */}
      {payingBill && (
        <div className="modal-backdrop" onClick={() => setPayingBill(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{lang === 'bn' ? 'বকেয়া পরিশোধ ও নিষ্পত্তি' : 'Settle Remaining Due'}</h2>
              <button onClick={() => setPayingBill(null)}>
                <X />
              </button>
            </div>

            <div style={{ background: '#fdf9f4', padding: 14, borderRadius: 14, border: '1.5px solid #ebd9c5', margin: '10px 0 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 15, color: '#3b2f28' }}>{payingBill.vendor}</strong>
                <span className="date-badge">{payingBill.category}</span>
              </div>
              <p style={{ fontSize: 12, color: '#6d5a4c', margin: '4px 0 8px' }}>
                {payingBill.description} · আবেদনকারী: <b>{payingBill.requester}</b>
              </p>

              <div className="spending-grid-3" style={{ margin: 0 }}>
                <div>
                  <span>১. মোট বিল</span>
                  <strong style={{ color: '#332' }}>{fmt(payingBill.total)}</strong>
                </div>
                <div>
                  <span>২. ইতিমধ্যে দেওয়া</span>
                  <strong style={{ color: '#25774a' }}>{fmt(payingBill.paid)}</strong>
                </div>
                <div>
                  <span>৩. বাকি পাওনা</span>
                  <strong style={{ color: '#b32323', fontSize: 15 }}>{fmt(Math.max(0, payingBill.total - payingBill.paid))}</strong>
                </div>
              </div>
            </div>

            {/* Quick Settle Amount Buttons */}
            {payingBill.total - payingBill.paid > 0 && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7a6758', display: 'block', marginBottom: 6 }}>
                  {lang === 'bn' ? 'দ্রুত পরিমাণ নির্বাচন:' : 'Quick Select Amount:'}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[1000, 2000, 5000, 10000]
                    .filter(amt => amt < (payingBill.total - payingBill.paid))
                    .map(amt => (
                      <button
                        key={amt}
                        type="button"
                        className="sub-chip"
                        onClick={() => setPayAmountInput(String(amt))}
                        style={{ background: '#f7f2eb', borderColor: '#dccab6' }}
                      >
                        +{fmt(amt)}
                      </button>
                    ))}
                  <button
                    type="button"
                    className="sub-chip"
                    onClick={() => setPayAmountInput(String(payingBill.total - payingBill.paid))}
                    style={{ background: '#fdeded', borderColor: '#f2abab', color: '#b32323', fontWeight: 800 }}
                  >
                    ⚡ {lang === 'bn' ? 'সম্পূর্ণ বকেয়া' : 'Full Due'} ({fmt(payingBill.total - payingBill.paid)})
                  </button>
                </div>
              </div>
            )}

            <label>{lang === 'bn' ? 'পরিশোধের পরিমাণ' : 'Payment Amount'}</label>
            <div className="amount-display">
              <span>৳</span>
              <input
                value={payAmountInput}
                onChange={e => setPayAmountInput(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                placeholder="0"
              />
            </div>

            {/* Manual Transfer In-Person Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f4ee', border: '1px solid #e7ded3', borderRadius: 10, padding: '10px 12px', margin: '10px 0 14px' }}>
              <span style={{ fontSize: 12, color: '#6d5a4c', fontWeight: 600 }}>
                {lang === 'bn' ? 'পরিশোধের মাধ্যম:' : 'Payment Method:'}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#8d1717', display: 'flex', alignItems: 'center', gap: 5 }}>
                <HandCoins size={15} />
                {lang === 'bn' ? 'ম্যানুয়াল ট্রান্সফার (সশরীরে পরিশোধ)' : 'Manual Transfer (In Person)'}
              </span>
            </div>

            <label>{lang === 'bn' ? 'ভাউচার / মেমো বা রেফারেন্স নোট (ঐচ্ছিক)' : 'Voucher / Memo or Note (Optional)'}</label>
            <input
              className="field"
              value={settleNote}
              onChange={e => setSettleNote(e.target.value)}
              placeholder={lang === 'bn' ? 'যেমন: ভাউচার নং ১২, রসিদ স্লিপ...' : 'e.g. Voucher #12, receipt note...'}
            />

            <div style={{ background: '#fff5e8', border: '1px dashed #f2ba9d', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: '#a64218', margin: '12px 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{lang === 'bn' ? 'এই টাকা পরিশোধ করলে "হাতে আছে" তহবিল থেকে স্বয়ংক্রিয়ভাবে বিয়োগ হবে এবং বিলটিতে জমা হবে।' : 'Paying this amount will deduct from available funds and update the bill.'}</span>
            </div>

            <button className="primary-button" onClick={executeBillPayment} style={{ margin: 0 }}>
              <CheckCircle2 size={18} /> {lang === 'bn' ? 'বকেয়া পরিশোধ সম্পন্ন করুন' : 'Confirm & Settle Due'}
            </button>
          </div>
        </div>
      )}

      {/* ===================== MODAL: INCOME DETAILS & ADMIN STATEMENT VERIFICATION ===================== */}
      {selectedIncome && (
        <div className="modal-backdrop" onClick={() => setSelectedIncome(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{selectedIncome.name}</h2>
              <button onClick={() => setSelectedIncome(null)}>
                <X />
              </button>
            </div>
            <div style={{ margin: '14px 0' }}>
              <div className="report-row">
                <span>{lang === 'bn' ? 'আয়ের ধরন' : 'Type'}</span>
                <strong>{selectedIncome.type === 'pronami' ? t.pronami : (lang === 'bn' ? 'মাসিক চাঁদা' : 'Monthly Chada')}</strong>
              </div>
              <div className="report-row">
                <span>{t.amount}</span>
                <strong style={{ color: '#25774a', fontSize: 18 }}>{fmt(selectedIncome.amount)}</strong>
              </div>
              {selectedIncome.month && (
                <div className="report-row">
                  <span>{lang === 'bn' ? 'চাঁদার মাস' : 'Month'}</span>
                  <span className="date-badge">{getMonthLabel(selectedIncome.month, true)}</span>
                </div>
              )}
              {selectedIncome.day && selectedIncome.day !== '—' && (
                <div className="report-row">
                  <span>{t.pujaDay}</span>
                  <span>{selectedIncome.day}</span>
                </div>
              )}
              <div className="report-row">
                <span>{t.method}</span>
                <span style={{ fontWeight: 800, color: selectedIncome.method === 'bKash' ? '#e2136e' : selectedIncome.method === 'Nagad' ? '#ea580c' : '#333' }}>
                  {selectedIncome.method}
                </span>
              </div>
              {selectedIncome.senderPhone && (
                <div className="report-row">
                  <span>{lang === 'bn' ? 'প্রেরক নম্বর' : 'Sender Phone'}</span>
                  <strong style={{ letterSpacing: 0.5 }}>{selectedIncome.senderPhone}</strong>
                </div>
              )}
              {selectedIncome.trxId && (
                <div className="report-row" style={{ background: '#fcf8f5', padding: '10px 12px', borderRadius: 12, margin: '8px 0', border: '1px solid #ebdcd0' }}>
                  <span>Transaction ID</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ letterSpacing: 1.5, fontFamily: 'monospace', color: '#8d1717', fontSize: 15 }}>
                      {selectedIncome.trxId}
                    </strong>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(selectedIncome.trxId || '');
                        notify(lang === 'bn' ? 'TrxID কপি করা হয়েছে!' : 'TrxID copied!');
                      }}
                      style={{ background: '#f5ebe0', border: 0, borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 700, color: '#6d5a4c' }}
                    >
                      কপি
                    </button>
                  </div>
                </div>
              )}
              <div className="report-row">
                <span>{lang === 'bn' ? 'বর্তমান স্ট্যাটাস' : 'Status'}</span>
                <StatusBadge status={selectedIncome.status} lang={lang} />
              </div>

              {selectedIncome.status === 'Pending' && (
                <div style={{ background: '#fff7ed', border: '1px dashed #fdba74', borderRadius: 12, padding: '10px 12px', fontSize: 11, color: '#9a3412', marginTop: 12, lineHeight: 1.5 }}>
                  <AlertCircle size={15} style={{ display: 'inline', verticalAlign: -3, marginRight: 6 }} />
                  {lang === 'bn'
                    ? 'অ্যাডমিন নির্দেশিকা: আপনার মোবাইলের বিকাশ/নগদ এসএমএস স্টেটমেন্টের সাথে TrxID ও প্রেরক নম্বর মিলিয়ে দেখুন। মিলে গেলে অনুমোদন করুন।'
                    : 'Admin instructions: Match the TrxID & amount in your bKash/Nagad SMS statement. If matched, approve.'}
                </div>
              )}
            </div>

            {role === 'Admin' && selectedIncome.status === 'Pending' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  className="primary-button"
                  style={{ flex: 1, margin: 0, background: '#25834d' }}
                  onClick={() => {
                    approve(selectedIncome.id);
                    setSelectedIncome(null);
                  }}
                >
                  <CheckCircle2 size={16} /> {lang === 'bn' ? 'স্টেটমেন্ট মিলেছে (অনুমোদন)' : 'Approve'}
                </button>
                <button
                  className="secondary-button danger-btn"
                  style={{ flex: 1, margin: 0 }}
                  onClick={() => {
                    reject(selectedIncome.id, 'স্টেটমেন্ট মেলেনি');
                    setSelectedIncome(null);
                  }}
                >
                  <X size={16} /> {lang === 'bn' ? 'মেলেনি (বাতিল)' : 'Reject'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== MODAL: BILL REVIEW & APPROVAL ===================== */}
      {selectedReviewBill && (
        <div className="modal-backdrop" onClick={() => setSelectedReviewBill(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{selectedReviewBill.vendor}</h2>
              <button onClick={() => setSelectedReviewBill(null)}>
                <X />
              </button>
            </div>
            <div style={{ margin: '14px 0' }}>
              <div className="report-row">
                <span>{lang === 'bn' ? 'বিবরণ' : 'Description'}</span>
                <strong>{selectedReviewBill.description}</strong>
              </div>
              <div className="report-row">
                <span>{lang === 'bn' ? 'খরচের ধরন' : 'Category'}</span>
                <span className="date-badge">{selectedReviewBill.category}</span>
              </div>
              <div className="report-row">
                <span>{lang === 'bn' ? 'আবেদনকারী' : 'Requester'}</span>
                <strong>{selectedReviewBill.requester}</strong>
              </div>
              <div className="report-row">
                <span>{lang === 'bn' ? 'আবেদনের ধরন' : 'Type'}</span>
                <span>{selectedReviewBill.type === 'Advance' ? t.advance : t.reimbursement}</span>
              </div>
              {selectedReviewBill.dueDate && (
                <div className="report-row">
                  <span>{t.dueDate}</span>
                  <span>{selectedReviewBill.dueDate}</span>
                </div>
              )}
              <div className="report-row">
                <span>{lang === 'bn' ? 'বর্তমান স্ট্যাটাস' : 'Status'}</span>
                <StatusBadge status={selectedReviewBill.status} lang={lang} />
              </div>

              {/* 3-Part Spending Card inside Modal */}
              <div className="spending-breakdown-card" style={{ margin: '14px 0 10px' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#8d1717', textTransform: 'uppercase' }}>
                  {lang === 'bn' ? '৩টি ধাপের খরচের হিসাব' : '3-Part Spending Breakdown'}
                </span>
                <div className="spending-grid-3">
                  <div>
                    <span>১. মোট বিল</span>
                    <strong style={{ color: '#332' }}>{fmt(selectedReviewBill.total)}</strong>
                  </div>
                  <div>
                    <span>২. দেওয়া হয়েছে</span>
                    <strong style={{ color: '#25774a' }}>{fmt(selectedReviewBill.paid)}</strong>
                  </div>
                  <div>
                    <span>৩. বাকি দিতে হবে</span>
                    <strong style={{ color: '#b32323' }}>{fmt(Math.max(0, selectedReviewBill.total - selectedReviewBill.paid))}</strong>
                  </div>
                </div>
              </div>

              {/* Admin Direct Status Modifier inside Modal */}
              {role === 'Admin' && (
                <div className="status-modify-row" style={{ margin: '10px 0 14px' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#6d5a4c' }}>
                    {lang === 'bn' ? 'স্ট্যাটাস সংশোধন করুন:' : 'Modify Status:'}
                  </label>
                  <select
                    className="status-modify-select"
                    value={selectedReviewBill.status}
                    onChange={e => {
                      const newStatus = e.target.value as 'Pending' | 'Approved' | 'Rejected';
                      modifyBillStatus(selectedReviewBill.id, newStatus);
                    }}
                  >
                    <option value="Pending">🕒 {t.pending} (অনুমোদনের অপেক্ষায়)</option>
                    <option value="Approved">✓ {t.approved} (অনুমোদিত ও যুক্ত)</option>
                    <option value="Rejected">✕ {t.rejected} (বাতিল)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Settle Due Action Button if there is a remaining due */}
            {selectedReviewBill.total - selectedReviewBill.paid > 0 && (
              <div style={{ marginBottom: 12 }}>
                <button
                  className="settle-due-btn"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 13 }}
                  onClick={() => {
                    const target = selectedReviewBill;
                    setSelectedReviewBill(null);
                    setPayingBill(target);
                    setPayAmountInput(String(target.total - target.paid));
                  }}
                >
                  <CreditCard size={17} />
                  <span>{lang === 'bn' ? 'বকেয়া মেটান' : 'Settle Due'} ({fmt(selectedReviewBill.total - selectedReviewBill.paid)})</span>
                </button>
              </div>
            )}

            {selectedReviewBill.status === 'Pending' ? (
              <div>
                <p style={{ fontSize: 11, color: '#a05a16', background: '#fff5e8', padding: '9px 12px', borderRadius: 10, margin: '8px 0 16px', lineHeight: 1.5 }}>
                  <AlertCircle size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 5 }} />
                  {lang === 'bn'
                    ? 'অ্যাডমিন অনুমোদন করলেই এই খরচটি সিস্টেমের মোট ব্যয়ে হিসাবভুক্ত হবে।'
                    : 'Once approved, this expense will be calculated into system funds.'}
                </p>
                {role === 'Admin' ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="primary-button"
                      style={{ flex: 1, margin: 0, background: '#25834d' }}
                      onClick={() => {
                        approve(selectedReviewBill.id);
                        setSelectedReviewBill(null);
                      }}
                    >
                      <CheckCircle2 size={16} /> {lang === 'bn' ? 'অনুমোদন করুন (Approve)' : 'Approve'}
                    </button>
                    <button
                      className="secondary-button danger-btn"
                      style={{ flex: 1, margin: 0 }}
                      onClick={() => {
                        reject(selectedReviewBill.id);
                        setSelectedReviewBill(null);
                      }}
                    >
                      <X size={16} /> {lang === 'bn' ? 'বাতিল করুন (Reject)' : 'Reject'}
                    </button>
                  </div>
                ) : (
                  <button className="secondary-button" style={{ width: '100%' }} onClick={() => setSelectedReviewBill(null)}>
                    {t.close}
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#25774a', fontSize: 12, fontWeight: 700, margin: '6px 0 12px' }}>
                  <CheckCircle2 size={16} />
                  <span>
                    {selectedReviewBill.status === 'Approved'
                      ? (lang === 'bn' ? 'বিলটি অনুমোদিত ও সিস্টেমের হিসাবে যুক্ত আছে' : 'Bill approved & calculated into system')
                      : (lang === 'bn' ? 'বিলটি বাতিল করা হয়েছে' : 'Bill rejected')}
                  </span>
                </div>
                <button className="secondary-button" style={{ width: '100%' }} onClick={() => setSelectedReviewBill(null)}>
                  {t.close}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD COMMITTEE EVENT ===================== */}
      {showAddEventModal && (
        <div className="modal-backdrop" onClick={() => setShowAddEventModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{lang === 'bn' ? 'ক্যালেন্ডার ইভেন্ট / মিটিং যোগ করুন' : 'Add Calendar Event'}</h2>
              <button onClick={() => setShowAddEventModal(false)}>
                <X />
              </button>
            </div>

            <div style={{ margin: '14px 0' }}>
              <label>{lang === 'bn' ? 'তারিখ' : 'Date'}</label>
              <input
                type="date"
                className="field"
                value={selectedDayStr}
                onChange={e => setSelectedDayStr(e.target.value)}
                style={{ marginBottom: 12 }}
              />

              <label>{lang === 'bn' ? 'ইভেন্ট / সভার শিরোনাম' : 'Event / Meeting Title'}</label>
              <input
                type="text"
                className="field"
                placeholder={lang === 'bn' ? 'যেমন: মণ্ডপ প্রাঙ্গণে প্রস্তুতি সভা' : 'e.g. Planning Meeting'}
                value={newEventTitle}
                onChange={e => setNewEventTitle(e.target.value)}
                style={{ marginBottom: 12 }}
              />

              <label>{lang === 'bn' ? 'সময়' : 'Time'}</label>
              <input
                type="text"
                className="field"
                placeholder={lang === 'bn' ? 'যেমন: সন্ধ্যা ৭:০০' : 'e.g. 7:00 PM'}
                value={newEventTime}
                onChange={e => setNewEventTime(e.target.value)}
                style={{ marginBottom: 12 }}
              />

              <label>{lang === 'bn' ? 'ধরন' : 'Type'}</label>
              <select
                className="field"
                value={newEventType}
                onChange={e => setNewEventType(e.target.value as 'meeting' | 'reminder' | 'deadline')}
                style={{ marginBottom: 12 }}
              >
                <option value="meeting">{lang === 'bn' ? 'সাধারণ সভা / প্রস্তুতি মিটিং' : 'General / Planning Meeting'}</option>
                <option value="reminder">{lang === 'bn' ? 'গুরুত্বপূর্ণ রিমাইন্ডার' : 'Important Reminder'}</option>
                <option value="deadline">{lang === 'bn' ? 'বিল বা কাজের শেষ সময়' : 'Work / Payment Deadline'}</option>
              </select>

              <label>{lang === 'bn' ? 'বিবরণ / এজেন্ডা (ঐচ্ছিক)' : 'Details (Optional)'}</label>
              <textarea
                className="field"
                rows={3}
                placeholder={lang === 'bn' ? 'সভার আলোচ্য বিষয় বা বিস্তারিত নির্দেশনা লিখুন...' : 'Enter meeting agenda or notes...'}
                value={newEventDesc}
                onChange={e => setNewEventDesc(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="secondary-button"
                style={{ flex: 1 }}
                onClick={() => setShowAddEventModal(false)}
              >
                {t.cancel}
              </button>
              <button
                className="primary-button"
                style={{ flex: 2, margin: 0 }}
                onClick={() => {
                  if (!newEventTitle.trim()) {
                    notify(lang === 'bn' ? 'ইভেন্টের নাম লিখুন' : 'Enter event title');
                    return;
                  }
                  const newEv: CommitteeCalendarEvent = {
                    id: `ev-${Date.now()}`,
                    title: newEventTitle.trim(),
                    dateStr: selectedDayStr,
                    time: newEventTime.trim(),
                    type: newEventType,
                    desc: newEventDesc.trim()
                  };
                  setCommitteeEvents(prev => [...prev, newEv]);
                  setShowAddEventModal(false);
                  setNewEventTitle('');
                  setNewEventDesc('');
                  notify(lang === 'bn' ? 'ক্যালেন্ডারে ইভেন্ট যুক্ত হয়েছে' : 'Event added to calendar');
                }}
              >
                {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ANNOUNCEMENT ===================== */}
      {showAnnouncementModal && (
        <div className="modal-backdrop" onClick={() => setShowAnnouncementModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{t.newAnnouncement}</h2>
              <button onClick={() => setShowAnnouncementModal(false)}>
                <X />
              </button>
            </div>
            <label>{lang === 'bn' ? 'শিরোনাম' : 'Title'}</label>
            <input
              className="field"
              value={announcementTitle}
              onChange={e => setAnnouncementTitle(e.target.value)}
              placeholder="যেমন: প্রস্তুতি সভা"
            />
            <label>{lang === 'bn' ? 'বিস্তারিত' : 'Details'}</label>
            <textarea
              className="field"
              style={{ height: 80, padding: 10, resize: 'none' }}
              value={announcementBody}
              onChange={e => setAnnouncementBody(e.target.value)}
              placeholder="ঘোষণার বিবরণ লিখুন..."
            />
            <label>{lang === 'bn' ? 'গুরুত্ব / রঙ' : 'Priority Color'}</label>
            <div className="choice-row">
              {(['green', 'orange', 'red', 'gold'] as const).map(c => (
                <button
                  key={c}
                  className={announcementColor === c ? 'selected' : ''}
                  onClick={() => setAnnouncementColor(c)}
                >
                  {c === 'green' ? 'সাধারণ' : c === 'orange' ? 'জরুরি' : c === 'red' ? 'গুরুত্বপূর্ণ' : 'উৎসব'}
                </button>
              ))}
            </div>
            <button className="primary-button" onClick={publishAnnouncement}>
              <Megaphone size={18} /> {lang === 'bn' ? 'ঘোষণা প্রচার করুন' : 'Publish Announcement'}
            </button>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CHANGE MONTHLY LIMIT ===================== */}
      {showChangeLimitModal && currentUser && (
        <div className="limit-modal-backdrop" onClick={() => setShowChangeLimitModal(false)}>
          <div className="limit-modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: '#8d1717', fontSize: 17, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HandCoins size={18} /> {lang === 'bn' ? 'মাসিক চাঁদার পরিমাণ পরিবর্তন' : 'Change Monthly Contribution'}
              </h3>
              <button
                onClick={() => setShowChangeLimitModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 12, color: '#6d5a4c', lineHeight: 1.5, margin: '0 0 14px' }}>
              {lang === 'bn'
                ? 'আপনি প্রতি মাসে কত টাকা চাঁদা দিতে চান তা নির্বাচন করুন। আপনার নির্বাচিত চাঁদার পরিমাণ অনুযায়ী আপনার ড্যাশবোর্ড ও বকেয়া হিসাব প্রদর্শিত হবে।'
                : 'Select how much you want to contribute each month. Your dashboard, dues, and payment suggestions will reflect this amount.'}
            </p>

            <label style={{ fontSize: 12, fontWeight: 700, color: '#4a3d33', display: 'block', marginBottom: 6 }}>
              {lang === 'bn' ? 'দ্রুত পরিমাণ নির্বাচন করুন:' : 'Select Amount:'}
            </label>

            <div className="monthly-choice-grid">
              {[500, 1000, 1500, 2000, 3000, 5000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  className={`monthly-choice-pill ${tempLimitChoice === amt && !customLimitInput ? 'active' : ''}`}
                  onClick={() => {
                    setTempLimitChoice(amt);
                    setCustomLimitInput('');
                  }}
                >
                  ৳{toBnDigits(amt.toLocaleString())}
                </button>
              ))}
            </div>

            <label style={{ fontSize: 12, fontWeight: 700, color: '#4a3d33', display: 'block', marginBottom: 6 }}>
              {lang === 'bn' ? 'অথবা কাস্টম টাকার পরিমাণ:' : 'Or custom amount (BDT):'}
            </label>
            <input
              className="field"
              value={customLimitInput}
              onChange={e => setCustomLimitInput(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={lang === 'bn' ? 'যেমন: ২৫০০' : 'e.g. 2500'}
              inputMode="numeric"
              style={{ marginBottom: 16 }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="secondary-button"
                style={{ flex: 1, padding: 11 }}
                onClick={() => setShowChangeLimitModal(false)}
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ flex: 1, margin: 0, padding: 11 }}
                onClick={() => {
                  const finalAmt = customLimitInput ? (Number(customLimitInput) || 1000) : tempLimitChoice;
                  updateUserCommitment(finalAmt);
                }}
              >
                {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Alert */}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}

// Subcomponents
function Stat({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: string }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tint}-bg`}>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Quick({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button className="quick-action" onClick={onClick}>
      <span className={`quick-icon ${color}-bg`}>{icon}</span>
      <strong>{label}</strong>
      <ChevronRight size={15} />
    </button>
  );
}

function StatusBadge({ status, lang }: { status: string; lang: 'bn' | 'en' }) {
  const label =
    status === 'Confirmed'
      ? lang === 'bn' ? 'নিশ্চিত' : 'Confirmed'
      : status === 'Pending'
      ? lang === 'bn' ? 'অপেক্ষায়' : 'Pending'
      : lang === 'bn' ? 'বাতিল' : 'Rejected';
  return <span className={`status ${status.toLowerCase()}`}>{label}</span>;
}

function Setting({
  icon,
  label,
  detail,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button className="setting-row" onClick={onClick}>
      <span className="setting-icon">{icon}</span>
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <ChevronRight size={18} />
    </button>
  );
}
