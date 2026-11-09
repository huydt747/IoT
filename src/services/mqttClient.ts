import { MqttHandlers, MqttUnsubscribe } from './mqttTypes';

export function connectToColdStorageMqtt(_handlers: MqttHandlers): MqttUnsubscribe {
  return () => {};
}
