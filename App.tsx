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
  const [timeLeft, setTimeLeft] = useState(1 * 60); // Ahora inicia en 1 min por defecto
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('visionSanaSettings');
    return saved ? JSON.parse(saved) : {
      workDuration: 1, // Valor inicial cambiado a 1
      breakDuration: 1, 
      notificationsEnabled: true,
      soundEnabled: true, 
      vibrationEnabled: true
    };
  });
  
  const [currentTip, setCurrentTip] = useState<EyeTip | null>(LOCAL_TIPS[0]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const timerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.loop = true;
  }, []);

  const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * LOCAL_TIPS.length);
    setCurrentTip(LOCAL_TIPS[randomIndex]);
  };

  const startAlarm = useCallback(() => {
    setIsAlarmActive(true);
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Permiso de audio requerido"));
    }
    if (settings.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
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
              getRandomTip();
              return settings.breakDuration * 60;
            } else {
              setStatus(TimerStatus.RUNNING);
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
  }, [status, settings, startAlarm]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-6">
      {isAlarmActive && (
        <div className="fixed inset-0 z-[200] bg-red-600 flex flex-col items-center justify-center p-6 animate-pulse">
          <h2 className="text-5xl font-black text-white text-center mb-8">¡TIEMPO!</h2>
          <button onClick={stopAlarm} className="w-full max-w-xs py-8 bg-white text-red-600 rounded-[2rem] font-black text-xl uppercase">
            Detener Alarma
          </button>
        </div>
      )}

      <header className="w-full max-w-md flex justify-between items-center py-4 mb-8">
        <h1 className="text-xl font-black italic text-blue-500">VisiónSana</h1>
        <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-slate-900 rounded-xl">⚙️</button>
      </header>

      <main className="w-full max-w-md flex flex-col items-center gap-10">
        <div className="w-64 h-64 rounded-full bg-slate-900 shadow-xl flex flex-col items-center justify-center border-4 border-blue-500/20">
          <span className="text-6xl font-black font-mono">{formatTime(timeLeft)}</span>
          <div className="text-[10px] font-bold uppercase tracking-widest mt-2 text-blue-400">
            {status === TimerStatus.BREAK ? 'Descanso' : 'Trabajo'}
          </div>
        </div>

        <button 
          onClick={() => status === TimerStatus.IDLE ? setStatus(TimerStatus.RUNNING) : setStatus(TimerStatus.IDLE)}
          className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest ${status === TimerStatus.IDLE ? 'bg-blue-600' : 'bg-slate-800'}`}
        >
          {status === TimerStatus.IDLE ? 'Comenzar' : 'Reiniciar'}
        </button>
      </main>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 p-6 flex flex-col">
           <button onClick={() => setIsSettingsOpen(false)} className="self-end text-2xl">✕</button>
           <h2 className="text-3xl font-black mb-10">Ajustes</h2>
           <div className="space-y-8">
              <div>
                <label className="block text-sm mb-2 text-slate-400">Tiempo de Trabajo: <span className="text-white font-bold">{settings.workDuration} min</span></label>
                <input 
                  type="range" 
                  min="1" 
                  max="60" 
                  step="1" 
                  value={settings.workDuration} 
                  onChange={(e) => setSettings({...settings, workDuration: parseInt(e.target.value)})} 
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none accent-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-slate-400">Tiempo de Descanso: <span className="text-white font-bold">{settings.breakDuration} min</span></label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="1"
                  value={settings.breakDuration} 
                  onChange={(e) => setSettings({...settings, breakDuration: parseInt(e.target.value)})} 
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none accent-emerald-500" 
                />
              </div>
           </div>
           <button onClick={() => setIsSettingsOpen(false)} className="mt-auto w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase">Guardar Cambios</button>
        </div>
      )}
    </div>
  );
};

export default App;
