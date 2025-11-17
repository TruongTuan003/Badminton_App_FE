import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { mealAPI, mealScheduleAPI } from '../services/api';
import { COLORS, FONTS, SHADOWS } from '../styles/commonStyles';

const { width } = Dimensions.get('window');

export default function MenuScreen({ navigation }) {
  const [selectedPeriod, setSelectedPeriod] = useState('Weekly');
  const [selectedMeal, setSelectedMeal] = useState('');
  const [periodModalVisible, setPeriodModalVisible] = useState(false);
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayMeals, setTodayMeals] = useState([]);
  const [loadingTodayMeals, setLoadingTodayMeals] = useState(true);
  const [errorTodayMeals, setErrorTodayMeals] = useState(null);

  // TÍNH nutritionData cho biểu đồ: calories từng ngày trong tuần (7 ngày gần nhất)
  const [nutritionData, setNutritionData] = React.useState([]);
  const [nutritionStats, setNutritionStats] = React.useState([]);
  const [totalCalories, setTotalCalories] = React.useState(0);

  React.useEffect(() => {
    const fetchMeals = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await mealAPI.getAllMeals();
        setMeals(res.data);
      } catch (err) {
        setError('Không thể tải danh sách món ăn');
        setMeals([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMeals();
  }, []);

  const loadTodayMeals = React.useCallback(async () => {
    setLoadingTodayMeals(true);
    setErrorTodayMeals(null);
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const res = await mealScheduleAPI.getByDate(dateStr);
      setTodayMeals(res.data || []);
      // Không tự động chọn bữa – mặc định hiển thị tất cả
    } catch (err) {
      setErrorTodayMeals('Không thể tải thực đơn hôm nay');
      setTodayMeals([]);
    } finally {
      setLoadingTodayMeals(false);
    }
  }, []);

  React.useEffect(() => {
    loadTodayMeals();
  }, [loadTodayMeals]);

  useFocusEffect(
    React.useCallback(() => {
      // Refetch mỗi khi màn hình lấy focus trở lại
      loadTodayMeals();
      return undefined;
    }, [loadTodayMeals])
  );

  React.useEffect(() => {
    // Chỉ tính khi todayMeals thay đổi
    // Xác định ngày hôm nay và 6 ngày trước đó
    const daysOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const today = new Date();
    const weekDates = [];
    for(let i=6; i>=0; --i) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      weekDates.push(new Date(d));
    }
    let sumCalories=0, sumProteins=0, sumFats=0, sumCarbs=0;
    todayMeals.forEach(meal => {
      const m = meal.mealId || {};
      sumCalories += m.calories ? Number(m.calories) : 0;
      sumProteins += m.protein ? Number(m.protein) : 0;
      sumFats += m.fat ? Number(m.fat) : 0;
      sumCarbs += m.carbs ? Number(m.carbs) : 0;
    });
    const nutritionChart = weekDates.map((dateObj,i) => ({
        day: daysOfWeek[dateObj.getDay()],
        value: sumCalories,
        active: i===6
    }));
    setNutritionData(nutritionChart);
    // Tính các stats
    setNutritionStats([
      { name: 'Năng lượng', value: sumCalories+' kcal', trend: '' },
      { name: 'Đạm', value: sumProteins+' g', trend: '' },
      { name: 'Chất béo', value: sumFats+' g', trend: '' },
      { name: 'Tinh bột', value: sumCarbs+' g', trend: '' },
    ]);
    // --- Tổng calories hôm nay ---
    setTotalCalories(sumCalories);
  }, [todayMeals]);

  const periodOptions = ['Daily', 'Weekly', 'Monthly'];
  const mealOptions = ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Bữa phụ'];
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
        <Text style={{fontWeight:'bold',fontSize:15,marginTop:8,alignSelf:'center'}}>Tổng calories hôm nay: {totalCalories} kcal</Text>
      </View>
    </View>
  );

  const renderTodayMenu = () => (
    <TouchableOpacity 
      style={styles.todayMenuCard}
    >
      <Text style={styles.todayMenuText}>Thực đơn hôm nay</Text>
      <TouchableOpacity 
      style={styles.checkButton} 
      onPress={() => navigation.navigate('MenuDetail')}
      >
        <Text style={styles.checkButtonText}>Kiểm tra</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderTodayMeals = () => {
    // Lọc theo selectedMeal nếu có
    let filteredMeals = todayMeals;
    if (selectedMeal && todayMeals && todayMeals.length && selectedMeal !== '') {
      filteredMeals = todayMeals.filter(meal => {
        const type = meal.meal_type || meal.mealType || meal.mealId?.meal_type || meal.mealId?.mealType;
        return type === selectedMeal;
      });
    }
    return (
      <View style={styles.mealsSection}>
        <View style={styles.mealsHeader}>
          <Text style={styles.mealsTitle}>Món ăn hôm nay</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setMealModalVisible(true)}
          >
            <Text style={styles.dropdownText}>{selectedMeal || 'Tất cả'}</Text>
            <Feather name="chevron-down" size={16} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.mealsList}>
          {loadingTodayMeals ? (
            <Text>Đang tải...</Text>
          ) : errorTodayMeals ? (
            <Text style={{ color: 'red' }}>{errorTodayMeals}</Text>
          ) : filteredMeals.length === 0 ? (
            <Text>Không có món ăn hôm nay!</Text>
          ) : filteredMeals.map((meal) => (
            <View key={meal._id || meal.id} style={styles.mealCard}>
              <View style={styles.mealIcon}>
                {meal.mealId?.image_url ? (
                  <Image
                    source={{ uri: meal.mealId.image_url }}
                    style={styles.mealImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.mealIconText}>{meal.mealId?.icon || '🍽️'}</Text>
                )}
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{meal.mealId?.name}</Text>
                {/* Hiển thị loại bữa */}
                {(meal.meal_type || meal.mealType || meal.mealId?.meal_type || meal.mealId?.mealType) && (
                  <Text style={styles.mealTime}>Bữa: {meal.meal_type || meal.mealType || meal.mealId?.meal_type || meal.mealId?.mealType}{meal.time ? ' - ' + meal.time : ''}</Text>
                )}
                {/* Thêm mô tả nếu có */}
                {meal.mealId?.description && (
                  <Text style={styles.mealDesc}>{meal.mealId.description}</Text>
                )}
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
  }

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
                  if (item === 'Tất cả') {
                    setSelectedMeal('');
                  } else {
                    setSelectedMeal(item);
                  }
                  setMealModalVisible(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  ((item === 'Tất cả' && selectedMeal === '') || item === selectedMeal) && styles.modalItemTextActive
                ]}>
                  {item}
                </Text>
                {((item === 'Tất cả' && selectedMeal === '') || item === selectedMeal) && (
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
      <TouchableOpacity
       style={styles.fab}
       onPress={() => navigation.navigate("MealPlanSelect")}
       >
        <Feather name="plus" size={26} color="#FFFFFF" />
      </TouchableOpacity>
      {renderPeriodModal()}
      {renderMealModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
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
  marginBottom: 12,    // giảm từ 15 -> 12
},
chartTitle: {
  fontSize: 16,
  fontWeight: FONTS.bold,
  color: COLORS.black,
  marginBottom: 0,      // loại bỏ nếu đang có
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
  paddingTop: 32,         // Thêm PADDING TOP lớn cho phía trên bar
  ...SHADOWS.small,
},
chartBars: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  height: 90,             // giảm từ 150 -> 90
  marginBottom: 6,        // giảm từ 20 -> 6
  marginTop: 0,           // loại bỏ mọi marginTop để sát phần trên
},
barContainer: {
  alignItems: 'center',
  flex: 1,
},
bar: {
  width: 20,
  borderRadius: 10,
  marginBottom: 0,        // sát đáy luôn, không thừa
},
barLabel: {
  fontSize: 12,
  color: COLORS.gray,
  marginTop: 10,         // tăng lên, tách label khỏi đáy cột
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
    overflow: 'hidden',
  },
  mealImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  mealDesc: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
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
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
});
