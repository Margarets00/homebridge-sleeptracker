# Homebridge SleepTracker Plugin

[English](README.md) | [한국어](README.ko.md)

[![npm version](https://badge.fury.io/js/homebridge-sleeptracker.svg)](https://badge.fury.io/js/homebridge-sleeptracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build and Test](https://github.com/Margarets00/homebridge-sleeptracker/actions/workflows/build.yml/badge.svg)](https://github.com/Margarets00/homebridge-sleeptracker/actions/workflows/build.yml)
[![CodeQL](https://github.com/Margarets00/homebridge-sleeptracker/actions/workflows/codeql.yml/badge.svg)](https://github.com/Margarets00/homebridge-sleeptracker/actions/workflows/codeql.yml)

This plugin allows you to control your SleepTracker smart bed through HomeKit. Control bed positions, access preset positions, and monitor environment sensors all through the Home app.

## Features

- **Position Control**
  - Head Up/Down
  - Foot Up/Down
  - Stop movement
  
- **Preset Positions**
  - Flat
  - Zero G
  - Anti-Snore
  - TV Position

- **Environment Sensors** (if supported by your bed)
  - Temperature
  - Humidity

## Requirements

- Node.js v16 or later
- Homebridge v1.6.0 or later
- SleepTracker smart bed with WiFi connectivity

## Installation

1. Install homebridge (if not already installed):
```bash
npm install -g homebridge
```

2. Install this plugin:
```bash
npm install -g homebridge-sleeptracker
```

3. Update your Homebridge config.json:
```json
{
  "platforms": [
    {
      "platform": "SleepTracker",
      "name": "SleepTracker",
      "username": "YOUR_EMAIL",
      "password": "YOUR_PASSWORD",
      "deviceId": "YOUR_DEVICE_ID",
      "enableEnvironmentSensors": true,
      "refreshInterval": 30
    }
  ]
}
```

## Getting Your Device ID

Before configuring the plugin, you'll need to get your SleepTracker device ID. You can obtain this using the [sleeptracker-tools](https://github.com/Margarets00/sleeptracker-tools) utility:

1. Install the utility:
```bash
npx sleeptracker-tools
```

2. Follow the prompts to log in with your SleepTracker credentials
3. The tool will display your device ID along with other bed information
4. Copy the device ID and use it in your Homebridge configuration

## Configuration

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| platform | string | Yes | - | Must be "SleepTracker" |
| name | string | Yes | - | Name of your platform |
| username | string | Yes | - | Your SleepTracker account email |
| password | string | Yes | - | Your SleepTracker account password |
| deviceId | string | Yes | - | Your bed's device ID |
| enableEnvironmentSensors | boolean | No | false | Enable temperature and humidity sensors |
| refreshInterval | number | No | 30 | Sensor update interval in seconds |

## Usage

### Position Control
The plugin creates separate switches for head and foot position control:
- Head Up/Down: Press to start movement, release (turn off) to stop
- Foot Up/Down: Press to start movement, release (turn off) to stop

### Preset Positions
Each preset position is represented as a switch:
- Turn on the switch to move to that position
- The switch will automatically turn off after the movement is complete

### Environment Sensors
If your bed supports environment sensors and they are enabled in the config:
- Temperature and humidity will be displayed as separate sensors
- Values update according to the configured refresh interval

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check your network connection
   - Verify your credentials in config.json
   - Ensure your bed is connected to WiFi

2. **Movement Not Working**
   - Check if the bed is powered on
   - Verify there are no obstructions
   - Ensure the bed is not in a locked state

3. **Sensors Not Showing**
   - Verify your bed model supports environment sensors
   - Check if enableEnvironmentSensors is set to true
   - Restart Homebridge after changing configuration

### Debug Logs

To enable debug logs, add the following to your Homebridge config.json:
```json
{
  "platforms": [
    {
      "platform": "SleepTracker",
      "debug": true,
      ...
    }
  ]
}
```

## Support

If you encounter any issues or have questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing GitHub issues
3. Create a new issue with:
   - Your Homebridge logs
   - Plugin version
   - Bed model
   - Description of the problem

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This plugin is not affiliated with, endorsed by, or connected to SleepTracker or its parent company. Use at your own risk.
