# RAILSENSE

### Smart Wagon Loading & Safety Monitoring System

RAILSENSE is an IoT-based smart loading system designed to improve the **safety, accuracy, and automation of wagon loading operations**. It combines embedded hardware with a real-time web dashboard for continuous monitoring and control.

## Overview

The system uses an **ESP32** as the central controller and integrates RFID authentication, load-cell based weight measurement, IR wagon detection, and a servo-controlled loading gate.

Real-time sensor data is transmitted to a **React-based monitoring dashboard using WebSocket communication**.

## Key Features

* RFID-based wagon identification and authorization
* Real-time load measurement using HX711 + Load Cell
* Automatic overload detection and safety response
* IR-based wagon arrival detection
* Automated servo gate control
* Real-time ESP32 ↔ Dashboard communication
* Live system status and event monitoring
* Visual load progress and operational states

## System Flow

```text
Wagon Detection
      ↓
RFID Authentication
      ↓
Loading Gate Control
      ↓
Live Weight Monitoring
      ↓
┌───────────────┬────────────────┐
│  ≤ 100% Load  │  > 100% Load   │
│               │                │
│ Ready/Loading │ Overload Alert │
└───────────────┴────────────────┘
      ↓
Wagon Departure
```

## Technology Stack

**Hardware**
ESP32 · HX711 · Load Cell · RFID Reader · IR Sensors · Servo Motor

**Software**
React · JavaScript · Tailwind CSS · WebSocket · Lucide React

## Getting Started

```bash
git clone https://github.com/Ayush9863/RAILSENSE.git
cd RAILSENSE
npm install
npm run dev
```

Configure the ESP32 WebSocket endpoint in the frontend:

```js
const [wsUrl, setWsUrl] = useState("ws://YOUR-ESP32-IP:81");
```

Ensure the ESP32 and the dashboard are connected to the same network during local deployment.

## Project Structure

```text
RAILSENSE/
├── src/
├── public/
├── package.json
└── README.md
```

## Author

**Ayush Rao**
GitHub: [Ayush9863](https://github.com/Ayush9863)

---

Built with **ESP32, IoT, React, and real-time WebSocket communication**.
