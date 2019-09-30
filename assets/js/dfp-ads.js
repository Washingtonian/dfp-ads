/**
 * Javascript for Google Ads
 *
 **/


/**
 * Browser sizes [browser size] [ad size]
 * @type {Array}
 */


/**
 * Debug some text.
 *
 */

function dfpDebug(text) {
  if (window.dfpAdsDebug) {
    console.log(text);
  }
}

var googletag = googletag || {};
googletag.cmd = googletag.cmd || [];

window.dfp_ad_slot_objects = window.dfp_ad_slot_objects || [];

var windowWidth = window.innerWidth;

googletag.cmd.push(function() {

  var resizeTimer;
  // Object from Ajax
  var dfp_ad_data = dfp_ad_object[0],
    acct_id = dfp_ad_data.account_id;

  googletag.pubads().disableInitialLoad();

  if (getCookie('dfp_session_tracker') && parseInt(getCookie('dfp_session_tracker')) < 10) {
    setCookie("dfp_session_tracker", parseInt(getCookie('dfp_session_tracker')) + parseInt(1), 1);
  } else {
    setCookie("dfp_session_tracker", parseInt(1), 1);
  }

  var pageConfig = {
    allowPushExpansion: true,
  };

  googletag.pubads().setSafeFrameConfig(pageConfig);

  /**
   * Loads Ad Position
   *
   * @param {Array} positions - Array of ad positions
   */
  function load_ad_positions(positions) {
    var ad_pos, len;
    // Run through positions
    for (ad_pos = 0, len = Object.keys(positions).length; ad_pos < len; ++ad_pos) {
      var thePosition = positions[Object.keys(positions)[ad_pos]];
      if (thePosition != null) {
        var theUnit = define_ad_slot(thePosition);
        if (theUnit) {
          set_size_mappings(theUnit, thePosition);
        }
        window.dfp_ad_slot_objects[thePosition.position_tag] = theUnit;
      }
    }
  }



  /**
   * Is Prebid enabled?
   *
   */

  function header_bidding_prebid_enabled() {
    if (dfp_ad_data.header_bidding_prebid_enabled) {

      if (dfp_ad_data.header_bidding_prebid_enabled === "1") {
        return true;
      }
      return dfp_ad_data.header_bidding_prebid_enabled;
    }
    return false;
  }

  /**
   * Is Amazon UAM enabled?
   *
   */

  function header_bidding_amazon_enabled() {
    if (dfp_ad_data.header_bidding_amazon_enabled) {
      if (dfp_ad_data.header_bidding_amazon_enabled === "1") {
        return true;
      }
      return dfp_ad_data.header_bidding_amazon_enabled;
    }
    return false;
  }


  /**
   * Looks for unloaded ad positions and refreshes them.
   *
   */

  function load_unloaded_ad_positions() {

    if (!check_ready_states()) {
      setTimeout(load_unloaded_ad_positions, 1000);
      return;
    }

    var ad_pos, len;
    var reloaders = [];

    window.dfp_ad_slot_objects.forEach(function(thePosition) {
      if (thePosition.getResponseInformation() == undefined) {
        dfpDebug("This position did not load in time: " + thePosition);
        reloaders.push(thePosition);
      }
    });
    if (reloaders.length > 0) {
      googletag.pubads().refresh(reloaders, {
        changeCorrelator: false
      });
    }
  }


  /**
   * Looks for Unnecessary Ad Positions and deletes their slots.
   *
   */

  function destroy_unnecessary_ad_positions() {
    var ad_pos, len;
    var dfpKeys = Object.keys(window.dfp_ad_slot_objects)
    for (ad_pos = 0, len = dfpKeys.length; ad_pos < len; ++ad_pos) {
      var thePosition = window.dfp_ad_slot_objects[dfpKeys[ad_pos]];
      try {
        var theId = thePosition.getSlotElementId();
        if (document.getElementById(theId) === null) {
          if (window.dfpAdsDebug) {
            console.log("deleting " + theId);
          }
          if (!googletag.destroySlots([thePosition])) {
            if (window.dfpAdsDebug) {
              console.log("couldn't destroySlots");
            }
          };
          delete window.dfp_ad_slot_objects[dfpKeys[ad_pos]];
        }
      } catch (err) {
        if (window.dfpAdsDebug) {
          console.log("failed to evaluate presence of ad #" + ad_pos + ": " + dfpKeys[ad_pos]);
        }
      }
    }
  }

  /**
   * Loads Ad Position
   *
   * @param {Object} position - Array of ad positions
   */
  function define_ad_slot(position) {
    if (position.out_of_page === true) {
      return googletag.defineOutOfPageSlot(
        acct_id + position.ad_name,
        position.position_tag
      ).addService(googletag.pubads());
    } else {
      try {
        dfpDebug("defined slot " + position.ad_name + " in " + position.position_tag);
        return googletag.defineSlot(
          acct_id + position.ad_name,
          position.sizes,
          position.position_tag
        ).addService(googletag.pubads());
      } catch (err) {
        dfpDebug("error defining ad slot ");
        dfpDebug(position);
      }
    }
  }

  /**
   * Sets Page level targeting
   * @param {object} targeting
   */
  function set_targeting(targeting) {
    for (var target in targeting) {
      var key = target.toLowerCase();
      googletag.pubads().setTargeting(key, targeting[target]);
    }
    dfp_session_tracker = getCookie('dfp_session_tracker');
    googletag.pubads().setTargeting('pageviews', dfp_session_tracker);
  }

  /**
   * Set Size Mappings
   * @param {[type]} position [description]
   */
  function set_size_mappings(theUnit, position) {

    var mapping = googletag.sizeMapping();

    dfpDebug("Considering " + position["position_tag"] + " : " + JSON.stringify(position["sizes"]));

    if (position.sizes.includes('fluid')) {
      dfpDebug("Fluid size, not adding any mappings.");
      return false;
    }

    maps = [];
    if (!Array.isArray(position['sizes'][0])) {
      position['sizes'] = [position['sizes']];
    }

    for (var targetAdSizesIndex in position['sizes']) {
        targetAdSizes = position['sizes'][targetAdSizesIndex];
        if (!Array.isArray(targetAdSizes[0])) {
          targetAdSizes = [targetAdSizes];
        }

        for (var targetAdSizeIndex in targetAdSizes) {

          targetAdSize = targetAdSizes[targetAdSizeIndex];
          requiredBrowserSize = browser_sizes[targetAdSize];

          if (typeof(targetAdSize) == "string") {
            targetAdSize = targetAdSize.split(",").map(Number);
          } else {
            targetAdSize = [ targetAdSize ];
          }

          desiredAdSize = targetAdSize;

          if (targetAdSize in alternate_sizes) {
            desiredAdSize = alternate_sizes[targetAdSize].map(function(thing) {
              if (typeof(thing) == "object") {
                thing = thing[0];
              }
              if (typeof(thing) == "string") {
                return thing.split(",").map(Number);
              }
              return [ thing ];
              } )
              ;
          }
          if (maps.includes(requiredBrowserSize)) {
            for (var newDesiredAdSize in desiredAdSize) {
              if (!maps[requiredBrowserSize].includes(desiredAdSize)) {
                maps[requiredBrowserSize].push(desiredAdSize);
              }
            }
          } else {
            maps[requiredBrowserSize] = desiredAdSize;
          }
        }
    }

    mapping.addSize([0,0], []);

    for (var map in maps) {
        targetAdSizes = maps[map];
        if ( targetAdSizes.length == 1) {
          targetAdSizes = targetAdSizes[0];
        }
        map = map.split(',').map(Number);
        dfpDebug("For browsers larger than " + JSON.stringify(map) + ", adding sizes " + JSON.stringify(targetAdSizes));

        mapping.addSize(map, targetAdSizes);
    }

    if (typeof theUnit.defineSizeMapping === 'function') {
      theUnit.defineSizeMapping(mapping.build());
    }

  }


  window.addEventListener('resize', function() {
    var currentWidth = window.innerWidth;
    if (windowWidth !== currentWidth) {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizer, 500);
      windowWidth = currentWidth;
    }
  });

  /**
   * [resizer description]
   * @return {[type]} [description]
   */
  function resizer() {
    // googletag.pubads().refresh();
  }

  /**
   *
   * @param cname
   * @param cvalue
   * @param exdays
   */
  function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
  }

  /**
   *
   * @param cname
   * @returns {*}
   */
  function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1);
      if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
  }

  /**
   *
   * @param name
   */
  function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
  }

  function hasClass(ele, cls) {
    return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
  }

  function check_ready_states() {
    isReady = true;
    window.dfp_ready_states = window.dfp_ready_states || {};

    if (window.dfp_ready_states == {}) {
      isReady = false;
    }

    for (var key in window.dfp_ready_states) {
      if (window.dfp_ready_states[key] !== true) {
        isReady = false;
      }
    }
    return isReady;
  }

  function refresh_when_ready() {
    isReady = check_ready_states();
    if (isReady) {
        dfpDebug("All ad service clients ready, requesting ads.");
      googletag.pubads().refresh();
    } else {
      setTimeout(refresh_when_ready, 50);
    }
  }

  // Targeting

  if (hasClass(document.getElementsByTagName("body")[0], "home")) {
    set_targeting({
      "Page": ["Home", "Homepage"]
    });
  } else {
    set_targeting(dfp_ad_data.page_targeting);
  }


  // Generates Ad Slots
  load_ad_positions(dfp_ad_data.positions);

  // Collapse Empty Divs
  // googletag.pubads().collapseEmptyDivs();

  // Asynchronous Loading
  if (dfp_ad_data.asynch === true) {
    googletag.pubads().enableAsyncRendering();
  }
  // Enable Single Request
  googletag.pubads().enableSingleRequest();
  // Go
  googletag.pubads().setCentering(true);
  googletag.enableServices();

  jQuery(document).ready(function() {
    dfpDebug("document ready");
    destroy_unnecessary_ad_positions();

    window.dfp_ready_states = window.dfp_ready_states || {};
    dfpDebug("GPT ready.");
    window.dfp_ready_states["gpt"] = true;

    dfpDebug("Header bidding through Prebid enabled: " + header_bidding_prebid_enabled());
    dfpDebug("Header bidding through Amazon enabled: " + header_bidding_amazon_enabled());

    setTimeout(refresh_when_ready, 50);

    setTimeout(destroy_unnecessary_ad_positions, 5000);
    setTimeout(load_unloaded_ad_positions, 5000);
  });

});
