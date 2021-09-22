const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const config = require('config');

const InputDataModel = require('./models/InputDataModel');
const indexRouter = require('./routes/index');
const setProj = require('./project');

const app = express();

app.set('config', config);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Сохраним путь до директории с результатами работы сервиса и предоставим получение результатов по http
const pathResults = path.join(__dirname, 'results');
app.set('pathResults', pathResults);
app.use('/results', express.static(pathResults));

// Добавляем функции на преобразование координат
setProj(app);

// Добавляем модель для получения необходимых данных из шины
const inputDataModel = new InputDataModel({ connection: config.amqp.connection });
inputDataModel.connect().catch((error) => {
  console.error(`Connection failed: ${error.message}`);
});

// Добавляем функцию для записи результатов
function writeResult(result, fileName = 'output') {
  const pathResults = app.get('pathResults');
  fs.writeFileSync(path.join(pathResults, `/${fileName}.json`), result);
}

app.use((req, res, next) => {
  req.models = { inputDataModel };
  req.writeResult = writeResult;
  next();
});

app.use('/', indexRouter);

module.exports = app;
