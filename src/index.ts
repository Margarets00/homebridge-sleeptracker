import { API } from 'homebridge';
import { PLATFORM_NAME, SleepTrackerPlatform } from './platform';

export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, SleepTrackerPlatform);
}; 