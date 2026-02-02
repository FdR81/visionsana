
export interface EyeTip {
  title: string;
  description: string;
  category: 'ejercicio' | 'postura' | 'hidratacion' | 'ambiente';
}

export enum TimerStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  BREAK = 'BREAK',
  COMPLETED = 'COMPLETED'
}

export interface UserSettings {
  workDuration: number; // minutes
  breakDuration: number; // minutes
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}
