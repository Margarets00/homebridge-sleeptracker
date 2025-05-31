import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { SleepTrackerPlatform } from './platform';
import { SleepTrackerClient } from './api/client';
import { Commands } from './api/types';

export class SleepTrackerAccessory {
  private client: SleepTrackerClient;
  private headService: Service;
  private footService: Service;
  private tvPresetService: Service;
  private temperatureService?: Service;
  private humidityService?: Service;

  private headPosition = 0;
  private footPosition = 0;
  private maxHeadAngle = 60;
  private maxFootAngle = 45;
  private isInitialized = false;
  private lastKnownState = {
    head: 0,
    foot: 0,
    temperature: null as number | null,
    humidity: null as number | null,
  };

  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1초

  constructor(
    private readonly platform: SleepTrackerPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.client = new SleepTrackerClient(
      this.platform.config.username,
      this.platform.config.password,
    );

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'SleepTracker')
      .setCharacteristic(this.platform.Characteristic.Model, 'Smart Bed')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.platform.config.deviceId);

    // Head position service
    this.headService = this.accessory.getService('Head Position') ||
      this.accessory.addService(this.platform.Service.Lightbulb, 'Head Position', 'head');

    this.headService.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setHeadOn.bind(this))
      .onGet(this.getHeadOn.bind(this));

    this.headService.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setHeadPosition.bind(this))
      .onGet(this.getHeadPosition.bind(this));

    // Foot position service
    this.footService = this.accessory.getService('Foot Position') ||
      this.accessory.addService(this.platform.Service.Lightbulb, 'Foot Position', 'foot');

    this.footService.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setFootOn.bind(this))
      .onGet(this.getFootOn.bind(this));

    this.footService.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setFootPosition.bind(this))
      .onGet(this.getFootPosition.bind(this));

    // TV Preset service
    this.tvPresetService = this.accessory.getService('TV Position') ||
      this.accessory.addService(this.platform.Service.Switch, 'TV Position', 'tv-preset');

    this.tvPresetService.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setTVPreset.bind(this))
      .onGet(this.getTVPreset.bind(this));

    // Initialize device with retries
    this.initializeDeviceWithRetry();
    
    // Start polling for updates
    setInterval(() => this.updateState(), this.platform.config.refreshInterval * 1000 || 30000);
  }

  private async initializeDeviceWithRetry(retryCount = 0) {
    try {
      await this.initializeDevice();
      this.isInitialized = true;
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        this.platform.log.warn(`Failed to initialize device, retrying in ${this.RETRY_DELAY}ms...`);
        setTimeout(() => this.initializeDeviceWithRetry(retryCount + 1), this.RETRY_DELAY);
      } else {
        this.platform.log.error('Failed to initialize device after maximum retries');
      }
    }
  }

  private async initializeDevice() {
    const deviceInfo = await this.client.getDeviceInfo(this.platform.config.deviceId);
    
    // Set max angles from device capabilities
    if (deviceInfo.motorMeta.capabilities.length > 0) {
      const capability = deviceInfo.motorMeta.capabilities[0];
      this.maxHeadAngle = capability.maxHeadAngle;
      this.maxFootAngle = capability.maxFootAngle;
    }

    // Setup environment sensors if enabled
    if (this.platform.config.enableEnvironmentSensors && deviceInfo.productFeatures.includes('env_sensors')) {
      this.setupEnvironmentSensors();
    }
  }

  private setupEnvironmentSensors() {
    // Temperature sensor
    this.temperatureService = this.accessory.getService('Temperature') ||
      this.accessory.addService(this.platform.Service.TemperatureSensor, 'Temperature', 'temperature');

    // Humidity sensor
    this.humidityService = this.accessory.getService('Humidity') ||
      this.accessory.addService(this.platform.Service.HumiditySensor, 'Humidity', 'humidity');
  }

  private async updateState() {
    if (!this.isInitialized) {
      return;
    }

    try {
      const snapshot = await this.client.getDeviceSnapshot(this.platform.config.deviceId);
      
      // Update position states and last known state
      this.headPosition = snapshot.headPosition;
      this.footPosition = snapshot.footPosition;
      this.lastKnownState.head = snapshot.headPosition;
      this.lastKnownState.foot = snapshot.footPosition;

      // Update environment sensors if available
      if (this.temperatureService || this.humidityService) {
        const sensorData = await this.client.getEnvironmentSensorData(this.platform.config.deviceId);
        
        if (sensorData.temperature !== null && this.temperatureService) {
          this.lastKnownState.temperature = sensorData.temperature;
          this.temperatureService.updateCharacteristic(
            this.platform.Characteristic.CurrentTemperature,
            sensorData.temperature
          );
        }
        
        if (sensorData.humidity !== null && this.humidityService) {
          this.lastKnownState.humidity = sensorData.humidity;
          this.humidityService.updateCharacteristic(
            this.platform.Characteristic.CurrentRelativeHumidity,
            sensorData.humidity
          );
        }
      }
    } catch (error) {
      this.platform.log.error('Failed to update state:', error);
      // Restore last known state
      this.headPosition = this.lastKnownState.head;
      this.footPosition = this.lastKnownState.foot;
    }
  }

  private async sendCommandWithRetry(command: Commands, targetPosition?: number, retryCount = 0): Promise<void> {
    try {
      if (targetPosition !== undefined) {
        await this.client.sendCommand(this.platform.config.deviceId, command, 0, targetPosition);
      } else {
        await this.client.sendCommand(this.platform.config.deviceId, command);
      }
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        this.platform.log.warn(`Command failed, retrying in ${this.RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.sendCommandWithRetry(command, targetPosition, retryCount + 1);
      }
      throw error;
    }
  }

  // Head position handlers
  private async setHeadOn(value: CharacteristicValue) {
    if (!value) {
      await this.sendCommandWithRetry(Commands.Flat);
    }
  }

  private async getHeadOn(): Promise<CharacteristicValue> {
    return this.headPosition > 0;
  }

  private async setHeadPosition(value: CharacteristicValue) {
    const targetPosition = this.scalePosition(value as number, this.maxHeadAngle);
    const command = targetPosition > this.headPosition ? Commands.HeadUp : Commands.HeadDown;
    await this.sendCommandWithRetry(command, targetPosition);
  }

  private async getHeadPosition(): Promise<CharacteristicValue> {
    return this.normalizePosition(this.headPosition, this.maxHeadAngle);
  }

  // Foot position handlers
  private async setFootOn(value: CharacteristicValue) {
    if (!value) {
      await this.sendCommandWithRetry(Commands.Flat);
    }
  }

  private async getFootOn(): Promise<CharacteristicValue> {
    return this.footPosition > 0;
  }

  private async setFootPosition(value: CharacteristicValue) {
    const targetPosition = this.scalePosition(value as number, this.maxFootAngle);
    const command = targetPosition > this.footPosition ? Commands.FootUp : Commands.FootDown;
    await this.sendCommandWithRetry(command, targetPosition);
  }

  private async getFootPosition(): Promise<CharacteristicValue> {
    return this.normalizePosition(this.footPosition, this.maxFootAngle);
  }

  // TV Preset handlers
  private async setTVPreset(value: CharacteristicValue) {
    if (value) {
      try {
        await this.sendCommandWithRetry(Commands.TV);
        // Reset the switch after 1 second
        setTimeout(() => {
          this.tvPresetService.updateCharacteristic(this.platform.Characteristic.On, false);
        }, 1000);
      } catch (error) {
        this.platform.log.error('Failed to set TV preset:', error);
        throw error;
      }
    }
  }

  private async getTVPreset(): Promise<CharacteristicValue> {
    // Always return false as this is a stateless switch
    return false;
  }

  // Utility functions
  private scalePosition(percentage: number, maxAngle: number): number {
    return Math.round((percentage / 100) * maxAngle);
  }

  private normalizePosition(position: number, maxAngle: number): number {
    return Math.round((position / maxAngle) * 100);
  }
} 