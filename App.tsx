import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TimerStatus, UserSettings, EyeTip } from './types';

// Consejos locales para evitar el uso de IA y ahorrar tokens
const LOCAL_TIPS: EyeTip[] = [
  { title: "Regla 20-20-20", description: "Cada 20 minutos, mira algo a 6 metros durante 20 segundos." },
  { title: "Parpadeo consciente", description: "Intenta parpadear más seguido para mantener tus ojos hidratados." },
  { title: "Brillo de pantalla", description: "Ajusta el brillo de tu monitor para que coincida con la luz de tu habitación." },
  { title: "Distancia adecuada", description: "Mantén tu pantalla a unos 50-60 cm de distancia de tus ojos." }
];

const App: React.FC = () => {
  const [status, setStatus] = useState<TimerStatus>(TimerStatus.IDLE);
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('visionSanaSettings');
    return saved ? JSON.parse(saved) : {
      workDuration: 20,
      breakDuration: 1,
      notificationsEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true
    };
  });
  
  const [currentTip, setCurrentTip] = useState<EyeTip | null>(LOCAL_TIPS[0]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBlobUrl, setIsBlobUrl] = useState(false);
  const timerRef = useRef<any>(null);

  // Función local para cambiar el consejo sin usar IA
  const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * LOCAL_TIPS.length);
    setCurrentTip(LOCAL_TIPS[randomIndex]);
  };

  useEffect(() => {
    if (window.location.href.startsWith('blob:')) {
      setIsBlobUrl(true);
    }
  }, []);

  const getCleanUrl = () => {
    if (window.location.href.startsWith('blob:')) return "URL_TEMPORAL_DETECTADA";
    return window.location.href.split('?')[0].split('#')[0];
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(getCleanUrl())}&bgcolor=0f172a&color=ffffff`;

  useEffect(() => {
    localStorage.setItem('visionSanaSettings', JSON.stringify(settings));
    if (status === TimerStatus.IDLE) {
      setTimeLeft(settings.workDuration * 60);
    }
  }, [settings, status]);

  const notifyUser = useCallback((title: string, body: string) => {
    if (settings.notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "https://cdn-icons-png.flaticon.com/512/2855/2855523.png" });
    }
    if (settings.soundEnabled) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    }
    if (settings.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [settings]);

  const startTimer = () => setStatus(TimerStatus.RUNNING);
  const stopTimer = () => setStatus(TimerStatus.IDLE);

  useEffect(() => {
    getRandomTip();
    if ("Notification" in window) Notification.requestPermission();
  }, []);

  useEffect(() => {
    if (status === TimerStatus.RUNNING || status === TimerStatus.BREAK) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (status === TimerStatus.RUNNING) {
              setStatus(TimerStatus.BREAK);
              notifyUser("¡Pausa!", "Mira a lo lejos.");
              getRandomTip();
              return settings.breakDuration * 60;
            } else {
              setStatus(TimerStatus.RUNNING);
              notifyUser("¡Vuelve!", "Sigue con tu trabajo.");
              getRandomTip();
              return settings.workDuration * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status, settings, notifyUser]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-6 selection:bg-blue-500/30">
      {/* HEADER */}
      <header className="w-full max-w-md flex justify-between items-center py-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
          </div>
          <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">VisiónSana</h1>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors"
        >
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
        </button>
      </header>

      {/* TIMER CARD */}
      <main className="w-full max-w-md flex flex-col items-center gap-10">
        <div className="relative w-72 h-72 flex items-center justify-center">
          <div className="w-64 h-64 rounded-full bg-slate-900 shadow-xl flex flex-col items-center justify-center">
            <span className="text-6xl font-black font-mono tracking-tighter text-white">{formatTime(timeLeft)}</span>
            <div className={`mt-2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status === TimerStatus.BREAK ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
              {status === TimerStatus.BREAK ? 'Descansando' : status === TimerStatus.RUNNING ? 'Trabajando' : 'Inactivo'}
            </div>
          </div>
        </div>

        <div className="flex gap-4 w-full">
          <button 
            onClick={status === TimerStatus.IDLE ? startTimer : stopTimer}
            className={`flex-1 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all active:scale-95 ${status === TimerStatus.IDLE ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'bg-slate-800 text-slate-300'}`}
          >
            {status === TimerStatus.IDLE ? 'Comenzar' : 'Reiniciar'}
          </button>
        </div>

        {currentTip && (
          <div className="w-full bg-slate-900 border border-slate-800/50 p-6 rounded-[2.5rem] relative overflow-hidden group">
            <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3 block">Consejo Salud Visual</span>
            <h4 className="text-lg font-bold text-white mb-2">{currentTip.title}</h4>
            <p className="text-sm text-slate-400 leading-relaxed">{currentTip.description}</p>
          </div>
        )}
      </main>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col p-6">
          <div className="w-full max-w-md mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black tracking-tight text-white">Ajustes</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-8 pr-2">
              <section className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[2.5rem] space-y-4">
                <h3 className="text-blue-400 text-xs font-black uppercase tracking-widest">Instalación</h3>
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-3 rounded-3xl">
                    <img src={qrUrl} alt="QR de Instalación" className="w-48 h-48" />
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">Escanea para abrir en tu móvil e instalar como App.</p>
                </div>
              </section>

              <section className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-300">Trabajo (min)</span>
                    <span className="text-blue-400 font-black font-mono">{settings.workDuration}</span>
                  </div>
                  <input 
                    type="range" min="5" max="60" step="5"
                    value={settings.workDuration}
                    onChange={(e) => setSettings({...settings, workDuration: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-300">Descanso (min)</span>
                    <span className="text-emerald-400 font-black font-mono">{settings.breakDuration}</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={settings.breakDuration}
                    onChange={(e) => setSettings({...settings, breakDuration: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </section>
            </div>
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-5 bg-white text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] mt-6"
            >
              Guardar y Volver
            </button>
          </div>
        </div>
      )}

      {/* BREAK OVERLAY */}
      {status === TimerStatus.BREAK && (
        <div className="fixed inset-0 z-[100] bg-blue-600 flex flex-col items-center justify-center p-10">
          <h2 className="text-4xl font-black text-white text-center mb-4 italic">¡DESCANSA!</h2>
          <p className="text-blue-100 text-center font-bold mb-10">Mira a 6 metros durante 20 segundos.</p>
          <div className="text-9xl font-black font-mono text-white mb-12">{formatTime(timeLeft)}</div>
          <button 
            onClick={() => setStatus(TimerStatus.RUNNING)}
            className="px-12 py-5 bg-white text-blue-600 rounded-[2rem] font-black text-xs uppercase"
          >
            Omitir
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
