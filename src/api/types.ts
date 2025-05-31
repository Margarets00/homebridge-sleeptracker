export enum Commands {
  Status = 'STATUS',
  HeadUp = 'HEAD_UP',
  HeadDown = 'HEAD_DOWN',
  FootUp = 'FOOT_UP',
  FootDown = 'FOOT_DOWN',
  Flat = 'FLAT',
  ZeroG = 'ZEROG',
  AntiSnore = 'ANTISNORE',
  TV = 'TV',
  Stop = 'STOP',
}

export interface DeviceSnapshot {
  side: number;
  headPosition: number;
  footPosition: number;
  massage: {
    head: number;
    foot: number;
  };
  safetyLight: boolean;
  snoreRelief: boolean;
}

export interface HelloData {
  productFeatures: string[];
  motorMeta: {
    capabilities: Array<{
      side: number;
      maxHeadAngle: number;
      maxFootAngle: number;
    }>;
  };
  environmentSensors?: {
    temperature: number;
    humidity: number;
  };
}

export interface EnvironmentSensorData {
  temperature: number | null;
  humidity: number | null;
}

export interface Snapshot {
  side: number;
  headPosition: number;
  footPosition: number;
  headMassage: number;
  footMassage: number;
  safetyLights: boolean;
  snoreRelief: boolean;
}

export interface APIResponse {
  statusCode: number;
  statusMessage: string;
  body: {
    snapshots: Snapshot[];
  };
}

export interface APICredentials {
  username: string;
  password: string;
  deviceId: string;
} 