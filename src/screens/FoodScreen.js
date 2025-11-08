import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { mealAPI, mealScheduleAPI } from '../services/api';
import { COLORS, FONTS, SHADOWS } from '../styles/commonStyles';

export default function FoodScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState('');
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedModalMealType, setSelectedModalMealType] = useState('');
  const [mealTypeModalVisible, setMealTypeModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [addingMeal, setAddingMeal] = useState(false);

  // Nhóm các loại bữa ăn
  const categories = [
    { key: '', name: 'Tất cả', icon: '🍽️', color: '#E3F2FD' },
    { key: 'Bữa sáng', name: 'Bữa sáng', icon: '🍳', color: '#FFE0E6' },
    { key: 'Bữa trưa', name: 'Bữa trưa', icon: '🍚', color: '#F3E5F5' },
    { key: 'Bữa tối', name: 'Bữa tối', icon: '🌙', color: '#FFF3E0' },
    { key: 'Bữa phụ', name: 'Bữa phụ', icon: '🥤', color: '#E8F5E8' },
  ];

  // Meal types for modal (không có "Tất cả")
  const mealTypes = [
    { key: 'Bữa sáng', name: 'Bữa sáng', icon: '🍳', color: '#FFE0E6' },
    { key: 'Bữa trưa', name: 'Bữa trưa', icon: '🍚', color: '#F3E5F5' },
    { key: 'Bữa tối', name: 'Bữa tối', icon: '🌙', color: '#FFF3E0' },
    { key: 'Bữa phụ', name: 'Bữa phụ', icon: '🥤', color: '#E8F5E8' },
  ];

  // Initialize date and time when modal opens
  const handleOpenModal = (meal) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const hh = String(today.getHours()).padStart(2, '0');
    const min = String(today.getMinutes()).padStart(2, '0');
    
    setSelectedMeal(meal);
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
    setSelectedTime(`${hh}:${min}`);
    setSelectedModalMealType(meal.meal_type || meal.mealType || '');
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedMeal(null);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedModalMealType('');
  };

  const handleAddToMenu = async () => {
    if (!selectedDate || !selectedTime || !selectedModalMealType) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin (ngày, giờ, bữa ăn)');
      return;
    }

    setAddingMeal(true);
    try {
      const mealData = {
        mealId: selectedMeal._id || selectedMeal.id,
        date: selectedDate,
        time: selectedTime,
        meal_type: selectedModalMealType,
      };

      await mealScheduleAPI.create(mealData);
      Alert.alert('Thành công', 'Đã thêm món ăn vào thực đơn');
      handleCloseModal();
    } catch (err) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể thêm món ăn vào thực đơn');
    } finally {
      setAddingMeal(false);
    }
  };

  React.useEffect(() => {
    const fetchMeals = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await mealAPI.getAllMeals();
        setMeals(res.data);
      } catch (err) {
        setError('Không thể tải danh sách món ăn');
      } finally {
        setLoading(false);
      }
    };
    fetchMeals();
  }, []);


  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Feather name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm tên món"
          placeholderTextColor={COLORS.gray}
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Feather name="sliders" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render lại Category thành loại bữa ăn
  const renderCategories = () => (
    <View style={styles.categoriesSection}>
      <Text style={styles.sectionTitle}>Loại bữa ăn</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryCard,
              selectedMealType === category.key && { borderColor: COLORS.primary, borderWidth: 2 }
            ]}
            onPress={() => setSelectedMealType(category.key)}
          >
            <View style={[styles.categoryIcon, { backgroundColor: category.color }]}> 
              <Text style={styles.categoryIconText}>{category.icon}</Text>
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Filter foodList theo loại bữa ăn + từ khóa tìm kiếm
  const renderFoodList = () => (
    <View style={styles.foodListSection}>
      <Text style={styles.sectionTitle}>Danh sách món ăn</Text>
      <View style={styles.foodList}>
        {loading ? (
          <Text>Đang tải...</Text>
        ) : error ? (
          <Text style={{ color: 'red' }}>{error}</Text>
        ) : (() => {
            let filtered = meals;
            if (selectedMealType) {
              filtered = filtered.filter(meal => (meal.meal_type || meal.mealType) && (meal.meal_type||meal.mealType) === selectedMealType);
            }
            if (searchText.trim()) {
              filtered = filtered.filter(meal => meal.name?.toLowerCase().includes(searchText.toLowerCase()));
            }
            if (filtered.length === 0) return <Text>Không có món ăn nào.</Text>;
            return filtered.map((meal) => (
              <TouchableOpacity 
                key={meal._id || meal.id} 
                style={styles.foodItem}
                onPress={() => handleOpenModal(meal)}
              >
                <View style={styles.foodItemIcon}>
                  {meal.image_url ? (
                    <Image
                      source={{ uri: meal.image_url }}
                      style={styles.foodItemImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.foodItemIconText}>{meal.icon || '🍽️'}</Text>
                  )}
                </View>
                <View style={styles.foodItemContent}>
                  <Text style={styles.foodItemTitle}>{meal.name}</Text>
                  {/* Hiển thị loại bữa */}
                  {(meal.meal_type || meal.mealType) && (
                    <Text style={styles.foodItemSubtitle}>Bữa: {meal.meal_type || meal.mealType}</Text>
                  )}
                  {/* Hiển thị mô tả nếu có */}
                  {meal.description && (
                    <Text style={styles.foodItemDescription}>{meal.description}</Text>
                  )}
                  {/* Hiển thị calories nếu có */}
                  {meal.calories && (<Text style={styles.foodItemSubtitle}>{meal.calories} kcal</Text>)}
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
              </TouchableOpacity>
            ));
          })()}
      </View>
    </View>
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
        <Text style={styles.headerTitle}>Món Ăn</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="more-vertical" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSearchBar()}
        {renderCategories()}
        {renderFoodList()}
      </ScrollView>

      {/* Add to Menu Modal */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm vào thực đơn</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            {selectedMeal && (
              <View style={styles.modalMealInfo}>
                <Text style={styles.modalMealName}>{selectedMeal.name}</Text>
                {selectedMeal.calories && (
                  <Text style={styles.modalMealCalories}>{selectedMeal.calories} kcal</Text>
                )}
              </View>
            )}

            {/* Date Input */}
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>Ngày</Text>
              <TouchableOpacity
                style={styles.modalDateButton}
                onPress={() => setCalendarModalVisible(true)}
              >
                <Text style={[
                  styles.modalDateText,
                  !selectedDate && { color: COLORS.gray }
                ]}>
                  {selectedDate || 'Chọn ngày'}
                </Text>
                <Feather name="calendar" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            {/* Time Input */}
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>Giờ</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="HH:MM"
                placeholderTextColor={COLORS.gray}
                value={selectedTime}
                onChangeText={setSelectedTime}
              />
            </View>

            {/* Meal Type Selector */}
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>Bữa ăn</Text>
              <TouchableOpacity
                style={styles.modalMealTypeButton}
                onPress={() => setMealTypeModalVisible(true)}
              >
                <Text style={[
                  styles.modalMealTypeText,
                  !selectedModalMealType && { color: COLORS.gray }
                ]}>
                  {selectedModalMealType || 'Chọn bữa ăn'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            {/* Add Button */}
            <TouchableOpacity
              style={[styles.modalAddButton, addingMeal && styles.modalAddButtonDisabled]}
              onPress={handleAddToMenu}
              disabled={addingMeal}
            >
              <Text style={styles.modalAddButtonText}>
                {addingMeal ? 'Đang thêm...' : 'Thêm vào thực đơn'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Meal Type Selection Modal */}
        <Modal
          transparent
          visible={mealTypeModalVisible}
          animationType="fade"
          onRequestClose={() => setMealTypeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Chọn bữa ăn</Text>
              <ScrollView>
                {mealTypes.map((mealType) => (
                  <TouchableOpacity
                    key={mealType.key}
                    style={styles.modalMealTypeItem}
                    onPress={() => {
                      setSelectedModalMealType(mealType.key);
                      setMealTypeModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.modalMealTypeItemText,
                      selectedModalMealType === mealType.key && styles.modalMealTypeItemTextActive
                    ]}>
                      {mealType.icon} {mealType.name}
                    </Text>
                    {selectedModalMealType === mealType.key && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Calendar Modal */}
        <Modal
          transparent
          visible={calendarModalVisible}
          animationType="slide"
          onRequestClose={() => setCalendarModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.calendarModalCard}>
              <View style={styles.calendarModalHeader}>
                <Text style={styles.modalTitle}>Chọn ngày</Text>
                <TouchableOpacity onPress={() => setCalendarModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.black} />
                </TouchableOpacity>
              </View>
              <Calendar
                onDayPress={(day) => {
                  setSelectedDate(day.dateString);
                  setCalendarModalVisible(false);
                }}
                markedDates={
                  selectedDate
                    ? {
                        [selectedDate]: {
                          selected: true,
                          selectedColor: COLORS.primary,
                        },
                      }
                    : {}
                }
                theme={{
                  todayTextColor: COLORS.primary,
                  arrowColor: COLORS.primary,
                  textDayFontFamily: 'System',
                  textMonthFontWeight: 'bold',
                  selectedDayBackgroundColor: COLORS.primary,
                  selectedDayTextColor: COLORS.white,
                }}
              />
            </View>
          </View>
        </Modal>
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
    paddingTop: 50,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Search bar
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  filterButton: {
    padding: 4,
  },

  // Categories
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: FONTS.bold,
    color: COLORS.black,
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: FONTS.semiBold,
    color: COLORS.black,
    textAlign: 'center',
  },

  // Food list
  foodListSection: {
    marginBottom: 20,
  },
  foodList: {
    gap: 12,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  foodItemIcon: {
    overflow: 'hidden',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: COLORS.inputBackground,
  },
  foodItemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  foodItemIconText: {
    fontSize: 20,
  },
  foodItemContent: {
    flex: 1,
  },
  foodItemTitle: {
    fontSize: 16,
    fontWeight: FONTS.semiBold,
    color: COLORS.black,
    marginBottom: 4,
  },
  foodItemSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
  },
  foodItemDescription: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  modalMealInfo: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalMealName: {
    fontSize: 16,
    fontWeight: FONTS.semiBold,
    color: COLORS.black,
    marginBottom: 4,
  },
  modalMealCalories: {
    fontSize: 14,
    color: COLORS.gray,
  },
  modalInputContainer: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: FONTS.semiBold,
    color: COLORS.black,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalDateButton: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalDateText: {
    fontSize: 16,
    color: COLORS.black,
  },
  modalMealTypeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalMealTypeText: {
    fontSize: 16,
    color: COLORS.black,
  },
  modalMealTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalMealTypeItemText: {
    fontSize: 16,
    color: COLORS.black,
  },
  modalMealTypeItemTextActive: {
    color: COLORS.primary,
    fontWeight: FONTS.semiBold,
  },
  modalAddButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalAddButtonDisabled: {
    opacity: 0.6,
  },
  modalAddButtonText: {
    fontSize: 16,
    fontWeight: FONTS.semiBold,
    color: COLORS.white,
  },
  calendarModalCard: {
    width: '90%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});
