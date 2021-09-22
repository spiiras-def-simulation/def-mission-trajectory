const { exec } = require('child_process');

const Model = require('./Model');

const { mapObject } = require('./helpers');

const mapAreaObject = { type: 'type', coordinates: 'area' };

const mapCombatMission = {
  accomplished: 'accomplished',
  scoutingArea: 'destination',
  dumpAmmoPoint: 'reset_point',
  departurePoint: 'start_point',
  landingPoint: 'landing_point',
  targetsCoordinates: 'targets_coords',
  path: 'trajectory',
};

const queues = {
  GET_MISSIONS: 'get_mission_rpc',
  GET_OBJECTS: 'get_uav_regions_rpc',
  ADD_OBJECTS: 'add_regions_rpc',
};

class InputDataModel extends Model {
  async getObstacles() {
    const banAreas = await this.getBanAreas();
    const repAreas = await this.getRepAreas();
    const obstaclesAreas = [...banAreas, ...repAreas];
    const obstacles = obstaclesAreas.map(({ coordinates }) => JSON.parse(coordinates));
    return obstacles;
  }

  async getBanAreas() {
    const input = { type: 'ban' };
    const dataResponse = await this.getData({ queue: queues.GET_OBJECTS, message: input });
    if (this.checkFailedResponse(dataResponse)) return [];
    return Object.entries(dataResponse).map(([id, value]) => {
      const data = mapObject(value, mapAreaObject);
      return { id, ...data };
    });
  }

  async getRepAreas() {
    const input = { type: 'rep' };
    const dataResponse = await this.getData({ queue: queues.GET_OBJECTS, message: input });
    if (this.checkFailedResponse(dataResponse)) return [];
    return Object.entries(dataResponse).map(([id, value]) => {
      const data = mapObject(value, mapAreaObject);
      return { id, ...data };
    });
  }

  async getMission(id) {
    const dataResponse = await this.getData({ queue: queues.GET_MISSIONS, message: { id } });
    if (this.checkFailedResponse(dataResponse)) return null;
    const data = mapObject(dataResponse, mapCombatMission);
    const mission = this.prepareMissionData(data);
    return { id, ...mission };
  }

  checkFailedResponse(response) {
    return !response || response.status === 'error' || response.status === 'Not found';
  }

  prepareMissionData(data) {
    const mission = { ...data };

    mission.accomplished = !!mission.accomplished;

    const targetCoords = mission.targetsCoordinates && JSON.parse(mission.targetsCoordinates);
    mission.targetsCoordinates =
      targetCoords &&
      targetCoords.map(({ latitude, longitude }) => ({ x: latitude, y: longitude }));

    mission.landingPoint = JSON.parse(mission.landingPoint);
    mission.dumpAmmoPoint = JSON.parse(mission.dumpAmmoPoint);
    mission.departurePoint = JSON.parse(mission.departurePoint);
    mission.scoutingArea = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: JSON.parse(mission.scoutingArea) },
    };

    const pathData = mission.path && JSON.parse(mission.path);
    mission.path = pathData && pathData.points.map((point) => ({ x: point[0], y: point[1] }));

    return mission;
  }
}

module.exports = InputDataModel;
