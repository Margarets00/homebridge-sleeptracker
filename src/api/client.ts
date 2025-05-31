import axios, { AxiosInstance } from 'axios';
import { Commands, DeviceSnapshot, HelloData, EnvironmentSensorData } from './types';

const DEFAULT_HEADERS = {
  accept: '*/*',
  'content-type': 'application/json',
  'accept-encoding': 'gzip',
  'accept-language': 'en-US,en;q=0.9',
  'User-Agent': 'sleeptracker-android-tsi/1.9.47',
};

const CLIENT_INFO = {
  clientID: 'sleeptracker-android-tsi',
  clientVersion: '1.9.47',
};

export class SleepTrackerClient {
  private readonly authApi: AxiosInstance;
  private readonly api: AxiosInstance;
  private token: string | null = null;
  private tokenExpiration: number = 0;

  constructor(
    private readonly username: string,
    private readonly password: string,
    private readonly deviceId: string,
  ) {
    const baseUrl = 'tsi.sleeptracker.com';
    const authHost = `auth.${baseUrl}`;
    const appHost = `app.${baseUrl}`;

    this.authApi = axios.create({
      baseURL: `https://${authHost}/v1/app/user`,
      headers: {
        ...DEFAULT_HEADERS,
        Host: authHost,
      },
    });

    this.api = axios.create({
      baseURL: `https://${appHost}/actrack-client/v2/fpcsiot/processor`,
      headers: {
        ...DEFAULT_HEADERS,
        Host: appHost,
      },
    });
  }

  private async authenticate(): Promise<void> {
    const currentTime = Math.floor(Date.now() / 1000) + 60;
    if (this.token && currentTime < this.tokenExpiration) {
      return;
    }

    const authHeader = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    const response = await this.authApi.post('/session', {
      ...CLIENT_INFO,
      scope: 'scope',
      id: 'TEST_ANDROID_getUserSession',
    }, {
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
    });

    const { token, expirationTimeSecs } = response.data;
    this.token = token;
    this.tokenExpiration = expirationTimeSecs;
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async getDeviceInfo(deviceId: string): Promise<HelloData> {
    await this.authenticate();
    const response = await this.api.post('/command/hello', {
      ...CLIENT_INFO,
      id: 'TEST_ANDROID_cloudIoTProcessorSimpleHello',
      sleeptrackerProcessorID: deviceId,
    });
    return response.data.helloData;
  }

  async getDeviceSnapshot(command: Commands): Promise<DeviceSnapshot> {
    await this.authenticate();
    const commandValue = this.getCommandValue(command);
    const response = await this.api.post('/adjustableBaseControls', {
      ...CLIENT_INFO,
      id: 'TEST_ANDROID_adjustableBaseControls',
      sleeptrackerProcessorID: this.deviceId,
      bedControlCommand: commandValue
    });
    return response.data.body.snapshots[0];
  }

  private getCommandValue(command: Commands): string {
    switch (command) {
      case Commands.Status:
        return "1";
      case Commands.HeadUp:
        return "100";
      case Commands.HeadDown:
        return "101";
      case Commands.FootUp:
        return "102";
      case Commands.FootDown:
        return "103";
      case Commands.Flat:
        return "2";
      case Commands.ZeroG:
        return "0";
      case Commands.AntiSnore:
        return "4";
      case Commands.TV:
        return "3";
      case Commands.Stop:
        return "107";
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  async sendCommand(deviceId: string, command: Commands, side: number = 0, targetPosition?: number): Promise<void> {
    await this.authenticate();
    const commandValue = this.getCommandValue(command);
    
    const response = await this.api.post('/adjustableBaseControls', {
      ...CLIENT_INFO,
      id: 'TEST_ANDROID_adjustableBaseControls',
      sleeptrackerProcessorID: deviceId,
      bedControlCommand: commandValue,
      side: side,
      ...(targetPosition !== undefined && { targetPosition: targetPosition })
    });

    if (response.data.statusCode !== 0) {
      throw new Error(`Command failed: ${response.data.statusMessage}`);
    }
  }

  async getEnvironmentSensorData(deviceId: string): Promise<EnvironmentSensorData> {
    await this.authenticate();
    const response = await this.api.post('/latestEnvironmentSensorData', {
      ...CLIENT_INFO,
      id: 'TEST_ANDROID_environmentalData',
      sleeptrackerProcessorID: deviceId,
    });
    
    const { degreesCelsius, humidityPercentage } = response.data;
    return {
      temperature: degreesCelsius?.status === 'valid' ? Math.round(degreesCelsius.value * 10) / 10 : null,
      humidity: humidityPercentage?.status === 'valid' ? Math.round(humidityPercentage.value * 10) / 10 : null,
    };
  }
} 