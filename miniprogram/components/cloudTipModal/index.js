Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer: function(newVal) {
        this.setData({ visible: newVal });
      }
    },
    title: {
      type: String,
      value: '提示'
    },
    content: {
      type: String,
      value: ''
    },
    confirmText: {
      type: String,
      value: '确定'
    }
  },

  data: {
    visible: false
  },

  methods: {
    handleConfirm() {
      this.setData({ visible: false });
      this.triggerEvent('confirm');
    },

    handleCancel() {
      this.setData({ visible: false });
      this.triggerEvent('cancel');
    },

    showModal() {
      this.setData({ visible: true });
    },

    hideModal() {
      this.setData({ visible: false });
    },

    stopPropagation() {
      return;
    }
  }
})