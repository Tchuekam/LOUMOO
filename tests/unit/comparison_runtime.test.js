/**
 * LOUMOO Unit Tests — Comparison Runtime & View State Lifecycle
 */

require('../setup');
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

async function run() {
  console.log('  Testing Comparison Runtime & View State Lifecycle in prototype engine...');

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
  assert.strictEqual(comp.state.vs, 2, 'Initial comparison count is 2');
  assert.strictEqual(vals.vsSlot1Active, true, 'Slot 1 active initially');
  assert.strictEqual(vals.vsSlot2Active, true, 'Slot 2 active initially');
  assert.strictEqual(vals.vsSlot3Active, false, 'Slot 3 inactive initially');
  assert.strictEqual(vals.vsFilterAll, true, 'Default filter is ALL SPECS');

  // 2. Add / Remove slot interactions
  vals.toggleVsSlot3();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.vsSlot3Active, true, 'Slot 3 activated');
  assert.strictEqual(comp.state.vs, 3, 'Comparison count is 3');

  vals.removeVsSlot1();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.vsSlot1Active, false, 'Slot 1 deactivated');
  assert.strictEqual(comp.state.vs, 2, 'Comparison count decremented to 2');

  vals.addVsXps();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.vsSlot4Active, true, 'Slot 4 activated');
  assert.strictEqual(comp.state.vs, 3, 'Comparison count is 3');

  vals.resetVsDefaults();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.vsSlot1Active, true, 'Slot 1 restored');
  assert.strictEqual(comp.state.vsSlot2Active, true, 'Slot 2 restored');
  assert.strictEqual(comp.state.vsSlot3Active, false, 'Slot 3 cleared');
  assert.strictEqual(comp.state.vsSlot4Active, false, 'Slot 4 cleared');
  assert.strictEqual(comp.state.vs, 2, 'Comparison count restored to 2');

  // 3. Clear All Workspace
  vals.clearVsAll();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.vs, 0, 'Workspace cleared to 0 items');
  assert.strictEqual(vals.vsEmpty, true, 'Empty state active');

  vals.resetVsDefaults();
  vals = comp.renderVals();
  assert.strictEqual(vals.vsEmpty, false, 'Empty state inactive');
  assert.strictEqual(comp.state.vs, 2, 'Comparison count reset to 2');

  // 4. Matrix Filter Mode Switches
  vals.setVsFilterDiff();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.vsFilterMode, 'diff', 'Filter set to differences');
  assert.strictEqual(vals.vsFilterDiff, true, 'vsFilterDiff getter true');
  assert.strictEqual(vals.vsFilterAll, false, 'vsFilterAll getter false');

  vals.setVsFilterWinners();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.vsFilterMode, 'winners', 'Filter set to winners');
  assert.strictEqual(vals.vsFilterWinners, true, 'vsFilterWinners getter true');

  vals.setVsFilterAll();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.vsFilterMode, 'all', 'Filter set to all');
  assert.strictEqual(vals.vsFilterAll, true, 'vsFilterAll getter true');

  // 5. Smart User Priority Weights
  vals.setVsPriorityPrice();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.vsPriority, 'price', 'Priority set to price');
  assert.strictEqual(vals.vsPriPrice, true, 'vsPriPrice getter true');

  vals.setVsPriorityDisp();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.vsPriority, 'display', 'Priority set to display');
  assert.strictEqual(vals.vsPriDisp, true, 'vsPriDisp getter true');

  vals.setVsPriorityPerf();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.vsPriority, 'perf', 'Priority set to performance');
  assert.strictEqual(vals.vsPriPerf, true, 'vsPriPerf getter true');

  // 6. Accordion Toggles
  assert.strictEqual(vals.vsSecPerfOpen, true, 'Performance accordion open initially');
  vals.toggleVsPerfSec();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.vsSecPerfOpen, false, 'Performance accordion closed');
  assert.strictEqual(vals.vsSecPerfOpen, false, 'vsSecPerfOpen getter false');

  vals.toggleVsPerfSec();
  vals = comp.renderVals();
  assert.strictEqual(vals.vsSecPerfOpen, true, 'Performance accordion reopened');

  console.log('    ✓ Comparison Runtime & View State Lifecycle passed all assertions.');
}

module.exports = { run };

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
