/**
 * These scripts need to be EVALuated within the context of the currently inspected page 
 * We do that using chrome API's eval function within devtools.js 
 */
const contentScripts = (() => {
  /**
   * Return CSS text of all stylesheets in the page
   *  or only a href if the stylesheet is external
   */
  function getStyleSheets() {
    return [].slice.call(document.styleSheets).map(({ cssRules: cr, href }) => (
      {
        href,
        cssText: (cr && cr.length) ? [].slice.call(cr).map(r => r.cssText).join(" \n") : null,
      }
    )).filter(v => v.href || v.cssText);
  }

  /**
   * Return HTML of last inspected element + full page HTML source
   * Exception when $0 is null is captured by windowEval Promise reject
   */
  function getLastInspectedElement() {
    if ($0 == null) {
      throw new Error("Nothing inspected yet.");
    }
    let u = $0;
    let fullHtml = $0.outerHTML;
    while (u.nodeName.toLowerCase() != "body") {
      u = u.parentNode;
      if (u == null) {
        throw new Error("Invalid element selected.");
      }
      fullHtml = u.outerHTML.replace(u.innerHTML, fullHtml);
    }
    
    return {
      element: $0.outerHTML,
      fullHtml,
      href: window.location.href
    };
  }

  /** Helper functions */
  function toEvalString(functionRef) {
    // functions must return immediately (no Promises inside allowed)
    return `(${functionRef.toString()})()`;
  }

  function windowEval(functionRef) {
    const evalString = toEvalString(functionRef);

    // Use any CommandLine APIs inside eval() - e.g. $0 or inspect()
    return new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(evalString, (result, exception) => {
        if (exception) {
          reject(exception);
        } else {
          resolve(result);
        }
      });
    });
  }

  return {
    getStyleSheets: () => windowEval(getStyleSheets),
    getLastInspectedElement: () => windowEval(getLastInspectedElement)
  };
})();

