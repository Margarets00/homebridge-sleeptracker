# Homebridge SleepTracker Plugin

This is a Homebridge plugin for SleepTracker smart beds. Control your smart bed features through Apple HomeKit.

## Features

- Control head and foot position
- Preset positions (TV, Zero G, Flat)
- Environment sensors (temperature and humidity) if supported
- Auto-refresh status

## Installation

1. Install the plugin:
```bash
cd ~
git clone https://github.com/yourusername/homebridge-sleeptracker.git
cd homebridge-sleeptracker
npm install
npm run build
npm link
```

2. Configure the plugin in Homebridge UI:
```json
{
    "platforms": [
        {
            "platform": "SleepTracker",
            "name": "SleepTracker",
            "username": "your-email@example.com",
            "password": "your-password",
            "deviceId": "your-device-id",
            "refreshInterval": 30,
            "enableEnvironmentSensors": true
        }
    ]
}
```

## Configuration

- `username`: Your SleepTracker account email
- `password`: Your SleepTracker account password
- `deviceId`: Your bed's processor ID
- `refreshInterval`: Status update interval in seconds (default: 30)
- `enableEnvironmentSensors`: Enable temperature and humidity sensors if supported (default: true)

## Support

For bugs and feature requests, please open an issue on GitHub. 