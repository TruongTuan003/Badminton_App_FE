import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KNOWLEDGE_CONTENT } from '../data/knowledgeContent';
import { COLORS, FONTS, SHADOWS } from '../styles/commonStyles';

export default function BadmintonKnowledgeDetailScreen({ navigation, route }) {
  const { categoryId } = route.params || {};
  const category =
    KNOWLEDGE_CONTENT.find((item) => item.id === categoryId) ||
    KNOWLEDGE_CONTENT[0];

  const renderSection = (section) => (
    <View key={section.title} style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
      {section.items?.map((item, index) => (
        <View key={`${section.title}-${index}`} style={styles.sectionItem}>
          <View style={styles.bullet} />
          <Text style={styles.sectionItemText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  const renderFeatured = () => {
    if (!category?.featured) return null;
    return (
      <View style={styles.featuredContainer}>
        <View style={styles.featuredHeader}>
          <Text style={styles.featuredTitle}>Gương mặt tiêu biểu</Text>
          <View style={styles.featuredBadge}>
            <Feather name="star" size={14} color="#FFD166" />
            <Text style={styles.featuredBadgeText}>Inspire</Text>
          </View>
        </View>
        <FlatList
          data={category.featured}
          keyExtractor={(item) => item.name}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
          renderItem={({ item }) => (
            <LinearGradient
              colors={category.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featuredCard}
            >
              <Text style={styles.featuredName}>{item.name}</Text>
              <Text style={styles.featuredMeta}>{item.country}</Text>
              <View style={styles.featuredDivider} />
              <Text style={styles.featuredStrength}>{item.strength}</Text>
            </LinearGradient>
          )}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={category?.gradient || ['#EEF6FF', '#F3F5FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <TouchableOpacity
              style={styles.heroBack}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={20} color="#1D1617" />
            </TouchableOpacity>
            <Text style={styles.heroBadge}>Chuyên đề</Text>
          </View>
          <Text style={styles.heroTitle}>{category?.title}</Text>
          <Text style={styles.heroSubtitle}>
            {category?.heroSubtitle || 'Nội dung chi tiết'}
          </Text>
        </LinearGradient>

        {renderFeatured()}

        <View style={styles.sectionList}>
          {category?.sections?.map(renderSection)}
        </View>

        {category?.tips?.length ? (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Ghi nhớ nhanh</Text>
            <View style={styles.tipsGrid}>
              {category.tips.map((tip, index) => (
                <View key={`${category.id}-tip-${index}`} style={styles.tipChip}>
                  <Feather name="check-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.bottomButtonWrapper}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryButtonText}>Xem chủ đề khác</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  heroCard: {
    margin: 20,
    borderRadius: 26,
    padding: 24,
    ...SHADOWS.primaryShadow,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    color: '#1D1617',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: FONTS.medium,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: FONTS.bold,
    color: '#1D1617',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#4E4E4E',
    lineHeight: 20,
  },
  featuredContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featuredBadgeText: {
    fontSize: 12,
    color: '#C58940',
    marginLeft: 6,
    fontWeight: FONTS.medium,
  },
  featuredCard: {
    width: 180,
    borderRadius: 18,
    padding: 16,
    marginRight: 16,
  },
  featuredName: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  featuredMeta: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  featuredDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginVertical: 12,
  },
  featuredStrength: {
    fontSize: 13,
    color: COLORS.black,
    lineHeight: 18,
  },
  sectionList: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.black,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: 10,
  },
  sectionItemText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  tipsContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: FONTS.bold,
    color: COLORS.black,
    marginBottom: 10,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F7F8F8',
    borderWidth: 1,
    borderColor: '#E8ECF4',
    maxWidth: '100%',
  },
  tipText: {
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.black,
    flexShrink: 1,
  },
  bottomButtonWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: FONTS.semiBold,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.primaryShadow,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: FONTS.bold,
  },
});

