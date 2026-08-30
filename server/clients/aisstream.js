/**
 * AISStream Client for Real-time Maritime, Port of Douala & Kribi Deep Sea Port Logistics Telemetry
 */

const config = require('../config');

class AISStreamClient {
  constructor(apiKey = config.aisstream.apiKey) {
    this.apiKey = apiKey;
    this.socket = null;
    this.subscribers = new Set();
  }

  connect(boundingBoxes = [[[3.0, 9.0], [5.0, 10.5]]]) { // Gulf of Guinea / Cameroon Coast default
    if (!this.apiKey) {
      console.warn('[AISStream] API Key not configured');
      return;
    }

    try {
      const WebSocket = require('ws');
      this.socket = new WebSocket('wss://stream.aisstream.io/v0/stream');

      this.socket.on('open', () => {
        console.log('[AISStream] Connected to global AIS maritime stream.');
        const subscriptionMessage = {
          APIKey: this.apiKey,
          BoundingBoxes: boundingBoxes,
          FilterMessageTypes: ['PositionReport', 'ShipStaticData']
        };
        this.socket.send(JSON.stringify(subscriptionMessage));
      });

      this.socket.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          this.subscribers.forEach(cb => cb(parsed));
        } catch (e) {
          // Ignore unparseable frames
        }
      });

      this.socket.on('error', (err) => {
        console.error('[AISStream] Stream error:', err.message);
      });
    } catch (e) {
      console.warn('[AISStream] ws module not available yet.');
    }
  }

  onMessage(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

module.exports = {
  AISStreamClient,
  aisStreamClient: new AISStreamClient()
};
