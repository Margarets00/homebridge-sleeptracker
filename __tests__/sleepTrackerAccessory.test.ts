import { SleepTrackerAccessory } from '../src/sleepTrackerAccessory';
import { Commands } from '../src/api/types';
import { CharacteristicValue, PlatformAccessory, Service, WithUUID } from 'homebridge';

type ServiceType = WithUUID<typeof Service>;

// Mock Homebridge platform and accessory
const mockPlatform = {
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  config: {
    username: 'test@example.com',
    password: 'password',
    deviceId: 'test-device',
    enableEnvironmentSensors: true,
    refreshInterval: 30,
  },
  Service: {
    Switch: jest.fn() as unknown as ServiceType,
    TemperatureSensor: jest.fn() as unknown as ServiceType,
    HumiditySensor: jest.fn() as unknown as ServiceType,
    AccessoryInformation: jest.fn() as unknown as ServiceType,
  },
  Characteristic: {
    On: { UUID: 'On' } as WithUUID<new () => any>,
    CurrentTemperature: { UUID: 'CurrentTemperature' } as WithUUID<new () => any>,
    CurrentRelativeHumidity: { UUID: 'CurrentRelativeHumidity' } as WithUUID<new () => any>,
    Manufacturer: { UUID: 'Manufacturer' } as WithUUID<new () => any>,
    Model: { UUID: 'Model' } as WithUUID<new () => any>,
    SerialNumber: { UUID: 'SerialNumber' } as WithUUID<new () => any>,
  },
};

interface MockCharacteristic {
  onSet: jest.Mock<MockCharacteristic, [(value: CharacteristicValue) => Promise<void>]>;
  onGet: jest.Mock<MockCharacteristic>;
  updateValue: jest.Mock;
  updateCharacteristic: jest.Mock;
}

const createMockCharacteristic = (): MockCharacteristic => ({
  onSet: jest.fn().mockReturnThis(),
  onGet: jest.fn().mockReturnThis(),
  updateValue: jest.fn(),
  updateCharacteristic: jest.fn(),
});

interface MockService {
  getCharacteristic: (characteristic: WithUUID<new () => any>) => MockCharacteristic;
  setCharacteristic: (characteristic: WithUUID<new () => any>, value: CharacteristicValue) => MockService;
  updateCharacteristic: (characteristic: WithUUID<new () => any>, value: CharacteristicValue) => void;
}

const createMockService = (): MockService => ({
  getCharacteristic: jest.fn().mockReturnValue(createMockCharacteristic()),
  setCharacteristic: jest.fn().mockReturnThis(),
  updateCharacteristic: jest.fn(),
});

const mockAccessory = {
  getService: jest.fn().mockImplementation((service: ServiceType | string) => {
    if (service === mockPlatform.Service.AccessoryInformation) {
      const infoService = createMockService();
      return infoService;
    }
    return null;
  }),
  addService: jest.fn().mockImplementation(() => createMockService()),
};

// Mock API client
const mockSendCommand = jest.fn().mockResolvedValue(undefined);
const mockGetEnvironmentSensorData = jest.fn().mockResolvedValue({
  temperature: 22,
  humidity: 45,
});
const mockGetDeviceInfo = jest.fn().mockResolvedValue({
  productFeatures: ['env_sensors'],
  motorMeta: {
    capabilities: [{
      side: 1,
      maxHeadAngle: 60,
      maxFootAngle: 45,
    }],
  },
});

jest.mock('../src/api/client', () => {
  return {
    SleepTrackerClient: jest.fn().mockImplementation(() => ({
      sendCommand: mockSendCommand,
      getDeviceInfo: mockGetDeviceInfo,
      getEnvironmentSensorData: mockGetEnvironmentSensorData,
    })),
  };
});

describe('SleepTrackerAccessory', () => {
  let accessory: SleepTrackerAccessory;
  let headUpService: MockService;
  let infoService: MockService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Create mock services
    headUpService = createMockService();
    infoService = createMockService();
    
    // Setup mock implementations
    mockAccessory.getService.mockImplementation((service: ServiceType | string) => {
      if (service === mockPlatform.Service.AccessoryInformation) {
        return infoService;
      }
      if (service === 'Head Up') {
        return null;
      }
      return null;
    });
    
    mockAccessory.addService.mockImplementation((service: ServiceType, name: string) => {
      if (name === 'Head Up') {
        return headUpService;
      }
      return createMockService();
    });
    
    accessory = new SleepTrackerAccessory(mockPlatform as any, mockAccessory as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should set up accessory information', () => {
      expect(infoService.setCharacteristic).toHaveBeenCalledWith(
        mockPlatform.Characteristic.Manufacturer,
        'SleepTracker'
      );
      expect(infoService.setCharacteristic).toHaveBeenCalledWith(
        mockPlatform.Characteristic.Model,
        'Smart Bed'
      );
      expect(infoService.setCharacteristic).toHaveBeenCalledWith(
        mockPlatform.Characteristic.SerialNumber,
        mockPlatform.config.deviceId
      );
    });
  });

  describe('Head Position Control', () => {
    it('should send head up command when activated', async () => {
      const onSetHandler = headUpService.getCharacteristic(mockPlatform.Characteristic.On).onSet;
      const setHandler = onSetHandler.mock.calls[0][0];
      
      await setHandler(true);
      
      expect(mockSendCommand).toHaveBeenCalledWith(
        mockPlatform.config.deviceId,
        Commands.HeadUp,
      );
    });

    it('should send stop command when deactivated', async () => {
      const onSetHandler = headUpService.getCharacteristic(mockPlatform.Characteristic.On).onSet;
      const setHandler = onSetHandler.mock.calls[0][0];
      
      await setHandler(false);
      
      expect(mockSendCommand).toHaveBeenCalledWith(
        mockPlatform.config.deviceId,
        Commands.Stop,
      );
    });
  });

  describe('Environment Sensors', () => {
    it('should update temperature and humidity values', async () => {
      // Wait for initialization
      await Promise.resolve();
      jest.advanceTimersByTime(1000);
      
      expect(mockGetDeviceInfo).toHaveBeenCalled();
      
      const temperatureService = mockAccessory.addService.mock.calls.find(
        call => call[1] === 'Temperature'
      );
      const humidityService = mockAccessory.addService.mock.calls.find(
        call => call[1] === 'Humidity'
      );
      
      expect(temperatureService).toBeTruthy();
      expect(temperatureService![0]).toBe(mockPlatform.Service.TemperatureSensor);
      expect(temperatureService![2]).toBe('temperature');
      
      expect(humidityService).toBeTruthy();
      expect(humidityService![0]).toBe(mockPlatform.Service.HumiditySensor);
      expect(humidityService![2]).toBe('humidity');

      // Trigger update interval
      jest.advanceTimersByTime(30000);
      
      expect(mockGetEnvironmentSensorData).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should retry failed commands', async () => {
      mockSendCommand
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(undefined);

      const onSetHandler = headUpService.getCharacteristic(mockPlatform.Characteristic.On).onSet;
      const setHandler = onSetHandler.mock.calls[0][0];
      
      const commandPromise = setHandler(true);
      
      // Wait for the first attempt to fail
      await Promise.resolve();
      
      // Advance timer for retry delay
      jest.advanceTimersByTime(1000);
      
      // Wait for the retry attempt
      await commandPromise;
      
      expect(mockSendCommand).toHaveBeenCalledTimes(2);
      expect(mockPlatform.log.warn).toHaveBeenCalled();
    });
  });
}); 