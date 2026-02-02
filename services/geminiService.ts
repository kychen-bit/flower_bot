import { GoogleGenAI } from "@google/genai";
import { SoilMetrics } from "../types";

// 外部分析服务适配层（可替换为自建服务）
const resolveApiKey = () => process.env.GEMINI_API_KEY || process.env.API_KEY || '';

const buildLocalSuggestion = (metrics: SoilMetrics): string => {
  const notes: string[] = [];

  if (metrics.moisture < 35) notes.push("湿度偏低");
  if (metrics.moisture > 70) notes.push("湿度偏高");
  if (metrics.ph < 6.0) notes.push("酸碱度偏酸");
  if (metrics.ph > 7.5) notes.push("酸碱度偏碱");
  if (metrics.temperature < 18) notes.push("温度偏低");
  if (metrics.temperature > 30) notes.push("温度偏高");
  if (metrics.lightLevel < 500) notes.push("光照偏弱");
  if (metrics.lightLevel > 5000) notes.push("光照偏强");

  const summary = notes.length ? `状态：${notes.join("，")}。` : "状态：指标在常规范围内。";

  let action = "建议：保持当前设置。";
  if (metrics.moisture < 35) action = "建议：短时开启浇水并观察回升。";
  else if (metrics.moisture > 70) action = "建议：暂停浇水，保持通风。";
  else if (metrics.lightLevel > 5000) action = "建议：适当下调遮光板或旋转避光。";
  else if (metrics.lightLevel < 500) action = "建议：适当调整平台朝向以增加受光。";

  return `${summary}${action}`;
};

export const analyzeSoilMetrics = async (metrics: SoilMetrics): Promise<string> => {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return `未配置 API Key，已返回本地建议。${buildLocalSuggestion(metrics)}`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      你是一个嵌入在园艺机器人中的植物学专家 AI。
      请分析以下针对混合花坛（包含喜阴植物如蕨类和喜阳植物如矮牵牛）的土壤传感器数据。

      传感器数据:
      - 湿度 (Moisture): ${metrics.moisture}%
      - 酸碱度 (pH): ${metrics.ph}
      - 氮含量 (Nitrogen): ${metrics.nitrogen} ppm
      - 温度 (Temperature): ${metrics.temperature}°C
      - 光照强度 (Light Level): ${metrics.lightLevel} Lux

      请提供一份简明的状态报告（不超过2句话），并针对机器人的执行器（浇水、遮光板或旋转平台）提出一个具体的中文操作建议。
      语气请保持专业、客观且乐于助人。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "分析完成，未生成具体建议。";
  } catch (error) {
    console.error("Analysis failed:", error);
    return `本地建议。${buildLocalSuggestion(metrics)}`;
  }
};