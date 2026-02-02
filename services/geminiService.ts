import { GoogleGenAI } from "@google/genai";
import { SoilMetrics } from "../types";

// 外部分析服务适配层（可替换为自建服务）
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeSoilMetrics = async (metrics: SoilMetrics): Promise<string> => {
  if (!apiKey) {
    return "未配置 API Key，无法进行 AI 土壤分析。";
  }

  try {
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
    return "连接 AI 分析模块失败，请检查网络设置。";
  }
};