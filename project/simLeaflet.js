global.window = {
  screen: {
    devicePixelRatio: 1,
  },
};
global.document = {
  documentElement: {
    style: {},
  },
  getElementsByTagName: function () {
    return [];
  },
  createElement: function () {
    return {};
  },
};
global.navigator = {
  userAgent: 'nodejs',
  platform: 'nodejs',
};
global.L = require('leaflet');

module.exports = global.L;
