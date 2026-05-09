const STORAGE_KEY = 'baby_tracker_records';
const ITEM_HEIGHT = 96;
const MILK_MIN = 10;
const MILK_MAX = 300;
const MILK_STEP = 10;

Page({
  data: {
    pickerValues: [],
    pickerIndex: [0],
    timeRange: [[], [], [], [], [], []],
    timeIndex: [0, 0, 0, 0, 0, 0],
    timeStr: '',
    isEdit: false
  },

  selectedAmount: 0,

  onLoad(options) {
    // 生成容量选项
    const values = [];
    for (let v = MILK_MIN; v <= MILK_MAX; v += MILK_STEP) {
      values.push(v);
    }
    this.setData({ pickerValues: values });

    // 初始化时间选择器
    this.initTimePicker();

    // 编辑模式
    if (options.id) {
      this.setData({ isEdit: true });
      this.loadRecord(parseInt(options.id));
    } else {
      this.resetForm();
    }
  },

  initTimePicker() {
    const now = new Date();
    const years = [], months = [], days = [], hours = [], minutes = [];

    for (let y = now.getFullYear() - 1; y <= now.getFullYear(); y++) years.push(y);
    for (let m = 1; m <= 12; m++) months.push(m);
    for (let d = 1; d <= 31; d++) days.push(d);
    for (let h = 0; h < 24; h++) hours.push(h);
    for (let m = 0; m < 60; m += 5) minutes.push(m);

    this.setData({
      timeRange: [years, months, days, hours, minutes],
      years, months, days, hours, minutes
    });

    // 设置当前时间
    const idx = [
      years.indexOf(now.getFullYear()),
      now.getMonth(),
      now.getDate() - 1,
      now.getHours(),
      Math.floor(now.getMinutes() / 5)
    ];
    this.setData({ timeIndex: idx });
    this.updateTimeStr(idx);
  },

  onTimeColumnChange(e) {
    const { column, value } = e.detail;
    const idx = this.data.timeIndex;
    idx[column] = value;
    this.setData({ timeIndex: idx });
  },

  onTimeChange(e) {
    const idx = e.detail.value;
    this.setData({ timeIndex: idx });
    this.updateTimeStr(idx);
  },

  updateTimeStr(idx) {
    const [y, mo, d, h, mi] = idx;
    const year = this.data.years[y];
    const month = this.data.months[mo];
    const day = this.data.days[d];
    const hour = this.data.hours[h];
    const minute = this.data.minutes[mi];
    this.setData({
      timeStr: `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')} ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`
    });
  },

  onPickerChange(e) {
    const idx = e.detail.value[0];
    this.selectedAmount = this.data.pickerValues[idx];
    this.setData({ pickerIndex: [idx] });
  },

  resetForm() {
    const lastAmount = this.getLastMilkAmount();
    const defaultIdx = lastAmount ? this.data.pickerValues.indexOf(lastAmount) : 0;
    if (defaultIdx < 0) {
      this.selectedAmount = this.data.pickerValues[0];
      this.setData({ pickerIndex: [0], isEdit: false });
    } else {
      this.selectedAmount = lastAmount;
      this.setData({ pickerIndex: [defaultIdx], isEdit: false });
    }
  },

  loadRecord(id) {
    const records = wx.getStorageSync(STORAGE_KEY) || [];
    const record = records.find(r => r.id === id);
    if (!record) return;

    this.selectedAmount = record.amount;
    const idx = this.data.pickerValues.indexOf(record.amount);
    if (idx >= 0) {
      this.setData({ pickerIndex: [idx] });
    }

    // 设置时间
    const d = new Date(record.time);
    const idx2 = [
      this.data.years.indexOf(d.getFullYear()),
      d.getMonth(),
      d.getDate() - 1,
      d.getHours(),
      Math.floor(d.getMinutes() / 5)
    ];
    this.setData({ timeIndex: idx2 });
    this.updateTimeStr(idx2);
  },

  getLastMilkAmount() {
    const records = wx.getStorageSync(STORAGE_KEY) || [];
    const milkRecords = records.filter(r => r.type === 'milk');
    if (!milkRecords.length) return 0;
    milkRecords.sort((a, b) => new Date(b.time) - new Date(a.time));
    return milkRecords[0].amount || 0;
  },

  submit() {
    if (!this.selectedAmount || this.selectedAmount <= 0) {
      wx.showToast({ title: '请选择喂奶容量', icon: 'none' });
      return;
    }

    const timeStr = this.data.timeStr;
    if (!timeStr) {
      wx.showToast({ title: '请选择时间', icon: 'none' });
      return;
    }

    const records = wx.getStorageSync(STORAGE_KEY) || [];
    const id = this.data.isEdit ? parseInt(this.getQuery().id) : Date.now();

    if (this.data.isEdit) {
      const idx = records.findIndex(r => r.id === id);
      if (idx >= 0) {
        records[idx].amount = this.selectedAmount;
        records[idx].time = timeStr;
      }
    } else {
      records.unshift({
        id,
        type: 'milk',
        amount: this.selectedAmount,
        time: timeStr
      });
    }

    wx.setStorageSync(STORAGE_KEY, records);
    wx.showToast({ title: this.data.isEdit ? '✅ 修改成功' : '✅ 记录成功', icon: 'success' });

    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage && prevPage.route === 'pages/records/records') {
      prevPage.loadRecords();
    }

    setTimeout(() => wx.navigateBack(), 800);
  },

  getQuery() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    return currentPage.options || {};
  }
});
