import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, addDoc, onSnapshot, 
  deleteDoc, updateDoc, serverTimestamp, query, orderBy, writeBatch, getDocs 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  CheckCircle2, Trophy, Gamepad2, Trash2, Settings, LogOut, Calendar as CalendarIcon, 
  Sun, ShoppingCart, Bell, Check, X as XIcon, User, Mic, MicOff, FileText, Send,
  RefreshCw, Minus, Flame, Lock, CalendarDays, Repeat, ChevronLeft, ChevronRight,
  Cloud, CloudRain, CloudSnow, CloudLightning, PlusCircle, Utensils, Timer, Hourglass,
  Puzzle, RotateCcw, Grid3X3, Eraser, AlertTriangle, Plus, Users, ClipboardList, Clock, Link as LinkIcon, Gift
} from 'lucide-react';

// --- 1. KONFIGURACJA FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyC4VNHLw96CZKI0stbkg-7Gfg27xbE-mIY", 
  authDomain: "rodzinkahero.firebaseapp.com",
  projectId: "rodzinkahero",
  storageBucket: "rodzinkahero.firebasestorage.app",
  messagingSenderId: "83786263974",
  appId: "1:83786263974:web:a38b984e2267ce05afb367",
  measurementId: "G-1MXK50ZY0J"
};

// Inicjalizacja
let app, auth, db, appId = 'rodzina-v4-stable';
let initError = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e: any) {
  console.error("Firebase init error:", e);
  initError = e.message;
}

// --- 2. STAŁE I DANE ---
const SHIFTS = ['A', 'B', 'C'];
const DEFAULT_SOCCER_URL = "https://www.meczyki.pl/"; 
const KOSTEK_GAME_URL = "https://logiclike.com/pl/v3/cabinet/exercise/5/1/1/problem/82077?backRoute=%2Fpl%2Fv3%2Fcabinet%2Fdashboard%2Flogic";
const DEFAULT_GAME_URL = "https://logiclike.com/pl/v3/cabinet/dashboard/logic";

const iconOptions = [ 
  { value: '🪥', label: 'Mycie zębów' }, { value: '🛌', label: 'Ścielenie łóżka' }, 
  { value: '🧸', label: 'Sprzątanie zabawek' }, { value: '🧹', label: 'Miotła/Zamiatanie' }, 
  { value: '🌪️', label: 'Odkurzanie' }, { value: '💨', label: 'Ścieranie kurzu' }, 
  { value: '🍽️', label: 'Zmywarka/Stół' }, { value: '📚', label: 'Nauka/Lekcje' }, 
  { value: '⚽', label: 'Trening' }, { value: '🐕', label: 'Spacer z psem' }, 
  { value: '🎒', label: 'Pakowanie plecaka' }, { value: '🗑️', label: 'Wynieś śmieci' }, 
  { value: '🚲', label: 'Rower' }, { value: '🎨', label: 'Rysowanie' }, 
  { value: '🎹', label: 'Ćwiczenie gry' }, { value: '💊', label: 'Witaminy/Leki' }, 
  { value: '🚿', label: 'Prysznic' }, { value: '🧩', label: 'Układanie' }, 
  { value: '🛒', label: 'Pomoc w zakupach' }, { value: '🚒', label: 'Służba' } 
];

const dinnerOptionsList = [ 
  { id: 'pizza', name: 'Pizza', icon: '🍕' }, { id: 'soup', name: 'Zupa', icon: '🍜' }, 
  { id: 'spaghetti', name: 'Spaghetti', icon: '🍝' }, { id: 'pancakes', name: 'Naleśniki', icon: '🥞' }, 
  { id: 'fries', name: 'Frytki/Nuggetsy', icon: '🍟' }, { id: 'pork', name: 'Kotlet', icon: '🥩' }, 
  { id: 'fish', name: 'Ryba', icon: '🐟' }, { id: 'dumplings', name: 'Pierogi', icon: '🥟' }, 
  { id: 'burger', name: 'Burger', icon: '🍔' }, { id: 'salad', name: 'Sałatka', icon: '🥗' }, 
  { id: 'scrambled', name: 'Jajecznica', icon: '🍳' }, { id: 'sandwich', name: 'Tosty', icon: '🥪' } 
];

const avatarOptions = ['🦕', '🏎️', '⚽', '🚒', '🌸', '🦄', '🚀', '👑', '🐶', '🐱', '🎮', '🎸', '🎨', '🐯', '🦁'];
const rewardIcons = ['🍬', '🍦', '🎮', '📺', '🎟️', '🛹', '🧸', '🍔', '🍕', '📱', '💻', '💸', '🎁', '⚽', '🎨', '🍿', '🎢'];

const defaultRewardsData = [ { title: '30 min Xbox', cost: 50, icon: '🎮' }, { title: 'Słodycz', cost: 30, icon: '🍫' }, { title: 'Lody', cost: 100, icon: '🍦' }, { title: 'Bajka', cost: 40, icon: '📺' } ];

// --- 3. POMOCNIKI ---
const getWeekNumber = (d: Date) => { d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7); };
const formatDate = (d: Date) => d.toISOString().split('T')[0];

const getShiftForDate = (targetDateInput: Date | string, refDateStr?: string) => { 
  const safeRefDate = refDateStr || formatDate(new Date()); 
  try { 
    const target = new Date(targetDateInput); 
    const ref = new Date(safeRefDate); 
    target.setHours(0,0,0,0); ref.setHours(0,0,0,0); 
    const diffTime = target.getTime() - ref.getTime(); 
    if (isNaN(diffTime)) return null; 
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    const targetIndex = (((0 + diffDays) % 3) + 3) % 3; 
    return SHIFTS[targetIndex]; 
  } catch (e) { return null; } 
};

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false); const [transcript, setTranscript] = useState('');
  const startListening = () => { if (typeof window === 'undefined') return; const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!SpeechRecognition) { alert("Użyj Chrome."); return; } const recognition = new SpeechRecognition(); recognition.lang = 'pl-PL'; recognition.continuous = false; recognition.onstart = () => setIsListening(true); recognition.onend = () => setIsListening(false); recognition.onerror = () => setIsListening(false); recognition.onresult = (e: any) => setTranscript(e.results[0][0].transcript); recognition.start(); };
  return { isListening, transcript, startListening, setTranscript };
};

// --- 4. KOMPONENTY UI ---
const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-100 border-4 border-slate-100 text-center">
        <h3 className="text-xl font-black text-slate-800 mb-6">{message}</h3>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={onCancel} className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold active:scale-95 transition-transform">Anuluj</button>
          <button onClick={onConfirm} className="py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg shadow-green-200 active:scale-95 transition-transform">Tak</button>
        </div>
      </div>
    </div>
  );
};

const PinPad = ({ onSuccess, onCancel }: any) => {
  const [input, setInput] = useState('');
  useEffect(() => { 
    if (input === '0000') onSuccess(); 
    else if (input.length === 4) { setTimeout(() => { alert('Błędny PIN'); setInput(''); }, 100); }
  }, [input]);

  return (
    <div className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center relative">
        <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400"><XIcon/></button>
        <h3 className="text-xl font-bold mb-6 text-slate-800">PIN RODZICA</h3>
        <div className="flex justify-center gap-4 mb-8">{[0,1,2,3].map(i => <div key={i} className={`w-4 h-4 rounded-full transition-all ${i < input.length ? 'bg-blue-600 scale-125' : 'bg-slate-200'}`}/>)}</div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1,2,3,4,5,6,7,8,9].map(n => <button key={n} onClick={() => setInput(prev => prev.length < 4 ? prev + n : prev)} className="h-16 rounded-xl bg-slate-100 text-2xl font-bold active:bg-blue-100 text-slate-700">{n}</button>)}
          <div/>
          <button onClick={() => setInput(prev => prev.length < 4 ? prev + '0' : prev)} className="h-16 rounded-xl bg-slate-100 text-2xl font-bold active:bg-blue-100 text-slate-700">0</button>
          <button onClick={() => setInput(prev => prev.slice(0, -1))} className="h-16 rounded-xl bg-red-50 text-red-400 font-bold flex items-center justify-center"><Minus/></button>
        </div>
      </div>
    </div>
  );
};

