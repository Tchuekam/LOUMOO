/**
 * LOUMOO Commerce Core — Order State Machine
 * ---------------------------------------------------------------------------
 * Enforces legal lifecycle transitions for Commerce Orders.
 * Disallows arbitrary client-dictated state jumps and protects terminal states.
 */

const { FULFILLMENT_STATUS, PAYMENT_STATUS } = require('./Order');
const { ConflictError, ValidationError } = require('../../../shared/errors/AppError');

const ALLOWED_FULFILLMENT_TRANSITIONS = Object.freeze({
  [FULFILLMENT_STATUS.PROCESSING]: Object.freeze([
    FULFILLMENT_STATUS.IN_TRANSIT,
    FULFILLMENT_STATUS.CANCELLED
  ]),
  [FULFILLMENT_STATUS.IN_TRANSIT]: Object.freeze([
    FULFILLMENT_STATUS.DELIVERED
  ]),
  [FULFILLMENT_STATUS.DELIVERED]: Object.freeze([]), // Terminal
  [FULFILLMENT_STATUS.CANCELLED]: Object.freeze([])  // Terminal
});

class OrderStateMachine {
  /**
   * Check if a transition from currentStatus to nextStatus is valid.
   * @param {string} currentStatus
   * @param {string} nextStatus
   * @returns {boolean}
   */
  static canTransition(currentStatus, nextStatus) {
    if (!currentStatus || !nextStatus) return false;
    if (currentStatus === nextStatus) return false; // Redundant / duplicate transition
    const allowed = ALLOWED_FULFILLMENT_TRANSITIONS[currentStatus];
    return Array.isArray(allowed) && allowed.includes(nextStatus);
  }

  /**
   * Asserts that a state transition is legal, or throws a ConflictError.
   * @param {string} currentStatus
   * @param {string} nextStatus
   * @param {string} [orderNumber]
   */
  static assertTransition(currentStatus, nextStatus, orderNumber = '') {
    const label = orderNumber ? `Order ${orderNumber}` : 'Order';
    
    if (!ALLOWED_FULFILLMENT_TRANSITIONS[currentStatus]) {
      throw new ValidationError(`Unknown order fulfillment status: "${currentStatus}"`);
    }

    if (currentStatus === nextStatus) {
      throw new ConflictError(`${label} is already in status "${currentStatus}".`);
    }

    if (!OrderStateMachine.canTransition(currentStatus, nextStatus)) {
      if (currentStatus === FULFILLMENT_STATUS.DELIVERED) {
        throw new ConflictError(`${label} is already delivered and reached a terminal state.`);
      }
      if (currentStatus === FULFILLMENT_STATUS.CANCELLED) {
        throw new ConflictError(`${label} has already been cancelled and reached a terminal state.`);
      }
      if (currentStatus === FULFILLMENT_STATUS.IN_TRANSIT && nextStatus === FULFILLMENT_STATUS.CANCELLED) {
        throw new ConflictError(`${label} is already in transit with the carrier and cannot be cancelled directly.`);
      }
      throw new ConflictError(`Invalid order state transition from "${currentStatus}" to "${nextStatus}".`);
    }
  }

  /**
   * Asserts that an order can be cancelled by the buyer.
   * @param {string} currentStatus
   * @param {string} [orderNumber]
   */
  static assertBuyerCanCancel(currentStatus, orderNumber = '') {
    const label = orderNumber ? `Order ${orderNumber}` : 'Order';
    if (currentStatus !== FULFILLMENT_STATUS.PROCESSING) {
      if (currentStatus === FULFILLMENT_STATUS.IN_TRANSIT) {
        throw new ConflictError(`${label} cannot be cancelled because it is already in transit with courier.`);
      }
      if (currentStatus === FULFILLMENT_STATUS.DELIVERED) {
        throw new ConflictError(`${label} cannot be cancelled because it has already been delivered.`);
      }
      if (currentStatus === FULFILLMENT_STATUS.CANCELLED) {
        throw new ConflictError(`${label} is already cancelled.`);
      }
      throw new ConflictError(`${label} cannot be cancelled in state "${currentStatus}".`);
    }
  }
}

module.exports = {
  OrderStateMachine,
  ALLOWED_FULFILLMENT_TRANSITIONS
};
