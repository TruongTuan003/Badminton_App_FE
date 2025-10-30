import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScheduleScreen({ navigation }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = React.useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [selectedDateIndex, setSelectedDateIndex] = React.useState(3);
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const [detailVisible, setDetailVisible] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(null);

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function clampDay(year, month, day) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return Math.max(1, Math.min(day, lastDay));
  }

  function getWeekDays(centerDate) {
    const year = centerDate.getFullYear();
    const month = centerDate.getMonth();
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

  const scheduleItems = [
    { time: '07:30 AM', title: 'Di Chuyển cơ bản(FootWork), 7:30am', color: '#E6C3FF' },
    { time: '09:00 AM', title: 'Bài tập tăng cơ, 9am', color: '#DCC8FF' },
    { time: '03:00 PM', title: 'Cầm vợt đúng cách, 3pm', color: '#F1ECFF' },
  ];

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#1D1617" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch trình tập luyện</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="more-horizontal" size={22} color="#1D1617" />
        </TouchableOpacity>
      </View>
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Feather name="chevron-left" size={18} color="#7B6F72" />
        </TouchableOpacity>
        <TouchableOpacity onPress={openPicker}>
          <Text style={styles.monthText}>{`${monthNames[currentMonth]} ${currentYear}`}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Feather name="chevron-right" size={18} color="#7B6F72" />
        </TouchableOpacity>
      </View>
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
      <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
        {[
          '06:00 AM','07:00 AM','08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 AM',
          '01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM','07:00 PM','08:00 PM'
        ].map((t) => (
          <View key={t} style={styles.timeRow}>
            <Text style={styles.timeLabel}>{t}</Text>
            <View style={styles.timeLine} />
          </View>
        ))}

        <View style={styles.itemsOverlay}>
          {scheduleItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.85}
              onPress={() => { setSelectedItem(item); setDetailVisible(true); }}
              style={[styles.itemBlock, { top: index === 0 ? 60 : index === 1 ? 120 : 280, backgroundColor: item.color }] }
            >
              <Text style={styles.itemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.fab}>
        <Feather name="plus" size={26} color="#FFFFFF" />
      </TouchableOpacity>
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
      {/* Detail Modal */}
      <Modal transparent visible={detailVisible} animationType="fade" onRequestClose={() => setDetailVisible(false)}>
        <View style={styles.detailOverlay}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <TouchableOpacity style={styles.detailIcon} onPress={() => setDetailVisible(false)}>
                <Ionicons name="close" size={18} color="#1D1617" />
              </TouchableOpacity>
              <Text style={styles.detailTitle}>Lịch trình tập luyện</Text>
              <View style={styles.detailIcon}>
                <Feather name="more-horizontal" size={18} color="#1D1617" />
              </View>
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailWorkoutName}>{selectedItem?.title || ''}</Text>
              <View style={styles.detailTimeRow}>
                <Ionicons name="time-outline" size={18} color="#7B6F72" />
                <Text style={styles.detailTimeText}>Hôm nay | {selectedItem?.time || ''}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setDetailVisible(false)}>
              <Text style={styles.primaryBtnText}>Thực hiện</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
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
    fontWeight: 'bold',
    color: '#1D1617',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F7F8F8',
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
    color: '#7B6F72',
  },
  daysRow: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dayPill: {
    width: 70,
    height: 84,
    borderRadius: 16,
    backgroundColor: '#F7F8F8',
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayPillActive: {
    backgroundColor: '#92A3FD',
  },
  dayPillLabel: {
    color: '#7B6F72',
    marginBottom: 2,
  },
  dayPillLabelActive: {
    color: '#FFFFFF',
  },
  dayPillDate: {
    color: '#1D1617',
    fontWeight: '600',
    fontSize: 18,
  },
  dayPillDateActive: {
    color: '#FFFFFF',
  },
  timeline: {
    // flex: 1,
    paddingHorizontal: 20,
    marginTop: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  timeLabel: {
    width: 70,
    color: '#7B6F72',
    fontSize: 12,
  },
  timeLine: {
    height: 1,
    backgroundColor: '#E6E7F2',
    flex: 1,
  },
  itemsOverlay: {
    position: 'absolute',
    left: 90,
    right: 20,
    top: 0,
  },
  itemBlock: {
    position: 'absolute',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  itemText: {
    color: '#7B6F72',
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#C58BF2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1617',
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
    color: '#1D1617',
  },
  pickerItemTextActive: {
    color: '#92A3FD',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  modalButton: {
    backgroundColor: '#92A3FD',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 10,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalButtonGhost: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalButtonGhostText: {
    color: '#7B6F72',
    fontWeight: '600',
  },
  // Detail modal
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  detailCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F7F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1617',
  },
  detailBody: {
    marginTop: 10,
    marginBottom: 16,
  },
  detailWorkoutName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D1617',
    marginBottom: 8,
  },
  detailTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTimeText: {
    marginLeft: 8,
    color: '#7B6F72',
  },
  primaryBtn: {
    backgroundColor: '#92A3FD',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});


