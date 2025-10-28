import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS, FONTS, SHADOWS } from '../styles/commonStyles';

const { width } = Dimensions.get('window');

export default function MenuScreen({ navigation }) {
  const [selectedPeriod, setSelectedPeriod] = useState('Weekly');
  const [selectedMeal, setSelectedMeal] = useState('Bữa sáng');
  const [periodModalVisible, setPeriodModalVisible] = useState(false);
  const [mealModalVisible, setMealModalVisible] = useState(false);

  const periodOptions = ['Daily', 'Weekly', 'Monthly'];
  const mealOptions = ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Bữa phụ'];

  // Dữ liệu biểu đồ dinh dưỡng
  const nutritionData = [
    { day: 'Sun', value: 65 },
    { day: 'Mon', value: 78 },
    { day: 'Tue', value: 82 },
    { day: 'Wed', value: 75 },
    { day: 'Thu', value: 88, active: true },
    { day: 'Fri', value: 72 },
    { day: 'Sat', value: 80 },
  ];

  // Dữ liệu thống kê dinh dưỡng
  const nutritionStats = [
    { name: 'Calories', value: '82%', trend: '+' },
    { name: 'Fibre', value: '88%', trend: '+' },
    { name: 'Sugar', value: '39%', trend: '+' },
    { name: 'Fats', value: '42%', trend: '+' },
  ];

  // Dữ liệu món ăn hôm nay
  const todayMeals = [
    {
      id: 1,
      name: 'Salmon Nigiri',
      time: 'Today | 7am',
      icon: '🍣',
      hasNotification: true,
    },
    {
      id: 2,
      name: 'Lowfat Milk',
      time: 'Today | 8am',
      icon: '🥛',
      hasNotification: false,
    },
  ];

  const renderNutritionChart = () => (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Dinh dưỡng bữa ăn</Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setPeriodModalVisible(true)}
        >
          <Text style={styles.dropdownText}>{selectedPeriod}</Text>
          <Feather name="chevron-down" size={16} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      {/* Biểu đồ đơn giản */}
      <View style={styles.chartArea}>
        <View style={styles.chartBars}>
          {nutritionData.map((item, index) => (
            <View key={item.day} style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: item.value * 1.5,
                    backgroundColor: item.active ? COLORS.primary : '#E6E7F2'
                  }
                ]} 
              />
              <Text style={[
                styles.barLabel,
                item.active && styles.barLabelActive
              ]}>
                {item.day}
              </Text>
            </View>
          ))}
        </View>

        {/* Thống kê dinh dưỡng */}
        <View style={styles.nutritionStats}>
          {nutritionStats.map((stat, index) => (
            <View key={stat.name} style={styles.statCard}>
              <Text style={styles.statName}>{stat.name}</Text>
              <Text style={styles.statValue}>{stat.value} {stat.trend}</Text>
              <View style={styles.statBar} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTodayMenu = () => (
    <TouchableOpacity 
      style={styles.todayMenuCard}
      onPress={() => navigation.navigate('MenuDetail')}
    >
      <Text style={styles.todayMenuText}>Thực đơn hôm nay</Text>
      <TouchableOpacity style={styles.checkButton}>
        <Text style={styles.checkButtonText}>Kiểm tra</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderTodayMeals = () => (
    <View style={styles.mealsSection}>
      <View style={styles.mealsHeader}>
        <Text style={styles.mealsTitle}>Món ăn hôm nay</Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setMealModalVisible(true)}
        >
          <Text style={styles.dropdownText}>{selectedMeal}</Text>
          <Feather name="chevron-down" size={16} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      <View style={styles.mealsList}>
        {todayMeals.map((meal) => (
          <View key={meal.id} style={styles.mealCard}>
            <View style={styles.mealIcon}>
              <Text style={styles.mealIconText}>{meal.icon}</Text>
            </View>
            <View style={styles.mealInfo}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealTime}>{meal.time}</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons 
                name={meal.hasNotification ? "notifications" : "notifications-off"} 
                size={20} 
                color={meal.hasNotification ? COLORS.primary : COLORS.lightGray} 
              />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPeriodModal = () => (
    <Modal
      transparent
      visible={periodModalVisible}
      animationType="fade"
      onRequestClose={() => setPeriodModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Chọn khoảng thời gian</Text>
          <FlatList
            data={periodOptions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedPeriod(item);
                  setPeriodModalVisible(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  item === selectedPeriod && styles.modalItemTextActive
                ]}>
                  {item}
                </Text>
                {item === selectedPeriod && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderMealModal = () => (
    <Modal
      transparent
      visible={mealModalVisible}
      animationType="fade"
      onRequestClose={() => setMealModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Chọn bữa ăn</Text>
          <FlatList
            data={mealOptions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedMeal(item);
                  setMealModalVisible(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  item === selectedMeal && styles.modalItemTextActive
                ]}>
                  {item}
                </Text>
                {item === selectedMeal && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thực Đơn</Text>
        <TouchableOpacity 
          style={styles.foodButton}
          onPress={() => navigation.navigate('Food')}
        >
          <Feather name="coffee" size={18} color={COLORS.white} />
          <Text style={styles.foodButtonText}>Món Ăn</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderNutritionChart()}
        {renderTodayMenu()}
        {renderTodayMeals()}
      </ScrollView>

      {renderPeriodModal()}
      {renderMealModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    ...SHADOWS.small,
  },
  foodButtonText: {
    fontSize: 12,
    fontWeight: FONTS.semiBold,
    color: COLORS.white,
    marginLeft: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Chart styles
  chartContainer: {
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dropdownText: {
    fontSize: 12,
    color: COLORS.gray,
    marginRight: 4,
  },
  chartArea: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.small,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  barLabelActive: {
    color: COLORS.primary,
    fontWeight: FONTS.semiBold,
  },
  nutritionStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statName: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: FONTS.bold,
    color: COLORS.black,
    marginBottom: 6,
  },
  statBar: {
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  // Today menu styles
  todayMenuCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  todayMenuText: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.white,
  },
  checkButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  checkButtonText: {
    fontSize: 12,
    fontWeight: FONTS.semiBold,
    color: COLORS.white,
  },

  // Meals section styles
  mealsSection: {
    marginBottom: 20,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  mealsTitle: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  mealsList: {
    gap: 12,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  mealIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealIconText: {
    fontSize: 24,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: FONTS.semiBold,
    color: COLORS.black,
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  notificationButton: {
    padding: 8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalItemText: {
    fontSize: 14,
    color: COLORS.black,
  },
  modalItemTextActive: {
    color: COLORS.primary,
    fontWeight: FONTS.semiBold,
  },
});
