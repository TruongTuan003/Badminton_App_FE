import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS, FONTS, SHADOWS } from '../styles/commonStyles';
import { mealAPI } from '../services/api';

export default function FoodScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState('');

  // Nhóm các loại bữa ăn
  const categories = [
    { key: '', name: 'Tất cả', icon: '🍽️', color: '#E3F2FD' },
    { key: 'Bữa sáng', name: 'Bữa sáng', icon: '🍳', color: '#FFE0E6' },
    { key: 'Bữa trưa', name: 'Bữa trưa', icon: '🍚', color: '#F3E5F5' },
    { key: 'Bữa tối', name: 'Bữa tối', icon: '🌙', color: '#FFF3E0' },
    { key: 'Bữa phụ', name: 'Bữa phụ', icon: '🥤', color: '#E8F5E8' },
  ];

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

  // Dữ liệu danh sách món ăn
  const foodItems = [
    {
      id: 1,
      title: "Hey, it's time for lunch",
      subtitle: "About 1 minutes ago",
      icon: '🍓',
      iconBg: '#FFE0E6'
    },
    {
      id: 2,
      title: "Don't miss your lowerbody workout",
      subtitle: "About 3 hours ago",
      icon: '🏃‍♀️',
      iconBg: '#E8F5E8'
    },
    {
      id: 3,
      title: "Hey, let's add some meals for your b..",
      subtitle: "About 3 hours ago",
      icon: '🥞',
      iconBg: '#FFF8E1'
    }
  ];

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
          <Feather name="sliders-horizontal" size={20} color={COLORS.gray} />
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
              <TouchableOpacity key={meal._id || meal.id} style={styles.foodItem}>
                <View style={styles.foodItemIcon}>
                  <Text style={styles.foodItemIconText}>{meal.icon || '🍽️'}</Text>
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
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
});
