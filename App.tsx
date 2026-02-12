import React, { useState, useCallback, useEffect } from 'react';
import { 
  Droplet, 
  Sun, 
  RotateCw, 
  MoveVertical, 
  Activity, 
  Wind, 
  Thermometer, 
  Leaf, 
  CloudRain,
  Wifi,
  Battery,
  Sprout,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Menu,
  Zap,
  Settings,
  Power,
  Signal
} from 'lucide-react';
import { RadialControl } from './components/RadialControl';
import { MetricCard } from './components/MetricCard';
import { ConnectionStatus, RobotState, SoilMetrics, PlantType, ShutterAction } from './types';
import { analyzeSoilMetrics } from './services/geminiService';
import { robotApi } from './services/robotApi';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

// 初始值用于界面占位，实际数据来自探针扫描
const INITIAL_METRICS: SoilMetrics = {
  moisture: 45,
  ph: 6.5,
  nitrogen: 120,
  temperature: 22,
  lightLevel: 800
};

// 演示用的静态趋势数据（无后端时占位）
const MOCK_HISTORY = [
  { time: '10:00', moisture: 40 },
  { time: '11:00', moisture: 42 },
  { time: '12:00', moisture: 38 },
  { time: '13:00', moisture: 35 },
  { time: '14:00', moisture: 30 },
  { time: '15:00', moisture: 45 },
];

