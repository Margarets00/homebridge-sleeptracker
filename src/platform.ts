import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { SleepTrackerAccessory } from './sleepTrackerAccessory';

export const PLATFORM_NAME = 'SleepTrackerPlatform';
export const PLUGIN_NAME = 'homebridge-sleeptracker';

export class SleepTrackerPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    // Validate configuration
    if (!this.validateConfig()) {
      return;
    }

    this.api.on('didFinishLaunching', () => {
      this.discoverDevices();
    });
  }

  private validateConfig(): boolean {
    if (!this.config.username) {
      this.log.error('Missing username in configuration');
      return false;
    }

    if (!this.config.password) {
      this.log.error('Missing password in configuration');
      return false;
    }

    if (!this.config.deviceId) {
      this.log.error('Missing deviceId in configuration');
      return false;
    }

    if (typeof this.config.username !== 'string' || this.config.username.length === 0) {
      this.log.error('Invalid username in configuration');
      return false;
    }

    if (typeof this.config.password !== 'string' || this.config.password.length < 8) {
      this.log.error('Invalid password in configuration (minimum 8 characters)');
      return false;
    }

    if (typeof this.config.deviceId !== 'string' || this.config.deviceId.length === 0) {
      this.log.error('Invalid deviceId in configuration');
      return false;
    }

    return true;
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    new SleepTrackerAccessory(this, accessory);
    this.accessories.push(accessory);
  }

  discoverDevices() {
    const deviceId = this.config.deviceId;
    if (!deviceId) {
      this.log.error('No device ID configured');
      return;
    }

    const uuid = this.api.hap.uuid.generate(deviceId);
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

    if (existingAccessory) {
      this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
      new SleepTrackerAccessory(this, existingAccessory);
    } else {
      this.log.info('Adding new accessory');
      const accessory = new this.api.platformAccessory('SleepTracker Bed', uuid);
      
      accessory.context.device = {
        id: deviceId,
        name: this.config.name || 'SleepTracker Bed'
      };

      new SleepTrackerAccessory(this, accessory);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }
} 