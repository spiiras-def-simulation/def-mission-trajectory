const express = require('express');
const path = require('path');
const multer = require('multer');

const upload = multer();

const router = express.Router();

router.get('/mapObstacles', async function (req, res) {
  try {
    const { inputDataModel } = req.models;
    const { projGlobal, writeResult } = req;
    const result = await inputDataModel.getObstacles();
    if (result) {
      const obstacles = result
        .map((area) => JSON.stringify({ points: area.slice(0, 4) }))
        .map((data) => JSON.parse(projGlobal(data)));
      const savedResult = { areas: obstacles };
      writeResult(JSON.stringify(savedResult), 'doneObstacles');
      res.status(200).send(savedResult);
    } else {
      res.status(404).send('Не удалось получить препятствия');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get('/mission/:id', async function (req, res) {
  try {
    const { id } = req.params;
    const { inputDataModel } = req.models;
    const { projGlobal, writeResult } = req;
    const result = await inputDataModel.getMission(id);
    if (result) {
      const { scoutingArea, dumpAmmoPoint, departurePoint, landingPoint } = result;

      const projKeyPoints = projGlobal(
        JSON.stringify({
          points: [
            [dumpAmmoPoint.x, dumpAmmoPoint.y],
            [departurePoint.x, departurePoint.y],
            [landingPoint.x, landingPoint.y],
          ],
        }),
      );
      const { points: localKeyPoints } = JSON.parse(projKeyPoints);
      const prepKeyPoints = localKeyPoints.map(([x, y]) => ({ latitude: x, longitude: y }));
      const reset_point = prepKeyPoints[0];
      const start_point = prepKeyPoints[1];
      const landing_point = prepKeyPoints[2];

      const destPoints = scoutingArea.geometry.coordinates[0];
      const shiftDestPoints = destPoints.map(([y, x]) => [x, y]);
      const projDestPoints = projGlobal(JSON.stringify({ points: shiftDestPoints }));
      const { points: localDestPoints } = JSON.parse(projDestPoints);
      const destination = localDestPoints.map(([x, y]) => ({ latitude: x, longitude: y }));

      const savedResult = {
        destination: destination,
        reset_point: reset_point,
        start_point: start_point,
        landing_point: landing_point,
      };
      writeResult(JSON.stringify(savedResult), 'doneMission');
      res.status(200).send(savedResult);
    } else {
      res.status(403).send('Не удалось получить данные миссии');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post('/projLocal', upload.single('data'), async function (req, res, next) {
  try {
    const { projLocal } = req;
    const data = req.file.buffer.toString();
    const result = projLocal(data);
    const shownResult = JSON.parse(result);
    res.status(200).send(shownResult);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post('/projGlobal', upload.single('data'), async function (req, res, next) {
  try {
    const { projGlobal } = req;
    const data = req.file.buffer.toString();
    const result = projGlobal(data);
    const shownResult = JSON.parse(result);
    res.status(200).send(shownResult);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post('/parseTrajectory', upload.single('data'), async function (req, res, next) {
  try {
    const { parseTrajectory } = req;
    const data = req.file.buffer.toString();
    const result = parseTrajectory(data);
    const shownResult = JSON.parse(result);
    res.status(200).send(shownResult);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
