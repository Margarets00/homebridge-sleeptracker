# 홈브릿지 슬립트래커 플러그인

이 플러그인을 통해 슬립트래커 스마트 침대를 HomeKit으로 제어할 수 있습니다. 홈 앱을 통해 침대 위치 조절, 프리셋 포지션 설정, 환경 센서 모니터링이 가능합니다.

## 기능

- **위치 제어**
  - 헤드 업/다운
  - 풋 업/다운
  - 동작 정지
  
- **프리셋 포지션**
  - 플랫
  - 제로 G
  - 코골이 방지
  - TV 포지션

- **환경 센서** (침대가 지원하는 경우)
  - 온도
  - 습도

## 요구사항

- Node.js v16 이상
- Homebridge v1.6.0 이상
- WiFi 연결이 가능한 슬립트래커 스마트 침대

## 설치

1. homebridge 설치 (아직 설치하지 않은 경우):
```bash
npm install -g homebridge
```

2. 플러그인 설치:
```bash
npm install -g homebridge-sleeptracker
```

3. Homebridge config.json 업데이트:
```json
{
  "platforms": [
    {
      "platform": "SleepTracker",
      "name": "SleepTracker",
      "username": "이메일_주소",
      "password": "비밀번호",
      "deviceId": "기기_ID",
      "enableEnvironmentSensors": true,
      "refreshInterval": 30
    }
  ]
}
```

## 설정

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|-------|------|----------|---------|-------------|
| platform | string | 예 | - | "SleepTracker"로 설정 |
| name | string | 예 | - | 플랫폼 이름 |
| username | string | 예 | - | 슬립트래커 계정 이메일 |
| password | string | 예 | - | 슬립트래커 계정 비밀번호 |
| deviceId | string | 예 | - | 침대의 기기 ID |
| enableEnvironmentSensors | boolean | 아니오 | false | 온도/습도 센서 활성화 |
| refreshInterval | number | 아니오 | 30 | 센서 업데이트 간격(초) |

## 사용법

### 위치 제어
플러그인은 헤드와 풋 위치 제어를 위한 별도의 스위치를 생성합니다:
- 헤드 업/다운: 누르면 동작 시작, 해제(끄기)하면 정지
- 풋 업/다운: 누르면 동작 시작, 해제(끄기)하면 정지

### 프리셋 포지션
각 프리셋 포지션은 스위치로 표시됩니다:
- 스위치를 켜면 해당 포지션으로 이동
- 동작이 완료되면 스위치는 자동으로 꺼짐

### 환경 센서
침대가 환경 센서를 지원하고 설정에서 활성화된 경우:
- 온도와 습도가 별도의 센서로 표시됨
- 설정된 새로고침 간격에 따라 값이 업데이트됨

## 문제 해결

### 일반적인 문제

1. **연결 실패**
   - 네트워크 연결 확인
   - config.json의 인증 정보 확인
   - 침대가 WiFi에 연결되어 있는지 확인

2. **동작이 작동하지 않음**
   - 침대 전원이 켜져 있는지 확인
   - 장애물이 없는지 확인
   - 침대가 잠금 상태가 아닌지 확인

3. **센서가 표시되지 않음**
   - 침대 모델이 환경 센서를 지원하는지 확인
   - enableEnvironmentSensors가 true로 설정되어 있는지 확인
   - 설정 변경 후 Homebridge 재시작

### 디버그 로그

디버그 로그를 활성화하려면 Homebridge config.json에 다음을 추가하세요:
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

## 지원

문제가 발생하거나 질문이 있는 경우:
1. [문제 해결](#문제-해결) 섹션 확인
2. 기존 GitHub 이슈 검색
3. 새 이슈 생성 시 포함할 내용:
   - Homebridge 로그
   - 플러그인 버전
   - 침대 모델
   - 문제 설명

## 기여

기여는 언제나 환영합니다! Pull Request를 자유롭게 제출해 주세요.

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다 - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 면책 조항

이 플러그인은 슬립트래커 또는 그 모회사와 제휴, 보증 또는 연결되어 있지 않습니다. 사용상의 책임은 사용자에게 있습니다. 