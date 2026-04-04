import Conf from 'conf';

const config = new Conf({
  projectName: 'terminus',
  schema: {
    apiKey: { type: 'string', default: '' },
    serverUrl: { type: 'string', default: 'http://localhost:3333' },
  },
});

export function getApiKey(flagValue?: string): string {
  if (flagValue) return flagValue;
  if (process.env.TERMINUS_API_KEY) return process.env.TERMINUS_API_KEY;
  return config.get('apiKey') as string;
}

export function setApiKey(key: string): void {
  config.set('apiKey', key);
}

export function getServerUrl(): string {
  if (process.env.TERMINUS_SERVER_URL) return process.env.TERMINUS_SERVER_URL;
  return config.get('serverUrl') as string;
}

export function getConfigPath(): string {
  return config.path;
}
