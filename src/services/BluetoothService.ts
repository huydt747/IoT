import { Platform } from 'react-native';

export interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
  bonded: boolean;
  disconnect?: () => Promise<void>;
}

// Simulated mock devices for development in Expo Go, Simulator, and Web
const MOCK_DEVICES: BluetoothDevice[] = [
  {
    id: '00:14:03:05:5A:12',
    name: 'ArduiNode-BT',
    address: '00:14:03:05:5A:12',
    bonded: true,
  },
  {
    id: '98:D3:31:F4:2E:88',
    name: 'HC-05 Relay Board',
    address: '98:D3:31:F4:2E:88',
    bonded: true,
  },
  {
    id: '20:19:08:14:3B:4C',
    name: 'HC-06 Workshop',
    address: '20:19:08:14:3B:4C',
    bonded: false,
  },
  {
    id: '24:6F:28:A1:B2:C3',
    name: 'ESP32 Smart Switch',
    address: '24:6F:28:A1:B2:C3',
    bonded: false,
  },
];

class SimulatedBluetoothService {
  private connectedDeviceId: string | null = null;
  public readonly isSimulated = true;

  async startDiscovery(): Promise<BluetoothDevice[]> {
    // Simulate radio discovery scan delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return MOCK_DEVICES;
  }

  async stopDiscovery(): Promise<boolean> {
    return true;
  }

  async isDeviceConnected(address: string): Promise<boolean> {
    return this.connectedDeviceId === address;
  }

  async connectToDevice(
    address: string,
    _options?: Record<string, unknown>
  ): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    this.connectedDeviceId = address;
    return true;
  }

  async disconnectDevice(address?: string): Promise<void> {
    if (!address || this.connectedDeviceId === address) {
      this.connectedDeviceId = null;
    }
  }

  async writeToDevice(address: string, message: string): Promise<boolean> {
    const meaning =
      message === 'A'
        ? 'Relay 1 Toggle'
        : message === 'B'
        ? 'Relay 2 Toggle'
        : message === 'F'
        ? 'Function Command'
        : message === 'O'
        ? 'Read Sensor'
        : `Command: ${message}`;
    console.log(`[Bluetooth] Data sent to ${address}: '${message}' (${meaning})`);
    return true;
  }
}

// Safely try to load native bluetooth library if linked in dev build
let nativeModule: any = null;
try {
  // @ts-ignore
  nativeModule = require('react-native-bluetooth-classic')?.default || require('react-native-bluetooth-classic');
} catch {
  nativeModule = null;
}

export const BluetoothService = nativeModule || new SimulatedBluetoothService();
export const isBluetoothSimulated = !nativeModule;
