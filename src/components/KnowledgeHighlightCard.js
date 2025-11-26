import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent
} from 'react-native';
import { KNOWLEDGE_CONTENT } from '../data/knowledgeContent';
import { COLORS, FONTS } from '../styles/commonStyles';

const { width } = Dimensions.get('window');
const CARD_PADDING = 24;
const CARD_WIDTH = width - (CARD_PADDING * 2); // 24px padding on each side

export default function KnowledgeHighlightCard({
  activeIndex = 0,
  data = KNOWLEDGE_CONTENT,
  onPrimaryPress,
  onIndexChange,
  onDotPress, // Keep for backwards compatibility
}) {
  // Use onDotPress if provided, otherwise use onIndexChange
  const handleIndexChange = onIndexChange || onDotPress;
  const scrollViewRef = useRef(null);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    
    if (index !== activeIndex && handleIndexChange) {
      handleIndexChange(index);
    }
  };

  const handleDotPress = (index) => {
    scrollViewRef.current?.scrollTo({
      x: index * CARD_WIDTH,
      animated: true,
    });
    handleIndexChange?.(index);
  };

  return (
    <View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {data.map((category, index) => (
          <LinearGradient
            key={category.id}
            colors={category?.gradient || ['#EEF6FF', '#F3F5FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.spotlightCard, { width: CARD_WIDTH }]}
          >
            <Text style={styles.spotlightLabel}>Chủ đề nổi bật</Text>
            <Text style={styles.spotlightTitle}>{category?.title}</Text>
            <Text style={styles.spotlightSubtitle}>
              {category?.heroSubtitle ||
                'Khám phá kiến thức then chốt để cải thiện trận đấu.'}
            </Text>
            <View style={styles.spotlightActions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => onPrimaryPress?.(category, index)}
                activeOpacity={0.9}
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
        ))}
      </ScrollView>

      <View style={styles.indicatorContainer}>
        {data.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.indicatorDot,
                isActive && [
                  styles.indicatorDotActive,
                  { backgroundColor: item.color || COLORS.primary },
                ],
              ]}
              onPress={() => handleDotPress(index)}
              activeOpacity={0.8}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    marginHorizontal: -24, 
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  spotlightCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#92A3FD',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
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
  },
});