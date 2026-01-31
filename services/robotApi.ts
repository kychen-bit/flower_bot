import { SoilMetrics, PlantType, ShutterAction } from "../types";

// 模拟网络延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 机器人控制接口层
 * 在此处对接真实的后端 API (例如 axios.post('/api/control', ...))
 */
export const robotApi = {
  // 控制液压升降 (喜阴平台)
  // 参数: height (0-100) 代表平台目标高度百分比/厘米
  setPlatformHeight: async (height: number): Promise<void> => {
    // TODO: 发送高度指令给底层 (PWM或步进电机位置)
    console.log(`[Backend] 设置平台目标高度: ${height}%`);
    await delay(100); 
  },

  // 控制偏心旋转 (躲避阳光)
  setRotationAngle: async (angle: number): Promise<void> => {
    console.log(`[Backend] 设置旋转角度: ${angle}°`);
    await delay(50);
  },

  // 控制遮光板 (只能上升或下降)
  controlShutter: async (action: ShutterAction): Promise<void> => {
    console.log(`[Backend] 遮光板执行动作: ${action === 'UP' ? '上升' : '下降'}`);
    await delay(100);
  },

  // 获取光线传感器数据 (阳光方位)
  // 返回: 0-360 度的方位角
  getSunPosition: async (): Promise<number> => {
    // TODO: 读取光敏传感器阵列计算最强光方位
    console.log(`[Backend] 读取阳光方位传感器...`);
    await delay(200);
    // 模拟太阳在 135 度方向 (东南方)
    return 135; 
  },

  // 触发浇水
  triggerWatering: async (type: PlantType): Promise<boolean> => {
    console.log(`[Backend] 正在为 ${type} 浇水`);
    await delay(1000); 
    return true;
  },

  // 执行探针检测并获取数据
  performProbeScan: async (): Promise<SoilMetrics> => {
    console.log(`[Backend] 启动探针检测序列...`);
    await delay(2500); 

    return {
      moisture: Math.floor(Math.random() * 40) + 30,
      ph: Number((Math.random() * 2 + 5.5).toFixed(1)),
      nitrogen: Math.floor(Math.random() * 100) + 80,
      temperature: Math.floor(Math.random() * 10) + 18,
      lightLevel: Math.floor(Math.random() * 5000) + 200,
    };
  }
};