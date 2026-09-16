/**
 * Realtime External Stream Provider (AISStream Maritime Telemetry)
 * Manages WebSocket connection lifecycle, reconnection, and backpressure
 */

const WebSocket = require('ws');
const { config } = require('../../config/env');
const logger = require('../../shared/logging/logger');

class RealtimeStreamProvider {
  constructor() {
    this.apiKey = config.aisstream.apiKey;
    this.socket = null;
    this.subscribers = new Set();
    this.isConnected = false;
    this.reconnectTimer = null;
    this.boundingBoxes = null;
    this.stopped = false;
  }

  /**
   * Connect to global AIS maritime stream with geographic bounding box
   */
  connect(boundingBoxes = this.boundingBoxes || [[[3.0, 9.0], [5.0, 10.5]]]) { // Gulf of Guinea / Cameroon coast
    if (!this.apiKey) {
      logger.warn('[AISStream] API key missing; stream disabled.');
      return;
    }

    // A reconnect must not resurrect a stream that close() deliberately stopped.
    this.stopped = false;
    // Remembered so a reconnect re-subscribes to the caller's geofence rather
    // than silently falling back to the default bounding box.
    this.boundingBoxes = boundingBoxes;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket('wss://stream.aisstream.io/v0/stream');

      this.socket.on('open', () => {
        this.isConnected = true;
        logger.info('[AISStream] Connected to maritime telemetry stream.');
        const subscription = {
          APIKey: this.apiKey,
          BoundingBoxes: boundingBoxes,
          FilterMessageTypes: ['PositionReport', 'ShipStaticData']
        };
        this.socket.send(JSON.stringify(subscription));
      });

      this.socket.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          this._broadcast(parsed);
        } catch (e) {}
      });

      this.socket.on('close', () => {
        this.isConnected = false;
        logger.warn('[AISStream] Stream connection closed, scheduling reconnect in 10s...');
        this._scheduleReconnect();
      });

      this.socket.on('error', (err) => {
        this.isConnected = false;
        logger.error('[AISStream] Stream error', err);
      });
    } catch (err) {
      logger.error('[AISStream] Connection initialization error', err);
    }
  }

  _scheduleReconnect() {
    if (this.stopped) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), 10000);
    // A pending reconnect must not hold the process open during shutdown.
    if (typeof this.reconnectTimer.unref === 'function') this.reconnectTimer.unref();
  }

  _broadcast(message) {
    for (const callback of this.subscribers) {
      try {
        callback(message);
      } catch (err) {
        logger.error('[AISStream] Subscriber callback error', err);
      }
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  close() {
    // Set before closing the socket: the 'close' listener fires afterwards and
    // would otherwise schedule a reconnect that revives the stream we just shut
    // down (and keeps a live timer behind).
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.removeAllListeners();
      // close() on a CONNECTING socket emits 'error' on the next tick; with no
      // listener left that event is thrown and crashes the process.
      this.socket.on('error', () => {});
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

module.exports = new RealtimeStreamProvider();
