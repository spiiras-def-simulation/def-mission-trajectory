const fs = require('fs');
const path = require('path');
const config = require('config');

const getProjection = require('./projection');

const projection = getProjection(config.mapParams.center);

module.exports = function (app) {
  app.use((req, res, next) => {
    req.projLocal = projLocal;
    req.projGlobal = projGlobal;
    req.parseTrajectory = parseTrajectory;
    next();
  });

  function writeResult(result, fileName = 'output') {
    const pathResults = app.get('pathResults');
    fs.writeFileSync(path.join(pathResults, `/${fileName}.json`), result);
  }

  function projLocal(data) {
    const { points } = JSON.parse(data);
    const result = points.map((point) => projection.project(point));
    const savedResult = JSON.stringify({ points: result });
    writeResult(savedResult, 'doneGlobal');
    console.log('Данные преобразованы');
    return savedResult;
  }

  function projGlobal(data) {
    const { points } = JSON.parse(data);
    const result = points.map((point) => projection.unproject(point));
    const savedResult = JSON.stringify({ points: result });
    writeResult(savedResult, 'doneLocal');
    console.log('Данные преобразованы');
    return savedResult;
  }

  function parseTrajectory(data) {
    const parsedPoints = data.split('\n');
    const result = parsedPoints
      .filter((point) => point.length)
      .map((point) => {
        const [x, y] = JSON.parse(point);
        return [parseFloat(x), parseFloat(y)];
      });
    const savedResult = JSON.stringify({ points: result });
    writeResult(savedResult, 'doneParse');
    console.log('Данные преобразованы');
    return savedResult;
  }
};
