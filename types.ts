export enum PlantType {
  SHADE_LOVING = '喜阴植物',
  SUN_LOVING = '喜阳植物',
}

export interface SoilMetrics {
  moisture: number; // Percentage
  ph: number; // 0-14
  nitrogen: number; // ppm
  temperature: number; // Celsius
  lightLevel: number; // Lux
}

export interface RobotState {
  platformHeight: number; // 0-100 (Platform Height cm/%)
  rotationAngle: number; // 0-360 (Eccentric rotation)
  shutterLevel: number; // 0-100 (Estimated Shutter Position)
  sunAzimuth: number; // 0-360 (Sun Position from Light Sensor)
  probeStatus: 'IDLE' | 'SCANNING' | 'RETRACTING' | 'DONE';
  lastMetrics: SoilMetrics | null;
  aiAnalysis: string | null;
}

export enum ConnectionStatus {
  CONNECTED = '已连接',
  DISCONNECTED = '断开',
  SYNCING = '同步中',
}

// 遮光板动作方向
export type ShutterAction = 'UP' | 'DOWN';

// 定义后端接口响应的标准格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}