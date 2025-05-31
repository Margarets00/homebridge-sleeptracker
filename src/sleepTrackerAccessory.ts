import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { SleepTrackerPlatform } from './platform';
import { SleepTrackerClient } from './api/client';
import { Commands } from './api/types';

export class SleepTrackerAccessory {
  private client: SleepTrackerClient;
  private headUpService: Service;
  private headDownService: Service;
  private footUpService: Service;
  private footDownService: Service;
  private flatPresetService: Service;
  private zeroGPresetService: Service;
  private antiSnorePresetService: Service;
  private tvPresetService: Service;
  private temperatureService?: Service;
  private humidityService?: Service;

  private isInitialized = false;
  private lastKnownState = {
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
      this.platform.config.deviceId
    );

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'SleepTracker')
      .setCharacteristic(this.platform.Characteristic.Model, 'Smart Bed')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.platform.config.deviceId);

    // Head Up switch
    this.headUpService = this.accessory.getService('Head Up') ||
      this.accessory.addService(this.platform.Service.Switch, 'Head Up', 'head-up');

    this.headUpService.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setHeadUp.bind(this))
      .onGet(this.getHeadUp.bind(this));

    // Head Down switch
    this.headDownService = this.accessory.getService('Head Down') ||
      this.accessory.addService(this.platform.Service.Switch, 'Head Down', 'head-down');

    this.headDownService.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setHeadDown.bind(this))
      .onGet(this.getHeadDown.bind(this));

    // Foot Up switch
    this.footUpService = this.accessory.getService('Foot Up') ||
      this.accessory.addService(this.platform.Service.Switch, 'Foot Up', 'foot-up');

    this.footUpService.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setFootUp.bind(this))
      .onGet(this.getFootUp.bind(this));

    // Foot Down switch
    this.footDownService = this.accessory.getService('Foot Down') ||
      this.accessory.addService(this.platform.Service.Switch, 'Foot Down', 'foot-down');

    this.footDownService.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setFootDown.bind(this))
      .onGet(this.getFootDown.bind(this));

    // Preset services
    this.flatPresetService = this.accessory.getService('Flat Position') ||
      this.accessory.addService(this.platform.Service.Switch, 'Flat Position', 'flat-preset');

    this.flatPresetService.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setFlatPreset.bind(this))
      .onGet(this.getPresetState.bind(this));

    this.zeroGPresetService = this.accessory.getService('Zero G') ||
      this.accessory.addService(this.platform.Service.Switch, 'Zero G', 'zerog-preset');

    this.zeroGPresetService.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setZeroGPreset.bind(this))
      .onGet(this.getPresetState.bind(this));

    this.antiSnorePresetService = this.accessory.getService('Anti Snore') ||
      this.accessory.addService(this.platform.Service.Switch, 'Anti Snore', 'antisnore-preset');

    this.antiSnorePresetService.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setAntiSnorePreset.bind(this))
      .onGet(this.getPresetState.bind(this));

    this.tvPresetService = this.accessory.getService('TV Position') ||
      this.accessory.addService(this.platform.Service.Switch, 'TV Position', 'tv-preset');

    this.tvPresetService.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setTVPreset.bind(this))
      .onGet(this.getPresetState.bind(this));

    // Initialize device with retries
    this.initializeDeviceWithRetry();
    
    // Start polling for updates (only for environment sensors)
    if (this.platform.config.enableEnvironmentSensors) {
      setInterval(() => this.updateState(), this.platform.config.refreshInterval * 1000 || 30000);
    }
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
    if (!this.isInitialized || !this.platform.config.enableEnvironmentSensors) {
      return;
    }

    try {
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
      this.platform.log.error('Failed to update environment sensors:', error);
    }
  }

  private async sendCommandWithRetry(command: Commands, retryCount = 0): Promise<void> {
    try {
      await this.client.sendCommand(this.platform.config.deviceId, command);
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        this.platform.log.warn(`Command failed, retrying in ${this.RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.sendCommandWithRetry(command, retryCount + 1);
      }
      throw error;
    }
  }

  // Head position handlers
  private async setHeadUp(value: CharacteristicValue) {
    if (value) {
      try {
        await this.sendCommandWithRetry(Commands.HeadUp);
      } catch (error) {
        this.platform.log.error('Failed to start head up movement:', error);
        throw error;
      }
    } else {
      try {
        await this.sendCommandWithRetry(Commands.Stop);
      } catch (error) {
        this.platform.log.error('Failed to stop movement:', error);
        throw error;
      }
    }
  }

  private async getHeadUp(): Promise<CharacteristicValue> {
    return false; // Always return false to allow toggling
  }

  private async setHeadDown(value: CharacteristicValue) {
    if (value) {
      try {
        await this.sendCommandWithRetry(Commands.HeadDown);
      } catch (error) {
        this.platform.log.error('Failed to start head down movement:', error);
        throw error;
      }
    } else {
      try {
        await this.sendCommandWithRetry(Commands.Stop);
      } catch (error) {
        this.platform.log.error('Failed to stop movement:', error);
        throw error;
      }
    }
  }

  private async getHeadDown(): Promise<CharacteristicValue> {
    return false; // Always return false to allow toggling
  }

  // Foot position handlers
  private async setFootUp(value: CharacteristicValue) {
    if (value) {
      try {
        await this.sendCommandWithRetry(Commands.FootUp);
      } catch (error) {
        this.platform.log.error('Failed to start foot up movement:', error);
        throw error;
      }
    } else {
      try {
        await this.sendCommandWithRetry(Commands.Stop);
      } catch (error) {
        this.platform.log.error('Failed to stop movement:', error);
        throw error;
      }
    }
  }

  private async getFootUp(): Promise<CharacteristicValue> {
    return false; // Always return false to allow toggling
  }

  private async setFootDown(value: CharacteristicValue) {
    if (value) {
      try {
        await this.sendCommandWithRetry(Commands.FootDown);
      } catch (error) {
        this.platform.log.error('Failed to start foot down movement:', error);
        throw error;
      }
    } else {
      try {
        await this.sendCommandWithRetry(Commands.Stop);
      } catch (error) {
        this.platform.log.error('Failed to stop movement:', error);
        throw error;
      }
    }
  }

  private async getFootDown(): Promise<CharacteristicValue> {
    return false; // Always return false to allow toggling
  }

  // Preset handlers
  private async setFlatPreset(value: CharacteristicValue) {
    if (value) {
      try {
        await this.sendCommandWithRetry(Commands.Flat);
        this.resetPresetSwitch(this.flatPresetService);
      } catch (error) {
        this.platform.log.error('Failed to set Flat preset:', error);
        throw error;
      }
    }
  }

  private async setZeroGPreset(value: CharacteristicValue) {
    if (value) {
      try {
        await this.sendCommandWithRetry(Commands.ZeroG);
        this.resetPresetSwitch(this.zeroGPresetService);
      } catch (error) {
        this.platform.log.error('Failed to set Zero G preset:', error);
        throw error;
      }
    }
  }

  private async setAntiSnorePreset(value: CharacteristicValue) {
    if (value) {
      try {
        await this.sendCommandWithRetry(Commands.AntiSnore);
        this.resetPresetSwitch(this.antiSnorePresetService);
      } catch (error) {
        this.platform.log.error('Failed to set Anti Snore preset:', error);
        throw error;
      }
    }
  }

  private async setTVPreset(value: CharacteristicValue) {
    if (value) {
      try {
        await this.sendCommandWithRetry(Commands.TV);
        this.resetPresetSwitch(this.tvPresetService);
      } catch (error) {
        this.platform.log.error('Failed to set TV preset:', error);
        throw error;
      }
    }
  }

  private async getPresetState(): Promise<CharacteristicValue> {
    return false;
  }

  private resetPresetSwitch(service: Service) {
    setTimeout(() => {
      service.updateCharacteristic(this.platform.Characteristic.On, false);
    }, 1000);
  }
} 