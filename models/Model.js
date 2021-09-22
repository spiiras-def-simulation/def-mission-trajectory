const amqp = require('amqplib');
const { v4: uuid } = require('uuid');

class Model {
  constructor(options = {}) {
    const { connection = 'amqp://localhost' } = options;

    this.urlConnection = connection;
    this.connection = null;
    this.subscriptions = new Map();
  }

  async connect() {
    if (this.connection === null) {
      console.log(`Initialize model connection with rabbitmq by address ${this.urlConnection}`);

      try {
        this.connection = await amqp.connect(this.urlConnection);

        console.log(`Model(${this.constructor.name}) connection created`);
      } catch (error) {
        throw error;
      }
    }
  }

  async getData({ queue, message = '' }) {
    if (this.connection === null) {
      throw new Error('Model is not connected with rabbitmq');
    }

    const connection = this.connection;
    const channel = await connection.createChannel();

    try {
      const { queue: retryQueue } = await channel.assertQueue('', {
        durable: false,
        autoDelete: true,
      });

      const request = () => {
        return new Promise((resolve, reject) => {
          const correlationId = uuid();

          const waitingResponse = setTimeout(
            () => reject(new Error(`No answer for request ${queue}`)),
            5000,
          );

          channel.consume(
            retryQueue,
            (answer) => {
              try {
                if (answer.properties.correlationId == correlationId) {
                  const result = JSON.parse(answer.content.toString());

                  if (waitingResponse) clearTimeout(waitingResponse);

                  resolve(result || null);
                }
              } catch (error) {
                reject(error);
              }
            },
            { noAck: true },
          );

          const serialized = this.serialize(message);
          channel.sendToQueue(queue, serialized, { correlationId, replyTo: retryQueue });
        });
      };

      const response = await request();

      return response;
    } catch (error) {
      console.log(error.message);
      return null;
    } finally {
      channel.close();
    }
  }

  async sendData({ queue, message = '' }) {
    if (this.connection === null) {
      throw new Error('Model is not connected with rabbitmq');
    }

    const connection = await this.connection;
    const channel = await connection.createChannel();
    channel.assertQueue(queue, { durable: false });
    const serialized = this.serialize(message);
    channel.sendToQueue(queue, serialized);
  }

  serialize(message = '') {
    return Buffer.from(typeof message === 'object' ? JSON.stringify(message) : message);
  }
}

module.exports = Model;
