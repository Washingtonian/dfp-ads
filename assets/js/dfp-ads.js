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

 function decorateLog(args, prefix) {
   args = [].slice.call(args);
   prefix && args.unshift(prefix);
   args.unshift('display: inline-block; color: #fff; background: #054663; padding: 1px 4px; border-radius: 3px;');
   args.unshift('%cdfp-ads');
   return args;
 }

function dfpDebug() {
  if (window.dfpAdsDebug) {
    console.log.apply(console, decorateLog(arguments, 'DEBUG:'));
  }
}

function dfpInfo() {
 console.info.apply(console, decorateLog(arguments, 'INFO:'));
}

function dfpWarn() {
 console.warn.apply(console, decorateLog(arguments, 'WARN:'));
}

function dfpError() {
 console.error.apply(console, decorateLog(arguments, 'ERROR:'));
}


var googletag = googletag || {};
googletag.cmd = googletag.cmd || [];

window.dfp_ad_slot_objects = window.dfp_ad_slot_objects || [];

var windowWidth = window.innerWidth;

googletag.cmd.push(function() {
  googletag.pubads().disableInitialLoad();
  dfpDebug("Disabled initial load.");
  dfpDebug("Running DFP version: " + googletag.getVersion());
  dfpDebug("Pubads ready status: " + googletag.pubadsReady);

  var resizeTimer;
  // Object from Ajax
  var dfp_ad_data = dfp_ad_object[0],
    acct_id = dfp_ad_data.account_id;

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

    theUnit.defineSizeMapping(mapping.build());

  }



  /**
   * [dfpHandleResize description]
   * @return {[type]} [description]
   */
  function dfpHandleResize() {
      var currentWidth = window.innerWidth;
      if (windowWidth !== currentWidth) {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(dfpHandleResize, 500);
        windowWidth = currentWidth;
      }
    // googletag.pubads().refresh();
  }

  window.addEventListener('resize', dfpHandleResize);

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

  function amazonSendAdTargeting(bids) {
    dfpDebug("Amazon bids returned.");
    googletag.cmd.push(function(){
         apstag.setDisplayBids();
         window.dfp_ready_states["amazon"] = true;
         dfpDebug("Amazon ready.");
    } ) ;
  }

  function amazonTimeout() {
    googletag.cmd.push(function(){
        if (window.dfp_ready_states["amazon"]) { return; }
        dfpDebug("Amazon failure, proceeding.");
        window.dfp_ready_states["amazon"] = true;
    });
  }

  function amazonPrepare() {
    apstag.init({
         pubID: dfp_ad_object[0]["header_bidding_amazon_publisher_id"],
         adServer: "googletag",
         simplerGPT: true
    });
    window.dfp_ready_states["amazon"] = false;
    window.header_bidding_amazon_params["timeout"] = parseInt(dfp_ad_object[0]["header_bidding_amazon_timeout"]);
    googletag.cmd.push(function(){
        dfpDebug("Amazon requesting bids.");
        var thisVpWidth = window.innerWidth;
        for (slot of header_bidding_amazon_params["slots"]) {
            if ("sizes" in slot) {
                var filteredSizes = slot["sizes"].filter(function(value, index, arr){
                    return (arr[index][0] < thisVpWidth);
                });
                slot["sizes"] = filteredSizes;
            }
        }
        var filteredSlots = header_bidding_amazon_params["slots"].filter(function(value, index, arr){
            return (arr[index]["sizes"].length > 0);
        });
        header_bidding_amazon_params["slots"] = filteredSlots;

        apstag.fetchBids(window.header_bidding_amazon_params, amazonSendAdTargeting );
    } );
    setTimeout(amazonTimeout, window.header_bidding_amazon_params["timeout"]);
  }


   function prebidSendAdTargeting() {
       if (pbjs.adserverRequestSent) {
           dfpDebug("Already sent ad server request; returning");
           return;
       }
       dfpDebug("Prebid bids returned.");
       googletag.cmd.push(function() {
           pbjs.que.push(function() {
                 pbjs.setTargetingForGPTAsync();
                 pbjs.adserverRequestSent = true;
                 window.dfp_ready_states["prebid"] = true;
                 dfpDebug("Prebid ready.");
           });
       });
   }
   function prebidTimeout() {
       if (pbjs.adserverRequestSent) {
         dfpDebug("Ad server request already sent; returning");
         return;
       }
       dfpDebug("Prebid failure, proceeding.");
       prebidSendAdTargeting();
   }

  function prebidPrepare() {
    window.dfp_ready_states["prebid"] = false;
    var PREBID_TIMEOUT = parseInt(dfp_ad_object[0]["header_bidding_prebid_timeout"]);
    var pbp = window.header_bidding_prebid_params;
    var dao = dfp_ad_object[0];

    pbjs.que.push(function() {
        window.dfp_prebid_major_version = pbjs.version.substr(1,1);
        if (dfp_prebid_major_version > 0) {
            dfpDebug("Prebid 1.x+ requesting bids.");
            var config = {
                bidderTimeout: PREBID_TIMEOUT - 50,
                priceGranularity: dao['header_bidding_prebid_price_granularity'],
                bidderOrder: dao['header_bidding_prebid_bidder_order_fixed'],
                publisherDomain: dao['prebid_publisher_domain'],
                debug: window.dfpAdsDebug,
                sizeMapping: dao['header_bidding_prebid_size_config']
            };
            dfpDebug(config);
            pbjs.setConfig(config);
            pbjs.addAdUnits(header_bidding_prebid_1x_params);
            pbjs.requestBids({
                 bidsBackHandler: prebidSendAdTargeting
            });
        } else {
            dfpDebug("Prebid 0.x requesting bids.");
            pbjs.setPriceGranularity("dense");
            pbjs.addAdUnits(header_bidding_prebid_params);
            pbjs.requestBids({
                 bidsBackHandler: prebidSendAdTargeting
            });

        }
     });

     setTimeout(prebidTimeout, PREBID_TIMEOUT);
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
    dfpDebug("Enabling async loading.");
    googletag.pubads().enableAsyncRendering();
  }

  // Lazy Loading
  if (dfp_ad_data.lazy_load === true) {
    dfpDebug("Enabling lazy load.");
    googletag.pubads().enableLazyLoad();
  } else {
    dfpDebug("Not enabling lazy load.");
  }

  // Enable Single Request
  googletag.pubads().enableSingleRequest();

  // Center Ads
  googletag.pubads().setCentering(true);

  // Go
  googletag.enableServices();

  jQuery(document).ready(function() {
    dfpDebug("document ready");
    destroy_unnecessary_ad_positions();

    window.dfp_ready_states = window.dfp_ready_states || {};
    dfpDebug("GPT ready.");
    window.dfp_ready_states["gpt"] = true;

    if (window.header_bidding_amazon_params && header_bidding_amazon_enabled()) {
        amazonPrepare();
    } else {
        dfpDebug("Amazon: No header_bidding_amazon_params.");
    }

    var pbjs = pbjs || {};
    pbjs.que = pbjs.que || [];
    if (window.header_bidding_prebid_params) {
        prebidPrepare();
    } else {
        dfpDebug("Prebid: No header_bidding_prebid_params.");
    }

    dfpDebug("Header bidding through Prebid enabled: " + header_bidding_prebid_enabled());
    dfpDebug("Header bidding through Amazon enabled: " + header_bidding_amazon_enabled());

    setTimeout(refresh_when_ready, 50);

    setTimeout(destroy_unnecessary_ad_positions, 5000);
    setTimeout(load_unloaded_ad_positions, 5000);
  });

});

