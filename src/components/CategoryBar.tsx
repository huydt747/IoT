import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { DEVICE_CATEGORIES, DeviceCategory } from '../config/categories';

interface CategoryBarProps {
  activeId?: string;
  onSelect?: (category: DeviceCategory) => void;
  categories?: DeviceCategory[];
}

export default function CategoryBar({
  activeId = 'thermostat',
  onSelect,
  categories = DEVICE_CATEGORIES,
}: CategoryBarProps) {
  const handlePress = (cat: DeviceCategory) => {
    if (onSelect) {
      onSelect(cat);
    } else if (cat.route) {
      router.push(cat.route as any);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const isActive = cat.id === activeId;
          const IconComp = cat.icon;
          const iconColor = isActive ? '#ff3b30' : '#94a3b8';

          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.7}
              onPress={() => handlePress(cat)}
              style={[styles.item, isActive && styles.itemActive]}
            >
              <IconComp
                size={22}
                color={iconColor}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {cat.label}
              </Text>
              {isActive && <View style={styles.activeUnderline} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  scrollContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minWidth: '100%',
  },
  item: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    position: 'relative',
  },
  itemActive: {},
  label: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 5,
  },
  labelActive: {
    color: '#ff3b30',
    fontWeight: '800',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: -6,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#ff3b30',
  },
});
