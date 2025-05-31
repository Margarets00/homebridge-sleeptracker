# Homebridge SleepTracker Plugin

[English](README.md) | [한국어](README.ko.md)

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

---

# 홈브릿지 슬립트래커 플러그인

Apple HomeKit을 통해 SleepTracker 스마트 침대를 제어할 수 있는 홈브릿지 플러그인입니다. 홈 앱에서 침대 위치 조절, 프리셋 설정, 환경 센서 모니터링 등을 할 수 있습니다.

## 기능

- 머리/발 위치 조절
- 프리셋 위치 (평평하게, 제로G, 코골이 방지, TV 시청)
- 환경 센서 지원 (온도 및 습도, 지원 모델에 한함)
- HomeKit을 통한 직관적인 제어

## 설치 방법

홈브릿지 Config UI X를 통해 설치하거나 수동으로 설치할 수 있습니다:

```bash
npm install -g homebridge-sleeptracker
```

## 설정

홈브릿지 config.json에 다음 내용을 추가하세요:

```json
{
    "platforms": [
        {
            "platform": "SleepTracker",
            "name": "SleepTracker",
            "username": "이메일주소",
            "password": "비밀번호",
            "deviceId": "기기ID",
            "enableEnvironmentSensors": true,
            "refreshInterval": 30
        }
    ]
}
```

### 설정 옵션

- `username`: SleepTracker 계정 이메일
- `password`: SleepTracker 계정 비밀번호
- `deviceId`: 침대의 기기 ID
- `enableEnvironmentSensors`: (선택) 온도/습도 센서 활성화 (지원 모델에 한함)
- `refreshInterval`: (선택) 센서 업데이트 주기(초) (기본값: 30)

## 사용 방법

설치 및 설정 후:

1. 홈브릿지 재시작
2. 홈 앱에 침대가 표시됨
3. 스위치로 침대 위치 조절:
   - 머리 올리기/내리기
   - 발 올리기/내리기
4. 프리셋 버튼으로 빠른 위치 변경:
   - 평평하게
   - 제로G
   - 코골이 방지
   - TV 시청

## 지원

버그 신고, 기능 요청 또는 문의사항은 [이슈 페이지](https://github.com/Margarets00/homebridge-sleeptracker/issues)를 이용해 주세요.

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다 - 자세한 내용은 LICENSE 파일을 참조하세요.

## 면책 조항

이 플러그인은 비공식 플러그인이며 SleepTracker 또는 그 모회사와 제휴, 보증 또는 연관되어 있지 않습니다. 사용상의 책임은 사용자에게 있습니다. 