const L = require('./simLeaflet');

module.exports = function (center) {
  const projCenter = L.CRS.EPSG3857.project(L.latLng(center[0], center[1]));

  return {
    project: ([x, y]) => {
      const unprojPoint = L.CRS.EPSG3857.unproject(L.point(projCenter.x + x, projCenter.y + y));

      return [unprojPoint.lat, unprojPoint.lng];
    },
    unproject: ([x, y]) => {
      const projPoint = L.CRS.EPSG3857.project(L.latLng(x, y));
      return [projPoint.x - projCenter.x, projPoint.y - projCenter.y];
    },
  };
};
