import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useEffect } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// HomeScreen has paddingHorizontal: 20, so we need to account for that
const SCREEN_PADDING = 20;
const CARD_WIDTH = SCREEN_WIDTH - (SCREEN_PADDING * 2); // Full width minus screen padding

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
    
    if (index !== activeIndex && handleIndexChange && index >= 0 && index < data.length) {
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

  // Auto-scroll when activeIndex changes from outside
  useEffect(() => {
    if (activeIndex >= 0 && activeIndex < data.length) {
      scrollViewRef.current?.scrollTo({
        x: activeIndex * CARD_WIDTH,
        animated: true,
      });
    }
  }, [activeIndex, data.length]);

  return (
    <View>
      <View style={styles.container}>
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
          clipsToBounds={true}
          bounces={false}
        >
          {data.map((category, index) => (
            <LinearGradient
              key={category.id}
              colors={category?.gradient || ['#EEF6FF', '#F3F5FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.spotlightCard, { width: CARD_WIDTH }]}
            >
              <View style={styles.spotlightRow}>
                <View style={styles.spotlightContent}>
                  <Text style={styles.spotlightLabel}>Chủ đề nổi bật</Text>
                  <Text style={styles.spotlightTitle} numberOfLines={1}>{category?.title}</Text>
                  <Text style={styles.spotlightSubtitle} numberOfLines={2}>
                    {category?.heroSubtitle ||
                      'Khám phá kiến thức để cải thiện trận đấu.'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => onPrimaryPress?.(category, index)}
                  activeOpacity={0.9}
                >
                  <Feather name="arrow-right" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ))}
        </ScrollView>
      </View>

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
  container: {
    marginBottom: 8,
    marginHorizontal: -SCREEN_PADDING,
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  scrollView: {
    width: SCREEN_WIDTH,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
  },
  spotlightCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 8,
    shadowColor: '#92A3FD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  spotlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spotlightContent: {
    flex: 1,
    marginRight: 14,
  },
  spotlightLabel: {
    color: '#7B6F72',
    fontSize: 12,
    fontWeight: FONTS.medium,
    marginBottom: 4,
  },
  spotlightTitle: {
    fontSize: 18,
    fontWeight: FONTS.bold,
    color: '#1D1617',
    marginBottom: 6,
  },
  spotlightSubtitle: {
    color: '#7B6F72',
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1D1617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
  },
  indicatorDotActive: {
    width: 16,
    borderRadius: 8,
  },
});