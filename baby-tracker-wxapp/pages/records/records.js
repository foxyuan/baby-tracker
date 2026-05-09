const STORAGE_KEY = 'baby_tracker_records';

Page({
  data: {
    records: [],
    stats: {
      milk: { count: 0, total: 0 },
      poop: { count: 0 },
      supplement: { count: 0, types: [], typesText: '' }
    }
  },

  onShow() {
    this.loadRecords();
  },

  loadRecords() {
    let records = wx.getStorageSync(STORAGE_KEY) || [];
    // 按时间倒序
    records.sort((a, b) => new Date(b.time) - new Date(a.time));
    // 格式化时间显示
    records = records.map(r => ({
      ...r,
      timeStr: this.formatTime(r.time)
    }));
    this.setData({ records });
    this.calcStats(records);
  },

  formatTime(timeStr) {
    const d = new Date(timeStr);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  },

  calcStats(records) {
    const milkRecords = records.filter(r => r.type === 'milk');
    const poopRecords = records.filter(r => r.type === 'poop');
    const supplementRecords = records.filter(r => r.type === 'supplement');

    const milkTotal = milkRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
    const supplementTypes = [...new Set(supplementRecords.map(r => r.supplementType))];
    const typesText = supplementTypes.slice(0, 3).join('、') + (supplementTypes.length > 3 ? '等' : '');

    this.setData({
      stats: {
        milk: { count: milkRecords.length, total: milkTotal },
        poop: { count: poopRecords.length },
        supplement: { count: supplementRecords.length, types: supplementTypes, typesText }
      }
    });
  },

  editRecord(e) {
    const { id, type } = e.currentTarget.dataset;
    const urlMap = {
      milk: '/pages/milk/milk',
      supplement: '/pages/supplement/supplement',
      poop: '/pages/poop/poop'
    };
    wx.navigateTo({ url: `${urlMap[type]}?id=${id}` });
  },

  deleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？删除后无法恢复。',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          let records = wx.getStorageSync(STORAGE_KEY) || [];
          records = records.filter(r => r.id !== id);
          wx.setStorageSync(STORAGE_KEY, records);
          this.loadRecords();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  }
});
