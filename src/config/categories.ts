import React from 'react';
import {
  Thermometer,
  Refrigerator,
  Lightbulb,
  Bell,
  LucideIcon,
} from 'lucide-react-native';

export interface DeviceCategory {
  id: 'thermostat' | 'door' | 'light' | 'alarm';
  label: string;
  sub: string;
  pin: string;
  icon: LucideIcon;
  route?: string;
  accentColor: string;
}

/**
 * Danh mục chức năng phần cứng thực tế (Khớp 100% với ArduinoCode.ino)
 * - Pin 15: DHT22 (Nhiệt độ & Độ ẩm)
 * - Pin 14: Cảm biến nút nhấn cửa kho
 * - Pin 18 & 34: Đèn kho lạnh & Cảm biến ánh sáng LDR
 * - Pin 4 & 2: Còi hú Buzzer & Đèn LED đỏ cảnh báo
 */
export const DEVICE_CATEGORIES: DeviceCategory[] = [
  {
    id: 'thermostat',
    label: 'Thermostat',
    sub: 'Nhiệt độ & Độ ẩm',
    pin: 'DHT22 - Pin 15',
    icon: Thermometer,
    route: '/temperature',
    accentColor: '#ff3b30',
  },
  {
    id: 'door',
    label: 'Cửa Kho',
    sub: 'Cảm biến mở cửa',
    pin: 'Button - Pin 14',
    icon: Refrigerator,
    route: '/door',
    accentColor: '#ffa502',
  },
  {
    id: 'light',
    label: 'Đèn Kho',
    sub: 'Chiếu sáng tự động',
    pin: 'Relay - Pin 18',
    icon: Lightbulb,
    accentColor: '#eab308',
  },
  {
    id: 'alarm',
    label: 'Còi Báo',
    sub: 'Báo động & LED',
    pin: 'Buzzer 4 & LED 2',
    icon: Bell,
    route: '/alerts',
    accentColor: '#ef4444',
  },
];
