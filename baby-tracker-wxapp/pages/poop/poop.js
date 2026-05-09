const STORAGE_KEY = 'baby_tracker_records';
const SHAPES_KEY = 'baby_tracker_poop_shapes';
const DEFAULT_SHAPES = ['正常', '偏干', '偏稀', '有奶瓣', '含血便'];
const UNDELETABLE_SHAPES = ['正常', '偏干', '偏稀'];
const DEFAULT_COLORS = ['黑色', '绿色', '黄色'];

Page({
  data: {
    shapes: [],
    colors: DEFAULT_COLORS,
    amounts: ['量少', '量中等', '量多'],
    selectedShape: '正常',
    selectedColor: '黄色',
    selectedAmount: '量中等',
    showShapeAdd: false,
    showColorAdd: false,
    newShape: '',
    newColor: '',
    timeRange: [[], [], [], [], []],
    timeIndex: [0, 0, 0, 0, 0],
    timeStr: '',
    isEdit: false
  },

  onLoad(options) {
    this.loadShapes();
    this.initTimePicker();

    if (options.id) {
      this.setData({ isEdit: true });
      this.loadRecord(parseInt(options.id));
    }
  },

  loadShapes() {
    let shapes = wx.getStorageSync(SHAPES_KEY);
    if (!shapes || !shapes.length) shapes = DEFAULT_SHAPES;
    this.setData({ shapes });
  },

  canDeleteShape(shape) {
    return !UNDELETABLE_SHAPES.includes(shape);
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

  selectShape(e) {
    this.setData({ selectedShape: e.currentTarget.dataset.shape });
  },

  selectColor(e) {
    this.setData({ selectedColor: e.currentTarget.dataset.color });
  },

  selectAmount(e) {
    this.setData({ selectedAmount: e.currentTarget.dataset.amount });
  },

  showShapeInput() {
    this.setData({ showShapeAdd: true });
  },

  hideShapeInput() {
    this.setData({ showShapeAdd: false, newShape: '' });
  },

  onShapeInput(e) {
    this.setData({ newShape: e.detail.value });
  },

  addShape() {
    const shape = this.data.newShape.trim();
    if (!shape) return;
    if (this.data.shapes.includes(shape)) {
      wx.showToast({ title: '形状已存在', icon: 'none' });
      return;
    }
    const shapes = [...this.data.shapes, shape];
    wx.setStorageSync(SHAPES_KEY, shapes);
    this.setData({ shapes, showShapeAdd: false, newShape: '' });
    wx.showToast({ title: '✅ 已添加', icon: 'success' });
  },

  deleteShape(e) {
    const shape = e.currentTarget.dataset.shape;
    wx.showModal({
      title: '删除形状',
      content: `确定要删除「${shape}」吗？`,
      success: (res) => {
        if (res.confirm) {
          const shapes = this.data.shapes.filter(s => s !== shape);
          wx.setStorageSync(SHAPES_KEY, shapes);
          this.setData({ shapes });
          if (this.data.selectedShape === shape) this.setData({ selectedShape: '' });
        }
      }
    });
  },

  showColorInput() {
    this.setData({ showColorAdd: true });
  },

  hideColorInput() {
    this.setData({ showColorAdd: false, newColor: '' });
  },

  onColorInput(e) {
    this.setData({ newColor: e.detail.value });
  },

  confirmColor() {
    const color = this.data.newColor.trim();
    if (!color) return;
    this.setData({ selectedColor: color, showColorAdd: false, newColor: '' });
  },

  loadRecord(id) {
    const records = wx.getStorageSync(STORAGE_KEY) || [];
    const record = records.find(r => r.id === id);
    if (!record) return;
    this.setData({
      selectedShape: record.shape,
      selectedColor: record.color,
      selectedAmount: record.amount
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
    if (!this.data.selectedShape) {
      wx.showToast({ title: '请选择便便形状', icon: 'none' });
      return;
    }
    if (!this.data.selectedColor) {
      wx.showToast({ title: '请选择便便颜色', icon: 'none' });
      return;
    }
    if (!this.data.selectedAmount) {
      wx.showToast({ title: '请选择便便量', icon: 'none' });
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
        records[idx].shape = this.data.selectedShape;
        records[idx].color = this.data.selectedColor;
        records[idx].amount = this.data.selectedAmount;
        records[idx].time = this.data.timeStr;
      }
    } else {
      records.unshift({
        id,
        type: 'poop',
        shape: this.data.selectedShape,
        color: this.data.selectedColor,
        amount: this.data.selectedAmount,
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
