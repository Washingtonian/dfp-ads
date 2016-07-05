/**
 * Javascript for Google Ads
 *
 **/
/**
 * Ad Position Creation
 */

/**
 * Browser sizes [browser size] [ad size]
 * @type {Array}
 */
var browser_sizes = [
  ['990,250','970,250'],
  ['740,250','728,90'],
  ['320,400','300,250']
];


googletag.cmd.push(function () {

  var googleAdUnit;

  // Object from Ajax
  var dfp_ad_data = dfp_ad_object[0],
      acct_id = dfp_ad_data.account_id;

  for( var position in dfp_ad_data['positions']) {
    var target = dfp_ad_data['positions'][position]['position_tag'];
    if(target != null) {
      if(document.getElementById(target) == null) {
        dfp_ad_data['positions'].splice(position, 1);
      }
    }
  }

  /**
   * Loads Ad Position
   *
   * @param {Array} positions - Array of ad positions
   */
  function load_ad_positions(positions) {
    var ad_pos, len;
    // Run through positions
    for (ad_pos = 0, len = positions.length; ad_pos < len; ++ad_pos) {

      define_ad_slot(positions[ad_pos]);
      set_size_mappings(positions[ad_pos])
    }
  }

  /**
   * Loads Ad Position
   *
   * @param {Object} position - Array of ad positions
   */
  function define_ad_slot(position) {
    console.debug(position);
    googleAdUnit = googletag.defineSlot(
        acct_id + position.ad_name,
        position.sizes,
        position.position_tag
    ).setCollapseEmptyDiv(true,true).addService(googletag.pubads());
    // if (position.out_of_page === true) {
    //   googleAdUnit = googletag.defineOutOfPageSlot(
    //       acct_id + position.ad_name,
    //       position.position_tag + '-oop'
    //   ).setCollapseEmptyDiv(true,true).addService(googletag.pubads());
    // }
  }

  /**
   * Sets Page level targeting
   * @param {object} targeting
   */
  function set_targeting(targeting) {
    for (var target in targeting) {
      var key = target.toLowerCase();

      googleAdUnit.setTargeting(key, targeting[target]);
    }
  }

  /**
   * Set Size Mappings
   * @param {[type]} sizes [description]
   */
  function set_size_mappings(positions) {
    var map = googletag.sizeMapping();

    for(var size in positions['sizes']) {
      for (var browser in browser_sizes) {
        if((positions['sizes'][size][0] != 'undefined') && (browser_sizes[browser][1] == positions['sizes'][size][0] + ',' + positions['sizes'][size][1])) {
          map.addSize(browser_sizes[browser][0].split(',').map(Number), positions['sizes'][size]);
        }
      }
    }
    googleAdUnit.defineSizeMapping(map.build());
  }

  // Generates Ad Slots
  load_ad_positions(dfp_ad_data.positions);
  // Collapse Empty Divs
  googletag.pubads().collapseEmptyDivs(true);
  // Targeting
  set_targeting(dfp_ad_data.page_targeting);
  // Asynchronous Loading
  if (dfp_ad_data.asynch === true) {
    googletag.pubads().enableAsyncRendering();
  }
  // Go
  googletag.enableServices();
});
