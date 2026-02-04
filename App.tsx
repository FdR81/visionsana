import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TimerStatus, UserSettings, EyeTip } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<TimerStatus>(TimerStatus.IDLE);
  const [timeLeft, setTimeLeft] = useState(1 * 60);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('visionSanaSettings');
    return saved ? JSON.parse(saved) : {
      workDuration: 1, breakDuration: 1, notificationsEnabled: true,
      soundEnabled: true, vibrationEnabled: true
    };
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const timerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicialización de sonidos y permisos
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.loop = true;

    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const startAlarm = useCallback(() => {
    setIsAlarmActive(true);
    
    // 1. Sonido en bucle
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => console.log("Interacción requerida"));
    }

    // 2. Vibración fuerte (Patrón: vibra 1s, para 0.2s, vibra 1s...)
    if (settings.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([1000, 200, 1000, 200, 1000, 200, 1000]);
    }

    // 3. Notificación de sistema (para cuando la app está en segundo plano)
    if (Notification.permission === "granted") {
      new Notification("¡DESCANSO ACTIVO!", {
        body: "Es momento de mirar lejos por un minuto.",
        tag: "vision-sana-alert"
      });
    }
  }, [settings]);

  const stopAlarm = () => {
    setIsAlarmActive(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (navigator.vibrate) navigator.vibrate(0);
  };

  useEffect(() => {
    localStorage.setItem('visionSanaSettings', JSON.stringify(settings));
    if (status === TimerStatus.IDLE) setTimeLeft(settings.workDuration * 60);
  }, [settings, status]);

  useEffect(() => {
    if (status === TimerStatus.RUNNING || status === TimerStatus.BREAK) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            startAlarm();
            if (status === TimerStatus.RUNNING) {
              setStatus(TimerStatus.BREAK);
              return settings.breakDuration * 60;
            } else {
              setStatus(TimerStatus.RUNNING);
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
  }, [status, settings, startAlarm]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-6 relative">
      
      {/* ALERTA VISUAL ROJA (Cubre toda la pantalla) */}
      {isAlarmActive && (
        <div className="fixed inset-0 z-[999] bg-red-600 flex flex-col items-center justify-center p-6 text-center animate-pulse">
          <div className="text-8xl mb-6">👁️‍🗨️</div>
          <h2 className="text-5xl font-black text-white mb-4 uppercase italic">¡DESCANSA!</h2>
          <p className="text-white text-xl font-bold mb-10">Mira a 6 metros de distancia</p>
          <button 
            onClick={stopAlarm}
            className="w-full max-w-sm py-10 bg-white text-red-600 rounded-[3rem] font-black text-3xl shadow-2xl active:scale-95 transition-transform"
          >
            ENTENDIDO
          </button>
        </div>
      )}

      {/* INTERFAZ NORMAL */}
      <header className="w-full max-w-md flex justify-between items-center py-6">
        <h1 className="text-2xl font-black italic text-blue-500 tracking-tighter">VisiónSana</h1>
        <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-slate-900 rounded-2xl border border-slate-800">⚙️</button>
      </header>

      <main className="w-full max-w-md flex flex-col items-center mt-10">
        <div className="relative w-72 h-72 rounded-full bg-slate-900 flex flex-col items-center justify-center border-8 border-slate-950 shadow-2xl overflow-hidden">
          <div className={`absolute inset-0 opacity-10 ${status === TimerStatus.BREAK ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
          <span className="text-7xl font-black font-mono tracking-tighter z-10">{formatTime(timeLeft)}</span>
          <span className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400 mt-2 z-10">
            {status === TimerStatus.BREAK ? 'Relájate' : 'Trabajando'}
          </span>
        </div>

        <button 
          onClick={() => status === TimerStatus.IDLE ? setStatus(TimerStatus.RUNNING) : setStatus(TimerStatus.IDLE)}
          className={`mt-12 w-full py-6 rounded-3xl font-black text-xl uppercase tracking-widest transition-all ${status === TimerStatus.IDLE ? 'bg-blue-600 shadow-lg shadow-blue-500/40' : 'bg-slate-800 text-slate-400'}`}
        >
          {status === TimerStatus.IDLE ? 'Comenzar Ciclo' : 'Reiniciar'}
        </button>
      </main>

      <footer className="mt-auto mb-4">
        <p className="text-[10px] font-medium text-slate-600 uppercase tracking-[0.2em]">
          Aplicación creada para Magalí
        </p>
      </footer>

      {/* PANEL DE CONFIGURACIÓN */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950 p-8 flex flex-col">
           <div className="flex justify-between items-center mb-10">
             <h2 className="text-4xl font-black">Ajustes</h2>
             <button onClick={() => setIsSettingsOpen(false)} className="text-3xl text-slate-500">✕</button>
           </div>
           
           <div className="space-y-8">
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <label className="block text-xs font-black text-slate-500 mb-4 uppercase">Tiempo de Trabajo: {settings.workDuration} min</label>
                <input type="range" min="1" max="60" value={settings.workDuration} onChange={(e) => setSettings({...settings, workDuration: parseInt(e.target.value)})} className="w-full h-2 bg-slate-800 rounded-lg appearance-none accent-blue-500" />
              </div>

              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <label className="block text-xs font-black text-slate-500 mb-4 uppercase">Tiempo de Descanso: {settings.breakDuration} min</label>
                <input type="range" min="1" max="10" value={settings.breakDuration} onChange={(e) => setSettings({...settings, breakDuration: parseInt(e.target.value)})} className="w-full h-2 bg-slate-800 rounded-lg appearance-none accent-emerald-500" />
              </div>
           </div>

           <button onClick={() => setIsSettingsOpen(false)} className="mt-auto w-full py-6 bg-white text-black rounded-3xl font-black text-lg uppercase">Guardar y Cerrar</button>
        </div>
      )}
    </div>
  );
};

export default App;
