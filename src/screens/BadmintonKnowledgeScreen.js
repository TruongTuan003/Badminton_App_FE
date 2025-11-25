import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KNOWLEDGE_CONTENT } from '../data/knowledgeContent';
import { COLORS, FONTS } from '../styles/commonStyles';

export default function BadmintonKnowledgeScreen({ navigation, route }) {
  const { categoryId } = route.params || {};

  const initialIndex = React.useMemo(() => {
    const idx = KNOWLEDGE_CONTENT.findIndex((item) => item.id === categoryId);
    return idx >= 0 ? idx : 0;
  }, [categoryId]);

  const [activeIndex, setActiveIndex] = React.useState(initialIndex);

  const activeCategory =
    KNOWLEDGE_CONTENT[activeIndex] || KNOWLEDGE_CONTENT[0];

  React.useEffect(() => {
    if (!KNOWLEDGE_CONTENT.length) return undefined;

    const interval = setInterval(() => {
      setActiveIndex((prev) =>
        prev + 1 >= KNOWLEDGE_CONTENT.length ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCategoryPress = (category) => {
    const idx = KNOWLEDGE_CONTENT.findIndex((item) => item.id === category.id);
    if (idx >= 0) {
      setActiveIndex(idx);
    }
    navigation.navigate('BadmintonKnowledgeDetail', { categoryId: category.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#9DCEFF', '#92A3FD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Kiến thức cầu lông</Text>
            <Text style={styles.headerSubtitle}>
              Học hỏi và nâng cao kỹ năng
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Highlight card */}
        <LinearGradient
          colors={activeCategory?.gradient || ['#EEF6FF', '#F3F5FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.spotlightCard}
        >
          <Text style={styles.spotlightLabel}>Chủ đề nổi bật</Text>
          <Text style={styles.spotlightTitle}>{activeCategory?.title}</Text>
          <Text style={styles.spotlightSubtitle}>
            {activeCategory?.heroSubtitle ||
              'Khám phá kiến thức then chốt để cải thiện trận đấu.'}
          </Text>
          <View style={styles.spotlightActions}>
            <View style={styles.badge}>
              <Feather name="zap" size={16} color="#FFFFFF" />
              <Text style={styles.badgeText}>Nâng trình nhanh</Text>
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                navigation.navigate('BadmintonKnowledgeDetail', {
                  categoryId: activeCategory?.id,
                })
              }
            >
              <Text style={styles.primaryButtonText}>Khám phá ngay</Text>
              <Feather
                name="arrow-right"
                size={16}
                color="#FFFFFF"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.indicatorContainer}>
          {KNOWLEDGE_CONTENT.map((category, index) => {
            const isActive = index === activeIndex;
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.indicatorDot,
                  isActive && [
                    styles.indicatorDotActive,
                    { backgroundColor: category.color },
                  ],
                ]}
                onPress={() => setActiveIndex(index)}
                activeOpacity={0.8}
              />
            );
          })}
        </View>

        {KNOWLEDGE_CONTENT.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(category)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={category.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.categoryCardGradient}
            >
              <View style={styles.categoryContent}>
                <View style={styles.categoryLeft}>
                  <View
                    style={[
                      styles.categoryIconContainer,
                      { backgroundColor: `${category.color}15` },
                    ]}
                  >
                    {category.iconType === 'Feather' ? (
                      <Feather
                        name={category.icon}
                        size={24}
                        color={category.color}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={category.icon}
                        size={24}
                        color={category.color}
                      />
                    )}
                  </View>
                  <View style={styles.categoryTextContainer}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categorySubtitle}>
                      {category.subtitle}
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryRight}>
                  <Text style={styles.categoryDescription}>
                    {category.description}
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={category.color}
                  />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: FONTS.medium,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollViewContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  spotlightCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    ...{
      shadowColor: '#92A3FD',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  spotlightLabel: {
    color: '#1D1617',
    opacity: 0.6,
    fontSize: 13,
    fontWeight: FONTS.medium,
    marginBottom: 4,
  },
  spotlightTitle: {
    fontSize: 22,
    fontWeight: FONTS.bold,
    color: '#1D1617',
    marginBottom: 8,
  },
  spotlightSubtitle: {
    color: '#4D4D4D',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  spotlightActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  indicatorDotActive: {
    width: 22,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#92A3FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: FONTS.medium,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D1617',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: FONTS.semiBold,
  },
  categoryCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryCardGradient: {
    padding: 20,
    borderRadius: 20,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: FONTS.bold,
    color: '#1D1617',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 13,
    color: '#7B6F72',
    fontWeight: FONTS.medium,
  },
  categoryRight: {
    alignItems: 'flex-end',
    maxWidth: 120,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#7B6F72',
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 16,
  },
  bottomSpacing: {
    height: 20,
  },
});

