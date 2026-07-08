import apiClient from './client';
import type { AIAnalysisResult, AIRiskFlag } from '../types';

export async function analyzeRequirement(reqId: string): Promise<AIAnalysisResult> {
  const { data } = await apiClient.post(`/ai/analyze/${reqId}`);
  return data;
}

export async function flagRisks(): Promise<AIRiskFlag[]> {
  const { data } = await apiClient.post('/ai/flag-risks');
  return data;
}
