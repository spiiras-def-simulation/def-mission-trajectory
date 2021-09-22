const mapObject = (value, map) => {
  const data = {};
  Object.entries(map).forEach(([name, key]) => {
    if (value[key]) {
      data[name] = value[key];
    } else {
      data[name] = null;
    }
  });
  return data;
};

const unmapObject = (value, map) => {
  const data = {};
  Object.entries(map).forEach(([name, key]) => {
    if (value[name]) {
      data[key] = value[name];
    }
  });
  return data;
};

module.exports = { mapObject, unmapObject };
