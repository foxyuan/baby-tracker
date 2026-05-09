const STORAGE_KEY = 'baby_tracker_records';
const TAGS_KEY = 'baby_tracker_supplement_tags';
const DEFAULT_TAGS = ['维D', 'AD', '益生菌', 'DHA'];

Page({
  data: {
    supplementTags: [],
    selectedType: '',
    units: ['片', '粒', '毫升'],
    selectedUnit: '片',
    dose: '1',
    showAdd: false,
    newTag: '',
    timeRange: [[], [], [], [], []],
    timeIndex: [0, 0, 0, 0, 0],
    timeStr: '',
    isEdit: false
  },

  onLoad(options) {
    this.loadTags();
    this.initTimePicker();

    if (options.id) {
      this.setData({ isEdit: true });
      this.loadRecord(parseInt(options.id));
    }
  },

  loadTags() {
    let tags = wx.getStorageSync(TAGS_KEY);
    if (!tags || !tags.length) tags = DEFAULT_TAGS;
    this.setData({ supplementTags: tags });
  },

  canDelete(tag) {
    return !DEFAULT_TAGS.includes(tag);
  },

  initTimePicker() {
    const now = new Date();
    const years = [], months = [], days = [], hours = [], minutes = [];
    for (let y = now.getFullYear() - 1; y <= now.getFullYear(); y++) years.push(y);
    for (let m = 1; m <= 12; m++) months.push(m);
    for (let d = 1; d <= 31; d++) days.push(d);
    for (let h = 0; h < 24; h++) hours.push(h);
    for (let m = 0; m < 60; m += 5) minutes.push(m);
    this.setData({ timeRange: [years, months, days, hours, minutes] });
    const idx = [years.indexOf(now.getFullYear()), now.getMonth(), now.getDate() - 1, now.getHours(), Math.floor(now.getMinutes() / 5)];
    this.setData({ timeIndex: idx });
    this.updateTimeStr(idx);
  },

  onTimeChange(e) {
    const idx = e.detail.value;
    this.setData({ timeIndex: idx });
    this.updateTimeStr(idx);
  },

  updateTimeStr(idx) {
    const [y, mo, d, h, mi] = idx;
    const range = this.data.timeRange;
    this.setData({
      timeStr: `${range[0][y]}-${String(range[1][mo]).padStart(2,'0')}-${String(range[2][d]).padStart(2,'0')} ${String(range[3][h]).padStart(2,'0')}:${String(range[4][mi]).padStart(2,'0')}`
    });
  },

  selectType(e) {
    this.setData({ selectedType: e.currentTarget.dataset.type });
  },

  selectUnit(e) {
    this.setData({ selectedUnit: e.currentTarget.dataset.unit });
  },

  onDoseInput(e) {
    this.setData({ dose: e.detail.value });
  },

  showAddInput() {
    this.setData({ showAdd: true });
  },

  hideAddInput() {
    this.setData({ showAdd: false, newTag: '' });
  },

  onTagInput(e) {
    this.setData({ newTag: e.detail.value });
  },

  addTag() {
    const tag = this.data.newTag.trim();
    if (!tag) return;
    if (this.data.supplementTags.includes(tag)) {
      wx.showToast({ title: '标签已存在', icon: 'none' });
      return;
    }
    const tags = [...this.data.supplementTags, tag];
    wx.setStorageSync(TAGS_KEY, tags);
    this.setData({ supplementTags: tags, showAdd: false, newTag: '' });
    wx.showToast({ title: '✅ 已添加', icon: 'success' });
  },

  deleteTag(e) {
    const tag = e.currentTarget.dataset.tag;
    wx.showModal({
      title: '删除标签',
      content: `确定要删除「${tag}」吗？`,
      success: (res) => {
        if (res.confirm) {
          const tags = this.data.supplementTags.filter(t => t !== tag);
          wx.setStorageSync(TAGS_KEY, tags);
          this.setData({ supplementTags: tags });
          if (this.data.selectedType === tag) this.setData({ selectedType: '' });
        }
      }
    });
  },

  loadRecord(id) {
    const records = wx.getStorageSync(STORAGE_KEY) || [];
    const record = records.find(r => r.id === id);
    if (!record) return;
    this.setData({
      selectedType: record.supplementType,
      selectedUnit: record.unit,
      dose: String(record.dose)
    });
    const d = new Date(record.time);
    const idx = [
      this.data.timeRange[0].indexOf(d.getFullYear()),
      d.getMonth(),
      d.getDate() - 1,
      d.getHours(),
      Math.floor(d.getMinutes() / 5)
    ];
    this.setData({ timeIndex: idx });
    this.updateTimeStr(idx);
  },

  submit() {
    if (!this.data.selectedType) {
      wx.showToast({ title: '请选择补剂类型', icon: 'none' });
      return;
    }
    const dose = parseFloat(this.data.dose);
    if (!dose || dose <= 0) {
      wx.showToast({ title: '请输入剂量', icon: 'none' });
      return;
    }
    if (!this.data.timeStr) {
      wx.showToast({ title: '请选择时间', icon: 'none' });
      return;
    }

    const records = wx.getStorageSync(STORAGE_KEY) || [];
    const id = this.data.isEdit ? parseInt(this.getQuery().id) : Date.now();

    if (this.data.isEdit) {
      const idx = records.findIndex(r => r.id === id);
      if (idx >= 0) {
        records[idx].supplementType = this.data.selectedType;
        records[idx].dose = dose;
        records[idx].unit = this.data.selectedUnit;
        records[idx].time = this.data.timeStr;
      }
    } else {
      records.unshift({
        id,
        type: 'supplement',
        supplementType: this.data.selectedType,
        dose,
        unit: this.data.selectedUnit,
        time: this.data.timeStr
      });
    }

    wx.setStorageSync(STORAGE_KEY, records);
    wx.showToast({ title: this.data.isEdit ? '✅ 修改成功' : '✅ 记录成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 800);
  },

  getQuery() {
    const pages = getCurrentPages();
    return pages[pages.length - 1].options || {};
  }
});
