# RAILSENSE

### Smart Wagon Loading & Safety Monitoring System

RAILSENSE is an IoT-enabled smart wagon loading and safety monitoring system designed to make loading operations **safer, more accurate, and automated**.

The system combines an **ESP32-based control unit** with RFID authentication, real-time load measurement, wagon detection, automated gate control, and a web-based monitoring dashboard.

## Overview

RAILSENSE continuously monitors the wagon loading process and provides real-time operational feedback through a React dashboard.

The system detects an incoming wagon, verifies its RFID, controls the loading gate, monitors the load in real time, and responds automatically to safe-load and overload conditions.

## Key Features

* RFID-based wagon authentication
* Real-time load measurement using HX711 and Load Cell
* IR-based wagon detection
* Automated servo-controlled loading gate
* Real-time overload detection
* ESP32 to dashboard communication via WebSocket
* Live system and component status monitoring
* Real-time event logging and load visualization

## System Workflow

```text
Wagon Detection
       ↓
RFID Authentication
       ↓
Loading Gate Control
       ↓
Continuous Weight Monitoring
       ↓
   Load Evaluation
    ↙          ↘
Safe Load      Overload
    ↓             ↓
Continue       Stop Loading
 Loading       + Protection
    ↓
Ready to Depart
    ↓
Wagon Departure
```

## Technology Stack

| Layer          | Technologies      |
| -------------- | ----------------- |
| Controller     | ESP32             |
| Weight Sensing | Load Cell + HX711 |
| Identification | RFID              |
| Detection      | IR Sensors        |
| Actuation      | Servo Motor       |
| Frontend       | React, JavaScript |
| Styling        | Tailwind CSS      |
| Communication  | WebSocket         |
| UI Icons       | Lucide React      |

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/Ayush9863/RailSense.git
cd RailSense
```

### Install Dependencies

```bash
npm install
```

### Start the Development Server

```bash
npm run dev
```

### Configure ESP32

Set the ESP32 WebSocket endpoint in the frontend:

```js
const [wsUrl, setWsUrl] = useState("ws://YOUR-ESP32-IP:81");
```

For local testing, ensure the ESP32 and the system running the dashboard are connected to the same network.

## Project

**RAILSENSE** bridges embedded hardware and real-time web monitoring to provide a practical approach to automated and safety-focused wagon loading.

## Author

**Ayush Rao**
[GitHub — Ayush9863](https://github.com/Ayush9863)

---

### RAILSENSE

**Smarter Monitoring. Safer Loading. Automated Operations.**
