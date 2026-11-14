import wearService from './common/wearService.js';
export default {
  _elctonWearChannel: wearService,
  onCreate: function () {
    console.info('Application onCreate');
  },
  onDestroy: function () {
    console.info('Application onDestroy');
  }
};