export default function App() {
  const [connection] = useState<ConnectionStatus>(ConnectionStatus.CONNECTED);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [robotState, setRobotState] = useState<RobotState>({
    platformHeight: 50,
    rotationAngle: 0,
    shutterLevel: 20,
    sunAzimuth: 135,
    probeStatus: 'IDLE',
    lastMetrics: null,
    aiAnalysis: null,
  });
    const [infraredEnabled, setInfraredEnabled] = useState(false);

  const [activeTab, setActiveTab] = useState<'control' | 'monitor'>('control');

  useEffect(() => {
    const fetchEnvironment = async () => {
        try {
            const sunPos = await robotApi.getSunPosition();
            setRobotState(prev => ({ ...prev, sunAzimuth: sunPos }));
        } catch (e) {
            console.error("Failed to fetch sun position", e);
        }
    };
    fetchEnvironment();
  }, []);

  // --- Handlers ---

  const handlePumpControl = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Number(e.target.value);
    setRobotState(prev => ({ ...prev, platformHeight: newVal }));
    await robotApi.setPlatformHeight(newVal);
  };

  const handleRotationChange = useCallback(async (angle: number) => {
    setRobotState(prev => ({ ...prev, rotationAngle: angle }));
    await robotApi.setRotationAngle(angle);
  }, []);

  const handleShutterAction = async (action: ShutterAction) => {
    setRobotState(prev => {
        if (action === 'UP') return { ...prev, shutterLevel: Math.max(0, prev.shutterLevel - 10) };
        if (action === 'DOWN') return { ...prev, shutterLevel: Math.min(100, prev.shutterLevel + 10) };
        return prev;
    });
    await robotApi.controlShutter(action);
  };

    const handleInfraredToggle = async () => {
        const next = !infraredEnabled;
        setInfraredEnabled(next);
        await robotApi.setInfraredEnabled(next);
    };

    const handleTrimRequest = async () => {
        if (!infraredEnabled) {
            alert('红外未启用，无法发送裁剪指令。');
            return;
        }
        // TODO: 接入真实红外高度判断
        await robotApi.sendTrimRequest();
        alert('已发送裁剪指令到手机端。');
    };

  const waterPlant = async (type: PlantType) => {
    if (confirm(`确定要为 "${type}" 区域开启精准灌溉吗？`)) {
      await robotApi.triggerWatering(type);
    }
  };

    const runProbeScan = async () => {
    if (robotState.probeStatus === 'SCANNING') return;
    setRobotState(prev => ({ ...prev, probeStatus: 'SCANNING', aiAnalysis: null }));

    try {
      const newMetrics = await robotApi.performProbeScan();
      setRobotState(prev => ({ 
        ...prev, 
        probeStatus: 'RETRACTING',
        lastMetrics: newMetrics 
      }));

    // TODO: 可替换为自建分析服务或本地算法
    const analysis = await analyzeSoilMetrics(newMetrics);
      setRobotState(prev => ({ 
        ...prev, 
        probeStatus: 'DONE',
        aiAnalysis: analysis 
      }));

    } catch (error) {
      console.error("Probe scan failed", error);
      setRobotState(prev => ({ ...prev, probeStatus: 'IDLE' }));
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-nature-bg text-nature-text font-sans relative">
      
      {/* Top Decoration */}
      <div className="absolute top-0 w-full h-64 bg-gradient-to-b from-emerald-50 to-transparent pointer-events-none"></div>

      {/* Header */}
      <header className="px-6 py-5 flex justify-between items-center z-20 relative">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-soft flex items-center justify-center text-nature-primary border border-slate-50">
                <Leaf size={22} fill="currentColor" className="opacity-90"/>
            </div>
            <div>
                <h1 className="font-bold text-xl text-nature-text leading-none">BotanyBot</h1>
                <div className="flex items-center gap-1.5 mt-1">
                    <div className={`w-2 h-2 rounded-full ${connection === ConnectionStatus.CONNECTED ? 'bg-emerald-500' : 'bg-red-400'}`}></div>
                    <span className="text-xs font-medium text-nature-muted">{connection}</span>
                </div>
            </div>
        </div>

        {/* Menu Button & Dropdown */}
        <div className="relative">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 transition-colors rounded-full shadow-soft border border-slate-100 active:scale-95 ${isMenuOpen ? 'bg-nature-primary text-white' : 'bg-white text-nature-text'}`}
            >
                <Menu size={20} />
            </button>

            {isMenuOpen && (
                <>
                    {/* Invisible Backdrop to close menu when clicking outside */}
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsMenuOpen(false)}
                    ></div>
                    
                    {/* Dropdown Content */}
                    <div className="absolute right-0 top-full mt-3 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-20 origin-top-right animate-slide-up">
                        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            系统设置
                        </div>
                        <button 
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-700 transition-colors"
                            onClick={() => { alert('进入设备校准模式...'); setIsMenuOpen(false); }}
                        >
                            <Settings size={16} className="text-slate-400" /> 
                            设备校准
                        </button>
                        <button 
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-700 transition-colors"
                            onClick={() => { alert('查看网络详情...'); setIsMenuOpen(false); }}
                        >
                            <Signal size={16} className="text-slate-400" /> 
                            网络配置
                        </button>
                        <button 
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-700 transition-colors"
                             onClick={() => { alert('检查电池健康度...'); setIsMenuOpen(false); }}
                        >
                            <Battery size={16} className="text-slate-400" /> 
                            电源管理
                        </button>
                        <div className="h-px bg-slate-100 my-1 mx-2"></div>
                        <button 
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 text-red-500 rounded-xl text-sm font-medium transition-colors"
                            onClick={() => { alert('断开设备连接'); setIsMenuOpen(false); }}
                        >
                            <Power size={16} /> 
                            断开连接
                        </button>
                    </div>
                </>
            )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 relative z-0">
        
        {/* Tab Switcher */}
        <div className="px-6 mb-6">
            <div className="flex p-1 bg-white rounded-xl shadow-soft border border-slate-100">
                <button 
                    onClick={() => setActiveTab('control')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'control' ? 'bg-nature-primary text-white shadow-md' : 'text-nature-muted hover:bg-slate-50'}`}
                >
                    手动控制
                </button>
                <button 
                    onClick={() => setActiveTab('monitor')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'monitor' ? 'bg-nature-primary text-white shadow-md' : 'text-nature-muted hover:bg-slate-50'}`}
                >
                    智能监测
                </button>
            </div>
        </div>

        {activeTab === 'control' ? (
            <div className="px-6 space-y-6 animate-slide-up">
                
                {/* Platform Height */}
                <section className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                <MoveVertical size={20} />
                            </div>
                            <h2 className="font-bold text-lg">喜阴植物平台高度</h2>
                        </div>
                        <span className="text-sm font-mono font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{robotState.platformHeight} cm</span>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* Visualizer */}
                        <div className="h-40 w-16 bg-slate-100 rounded-full relative overflow-hidden border border-slate-200 shadow-inner">
                            <div 
                                className="absolute bottom-0 w-full bg-blue-400 transition-all duration-300 ease-out"
                                style={{ height: `${robotState.platformHeight}%` }}
                            >
                                <div className="absolute top-0 w-full h-[1px] bg-blue-300"></div>
                            </div>
                            {/* Ruler marks */}
                            <div className="absolute inset-0 flex flex-col justify-between py-4 px-3 opacity-30">
                                {[...Array(6)].map((_,i) => <div key={i} className="w-3 h-[1px] bg-slate-400 self-end"></div>)}
                            </div>
                        </div>
                        {/* Control */}
                        <div className="flex-1">
                             <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={robotState.platformHeight} 
                                onChange={handlePumpControl}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-nature-muted mt-2 font-medium">
                                <span>地面 (0cm)</span>
                                <span>最高 (100cm)</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Rotation */}
                <section className="bg-white rounded-2xl p-1 shadow-soft border border-slate-100">
                    <div className="p-4 pb-0 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <RotateCw size={20} />
                            </div>
                            <h2 className="font-bold text-lg">偏心旋转</h2>
                        </div>
                    </div>
                   
                    <RadialControl 
                        value={robotState.rotationAngle} 
                        onChange={handleRotationChange} 
                        label="平台方位"
                        sunAngle={robotState.sunAzimuth}
                    />
                </section>

                {/* Shutter Control */}
                <section className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-orange-50 text-nature-accent rounded-lg">
                                <Sun size={20} />
                            </div>
                            <h2 className="font-bold text-lg">遮光板</h2>
                        </div>
                        <span className="text-xs font-medium text-nature-muted bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                             {robotState.shutterLevel}% 覆盖
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleShutterAction('UP')}
                            className="bg-slate-50 hover:bg-slate-100 active:bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center transition-all active:scale-[0.98]"
                        >
                            <ArrowUp size={24} className="text-nature-text mb-1" />
                            <span className="text-sm font-bold text-nature-muted">收起 (UP)</span>
                        </button>

                        <button 
                             onClick={() => handleShutterAction('DOWN')}
                             className="bg-slate-50 hover:bg-slate-100 active:bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center transition-all active:scale-[0.98]"
                        >
                            <ArrowDown size={24} className="text-nature-text mb-1" />
                            <span className="text-sm font-bold text-nature-muted">降下 (DOWN)</span>
                        </button>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-5 h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className="h-full bg-nature-accent transition-all duration-500 rounded-full"
                            style={{ width: `${robotState.shutterLevel}%` }}
                        ></div>
                    </div>
                </section>

                {/* Watering */}
                <section className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                            <CloudRain size={20} />
                        </div>
                        <h2 className="font-bold text-lg">精准灌溉</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => waterPlant(PlantType.SHADE_LOVING)}
                            className="relative overflow-hidden group p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-200 bg-white transition-all active:scale-[0.98]"
                        >
                            <div className="flex flex-col items-start gap-2">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                                    <Sprout size={20} />
                                </div>
                                <span className="text-base font-bold text-nature-text">喜阴区域</span>
                                <span className="text-xs text-nature-muted">适合蕨类/苔藓</span>
                            </div>
                        </button>

                        <button 
                            onClick={() => waterPlant(PlantType.SUN_LOVING)}
                            className="relative overflow-hidden group p-4 rounded-xl border-2 border-slate-100 hover:border-orange-200 bg-white transition-all active:scale-[0.98]"
                        >
                            <div className="flex flex-col items-start gap-2">
                                <div className="p-2 bg-orange-100 text-orange-500 rounded-full">
                                    <Sun size={20} />
                                </div>
                                <span className="text-base font-bold text-nature-text">喜阳区域</span>
                                <span className="text-xs text-nature-muted">适合多肉/矮牵牛</span>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Infrared Control */}
                <section className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                                <Signal size={20} />
                            </div>
                            <h2 className="font-bold text-lg">红外遮挡检测</h2>
                        </div>
                        <button
                            onClick={handleInfraredToggle}
                            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${infraredEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                        >
                            {infraredEnabled ? '已启用' : '已禁用'}
                        </button>
                    </div>
                    <p className="text-xs text-nature-muted leading-relaxed">
                        植物过高遮挡红外时，将向手机端发送裁剪指令。
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                        <button
                            onClick={handleTrimRequest}
                            className="bg-slate-50 hover:bg-slate-100 active:bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 transition-all active:scale-[0.98]"
                        >
                            发送裁剪指令
                        </button>
                        <span className="text-xs text-slate-400">（mock，未接入真实红外传感）</span>
                    </div>
                </section>
            </div>
        ) : (
            <div className="px-6 space-y-6 animate-slide-up">
                
                {/* Probe Button */}
                <div className="flex justify-center py-6">
                     <button
                        onClick={runProbeScan}
                        disabled={robotState.probeStatus === 'SCANNING'}
                        className={`
                            relative w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all shadow-xl
                            ${robotState.probeStatus === 'SCANNING' 
                                ? 'bg-white border-4 border-nature-primary' 
                                : 'bg-gradient-to-b from-nature-primary to-emerald-600 text-white active:scale-95 shadow-emerald-200'}
                        `}
                     >
                        <Activity size={40} className={`mb-2 ${robotState.probeStatus === 'SCANNING' ? 'text-nature-primary animate-pulse' : 'text-white'}`} />
                        <span className={`text-lg font-bold ${robotState.probeStatus === 'SCANNING' ? 'text-nature-primary' : 'text-white'}`}>
                            {robotState.probeStatus === 'SCANNING' ? '检测中...' : '启动探针'}
                        </span>
                        
                        {robotState.probeStatus === 'SCANNING' && (
                            <div className="absolute inset-[-8px] border-4 border-nature-primary/20 rounded-full animate-ping"></div>
                        )}
                     </button>
                </div>

                {/* 分析结果 */}
                {robotState.aiAnalysis && (
                    <div className="bg-white border-l-4 border-nature-primary rounded-r-xl p-5 shadow-soft">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap size={18} className="text-nature-primary fill-nature-primary" />
                            <h3 className="font-bold text-nature-text">分析建议</h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {robotState.aiAnalysis}
                        </p>
                    </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <MetricCard 
                        label="土壤湿度" 
                        value={robotState.lastMetrics?.moisture ?? '--'} 
                        unit="%" 
                        icon={Droplet} 
                        color="#3b82f6" 
                        bgColor="#eff6ff"
                    />
                    <MetricCard 
                        label="酸碱度 (pH)" 
                        value={robotState.lastMetrics?.ph ?? '--'} 
                        unit="" 
                        icon={Activity} 
                        color="#8b5cf6" 
                        bgColor="#f5f3ff"
                    />
                    <MetricCard 
                        label="土壤温度" 
                        value={robotState.lastMetrics?.temperature ?? '--'} 
                        unit="°C" 
                        icon={Thermometer} 
                        color="#ef4444" 
                        bgColor="#fef2f2"
                    />
                    <MetricCard 
                        label="氮含量" 
                        value={robotState.lastMetrics?.nitrogen ?? '--'} 
                        unit="ppm" 
                        icon={Wind} 
                        color="#10b981" 
                        bgColor="#ecfdf5"
                    />
                </div>

                {/* Chart */}
                <section className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-nature-primary"></div>
                        湿度趋势 (24h)
                    </h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={MOCK_HISTORY}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickMargin={10}/>
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#059669', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#64748b' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="moisture" 
                                    stroke="#059669" 
                                    strokeWidth={3} 
                                    dot={{ fill: '#fff', stroke: '#059669', strokeWidth: 2, r: 4 }} 
                                    activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>
        )}

      </main>

      {/* Modern Bottom Action Bar */}
      <div className="absolute bottom-0 w-full bg-white border-t border-slate-100 px-6 py-4 pb-8 z-30 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] safe-area-bottom">
        <div className="flex items-center justify-between max-w-lg mx-auto gap-4">
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">系统状态</span>
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    {robotState.probeStatus === 'SCANNING' ? (
                        <span className="flex items-center text-nature-primary gap-1">
                            <span className="w-2 h-2 rounded-full bg-nature-primary animate-pulse"></span>
                            忙碌 (检测中)
                        </span>
                    ) : (
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            系统正常
                        </span>
                    )}
                </span>
            </div>
            
            {/* The Big Red Button - Re-styled */}
            <button 
                className="flex-1 bg-white border-2 border-red-100 text-nature-danger rounded-xl px-4 py-3 font-bold flex items-center justify-center gap-2 shadow-sm active:bg-red-50 active:scale-[0.98] transition-all"
                onClick={() => alert("紧急停止已触发！机器人将立即停止所有动作。")}
            >
                <div className="w-3 h-3 bg-nature-danger rounded-sm"></div>
                紧急停止
                <AlertCircle size={18} />
            </button>
        </div>
      </div>
    </div>
  );
}