/*@@ prelude @@*/

class Component extends DCLogic {
  state = {
/*@@ state @@*/
  };
/*@@ members @@*/

  renderVals() {
/*@@ render @@*/

    const viewProps = {
/*@@ props @@*/
    };
    // Pass the already-derived render object to on-demand screen chunks. A
    // shared object keeps lazy boundaries cheap and avoids recomputing the
    // entire projection in every child component.
    viewProps.viewProps = viewProps;
    return viewProps;
  }
}
