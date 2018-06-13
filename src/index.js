/**
 * Navigation Timing API helpers
 * timing.getTimes();
 **/

const isNumeric = n => !isNaN(parseFloat(n)) && isFinite(n)

const result = (v, ...args) =>
  typeof v === 'function' ? v(...args) : v

// based on <https://github.com/addyosmani/timing.js.git>
const timing = window.timing || (window.timing = {

  /**
   * Uses console.table() to print a complete table of timing information
   * @param  Object opts Options (simple (bool) - opts out of full data view)
   */
  printTable: function (opts) {
    var table = {}
    var data = this.getTimes(opts) || {}
    Object.keys(data).sort().forEach(function (k) {
      table[k] = {
        ms: data[k],
        s: +((data[k] / 1000).toFixed(2))
      }
    })
    console.table(table)
  },

  /**
   * Uses console.table() to print a summary table of timing information
   */
  printSimpleTable: function () {
    this.printTable({ simple: true })
  }
})

// cache customize metrics implements
const metricsCache = {}

/**
 * Outputs extended measurements using Navigation Timing API
 * @param  Object opts Options (simple (bool) - opts out of full data view)
 * @return Object      measurements
 */
timing.getTimes = (opts) => {
  var performance = window.performance || window.webkitPerformance || window.msPerformance || window.mozPerformance

  if (performance === undefined) {
    return false
  }

  var timing = performance.timing
  var api = {}
  opts = opts || {}

  if (timing) {
    if (opts && !opts.simple) {
      for (var k in timing) {
        // hasOwnProperty does not work because properties are
        // added by modifying the object prototype
        if (isNumeric(timing[k])) {
          api[k] = parseFloat(timing[k])
        }
      }
    }

    // Total time from start to load
    api.loadTime = timing.loadEventEnd - timing.fetchStart

    // Time of dom content ready, seem like $.ready() fired.
    api.domContentReadyTime = api.domContentLoadedEventEnd - api.navigationStart
    // Time spent constructing the DOM tree
    api.domReadyTime = timing.domComplete - timing.domInteractive

    // Time consumed preparing the new page
    api.readyStart = timing.fetchStart - timing.navigationStart
    // Time spent during redirection
    api.redirectTime = timing.redirectEnd - timing.redirectStart
    // AppCache
    api.appcacheTime = timing.domainLookupStart - timing.fetchStart
    // Time spent unloading documents
    api.unloadEventTime = timing.unloadEventEnd - timing.unloadEventStart
    // DNS query time
    api.lookupDomainTime = timing.domainLookupEnd - timing.domainLookupStart
    // TCP connection time
    api.connectTime = timing.connectEnd - timing.connectStart
    // Time spent during the request
    api.requestTime = timing.responseEnd - timing.requestStart
    // Request to completion of the DOM loading
    api.initDomTreeTime = timing.domInteractive - timing.responseEnd
    // Load event time
    api.loadEventTime = timing.loadEventEnd - timing.loadEventStart
  }

  Object.keys(metricsCache).forEach(k => {
    try {
      const v = result(metricsCache[k], api)
      if (v !== undefined) {
        api[k] = v
      }
    } catch (e) {
      api[k] = 0
      console.error(e)
    }
  })

  return api
}

/**
 * Provide api for register customize or override metrics.
 */
timing.r = (name, fn) => {
  metricsCache[name] = fn
}

timing.r('finishLoadTime', () => {
  // If the browser supports the Navigation Timing 2 and HR Time APIs, use
  // them, otherwise fall back to the Navigation Timing 1 API.
  if (window.PerformanceNavigationTiming && performance.timeOrigin) {
    const ntEntry = performance.getEntriesByType('navigation')[0]
    return (ntEntry.loadEventEnd + performance.timeOrigin) / 1000
  } else {
    return performance.timing.loadEventEnd / 1000
  }
})

// Time to first paint -> https://css-tricks.com/paint-timing-api/
timing.r('firstPaintTime', (api) => {
  // All times are relative times to the start time within the
  // same objects
  var firstPaint = 0
  var firstPaintTime = 0

  // https://developers.google.com/web/updates/2017/12/chrome-loadtimes-deprecated
  if (window.PerformancePaintTiming) {
    const fpEntry = performance.getEntriesByType('paint')[0] || 0
    firstPaintTime = ((fpEntry.startTime || 0) + performance.timeOrigin) / 1000
  } else if (window.chrome && window.chrome.loadTimes) { // Chrome
    // Convert to ms
    firstPaint = window.chrome.loadTimes().firstPaintTime * 1000
    firstPaintTime = firstPaint - (window.chrome.loadTimes().startLoadTime * 1000)
  } else if (typeof window.performance.timing.msFirstPaint === 'number') { // IE
    firstPaint = window.performance.timing.msFirstPaint
    firstPaintTime = firstPaint - window.performance.timing.navigationStart
  }

  api.firstPaint = firstPaint
  api.firstPaintTime = firstPaintTime
})

export default timing