const CountdownTimer = ({ unlockTime }: { unlockTime: number }) => {
  const [timeLeft, setTimeLeft] = useState('15:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - unlockTime;
      const remaining = 15 * 60 * 1000 - elapsed;

      if (remaining <= 0) {
        setTimeLeft('00:00');
        clearInterval(interval);
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [unlockTime]);

  return (
    <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-lg font-black shadow-lg animate-in fade-in">
      <Clock className="w-5 h-5 text-red-400 animate-pulse" />
      {timeLeft}
    </div>
  );
};

const DayModal = ({ date, events, shift, isOverride, onClose, onAddEvent, onToggleOverride }: any) => {
  if (!date) return null;
  const dStr = formatDate(date);
  const dayEvents = events.filter((e:any) => e.date === dStr);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
         <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-slate-800">{dStr}</h3><button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><XIcon className="w-5 h-5"/></button></div>
         {shift === 'A' && (
           <div className="mb-6 p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-full ${isOverride ? 'bg-slate-200' : 'bg-red-100'}`}><Flame className={`w-6 h-6 ${isOverride ? 'text-slate-400' : 'text-red-500'}`} /></div>
                 <div><div className="font-bold text-slate-700">Służba Taty</div><div className="text-xs text-slate-400">{isOverride ? 'Wolne' : 'Pracująca'}</div></div>
              </div>
              <button onClick={() => onToggleOverride(dStr)} className={`px-3 py-1 rounded-lg text-xs font-bold ${isOverride ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>{isOverride ? 'Przywróć' : 'Oznacz jako Wolne'}</button>
           </div>
         )}
         <div className="mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Wydarzenia</h4>
            {dayEvents.length === 0 && <p className="text-sm text-slate-400 italic">Brak planów.</p>}
            {dayEvents.map((e:any) => (<div key={e.id} className="flex justify-between items-center mb-2 bg-blue-50 p-2 rounded-lg"><span className="font-bold text-slate-700">{e.title}</span><button onClick={() => deleteDoc(doc(db,'artifacts',appId,'public','data','events',e.id))} className="text-red-400"><XIcon className="w-4 h-4"/></button></div>))}
         </div>
         <div className="flex gap-2"><input id="newEvt" placeholder="Np. Lekarz 15:00" className="flex-1 p-3 bg-slate-50 rounded-xl border-none outline-none"/><button onClick={() => { const el = document.getElementById('newEvt') as HTMLInputElement; if(el.value) { onAddEvent(dStr, el.value); el.value=''; } }} className="bg-blue-600 text-white p-3 rounded-xl"><PlusCircle/></button></div>
      </div>
    </div>
  );
};

const FirefighterCalendar = ({ shiftRefDate, events, overrides, onDayClick }: any) => {
  const [date, setDate] = useState(new Date());
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const handlePrev = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
  const handleNext = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));
  const monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

  return (
    <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrev} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft className="w-5 h-5"/></button>
        <h3 className="font-bold text-lg text-slate-800">{monthNames[date.getMonth()]} {date.getFullYear()}</h3>
        <button onClick={handleNext} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight className="w-5 h-5"/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">{['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map(d => <div key={d} className="text-xs font-bold text-slate-400">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1 flex-1 content-start">
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1; const curr = new Date(date.getFullYear(), date.getMonth(), day); const dStr = formatDate(curr); const isToday = dStr === formatDate(new Date()); const shift = getShiftForDate(curr, shiftRefDate); const isOverride = overrides?.some((o:any) => o.id === dStr); const hasEvent = events?.some((e:any) => e.date === dStr);
          return (
            <button key={day} onClick={() => onDayClick && onDayClick(curr)} className={`h-10 rounded-xl flex flex-col items-center justify-center border transition-all relative ${isToday ? 'border-blue-500 bg-blue-50' : 'border-slate-50'} ${shift === 'A' && !isOverride ? 'bg-red-50 border-red-100' : ''}`}>
              <span className={`text-xs font-bold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>{day}</span>
              {shift === 'A' && !isOverride && <Flame className="w-3 h-3 text-red-500 mt-0.5"/>}
              {shift === 'A' && isOverride && <div className="text-[8px] text-slate-400 line-through">WOLNE</div>}
              {hasEvent && <div className="w-1 h-1 rounded-full bg-blue-400 mt-0.5"></div>}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-slate-400">
         <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-red-500"/> Służba Taty (A)</span>
         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Wydarzenie</span>
      </div>
    </div>
  );
};

const WeatherWidget = () => {
  const [weather, setWeather] = useState<{temp: number, code: number} | null>(null);
  useEffect(() => { fetch('https://api.open-meteo.com/v1/forecast?latitude=52.0836&longitude=15.6251&current_weather=true').then(res => res.json()).then(data => { if (data.current_weather) setWeather({ temp: data.current_weather.temperature, code: data.current_weather.weathercode }); }).catch(console.error); }, []);
  const getWeatherIcon = (code: number) => { if (code === 0) return <Sun className="w-10 h-10 text-yellow-400" />; if (code >= 1 && code <= 3) return <div className="relative"><Sun className="w-10 h-10 text-yellow-400"/><Cloud className="w-6 h-6 text-white absolute bottom-0 right-0 opacity-80"/></div>; if (code >= 45 && code <= 48) return <Cloud className="w-10 h-10 text-slate-200" />; if (code >= 51 && code <= 67) return <CloudRain className="w-10 h-10 text-blue-300" />; return <Sun className="w-10 h-10 text-yellow-400" />; };
  if (!weather) return <div className="bg-blue-300 rounded-3xl w-[130px] h-[120px] animate-pulse"></div>;
  return (<div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-3xl p-3 w-[130px] h-[120px] shrink-0 shadow-md relative overflow-hidden flex flex-col justify-between text-white"><div className="flex justify-between items-start z-10"><span className="font-bold text-[10px] uppercase opacity-80 tracking-wider">Sulechów</span></div><div className="z-10 flex flex-col items-center">{getWeatherIcon(weather.code)}<span className="text-2xl font-black mt-1">{Math.round(weather.temp)}°C</span></div><Sun className="absolute -top-4 -right-4 w-20 h-20 text-white opacity-10" /></div>);
};

// --- 5. GŁÓWNA APLIKACJA ---
export default function App() {
  const [errorMessage, setErrorMessage] = useState<string | null>(initError);
  const [user, setUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [view, setView] = useState<'select' | 'dashboard' | 'parent'>('select');
  const [tab, setTab] = useState('tasks');
  
  // Dane
  const [profiles, setProfiles] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [shoppingList, setShoppingList] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [todayActions, setTodayActions] = useState<ActionLog[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [overrides, setOverrides] = useState<ShiftOverride[]>([]);
  const [dinnerPoll, setDinnerPoll] = useState<any>(null);
  const [parentTodos, setParentTodos] = useState<any[]>([]);
  
  // UI
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, action: () => void}>({isOpen: false, message: '', action: () => {}});
  const [manualPoints, setManualPoints] = useState('');
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAge, setNewProfileAge] = useState('');
  const [newProfileAvatar, setNewProfileAvatar] = useState('🦖');
  const [selectedForTask, setSelectedForTask] = useState<string[]>([]);
  const [newTaskType, setNewTaskType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDinnerOptions, setSelectedDinnerOptions] = useState<string[]>([]);
  const [parentTodoInput, setParentTodoInput] = useState('');

  // Sklepik Edycja
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('');
  const [newRewardIcon, setNewRewardIcon] = useState('🍬');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const currentWeekNum = getWeekNumber(new Date());

  const soccerLimit = settings.soccerThreshold || 30;
  const gameLimit = settings.gameThreshold || 50;

  const shopVoice = useSpeechRecognition();
  const noteVoice = useSpeechRecognition();
  const parentNoteVoice = useSpeechRecognition();

  // Liczniki globalne
  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;
  const pendingActionsCount = todayActions.filter(a => a.status === 'pending').length;
  const totalPending = pendingRequestsCount + pendingActionsCount;
  
  // Calculate Daily Score Safely
  const getDailyScore = (pid: string) => { 
    if(!todayActions) return 0;
    const actions = todayActions.filter(a => a.profileId === pid && a.status === 'approved'); 
    let score = 0; 
    actions.forEach(a => { score += (a.pointsSnapshot || 0); }); 
    return score; 
  };

  // Determine Access
  const canAccessSoccer = currentProfile ? (getDailyScore(currentProfile.id) >= soccerLimit || currentProfile.isParent) : false;
  const canAccessGame = currentProfile ? (getDailyScore(currentProfile.id) >= gameLimit || currentProfile.isParent) : false;

  useEffect(() => { const initAuth = async () => { if(!auth) return; try { await signInAnonymously(auth); } catch (err: any) { console.error("Auth error:", err); setErrorMessage(err.message); } }; if (auth) initAuth(); if (auth) return onAuthStateChanged(auth, setUser); }, []);

  useEffect(() => {
    if (!user || !db) return;
    const path = ['artifacts', appId, 'public', 'data'];
    const subs = [
      onSnapshot(collection(db, ...path, 'profiles'), s => { 
        const p: any[] = []; s.forEach(d => p.push({ id: d.id, ...d.data() })); 
        if (p.length === 0) {
             // AUTO-SEED if empty (silent)
             seedDatabase(true);
        } else {
             setProfiles(p.sort((a:any, b:any) => a.age - b.age)); 
        }
      }),
      onSnapshot(collection(db, ...path, 'tasks'), s => setTasks(s.docs.map(d => ({id: d.id, ...d.data()})))),
      onSnapshot(collection(db, ...path, 'rewards'), s => setRewards(s.docs.map(d => ({id: d.id, ...d.data()})))),
      onSnapshot(collection(db, ...path, 'shopping'), s => setShoppingList(s.docs.map(d => ({id: d.id, ...d.data()})))),
      onSnapshot(query(collection(db, ...path, 'notes'), orderBy('timestamp', 'desc')), s => setNotes(s.docs.map(d => ({id: d.id, ...d.data()})))),
      onSnapshot(collection(db, ...path, 'requests'), s => setRequests(s.docs.map(d => ({id: d.id, ...d.data()})))),
      onSnapshot(collection(db, ...path, 'actions'), s => setTodayActions(s.docs.map(d => ({id: d.id, ...d.data()})).filter((a:any) => a.date === todayStr))),
      onSnapshot(doc(db, ...path, 'settings', 'config'), s => setSettings(s.data() || {})),
      onSnapshot(collection(db, ...path, 'events'), s => setEvents(s.docs.map(d => ({id: d.id, ...d.data()})))),
      onSnapshot(collection(db, ...path, 'overrides'), s => setOverrides(s.docs.map(d => ({id: d.id, ...d.data()})))),
      onSnapshot(doc(db, ...path, 'dinner', 'today'), s => setDinnerPoll(s.data())),
      onSnapshot(collection(db, ...path, 'parentTodos'), s => setParentTodos(s.docs.map(d => ({id: d.id, ...d.data()})))),
    ];
    return () => subs.forEach(u => u());
  }, [user]);

  useEffect(() => { if (shopVoice.transcript) { setDoc(doc(collection(db, 'artifacts', appId, 'public', 'data', 'shopping')), { name: shopVoice.transcript, isBought: false }); shopVoice.setTranscript(''); } }, [shopVoice.transcript]);

  const handleConfirm = (message: string, action: () => void) => setConfirmModal({isOpen: true, message, action});

  // --- ACTIONS ---
  const seedDatabase = async (silent = false) => {
    const path = ['artifacts', appId, 'public', 'data'];
    const batch = writeBatch(db);

    const collectionsToClear = ['profiles', 'tasks', 'rewards', 'actions', 'requests', 'parentTodos', 'events', 'overrides', 'notes'];
    for (const colName of collectionsToClear) {
        const snap = await getDocs(collection(db, ...path, colName));
        snap.forEach((doc) => batch.delete(doc.ref));
    }
    await batch.commit();

    // Create Base with FIXED IDs
    await setDoc(doc(db, ...path, 'profiles', 'p_maks'), { name: 'Maks (4)', age: 4, avatar: '🦕', points: 10, isParent: false });
    await setDoc(doc(db, ...path, 'profiles', 'p_kostek'), { name: 'Kostek (6)', age: 6, avatar: '🏎️', points: 20, isParent: false });
    await setDoc(doc(db, ...path, 'profiles', 'p_tymek'), { name: 'Tymek (8)', age: 8, avatar: '⚽', points: 40, isParent: false });
    await setDoc(doc(db, ...path, 'profiles', 'p_tata'), { name: 'Tata', age: 99, avatar: '🚒', points: 0, isParent: true });
    await setDoc(doc(db, ...path, 'profiles', 'p_mama'), { name: 'Mama', age: 98, avatar: '🌸', points: 0, isParent: true });
    
    await setDoc(doc(db, ...path, 'tasks', 'def_teeth'), { title: 'Mycie zębów', icon: '🪥', points: 5, assignedTo: [], type: 'daily' });
    
    const rRef = collection(db, ...path, 'rewards');
    for (const r of defaultRewardsData) { await setDoc(doc(rRef), r); }
    
    if (!silent) {
        alert("Baza wyczyszczona i naprawiona!");
        // No reload needed, snapshots will update
    }
  };

  const addProfile = async () => { if (!newProfileName) return; const isP = newProfileName.toLowerCase().includes('tata') || newProfileName.toLowerCase().includes('mama'); const newId = 'p_' + newProfileName.toLowerCase().replace(/\s/g, ''); await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', newId), { name: newProfileName, age: parseInt(newProfileAge) || 5, avatar: newProfileAvatar, points: 0, isParent: isP }); setNewProfileName(''); setNewProfileAge(''); };
  const deleteProfile = async (id: string) => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', id)); };
  
  const toggleTask = async (task: any) => { 
    if (!currentProfile) return; 
    const action = todayActions.find(a => a.taskId === task.id && a.profileId === currentProfile.id); 
    const path = ['artifacts', appId, 'public', 'data']; 
    
    if (action) { 
        await deleteDoc(doc(db, ...path, 'actions', action.id)); 
        if (action.status === 'approved') { 
            await updateDoc(doc(db, ...path, 'profiles', currentProfile.id), { points: Math.max(0, currentProfile.points - task.points) }); 
        } 
    } else { 
        const status = currentProfile.isParent ? 'approved' : 'pending'; 
        await setDoc(doc(collection(db, ...path, 'actions')), { taskId: task.id, profileId: currentProfile.id, date: todayStr, status, timestamp: serverTimestamp(), pointsSnapshot: task.points }); 
        if (currentProfile.isParent) { 
            await updateDoc(doc(db, ...path, 'profiles', currentProfile.id), { points: currentProfile.points + task.points }); 
        } 
    } 
  };

  const approveAction = async (act: any) => { const path = ['artifacts', appId, 'public', 'data']; const p = profiles.find(pr => pr.id === act.profileId); if (p) { await updateDoc(doc(db, ...path, 'actions', act.id), { status: 'approved' }); await updateDoc(doc(db, ...path, 'profiles', p.id), { points: p.points + act.pointsSnapshot }); } };
  const rejectAction = async (act: any) => { const path = ['artifacts', appId, 'public', 'data']; await deleteDoc(doc(db, ...path, 'actions', act.id)); };
  const requestReward = async (reward: any) => { if (!currentProfile) return; if (currentProfile.points < reward.cost) { alert("Za mało punktów w Skarbonce!"); return; } if (requests.find(r => r.profileId === currentProfile.id && r.status === 'pending' && r.rewardTitle === reward.title)) { alert("Już prosiłeś o to!"); return; } await setDoc(doc(collection(db, 'artifacts', appId, 'public', 'data', 'requests')), { profileId: currentProfile.id, profileName: currentProfile.name, rewardTitle: reward.title, cost: reward.cost, status: 'pending', timestamp: serverTimestamp() }); };
  const handleRequestDecision = async (req: any, approved: boolean) => { const path = ['artifacts', appId, 'public', 'data']; if (approved) { const p = profiles.find(prof => prof.id === req.profileId); if (p && p.points >= req.cost) { await updateDoc(doc(db, ...path, 'profiles', req.profileId), { points: p.points - req.cost }); await updateDoc(doc(db, ...path, 'requests', req.id), { status: 'approved' }); } else alert("Brak punktów!"); } else { await updateDoc(doc(db, ...path, 'requests', req.id), { status: 'rejected' }); } };
  
  const modifyPoints = async (pid: string, amount: number) => { 
    if (isNaN(amount)) return; 
    const p = profiles.find(pr => pr.id === pid); 
    if (p) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', pid), { points: Math.max(0, p.points + amount) }); setManualPoints(''); }
  };
  const resetTimers = async (pid: string) => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', pid), { soccerUnlockDate: '', soccerUnlockTime: null, gameUnlockDate: '', gameUnlockTime: null }); alert("Zresetowano czasy gier!"); };
  
  // Check Access logic
  const checkTimeAccess = async (type: 'soccer' | 'game') => { 
    if (!currentProfile) return; 
    const path = ['artifacts', appId, 'public', 'data']; 
    const now = Date.now(); 
    const today = formatDate(new Date()); 
    const unlockDateKey = type === 'soccer' ? 'soccerUnlockDate' : 'gameUnlockDate'; 
    const unlockTimeKey = type === 'soccer' ? 'soccerUnlockTime' : 'gameUnlockTime'; 
    
    // If not unlocked today, unlock it now
    if (currentProfile[unlockDateKey] !== today) { 
        await updateDoc(doc(db, ...path, 'profiles', currentProfile.id), { [unlockDateKey]: today, [unlockTimeKey]: now }); 
    } 
    setTab(type); 
  };
  
  // Custom URL save
  const saveThresholds = (s: string, g: string) => {
     setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), { soccerThreshold: parseInt(s), gameThreshold: parseInt(g) }, {merge:true});
     alert('Zapisano progi!');
  };
  
  // Add Reward
  const addReward = async () => {
    if (!newRewardTitle || !newRewardCost) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'rewards'), { title: newRewardTitle, cost: parseInt(newRewardCost), icon: newRewardIcon });
    setNewRewardTitle(''); setNewRewardCost('');
  };
  const deleteReward = async (id: string) => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rewards', id)); };

  const addEvent = async (date: string, title: string) => { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { date, title, author: currentProfile?.name }); };
  const toggleOverride = async (date: string) => { const exists = overrides.find((o:any) => o.id === date); if (exists) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'overrides', date)); else await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'overrides', date), { type: 'off' }); };
  const startDinnerPoll = async () => { if (selectedDinnerOptions.length < 1) { alert("Wybierz dania!"); return; } const options = selectedDinnerOptions.map(optId => ({ optionId: optId, votes: [] })); await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'dinner', 'today'), { date: todayStr, isActive: true, options }); alert("Wysłano!"); setSelectedDinnerOptions([]); };
  const voteDinner = async (optionId: string) => { if (!dinnerPoll || !currentProfile) return; const newOptions = dinnerPoll.options.map((opt:any) => ({ ...opt, votes: opt.votes.filter((vid:string) => vid !== currentProfile.id) })); const targetOpt = newOptions.find((o:any) => o.optionId === optionId); if (targetOpt) targetOpt.votes.push(currentProfile.id); await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'dinner', 'today'), { ...dinnerPoll, options: newOptions }); };
  const addNote = async (content: string, target: string) => { const name = currentProfile?.name || 'Ktoś'; const avatar = currentProfile?.avatar || '❓'; if (!content) return; const colors = ['bg-yellow-100', 'bg-blue-100', 'bg-pink-100', 'bg-green-100']; await setDoc(doc(collection(db, 'artifacts', appId, 'public', 'data', 'notes')), { authorName: name, authorAvatar: avatar, content, target, timestamp: serverTimestamp(), color: colors[Math.floor(Math.random() * colors.length)] }); };
  const addParentTodo = async () => { if(!parentTodoInput) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'parentTodos'), { text: parentTodoInput, isDone: false }); setParentTodoInput(''); };
  const toggleParentTodo = async (id: string, current: boolean) => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parentTodos', id), { isDone: !current }); };
  const deleteParentTodo = async (id: string) => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parentTodos', id)); };

  if (errorMessage) return <div className="p-10 text-red-500 font-bold">Błąd: {errorMessage}</div>;

  return (
    <>
      <ConfirmModal isOpen={confirmModal.isOpen} message={confirmModal.message} onConfirm={() => { confirmModal.action(); setConfirmModal({...confirmModal, isOpen: false}); }} onCancel={() => setConfirmModal({...confirmModal, isOpen: false})} />
      
      {/* --- EKRAN STARTOWY --- */}
      {view === 'select' && (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center relative">
          {/* Notes display */}
          {notes.filter((n:any) => n.target === 'all').length > 0 && (<div className="absolute top-6 w-full max-w-md bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-r-xl shadow-lg animate-in slide-in-from-top-4 z-20"><div className="flex justify-between items-start"><div className="flex gap-2 items-start"><FileText className="w-5 h-5 text-yellow-700 mt-1 shrink-0" /><div><p className="text-xs font-bold text-yellow-600 uppercase">Od: {notes.filter((n:any) => n.target === 'all')[0].authorName}</p><p className="font-medium text-yellow-900">{notes.filter((n:any) => n.target === 'all')[0].content}</p></div></div><button onClick={() => deleteDoc(doc(db,'artifacts',appId,'public','data','notes',notes.filter((n:any) => n.target === 'all')[0].id))} className="text-yellow-600 hover:text-red-500 p-1"><XIcon className="w-5 h-5"/></button></div></div>)}
          
          {isPinModalOpen && <PinPad onSuccess={() => { setView('dashboard'); setIsPinModalOpen(false); }} onCancel={() => setIsPinModalOpen(false)} />}
          
          <h1 className="text-3xl font-black text-slate-800 mb-8 mt-12">Rodzinka Hero</h1>
          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            {profiles.map(p => (
              <button key={p.id} onClick={() => { setCurrentProfile(p); if(p.isParent) setIsPinModalOpen(true); else { setTab('tasks'); setView('dashboard'); }}} className="relative bg-white p-4 rounded-3xl shadow-lg border-4 transition-transform active:scale-95 flex flex-col items-center border-slate-100">
                {p.isParent && totalPending > 0 && <div className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold animate-bounce shadow-md z-10">{totalPending}</div>}
                <div className="text-5xl mb-2">{p.avatar}</div>
                <span className="text-lg font-bold text-slate-700">{p.name}</span>
                {!p.isParent && <div className="mt-1 bg-yellow-400 text-white px-3 py-0.5 rounded-full text-xs font-black shadow-sm">{p.points} pkt</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- DASHBOARD --- */}
      {view === 'dashboard' && currentProfile && (
        <div className="min-h-screen bg-slate-50 pb-28">
           {selectedDate && <DayModal date={selectedDate} events={events} shift={getShiftForDate(selectedDate, settings.shiftRefDate)} isOverride={overrides.some((o:any) => o.id === formatDate(selectedDate))} onClose={() => setSelectedDate(null)} onAddEvent={addEvent} onToggleOverride={toggleOverride} />}
           <div className="bg-white px-6 pt-10 pb-6 rounded-b-[2.5rem] shadow-sm flex justify-between items-center sticky top-0 z-20">
              <div className="flex items-center gap-3"><div className="text-4xl">{currentProfile.avatar}</div><div><h2 className="text-xl font-black text-slate-800">{currentProfile.name}</h2><div className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg inline-block">Dziś: {getDailyScore(currentProfile.id)} pkt</div></div></div>
              <div className="flex items-center gap-2">
                 {/* TIMER DISPLAY */}
                 {tab === 'soccer' && currentProfile.soccerUnlockTime && (
                   <CountdownTimer unlockTime={currentProfile.soccerUnlockTime} />
                 )}
                 {tab === 'game' && currentProfile.gameUnlockTime && (
                   <CountdownTimer unlockTime={currentProfile.gameUnlockTime} />
                 )}

                 {currentProfile.isParent && <button onClick={() => setView('parent')} className="bg-slate-800 text-white p-3 rounded-2xl shadow-lg relative"><Settings className="w-6 h-6"/>{totalPending > 0 && <div className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold">{totalPending}</div>}</button>}
                 <div className="bg-slate-900 px-4 py-2 rounded-2xl shadow-lg text-white flex flex-col items-center"><span className="text-[8px] font-bold uppercase opacity-60">Skarbonka</span><span className="text-xl font-black text-yellow-400">{currentProfile.points}</span></div>
              </div>
           </div>

           <div className="p-5">
              {tab === 'tasks' && (
                <div className="space-y-4 animate-in fade-in">
                   <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide mb-2">
                      <WeatherWidget />
                      <button onClick={() => { if (getDailyScore(currentProfile.id) >= soccerLimit || currentProfile.isParent) checkTimeAccess('soccer'); else alert(`Wymagane ${soccerLimit} pkt DZIŚ!`); }} className={`p-4 rounded-3xl min-w-[130px] relative overflow-hidden shrink-0 text-left shadow-sm transition-all ${getDailyScore(currentProfile.id) >= soccerLimit || currentProfile.isParent ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'}`}><span className="font-bold z-10 block relative text-sm">Meczyki.pl</span>{(canAccessSoccer) ? (<><span className="text-xs font-medium opacity-80 z-10 relative block">Wejdź (15 min)</span><Trophy className="absolute -right-4 -bottom-4 w-20 h-20 text-green-400 opacity-50"/></>) : (<><span className="text-xs font-bold z-10 relative block mt-1 flex items-center gap-1"><Lock className="w-3 h-3"/> {getDailyScore(currentProfile.id)}/{soccerLimit} dziś</span><Lock className="absolute -right-2 -bottom-2 w-16 h-16 text-slate-300 opacity-20" /></>)}</button>
                      <button onClick={() => { if (getDailyScore(currentProfile.id) >= gameLimit || currentProfile.isParent) checkTimeAccess('game'); else alert(`Wymagane ${gameLimit} pkt DZIŚ!`); }} className={`p-4 rounded-3xl min-w-[130px] relative overflow-hidden shrink-0 text-left shadow-sm transition-all ${getDailyScore(currentProfile.id) >= gameLimit || currentProfile.isParent ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-400'}`}><span className="font-bold z-10 block relative text-sm">Gierka</span>{(canAccessGame) ? (<><span className="text-xs font-medium opacity-80 z-10 relative block">Graj (15 min)</span><Puzzle className="absolute -right-4 -bottom-4 w-20 h-20 text-purple-400 opacity-50"/></>) : (<><span className="text-xs font-bold z-10 relative block mt-1 flex items-center gap-1"><Lock className="w-3 h-3"/> {getDailyScore(currentProfile.id)}/{gameLimit} dziś</span><Lock className="absolute -right-2 -bottom-2 w-16 h-16 text-slate-300 opacity-20" /></>)}</button>
                   </div>
                   
                   {/* TASK LIST - HIDE FOR PARENTS */}
                   {!currentProfile.isParent ? (
                     <>
                       <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-2 ml-2">Do zrobienia</h3>
                       {tasks.filter(t => { 
                          const isForMe = !t.assignedTo || t.assignedTo.length === 0 || t.assignedTo.includes(currentProfile.id);
                          if (!isForMe) return false;
                          if (t.type === 'once') return t.date === todayStr;
                          return true;
                       }).map(task => {
                          const action = todayActions.find(a => a.taskId === task.id && a.profileId === currentProfile.id);
                          const isApproved = action?.status === 'approved';
                          const isPending = action?.status === 'pending';
                          return (
                            <button key={task.id} onClick={() => toggleTask(task)} className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all border-b-4 text-left relative overflow-hidden ${isApproved ? 'bg-emerald-50 border-emerald-200 opacity-75' : isPending ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                               <div className="text-4xl">{task.icon}</div>
                               <div className="flex-1"><div className={`font-bold text-xl ${isApproved ? 'line-through text-emerald-800' : 'text-slate-700'}`}>{task.title}</div>{!action && <span className="text-blue-500 font-bold text-sm">+{task.points} pkt</span>}{isPending && <span className="text-orange-500 text-xs font-bold flex gap-1 items-center"><Hourglass className="w-3 h-3"/> Czeka</span>}</div>
                               <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${isApproved ? 'bg-emerald-500 border-emerald-500' : isPending ? 'bg-orange-400 border-orange-400' : 'border-slate-200'}`}>{isApproved ? <CheckCircle2 className="w-5 h-5 text-white"/> : isPending ? <Hourglass className="w-4 h-4 text-white"/> : null}</div>
                            </button>
                          )
                       })}
                     </>
                   ) : (
                     <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mt-4">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ClipboardList className="text-blue-500"/> Lista Spraw Rodziców</h3>
                        <div className="flex gap-2 mb-4">
                           <input value={parentTodoInput} onChange={e=>setParentTodoInput(e.target.value)} placeholder="Dodaj sprawę..." className="flex-1 bg-slate-50 p-3 rounded-xl text-sm"/>
                           <button onClick={addParentTodo} className="bg-blue-600 text-white px-4 rounded-xl font-bold">+</button>
                        </div>
                        <div className="space-y-2">
                           {parentTodos.map(todo => (
                             <div key={todo.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                <span className={todo.isDone ? 'line-through text-slate-400' : 'text-slate-700 font-bold'}>{todo.text}</span>
                                <div className="flex gap-2">
                                   <button onClick={() => toggleParentTodo(todo.id, todo.isDone)} className={`p-2 rounded-lg ${todo.isDone ? 'bg-slate-200' : 'bg-green-100 text-green-600'}`}><Check/></button>
                                   <button onClick={() => deleteParentTodo(todo.id)} className="p-2 text-red-400"><Trash2/></button>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
              )}
              {/* OTHER TABS */}
              {tab === 'calendar' && <div className="h-full"><FirefighterCalendar shiftRefDate={settings.shiftRefDate} events={events} overrides={overrides} onDayClick={currentProfile.isParent ? setSelectedDate : undefined} /></div>}
              {tab === 'game' && <div className="h-[70vh] rounded-3xl overflow-hidden shadow-sm"><iframe src={currentProfile.name.includes('Kostek') ? KOSTEK_GAME_URL : (settings.gameUrl || DEFAULT_GAME_URL)} className="w-full h-full border-none" title="Game"/></div>}
              {tab === 'soccer' && <div className="h-[70vh] rounded-3xl overflow-hidden shadow-sm"><iframe src={settings.soccerWidgetUrl || DEFAULT_SOCCER_URL} className="w-full h-full border-none" title="Soccer"/></div>}
              {tab === 'rewards' && (<div className="space-y-6 animate-in fade-in"><div className="bg-slate-800 text-white p-6 rounded-3xl shadow-lg"><h3 className="font-bold flex items-center gap-2 mb-4"><Gamepad2 className="text-purple-400" /> Sklepik (z Tygodniowych)</h3><div className="grid grid-cols-2 gap-3">{rewards.map(r => (<button key={r.id} onClick={() => requestReward(r)} disabled={currentProfile.points < r.cost} className={`p-3 rounded-xl bg-slate-700 border-2 border-slate-600 relative overflow-hidden ${currentProfile.points < r.cost ? 'opacity-50 grayscale' : 'hover:bg-slate-600 hover:border-purple-500'}`}><div className="text-3xl mb-2">{r.icon}</div><div className="font-bold text-sm mb-1">{r.title}</div><div className="text-xs font-bold text-yellow-400 mb-2">{r.cost} pkt</div>{currentProfile.points >= r.cost && <div className="bg-green-500 text-white text-xs font-bold py-1 px-2 rounded-lg w-full">KUP</div>}</button>))}</div></div>{requests.filter(r => r.profileId === currentProfile.id && r.status !== 'rejected').length > 0 && (<div className="space-y-2"><h3 className="font-bold text-slate-400 text-xs ml-2">STATUS</h3>{requests.filter(r => r.profileId === currentProfile.id && r.status !== 'rejected').map(req => (<div key={req.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center text-sm"><span className="font-bold text-slate-700">{req.rewardTitle}</span>{req.status === 'pending' ? <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-bold">Czekaj...</span> : <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-bold">Zgoda!</span>}</div>))}</div>)}</div>)}
              {tab === 'shop' && (<div className="animate-in fade-in bg-yellow-50 p-5 rounded-3xl border border-yellow-100 min-h-[60vh]"><h3 className="font-black text-yellow-800 text-lg mb-4 flex items-center gap-2"><ShoppingCart /> Zakupy</h3><div className="flex gap-2 mb-4"><button onClick={shopVoice.startListening} className={`p-3 rounded-xl shadow-sm ${shopVoice.isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-500'}`}><Mic/></button><input id="shopInp" className="flex-1 p-3 rounded-xl border-none shadow-sm" placeholder="Mów lub pisz..." /><button onClick={()=>{const el = document.getElementById('shopInp') as HTMLInputElement; if(el.value) {setDoc(doc(collection(db,'artifacts',appId,'public','data','shopping')),{name:el.value,isBought:false}); el.value='';}}} className="bg-yellow-400 text-yellow-900 px-4 rounded-xl font-bold">+</button></div><div className="space-y-2">{shoppingList.map(item => (<div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm"><button onClick={() => deleteDoc(doc(db,'artifacts',appId,'public','data','shopping',item.id))} className="text-slate-300 hover:text-red-400"><XIcon className="w-4 h-4"/></button><span className="font-bold text-slate-700">{item.name}</span></div>))}</div></div>)}
              {tab === 'notes' && (<div className="animate-in fade-in">{currentProfile.isParent && (<div className="bg-white p-4 rounded-3xl shadow-sm mb-4 border border-slate-200"><textarea id="noteInp" value={noteVoice.transcript} onChange={e=>noteVoice.setTranscript(e.target.value)} placeholder="Wiadomość..." className="w-full h-20 p-3 bg-slate-50 rounded-xl mb-3 resize-none border-none"/><div className="flex justify-between"><button onClick={noteVoice.startListening} className={`px-4 py-2 rounded-xl font-bold flex gap-2 ${noteVoice.isListening ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{noteVoice.isListening ? <MicOff className="w-4 h-4"/> : <Mic className="w-4 h-4"/>} Dyktuj</button><button onClick={()=>{addNote(noteVoice.transcript, 'all'); noteVoice.setTranscript('')}} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex gap-2"><Send className="w-4 h-4"/> Wyślij</button></div></div>)}{notes.filter((n:any) => n.target === 'all' || n.target === currentProfile.id).length === 0 && <p className="text-center text-slate-400 mt-10">Brak wiadomości.</p>}<div className="grid grid-cols-2 gap-3">{notes.filter((n:any) => n.target === 'all' || n.target === currentProfile.id).map((n:any) => (<div key={n.id} className={`${n.color} p-4 rounded-2xl shadow-sm relative`}><div className="flex justify-between items-start mb-2"><div className="flex items-center gap-2 opacity-70"><span className="text-lg">{n.authorAvatar}</span><span className="text-xs font-bold uppercase">{n.authorName}</span></div>{currentProfile.isParent && <button onClick={() => deleteDoc(doc(db,'artifacts',appId,'public','data','notes',n.id))} className="text-black/20 hover:text-red-500"><XIcon className="w-4 h-4"/></button>}</div><p className="font-bold text-slate-800 text-sm break-words">{n.content}</p></div>))}</div></div>)}
              {tab === 'dinner' && (<div className="animate-in fade-in p-2">{dinnerPoll && dinnerPoll.isActive && dinnerPoll.date === todayStr ? (<><h3 className="font-black text-center text-2xl text-slate-700 mb-6">Co jemy na obiad? 😋</h3><div className="grid grid-cols-2 gap-4">{dinnerPoll.options.map((opt:any) => { const meta = dinnerOptionsList.find(o => o.id === opt.optionId); const votes = opt.votes.map((vid:string) => profiles.find((p:any) => p.id===vid)?.avatar).filter(Boolean); const isSelected = opt.votes.includes(currentProfile.id); return (<button key={opt.optionId} onClick={() => voteDinner(opt.optionId)} className={`p-6 rounded-3xl border-4 transition-all relative ${isSelected ? 'border-orange-400 bg-orange-50' : 'border-slate-100 bg-white'}`}><div className="text-6xl mb-2">{meta?.icon}</div><div className="font-bold text-slate-700">{meta?.name}</div><div className="flex gap-1 mt-3 justify-center min-h-[30px]">{votes.map((v:string, i:number) => <span key={i} className="text-xl drop-shadow-sm">{v}</span>)}</div></button>)})}</div></>) : (<div className="text-center mt-20"><Utensils className="w-20 h-20 text-slate-200 mx-auto mb-4"/><p className="text-slate-400 font-bold">Rodzice jeszcze nie dodali ankiety.</p></div>)}</div>)}
           </div>

           <div className="fixed bottom-6 left-4 right-4 bg-white/95 backdrop-blur-md rounded-full shadow-2xl p-2 flex justify-between items-center border border-slate-200 z-30 overflow-x-auto">
             <button onClick={() => setView('select')} className="w-12 h-12 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-full shrink-0"><LogOut className="w-5 h-5" /></button>
             <div className="flex gap-1">
               <button onClick={() => setTab('tasks')} className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tab==='tasks'?'bg-blue-600 text-white':'text-slate-400'}`}><CheckCircle2 className="w-6 h-6"/></button>
               <button onClick={() => setTab('shop')} className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tab==='shop'?'bg-yellow-500 text-white':'text-slate-400'}`}><ShoppingCart className="w-6 h-6"/></button>
               <button onClick={() => setTab('notes')} className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tab==='notes'?'bg-pink-500 text-white':'text-slate-400'}`}><FileText className="w-6 h-6"/></button>
               <button onClick={() => setTab('dinner')} className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tab==='dinner'?'bg-orange-500 text-white':'text-slate-400'}`}><Utensils className="w-6 h-6"/></button>
               <button onClick={() => { if(canAccessSoccer) checkTimeAccess('soccer'); else alert(`Wymagane ${soccerLimit} pkt DZIŚ!`); }} className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tab==='soccer'?'bg-green-600 text-white':'text-slate-400'}`}><Trophy className="w-6 h-6"/></button>
               <button onClick={() => { if(canAccessGame) checkTimeAccess('game'); else alert(`Wymagane ${gameLimit} pkt DZIŚ!`); }} className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tab==='game'?'bg-purple-600 text-white':'text-slate-400'}`}><Puzzle className="w-6 h-6"/></button>
               <button onClick={() => setTab('calendar')} className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tab==='calendar'?'bg-indigo-600 text-white':'text-slate-400'}`}><CalendarIcon className="w-6 h-6"/></button>
               <button onClick={() => setTab('rewards')} className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tab==='rewards'?'bg-purple-600 text-white':'text-slate-400'}`}><Gamepad2 className="w-6 h-6"/></button>
             </div>
             <div className="w-4 shrink-0"></div>
           </div>
        </div>
      )}

      {view === 'parent' && (
        <div className="min-h-screen bg-slate-100 p-4 pb-20">
           <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-100 z-10 py-2"><h1 className="text-xl font-black text-slate-800 flex items-center gap-2"><Settings className="w-6 h-6"/> Panel Rodzica</h1><button onClick={() => setView('dashboard')} className="px-4 py-2 bg-white rounded-xl font-bold text-slate-600 shadow-sm flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Wróć</button></div>
           
           {/* THRESHOLDS CONFIG */}
           <div className="bg-white p-4 rounded-3xl shadow-sm mb-6 border border-slate-200">
             <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-500" /> Ustawienia Progów Punktowych</h2>
             <div className="flex gap-4">
                <div className="flex-1">
                   <label className="text-xs font-bold uppercase text-slate-500">Meczyki (pkt)</label>
                   <input type="number" defaultValue={settings.soccerThreshold || 30} id="setSoccer" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-center"/>
                </div>
                <div className="flex-1">
                   <label className="text-xs font-bold uppercase text-slate-500">Gierka (pkt)</label>
                   <input type="number" defaultValue={settings.gameThreshold || 50} id="setGame" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-center"/>
                </div>
             </div>
             <button onClick={() => saveThresholds((document.getElementById('setSoccer') as HTMLInputElement).value, (document.getElementById('setGame') as HTMLInputElement).value)} className="w-full mt-4 py-2 bg-blue-100 text-blue-600 font-bold rounded-lg text-xs">Zapisz Progi</button>
           </div>

           {/* REWARD CONFIG */}
           <div className="bg-white p-4 rounded-3xl shadow-sm mb-6 border border-slate-200">
             <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Gift className="w-5 h-5 text-purple-500" /> Zarządzanie Sklepikiem</h2>
             <div className="flex gap-2 mb-4 bg-slate-50 p-2 rounded-xl">
               <select onChange={(e) => setNewRewardIcon(e.target.value)} value={newRewardIcon} className="text-2xl bg-transparent border-none outline-none">{rewardIcons.map(i => <option key={i} value={i}>{i}</option>)}</select>
               <input placeholder="Nazwa" value={newRewardTitle} onChange={e=>setNewRewardTitle(e.target.value)} className="flex-1 bg-transparent text-sm outline-none font-bold text-slate-700"/>
               <input placeholder="Koszt" type="number" value={newRewardCost} onChange={e=>setNewRewardCost(e.target.value)} className="w-12 bg-transparent text-sm outline-none text-center"/>
               <button onClick={addReward} className="bg-blue-600 text-white rounded-lg px-3 font-bold">+</button>
             </div>
             <div className="space-y-2">{rewards.map(r => (<div key={r.id} className="flex justify-between items-center p-2 border-b border-slate-100 last:border-0"><div className="flex items-center gap-2"><span className="text-2xl">{r.icon}</span><span className="font-bold text-sm">{r.title} ({r.cost} pkt)</span></div><button onClick={() => handleConfirm(`Usunąć ${r.title}?`, () => deleteReward(r.id))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div>))}</div>
           </div>

           <div className="bg-white p-4 rounded-3xl shadow-sm mb-6 border border-slate-200">
             <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> Zarządzanie Rodziną</h2>
             <div className="flex gap-2 mb-4 bg-slate-50 p-2 rounded-xl"><select onChange={(e) => setNewProfileAvatar(e.target.value)} value={newProfileAvatar} className="text-2xl bg-transparent border-none outline-none">{avatarOptions.map(a => <option key={a} value={a}>{a}</option>)}</select><input placeholder="Imię" value={newProfileName} onChange={e=>setNewProfileName(e.target.value)} className="flex-1 bg-transparent text-sm outline-none font-bold text-slate-700"/><input placeholder="Wiek" type="number" value={newProfileAge} onChange={e=>setNewProfileAge(e.target.value)} className="w-12 bg-transparent text-sm outline-none text-center"/><button onClick={addProfile} className="bg-blue-600 text-white rounded-lg px-3 font-bold">+</button></div>
             <div className="space-y-2">{profiles.map(p => (<div key={p.id} className="flex justify-between items-center p-2 border-b border-slate-100 last:border-0"><div className="flex items-center gap-2"><span className="text-2xl">{p.avatar}</span><span className="font-bold text-sm">{p.name}</span></div>{p.id !== currentProfile?.id && (<button onClick={() => handleConfirm(`Usunąć ${p.name}?`, () => deleteProfile(p.id))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>)}</div>))}</div>
           </div>

           {todayActions.filter(a => a.status === 'pending').length > 0 && (<div className="bg-white p-4 rounded-3xl shadow-sm border-l-4 border-orange-500 mb-6"><h2 className="font-bold text-orange-600 mb-3 flex items-center gap-2"><Hourglass className="w-4 h-4"/> Zatwierdź Wykonanie Zadań</h2>{todayActions.filter(a => a.status === 'pending').map(act => { const task = tasks.find(t => t.id === act.taskId); const kid = profiles.find(p => p.id === act.profileId); return (<div key={act.id} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center mb-2"><div className="flex items-center gap-2"><span className="text-2xl">{kid?.avatar}</span><div><div className="font-black text-sm">{kid?.name}</div><div className="text-xs">{task?.title || 'Zadanie'} (+{act.pointsSnapshot})</div></div></div><div className="flex gap-2"><button onClick={()=>handleConfirm("Odrzucić?", () => rejectAction(act))} className="p-2 bg-slate-200 rounded-lg text-red-500"><XIcon className="w-4 h-4"/></button><button onClick={()=>approveAction(act)} className="px-4 py-2 bg-green-100 text-green-500 rounded-lg"><Check/></button></div></div>); })}</div>)}
           {requests.filter(r => r.status === 'pending').length > 0 && (<div className="bg-white p-4 rounded-3xl shadow-sm border-l-4 border-red-500 mb-6"><h2 className="font-bold text-red-600 mb-3 flex items-center gap-2"><Bell className="w-4 h-4"/> Prośby o Nagrody</h2>{requests.filter(r => r.status === 'pending').map(req => (<div key={req.id} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center mb-2"><div><div className="font-black">{req.profileName}</div><div className="text-xs">Chce: {req.rewardTitle}</div></div><div className="flex gap-2"><button onClick={()=>handleConfirm("Odrzucić?", () => handleRequestDecision(req, false))} className="p-2 bg-slate-200 rounded-lg"><XIcon className="w-4 h-4"/></button><button onClick={()=>handleRequestDecision(req, true)} className="p-2 bg-green-500 text-white rounded-lg font-bold">OK</button></div></div>))}</div>)}

           <div className="bg-white p-4 rounded-3xl shadow-sm mb-6"><h2 className="font-bold text-slate-700 mb-4">Korekta Punktów</h2><div className="flex gap-2 mb-4"><input type="number" placeholder="Ile pkt? (np. 50)" value={manualPoints} onChange={(e) => setManualPoints(e.target.value)} className="flex-1 p-2 bg-slate-50 rounded-xl text-center font-bold"/></div><div className="space-y-2">{profiles.filter(p => !p.isParent).map(p => (<div key={p.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl"><div className="flex flex-col"><span className="font-bold text-sm w-20">{p.name}</span><span className="text-[10px] text-slate-400">{p.soccerUnlockDate === todayStr ? '⏳ Grał' : 'Dostępne'}</span></div><span className="font-black text-yellow-600">{p.points}</span><div className="flex gap-1"><button onClick={() => modifyPoints(p.id, parseInt(manualPoints))} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-bold"><Plus className="w-4 h-4"/></button><button onClick={() => modifyPoints(p.id, -parseInt(manualPoints))} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-bold"><Minus className="w-4 h-4"/></button><button onClick={()=>handleConfirm('Zresetować liczniki czasu?', () => resetTimers(p.id))} className="px-2 py-1 bg-blue-100 text-blue-600 rounded-lg flex items-center gap-1 text-[10px] font-bold"><RotateCcw className="w-3 h-3"/> Zegar</button></div></div>))}</div></div>
           
           <div className="bg-white p-4 rounded-3xl shadow-sm mb-6"><h2 className="font-bold text-slate-700 mb-4">Ustawienia Linków</h2>
             <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center"><label className="text-xs font-bold w-16">Meczyki:</label><input className="flex-1 bg-slate-50 p-2 rounded text-xs" defaultValue={settings.soccerWidgetUrl || DEFAULT_SOCCER_URL} id="urlSoccer" /></div>
                <div className="flex gap-2 items-center"><label className="text-xs font-bold w-16">Gierka:</label><input className="flex-1 bg-slate-50 p-2 rounded text-xs" defaultValue={settings.gameUrl || DEFAULT_GAME_URL} id="urlGame" /></div>
                <button onClick={() => { 
                   const sUrl = (document.getElementById('urlSoccer') as HTMLInputElement).value;
                   const gUrl = (document.getElementById('urlGame') as HTMLInputElement).value;
                   setDoc(doc(db,'artifacts',appId,'public','data','settings','config'), { soccerWidgetUrl: sUrl, gameUrl: gUrl }, {merge:true});
                   alert('Zapisano!');
                }} className="w-full py-2 bg-blue-100 text-blue-600 font-bold rounded-lg text-xs">Zapisz Linki</button>
             </div>
           </div>

           <div className="bg-white p-4 rounded-3xl shadow-sm mb-6 border border-orange-200"><h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Utensils className="w-5 h-5 text-orange-500" /> Ankieta Obiadowa</h2><div className="grid grid-cols-4 gap-2 mb-4">{dinnerOptionsList.map(opt => (<button key={opt.id} onClick={() => setSelectedDinnerOptions(prev => prev.includes(opt.id) ? prev.filter(id=>id!==opt.id) : [...prev, opt.id])} className={`p-2 rounded-xl text-2xl border-2 transition-all ${selectedDinnerOptions.includes(opt.id) ? 'bg-orange-100 border-orange-400' : 'bg-slate-50 border-transparent'}`}>{opt.icon}</button>))}</div><button onClick={startDinnerPoll} className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-200">Rozpocznij Głosowanie ({selectedDinnerOptions.length})</button></div>
           
           <div className="bg-white p-4 rounded-3xl shadow-sm mb-6 border border-red-200"><h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-red-500" /> Służba Taty</h2><div className="flex justify-between items-center bg-red-50 p-3 rounded-xl mb-3"><span className="text-sm font-bold text-red-900">Stan na dziś:</span><span className="font-black text-xl text-red-600">{getShiftForDate(new Date(), settings.shiftRefDate || '') === 'A' ? 'SŁUŻBA (I)' : 'WOLNE'}</span></div><button onClick={() => handleConfirm("Ustawić dziś jako Twoją służbę?", () => { setDoc(doc(db,'artifacts',appId,'public','data','settings','config'), { shiftRefDate: todayStr }, {merge:true}); alert('Skalibrowano!'); })} className="w-full py-2 bg-white border border-red-200 text-red-500 font-bold rounded-xl text-sm">Kalibruj: Dziś jest moja służba</button></div>
           
           <div className="bg-white p-4 rounded-3xl shadow-sm mb-6 border border-yellow-200"><h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-yellow-500"/> Wspólne Zakupy</h2><div className="flex gap-2 mb-4"><input id="parentShopInp" className="flex-1 p-2 bg-slate-50 rounded-lg text-sm" placeholder="Dodaj coś..." /><button onClick={()=>{ const el = document.getElementById('parentShopInp') as HTMLInputElement; if(el.value){ setDoc(doc(collection(db,'artifacts',appId,'public','data','shopping')),{name:el.value,isBought:false}); el.value=''; } }} className="bg-yellow-500 text-white px-3 rounded-lg font-bold">+</button></div><div className="space-y-2">{shoppingList.map(item => (<div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl"><button onClick={() => deleteDoc(doc(db,'artifacts',appId,'public','data','shopping',item.id))} className="text-slate-400 hover:text-green-500"><Check className="w-5 h-5"/></button><span className="font-bold text-slate-700">{item.name}</span></div>))}</div></div>
           
           {/* Settings & Add Task - kept same as before */}
           <div className="bg-white p-4 rounded-3xl shadow-sm mb-6"><h2 className="font-bold text-slate-700 mb-4">Dodaj Zadanie</h2><div className="flex flex-col gap-2"><input id="taskTitle" placeholder="Nazwa" className="p-3 bg-slate-50 rounded-xl text-sm"/><div className="flex gap-2"><input id="taskPts" type="number" defaultValue="5" className="w-16 p-3 bg-slate-50 rounded-xl text-center"/><select id="taskIcon" className="flex-1 p-3 bg-slate-50 rounded-xl">{iconOptions.map(o => <option key={o.value} value={o.value}>{o.value} {o.label}</option>)}</select></div><div className="flex gap-2 my-1"><button onClick={() => setNewTaskType('daily')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${newTaskType==='daily' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400'}`}><Repeat className="w-3 h-3 inline mr-1"/> Codzienne</button><button onClick={() => setNewTaskType('once')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${newTaskType==='once' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-400'}`}><CalendarDays className="w-3 h-3 inline mr-1"/> Tylko Dziś</button></div><div className="flex flex-wrap gap-2 mt-1"><span className="text-xs font-bold uppercase text-slate-400 w-full">Dla kogo?</span>{profiles.map(p => (<button key={p.id} onClick={() => setSelectedForTask(prev => prev.includes(p.id) ? prev.filter(id=>id!==p.id) : [...prev, p.id])} className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedForTask.includes(p.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>{p.name}</button>))}</div><button onClick={async ()=>{ const t = document.getElementById('taskTitle') as HTMLInputElement; const p = document.getElementById('taskPts') as HTMLInputElement; const i = document.getElementById('taskIcon') as HTMLSelectElement; if(t.value) { await setDoc(doc(collection(db,'artifacts',appId,'public','data','tasks')),{ title:t.value, points:parseInt(p.value), icon:i.value, assignedTo: selectedForTask, type: newTaskType, date: newTaskType === 'once' ? todayStr : null }); t.value=''; setSelectedForTask([]); } }} className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold mt-2">+ Dodaj Zadanie</button></div></div>

           <button onClick={() => handleConfirm("Zresetować bazę i naprawić duplikaty?", seedDatabase)} className="w-full py-4 bg-slate-200 text-slate-500 font-bold rounded-xl flex items-center justify-center gap-2 mb-10"><RefreshCw className="w-4 h-4"/> 🧹 Wyczyść i Napraw Bazę</button>
        </div>
      )}
    </>
  );
}