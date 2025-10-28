import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SHADOWS } from '../styles/commonStyles';

export default function MenuDetailScreen({ navigation }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = React.useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [selectedDateIndex, setSelectedDateIndex] = React.useState(3);
  const [pickerVisible, setPickerVisible] = React.useState(false);

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  
  function clampDay(year, month, day) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return Math.max(1, Math.min(day, lastDay));
  }

  function getWeekDays(centerDate) {
    const year = centerDate.getFullYear();
    const month = centerDate.getMonth();
    // tạo dải 7 ngày xung quanh ngày đang chọn (-3..+3), giữ trong tháng
    const startDay = clampDay(year, month, centerDate.getDate() - 3);
    const daysArr = [];
    for (let i = 0; i < 7; i++) {
      const d = clampDay(year, month, startDay + i);
      const dateObj = new Date(year, month, d);
      const dow = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      daysArr.push({ label: dow, date: String(d), dateObj });
    }
    return daysArr;
  }

  const days = getWeekDays(selectedDate);

  // Dữ liệu món ăn theo ngày
  const getMealsForDate = (date) => {
    const dateStr = date.toDateString();
    const mealsData = {
      [new Date(2024, 4, 12).toDateString()]: [
        {
          id: 1,
          mealType: 'Breakfast',
          mealTypeVi: 'Bữa sáng',
          summary: '2 meals | 230 calories',
          items: [
            { id: 1, name: 'Honey Pancake', time: '07:00am', icon: '🥞', calories: 180 },
            { id: 2, name: 'Coffee', time: '07:30am', icon: '☕', calories: 50 }
          ]
        },
        {
          id: 2,
          mealType: 'Lunch',
          mealTypeVi: 'Bữa trưa',
          summary: '2 meals | 500 calories',
          items: [
            { id: 3, name: 'Chicken Steak', time: '01:00pm', icon: '🍗', calories: 400 },
            { id: 4, name: 'Milk', time: '01:20pm', icon: '🥛', calories: 100 }
          ]
        },
        {
          id: 3,
          mealType: 'Snacks',
          mealTypeVi: 'Bữa phụ',
          summary: '2 meals | 140 calories',
          items: [
            { id: 5, name: 'Orange', time: '04:30pm', icon: '🍊', calories: 60 },
            { id: 6, name: 'Apple Pie', time: '04:40pm', icon: '🥧', calories: 80 }
          ]
        },
        {
          id: 4,
          mealType: 'Dinner',
          mealTypeVi: 'Bữa tối',
          summary: '2 meals | 120 calories',
          items: [
            { id: 7, name: 'Salad', time: '07:10pm', icon: '🥗', calories: 50 },
            { id: 8, name: 'Oatmeal', time: '08:10pm', icon: '🥣', calories: 70 }
          ]
        }
      ],
      [new Date(2024, 4, 13).toDateString()]: [
        {
          id: 1,
          mealType: 'Breakfast',
          mealTypeVi: 'Bữa sáng',
          summary: '2 meals | 200 calories',
          items: [
            { id: 1, name: 'Toast with Butter', time: '07:00am', icon: '🍞', calories: 150 },
            { id: 2, name: 'Orange Juice', time: '07:30am', icon: '🍊', calories: 50 }
          ]
        },
        {
          id: 2,
          mealType: 'Lunch',
          mealTypeVi: 'Bữa trưa',
          summary: '2 meals | 450 calories',
          items: [
            { id: 3, name: 'Fish and Rice', time: '01:00pm', icon: '🐟', calories: 350 },
            { id: 4, name: 'Green Tea', time: '01:20pm', icon: '🍵', calories: 100 }
          ]
        }
      ]
    };
    return mealsData[dateStr] || [];
  };

  const currentMeals = getMealsForDate(selectedDate);

  // Dữ liệu dinh dưỡng hôm nay
  const todayNutrition = {
    calories: { value: 320, unit: 'kCal', progress: 60, icon: '🔥' },
    proteins: { value: 300, unit: 'g', progress: 80, icon: '🍗' },
    fats: { value: 150, unit: 'g', progress: 40, icon: '🥚' }
  };

  function changeMonth(delta) {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setCurrentMonth(m);
    setCurrentYear(y);
    const midDay = clampDay(y, m, 15);
    const newDate = new Date(y, m, midDay);
    setSelectedDate(newDate);
    setSelectedDateIndex(3);
  }

  function openPicker() {
    setPickerVisible(true);
  }

  function onPickMonthYear(m, y) {
    setCurrentMonth(m);
    setCurrentYear(y);
    const midDay = clampDay(y, m, 15);
    const newDate = new Date(y, m, midDay);
    setSelectedDate(newDate);
    setSelectedDateIndex(3);
    setPickerVisible(false);
  }

  const renderMealSection = (meal) => (
    <View key={meal.id} style={styles.mealSection}>
      <View style={styles.mealHeader}>
        <Text style={styles.mealTypeTitle}>{meal.mealType}</Text>
        <Text style={styles.mealSummary}>{meal.summary}</Text>
      </View>
      
      <View style={styles.mealItems}>
        {meal.items.map((item) => (
          <TouchableOpacity key={item.id} style={styles.mealItem}>
            <View style={styles.mealItemLeft}>
              <View style={styles.mealItemIcon}>
                <Text style={styles.mealItemIconText}>{item.icon}</Text>
              </View>
              <View style={styles.mealItemInfo}>
                <Text style={styles.mealItemName}>{item.name}</Text>
                <Text style={styles.mealItemTime}>{item.time}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderNutritionSection = () => (
    <View style={styles.nutritionSection}>
      <Text style={styles.nutritionTitle}>Today Meal Nutritions</Text>
      
      <View style={styles.nutritionItems}>
        {Object.entries(todayNutrition).map(([key, nutrition]) => (
          <View key={key} style={styles.nutritionItem}>
            <View style={styles.nutritionIcon}>
              <Text style={styles.nutritionIconText}>{nutrition.icon}</Text>
            </View>
            <View style={styles.nutritionInfo}>
              <Text style={styles.nutritionValue}>{nutrition.value} {nutrition.unit}</Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${nutrition.progress}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thực đơn</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="more-vertical" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {/* Month selector */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Feather name="chevron-left" size={18} color={COLORS.gray} />
        </TouchableOpacity>
        <TouchableOpacity onPress={openPicker}>
          <Text style={styles.monthText}>{`${monthNames[currentMonth]} ${currentYear}`}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Feather name="chevron-right" size={18} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      {/* Day pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysRow}
      >
        {days.map((d, idx) => {
          const active = idx === selectedDateIndex;
          return (
            <TouchableOpacity
              key={`${d.label}-${d.date}`}
              style={[styles.dayPill, active && styles.dayPillActive]}
              onPress={() => {
                setSelectedDateIndex(idx);
                setSelectedDate(d.dateObj);
              }}
            >
              <Text style={[styles.dayPillLabel, active && styles.dayPillLabelActive]}>{d.label}</Text>
              <Text style={[styles.dayPillDate, active && styles.dayPillDateActive]}>{d.date}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Meals for selected date */}
        {currentMeals.length > 0 ? (
          currentMeals.map(renderMealSection)
        ) : (
          <View style={styles.noMealsContainer}>
            <Text style={styles.noMealsText}>Không có món ăn nào cho ngày này</Text>
          </View>
        )}

        {/* Nutrition section */}
        {renderNutritionSection()}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Feather name="plus" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Month/Year Picker Modal */}
      <Modal transparent visible={pickerVisible} animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chọn tháng/năm</Text>
            <View style={styles.pickerRow}>
              <FlatList
                data={monthNames.map((n, i) => ({ name: n, value: i }))}
                keyExtractor={(item) => String(item.value)}
                style={styles.pickerList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.pickerItem, item.value === currentMonth && styles.pickerItemActive]}
                    onPress={() => setCurrentMonth(item.value)}
                  >
                    <Text style={[styles.pickerItemText, item.value === currentMonth && styles.pickerItemTextActive]}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
              <FlatList
                data={Array.from({ length: 11 }, (_, i) => 2020 + i)}
                keyExtractor={(item) => String(item)}
                style={styles.pickerList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.pickerItem, item === currentYear && styles.pickerItemActive]}
                    onPress={() => setCurrentYear(item)}
                  >
                    <Text style={[styles.pickerItemText, item === currentYear && styles.pickerItemTextActive]}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonGhost} onPress={() => setPickerVisible(false)}>
                <Text style={styles.modalButtonGhostText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => onPickMonthYear(currentMonth, currentYear)}>
                <Text style={styles.modalButtonText}>Xong</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  monthText: {
    marginHorizontal: 10,
    color: COLORS.gray,
  },
  daysRow: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dayPill: {
    width: 70,
    height: 84,
    borderRadius: 16,
    backgroundColor: COLORS.inputBackground,
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayPillActive: {
    backgroundColor: COLORS.primary,
  },
  dayPillLabel: {
    color: COLORS.gray,
    marginBottom: 2,
  },
  dayPillLabelActive: {
    color: COLORS.white,
  },
  dayPillDate: {
    color: COLORS.black,
    fontWeight: FONTS.semiBold,
    fontSize: 18,
  },
  dayPillDateActive: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Meal sections
  mealSection: {
    marginBottom: 20,
  },
  mealHeader: {
    marginBottom: 12,
  },
  mealTypeTitle: {
    fontSize: 18,
    fontWeight: FONTS.bold,
    color: COLORS.black,
    marginBottom: 4,
  },
  mealSummary: {
    fontSize: 14,
    color: COLORS.gray,
  },
  mealItems: {
    gap: 8,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  mealItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealItemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealItemIconText: {
    fontSize: 24,
  },
  mealItemInfo: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 16,
    fontWeight: FONTS.semiBold,
    color: COLORS.black,
    marginBottom: 4,
  },
  mealItemTime: {
    fontSize: 12,
    color: COLORS.gray,
  },

  // Nutrition section
  nutritionSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.black,
    marginBottom: 16,
  },
  nutritionItems: {
    gap: 16,
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nutritionIconText: {
    fontSize: 20,
  },
  nutritionInfo: {
    flex: 1,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: FONTS.semiBold,
    color: COLORS.black,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },

  // No meals
  noMealsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noMealsText: {
    fontSize: 16,
    color: COLORS.gray,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: FONTS.semiBold,
    color: COLORS.black,
    marginBottom: 10,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerList: {
    height: 220,
    width: '48%',
  },
  pickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  pickerItemActive: {
    backgroundColor: '#EEF6FF',
  },
  pickerItemText: {
    color: COLORS.black,
  },
  pickerItemTextActive: {
    color: COLORS.primary,
    fontWeight: FONTS.bold,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 10,
  },
  modalButtonText: {
    color: COLORS.white,
    fontWeight: FONTS.semiBold,
  },
  modalButtonGhost: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalButtonGhostText: {
    color: COLORS.gray,
    fontWeight: FONTS.semiBold,
  },
  bottomSpacing: {
    height: 100,
  },
});
