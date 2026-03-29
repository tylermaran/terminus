import axios, { AxiosError } from 'axios';
import { getApiKey, getServerUrl } from './config';

function createClient(apiKeyFlag?: string) {
  const apiKey = getApiKey(apiKeyFlag);
  const baseURL = getServerUrl();

  return axios.create({
    baseURL,
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    timeout: 15000,
  });
}

function handleError(err: unknown): never {
  if (err instanceof AxiosError) {
    if (err.response) {
      const data = err.response.data;
      const message = data?.error || data?.message || `HTTP ${err.response.status}`;
      console.error(`Error: ${message}`);
      if (data?.required) console.error('Required:', JSON.stringify(data.required));
      if (data?.available) console.error('Available:', JSON.stringify(data.available));
    } else if (err.code === 'ECONNREFUSED') {
      console.error('Error: Cannot connect to server. Is the Terminus server running?');
    } else {
      console.error(`Error: ${err.message}`);
    }
  } else {
    console.error('Error:', err);
  }
  process.exit(1);
}

export async function post(path: string, data?: Record<string, unknown>, apiKeyFlag?: string) {
  try {
    const resp = await createClient(apiKeyFlag).post(path, data);
    return resp.data;
  } catch (err) {
    handleError(err);
  }
}

export async function get(path: string, params?: Record<string, unknown>, apiKeyFlag?: string) {
  try {
    const resp = await createClient(apiKeyFlag).get(path, { params });
    return resp.data;
  } catch (err) {
    handleError(err);
  }
}
