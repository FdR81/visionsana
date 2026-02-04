import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TimerStatus, UserSettings, EyeTip } from './types';

const LOCAL_TIPS: EyeTip[] = [
  { title: "Regla 20-20-20", description: "Cada 20 minutos, mira algo a 6 metros durante 20 segundos." },
  { title: "Parpadeo consciente", description: "Intenta parpadear más seguido para mantener tus ojos hidratados." },
  { title: "Brillo de pantalla", description: "Ajusta el brillo de tu monitor para que coincida con la luz de tu habitación." },
  { title: "Distancia adecuada", description: "Mantén tu pantalla a unos 50-60 cm de distancia de tus ojos." }
];

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

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/industrial_alarm_loop.ogg');
    audioRef.current.loop = true;
  }, []);

  const startAlarm = useCallback(() => {
    setIsAlarmActive(true);
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => console.log("Audio bloqueado por el navegador"));
    }
    if (settings.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([1000, 500, 1000, 500, 1000]);
    }
    if (Notification.permission === "granted") {
      new Notification("¡TIEMPO DE DESCANSO!", {
        body: "Tus ojos necesitan un respiro ahora.",
        vibrate: [200, 100, 200]
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
      {/* PANTALLA ROJA DE ALARMA */}
      {isAlarmActive && (
        <div className="fixed inset-0 z-[200] bg-red-600 flex flex-col items-center justify-center p-6 text-center">
          <div className="animate-bounce mb-4 text-6xl">🔔</div>
          <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">¡DESCANSO!</h2>
          <button 
            onClick={stopAlarm}
            className="w-full max-w-xs py-8 bg-white text-red-600 rounded-full font-black text-2xl shadow-2xl uppercase mt-6"
          >
            ENTENDIDO
          </button>
        </div>
      )}

      {/* HEADER */}
      <header className="w-full max-w-md flex justify-between items-center py-6">
        <h1 className="text-2xl font-black italic text-blue-500">VisiónSana</h1>
        <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-slate-900 rounded-2xl border border-slate-800">⚙️</button>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="w-full max-w-md flex flex-col items-center mt-10 mb-20">
        <div className="relative w-72 h-72 rounded-full bg-slate-900 flex flex-col items-center justify-center border-8 border-slate-950 shadow-2xl">
          <span className="text-7xl font-black font-mono tracking-tighter">{formatTime(timeLeft)}</span>
          <span className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400 mt-2">
            {status === TimerStatus.BREAK ? 'Relájate' : 'Trabajando'}
          </span>
        </div>

        <button 
          onClick={() => status === TimerStatus.IDLE ? setStatus(TimerStatus.RUNNING) : setStatus(TimerStatus.IDLE)}
          className={`mt-12 w-full py-6 rounded-3xl font-black text-xl uppercase tracking-widest transition-all ${status === TimerStatus.IDLE ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-slate-800'}`}
        >
          {status === TimerStatus.IDLE ? 'Comenzar Ciclo' : 'Reiniciar'}
        </button>
      </main>

      {/* PIE DE PÁGINA PERSONALIZADO */}
      <footer className="mt-auto mb-4">
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest opacity-80">
          Aplicación creada para Magalí
        </p>
      </footer>

      {/* AJUSTES */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 p-8 flex flex-col">
           <div className="flex justify-between items-center mb-12">
             <h2 className="text-4xl font-black">Configuración</h2>
             <button onClick={() => setIsSettingsOpen(false)} className="text-3xl text-slate-500">✕</button>
           </div>
           
           <div className="space-y-6">
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <label className="block text-xs font-black text-slate-500 mb
