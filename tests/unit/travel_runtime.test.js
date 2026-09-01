/**
 * LOUMOO Unit Tests — Travel Runtime & View State Lifecycle
 */

require('../setup');
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

async function run() {
  console.log('  Testing Travel Runtime & View State Lifecycle in prototype engine...');

  const content = fs.readFileSync('Commerce App.dc.html', 'utf8');

  const scriptMatch = content.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    throw new Error('Failed to find data-dc-script block in Commerce App.dc.html');
  }

  class DCLogic {
    constructor(props) {
      this.props = props || {};
      this.state = {};
    }
    setState(fnOrObj, cb) {
      if (typeof fnOrObj === 'function') {
        this.state = Object.assign({}, this.state, fnOrObj(this.state));
      } else {
        this.state = Object.assign({}, this.state, fnOrObj);
      }
      if (typeof cb === 'function') cb();
    }
  }

  const context = {
    DCLogic,
    console,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    document: {
      documentElement: {
        setAttribute: () => {}
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(scriptMatch[1] + "\nvar comp = new Component({ userName: 'Tchuekam', showAds: true });", context);
  const comp = context.comp;

  // 1. Initial State
  comp.componentDidMount();
  let vals = comp.renderVals();
  assert.strictEqual(comp.state.travelServiceTab, 'bus', 'Default travel tab is bus');
  assert.strictEqual(vals.isTravelTabBus, true, 'isTravelTabBus getter true');
  assert.strictEqual(vals.isTravelTabFlight, false, 'isTravelTabFlight getter false');
  assert.strictEqual(vals.isSeat4A, true, 'Default selected seat is 4A');

  // 2. Service Tab Switching
  vals.setTravelTabFlight();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.travelServiceTab, 'flight');
  assert.strictEqual(vals.isTravelTabFlight, true);
  assert.strictEqual(vals.isTravelTabBus, false);

  vals.setTravelTabTrain();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.travelServiceTab, 'train');
  assert.strictEqual(vals.isTravelTabTrain, true);

  vals.setTravelTabTaxi();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.travelServiceTab, 'taxi');
  assert.strictEqual(vals.isTravelTabTaxi, true);

  vals.setTravelTabBus();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.travelServiceTab, 'bus');

  // 3. Operator Filters
  vals.setBusFilterGeneral();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.busOperatorFilter, 'general');
  assert.strictEqual(vals.isBusFilterGeneral, true);
  assert.strictEqual(vals.isBusFilterAll, false);

  vals.setBusFilterFinexs();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.busOperatorFilter, 'finexs');
  assert.strictEqual(vals.isBusFilterFinexs, true);

  vals.setBusFilterAll();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.busOperatorFilter, 'all');
  assert.strictEqual(vals.isBusFilterAll, true);

  // 4. Visual Seat Selection
  vals.setBusSeat1A();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.selectedBusSeat, '1A');
  assert.strictEqual(vals.isSeat1A, true);
  assert.strictEqual(vals.isSeat4A, false);

  vals.setBusSeat2C();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.selectedBusSeat, '2C');
  assert.strictEqual(vals.isSeat2C, true);

  vals.setBusSeat4A();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.selectedBusSeat, '4A');
  assert.strictEqual(vals.isSeat4A, true);

  // 5. Booking Navigation Flow
  comp.go('travel');
  assert.strictEqual(comp.state.screen, 'travel');
  vals.on.travelBus();
  assert.strictEqual(comp.state.screen, 'travelBus');
  vals.on.travelPassenger();
  assert.strictEqual(comp.state.screen, 'travelPassenger');
  vals.bookTravelItem();
  assert.strictEqual(comp.state.screen, 'travelTicket');

  console.log('    ✓ Travel Runtime & View State Lifecycle passed all assertions.');
}

if (require.main === module) {
  run().catch(err => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}

module.exports = { run };
