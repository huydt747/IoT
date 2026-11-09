import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { hp, wp } from '../../utils/responsive';
import Icon from '../../components/Icon';
import { useSendData } from '../../Provider/BTContextProvider';

interface ButtonState {
  [key: string]: boolean;
}

export default function ControlScreen() {
  const [activeStates, setActiveStates] = useState<ButtonState>({
    debug: false,
    bulb: false,
    tv: false,
    speaker: false,
    alarm: false,
    lock: false,
    temperature: false,
    security: false,
    weather: false,
  });

  const sendData = useSendData();

  const handlePress = (key: string, command: string, toggle = true) => {
    sendData(command);
    if (toggle) {
      setActiveStates((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    } else {
      // Flash momentary active state
      setActiveStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setActiveStates((prev) => ({ ...prev, [key]: false }));
      }, 400);
    }
  };

  const renderButton = (
    key: string,
    label: string,
    iconName: string,
    command: string,
    isToggle: boolean = true
  ) => {
    const isActive = activeStates[key];
    return (
      <TouchableOpacity
        key={key}
        onPress={() => handlePress(key, command, isToggle)}
        activeOpacity={0.7}
        style={[
          styles.buttonContainer,
          isActive ? styles.buttonActive : styles.buttonInactive,
        ]}
      >
        <Icon
          name={iconName}
          size={hp('4%')}
          color={isActive ? '#fff' : '#2d3436'}
        />
        <Text
          style={[
            styles.buttonLabel,
            isActive ? styles.labelActive : styles.labelInactive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.buttonsContainer}>
        {renderButton('debug', 'Debug', 'bug-outline', 'A', true)}
        {renderButton('bulb', 'Bulb', 'bulb-outline', 'B', true)}
        {renderButton('tv', 'TV', 'tv-outline', 'F', false)}
      </View>
      <View style={styles.buttonsContainer}>
        {renderButton('speaker', 'Speaker', 'musical-notes-outline', 'O', false)}
        {renderButton('alarm', 'Alarm', 'alarm-outline', 'F', false)}
        {renderButton('lock', 'Lock', 'lock-closed-outline', 'F', true)}
      </View>
      <View style={styles.buttonsContainer}>
        {renderButton('temperature', 'Temperature', 'thermometer-outline', 'O', false)}
        {renderButton('security', 'Security', 'finger-print-outline', 'F', true)}
        {renderButton('weather', 'Weather', 'cloudy-outline', 'F', false)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    height: hp('52%'),
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 10,
  },
  buttonsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  buttonContainer: {
    width: wp('26%'),
    height: hp('13%'),
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonInactive: {
    backgroundColor: '#ffffff',
  },
  buttonActive: {
    backgroundColor: '#1dd1a1',
  },
  buttonLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  labelInactive: {
    color: '#2d3436',
  },
  labelActive: {
    color: '#ffffff',
  },
});
