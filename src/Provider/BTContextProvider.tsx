import React, { useState, createContext, useContext, ReactNode } from 'react';
import { BluetoothService, BluetoothDevice } from '../services/BluetoothService';

export interface BTContextType {
  device: BluetoothDevice | undefined;
  deviceId: string | undefined;
  scannedDevices: BluetoothDevice[];
  connectedDevice: string;
  isConnected: boolean;
}

export const DeviceContext = createContext<BTContextType>({
  device: undefined,
  deviceId: undefined,
  scannedDevices: [],
  connectedDevice: '',
  isConnected: false,
});

const SelectDeviceContext = createContext<(device: BluetoothDevice | undefined) => void>(() => {});
const SetScannedDeviceContext = createContext<(devices: BluetoothDevice[]) => void>(() => {});
const OnDeviceConnectContext = createContext<(connectedName: string) => void>(() => {});
const DisconnectDeviceContext = createContext<(disconnected?: boolean) => Promise<void>>(async () => {});
const SendDataContext = createContext<(msg: string) => Promise<void>>(async () => {});

export function useSelectDevice() {
  return useContext(SelectDeviceContext);
}

export function useDisconnectDevice() {
  return useContext(DisconnectDeviceContext);
}

export function useSendData() {
  return useContext(SendDataContext);
}

export function useSetScannedDevice() {
  return useContext(SetScannedDeviceContext);
}

export function useOnDeviceConnect() {
  return useContext(OnDeviceConnectContext);
}

interface BTContextProviderProps {
  children: ReactNode;
}

export default function BTContextProvider({ children }: BTContextProviderProps) {
  const [device, setDevice] = useState<BluetoothDevice | undefined>(undefined);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [scannedDevices, setScannedDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  function selectDevice(selected: BluetoothDevice | undefined) {
    setDevice(selected);
    setDeviceId(selected ? selected.id : undefined);
  }

  function setScanned(devices: BluetoothDevice[]) {
    setScannedDevices(devices);
  }

  function onConnect(name: string) {
    setConnectedDevice(name);
    setIsConnected(!!name);
  }

  async function disconnectDevice(alreadyDisconnected = false) {
    try {
      if (!alreadyDisconnected && device) {
        if (typeof device.disconnect === 'function') {
          await device.disconnect();
        } else if (typeof BluetoothService.disconnectDevice === 'function') {
          await BluetoothService.disconnectDevice(device.address);
        }
      }
      onConnect('');
      setDevice(undefined);
      setDeviceId(undefined);
    } catch (err) {
      console.warn('Disconnect error:', err);
    }
  }

  async function writeData(msg: string) {
    try {
      if (device) {
        await BluetoothService.writeToDevice(device.address, msg);
      } else {
        // Fallback or demo write
        await BluetoothService.writeToDevice('00:00:00:00:00:00', msg);
      }
    } catch (e) {
      console.warn('Write error:', e);
    }
  }

  return (
    <DeviceContext.Provider
      value={{
        device,
        deviceId,
        scannedDevices,
        connectedDevice,
        isConnected,
      }}
    >
      <SetScannedDeviceContext.Provider value={setScanned}>
        <SelectDeviceContext.Provider value={selectDevice}>
          <OnDeviceConnectContext.Provider value={onConnect}>
            <DisconnectDeviceContext.Provider value={disconnectDevice}>
              <SendDataContext.Provider value={writeData}>
                {children}
              </SendDataContext.Provider>
            </DisconnectDeviceContext.Provider>
          </OnDeviceConnectContext.Provider>
        </SelectDeviceContext.Provider>
      </SetScannedDeviceContext.Provider>
    </DeviceContext.Provider>
  );
}
