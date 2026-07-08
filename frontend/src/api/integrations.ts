import apiClient from './client';
import type { IntegrationStatus, IntegrationsStatusResponse, LinearTeam } from '../types';

export async function fetchIntegrationStatus(): Promise<IntegrationsStatusResponse> {
  const { data } = await apiClient.get<IntegrationsStatusResponse>('/integrations/status');
  return data;
}

export async function configureJira(payload: {
  domain: string;
  email: string;
  api_token: string;
  project_key: string;
  issue_type: string;
}): Promise<IntegrationStatus> {
  const { data } = await apiClient.post<IntegrationStatus>('/integrations/jira/configure', payload);
  return data;
}

export async function testJira(): Promise<IntegrationStatus> {
  const { data } = await apiClient.post<IntegrationStatus>('/integrations/jira/test');
  return data;
}

export async function configureLinear(payload: {
  api_key: string;
  team_id: string;
}): Promise<IntegrationStatus> {
  const { data } = await apiClient.post<IntegrationStatus>('/integrations/linear/configure', payload);
  return data;
}

export async function testLinear(): Promise<IntegrationStatus> {
  const { data } = await apiClient.post<IntegrationStatus>('/integrations/linear/test');
  return data;
}

export async function fetchLinearTeams(): Promise<LinearTeam[]> {
  const { data } = await apiClient.get<LinearTeam[]>('/integrations/linear/teams');
  return data;
}

export async function pushToJira(reqId: string): Promise<{ jira_issue_key: string; url: string }> {
  const { data } = await apiClient.post(`/requirements/${reqId}/jira`);
  return data;
}

export async function pushToLinear(reqId: string): Promise<{ linear_issue_id: string; identifier: string; url: string }> {
  const { data } = await apiClient.post(`/requirements/${reqId}/linear`);
  return data;
}
