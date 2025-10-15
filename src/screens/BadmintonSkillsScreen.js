import { Feather } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BadmintonSkillsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header with gradient background */}
        <View style={styles.headerSection}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={24} color="#1D1617" />
            </TouchableOpacity>
            <Text style={styles.title}>Nâng cao kỹ năng cầu lông</Text>
            <TouchableOpacity style={styles.menuButton}>
              <Feather name="more-horizontal" size={24} color="#1D1617" />
            </TouchableOpacity>
          </View>

          {/* Description Section */}
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionLabel}>Mô tả:</Text>
            <View style={styles.descriptionList}>
              <Text style={styles.descriptionItem}>
                • Học và chỉnh kỹ thuật cầm vợt, đánh cầu đúng cách.
              </Text>
              <Text style={styles.descriptionItem}>
                • Luyện các bước di chuyển (footwork) để kiểm soát sân.
              </Text>
              <Text style={styles.descriptionItem}>
                • Tập phản xạ và khả năng xử lý cầu nhanh.
              </Text>
              <Text style={styles.descriptionItem}>
                • Nâng cao kỹ năng đập cầu, bỏ nhỏ, điều cầu và chiến thuật thi đấu.
              </Text>
              <Text style={styles.descriptionItem}>
                • Các bài tập phân cấp: Cơ bản → Trung bình → Nâng cao.
              </Text>
            </View>
          </View>
        </View>

        {/* Where to Start Section */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Bạn muốn bắt đầu từ đâu ?</Text>
          
          {/* Basic Level Card */}
          <TouchableOpacity 
            style={styles.levelCard}
            onPress={() => navigation.navigate('Basic')}
          >
            <Text style={styles.levelTitle}>Cơ bản</Text>
            <Text style={styles.levelSubtitle}>Mô tả</Text>
            <TouchableOpacity style={styles.seeMoreButton}>
              <Text style={styles.seeMoreButtonText}>Xem thêm</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Intermediate Level Card */}
          <TouchableOpacity style={styles.levelCard}>
            <Text style={styles.levelTitle}>Trung bình</Text>
            <Text style={styles.levelSubtitle}>Mô tả</Text>
            <TouchableOpacity style={styles.seeMoreButton}>
              <Text style={styles.seeMoreButtonText}>Xem thêm</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Advanced Level Card */}
          <TouchableOpacity style={styles.levelCard}>
            <Text style={styles.levelTitle}>Nâng cao</Text>
            <Text style={styles.levelSubtitle}>Mô tả</Text>
            <TouchableOpacity style={styles.seeMoreButton}>
              <Text style={styles.seeMoreButtonText}>Xem thêm</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing}></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#E8F3F1',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1617',
    textAlign: 'center',
    flex: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  descriptionSection: {
    marginTop: 10,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D1617',
    marginBottom: 15,
  },
  descriptionList: {
    gap: 8,
  },
  descriptionItem: {
    fontSize: 14,
    color: '#1D1617',
    lineHeight: 20,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1617',
    marginBottom: 25,
  },
  levelCard: {
    backgroundColor: '#F7F8F8',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D1617',
    marginBottom: 5,
  },
  levelSubtitle: {
    fontSize: 14,
    color: '#7B6F72',
    marginBottom: 15,
  },
  seeMoreButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  seeMoreButtonText: {
    fontSize: 14,
    color: '#92A3FD',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
});
