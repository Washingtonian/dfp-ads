/**
 * Javascript for Google Ads
 *
 **/
/**
 * Browser sizes [browser size] [ad size]
 * @type {Array}
 */

var googletag = googletag || {};
googletag.cmd = googletag.cmd || [];

var browser_sizes = [
    ['200,100', '180,90'],
    ['200,180', '180,150'],
    ['220,220', '200,200'],
    ['300,200', '245,155'],
    ['320,50', '300,100'],
    ['320,400', '300,250'],
    ['320,100', '320,50'],
    ['320,150', '320,100'],
    ['340,400', '336,280'],
    ['320,800', '300,600'],
    ['400,700', '160,600'],
    ['500,200', '468,60'],
    ['500,600', '240,400'],
    ['650,350', '600,300'],
    ['740,250', '728,90'],
    ['990,250', '970,250'],
    ['1,1', '1,1']
];

var alternate_sizes = [
    ['300,600', [
        [300, 600],
        [300, 250]
    ]],
    ['600,300', [
        [600, 300],
        [300, 250]
    ]],
    ['970,250', [
        [970, 250],
        [728, 90],
        [970, 90]
    ]]
];

var dfp_ad_slot_objects = [];

var windowWidth = window.innerWidth;

  googletag.cmd.push(function () {

      var resizeTimer;
      // Object from Ajax
      var dfp_ad_data = dfp_ad_object[0],
          acct_id = dfp_ad_data.account_id;

      if (getCookie('dfp_session_tracker') && parseInt(getCookie('dfp_session_tracker')) < 10) {
          setCookie("dfp_session_tracker", parseInt(getCookie('dfp_session_tracker')) + parseInt(1), 1);
      } else {
          setCookie("dfp_session_tracker", parseInt(1), 1);
      }

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
                  dfp_ad_slot_objects[thePosition.position_tag] = theUnit;
              }
          }
      }

      /**
       * Looks for Unnecessary Ad Positions and deletes their slots.
       *
       */

      function destroy_unnecessary_ad_positions() {

        for (ad_pos = 0, len = Object.keys(dfp_ad_slot_objects).length; ad_pos < len; ++ad_pos) {
          var thePosition = dfp_ad_slot_objects[Object.keys(dfp_ad_slot_objects)[ad_pos]];
          try {
            var theId = thePosition.getSlotElementId();
          } catch (err) {
            googletag.destroySlots(thePosition);
            delete thePosition;
          }
          if (document.getElementById(theId) === null) {
            console.log("deleting " + theId);
            googletag.destroySlots([thePosition]);
            delete thePosition;
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
                    return googletag.defineSlot(
                        acct_id + position.ad_name,
                        position.sizes,
                        position.position_tag
                    ).addService(googletag.pubads());
            } catch(err) {}
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

          var map = googletag.sizeMapping();

          if (position.sizes.includes('fluid')) {
              return false;
          }

          if (!Array.isArray(position['sizes'][0])) {
              var arrayPosition0 = position['sizes'][0];
              var arrayPosition1 = position['sizes'][1];
              checkForUndefined(arrayPosition0);
              for (var browser in browser_sizes) {
                  if (browser_sizes[browser][1] == arrayPosition0 + ',' + arrayPosition1) {
                      for (var alt_size in alternate_sizes) {
                          checkForUndefined(alternate_sizes[alt_size]);
                          if (alternate_sizes[alt_size][0] == arrayPosition0 + ',' + arrayPosition1) {
                              map.addSize(browser_sizes[browser][0].split(',').map(Number), alternate_sizes[alt_size][1]);
                          }
                      }
                      map.addSize(browser_sizes[browser][0].split(',').map(Number), [arrayPosition0, arrayPosition1]);
                  }
              }
          } else {

              for (var size in position['sizes']) {

                  var arrayPosition0 = position['sizes'][size][0];
                  var arrayPosition1 = position['sizes'][size][1];
                  checkForUndefined(arrayPosition0);
                  for (var browser in browser_sizes) {
                      checkForUndefined(browser_sizes[browser][1]);
                      if (browser_sizes[browser][1] == arrayPosition0 + ',' + arrayPosition1) {
                          for (var alt_size in alternate_sizes) {
                              checkForUndefined(alternate_sizes[alt_size]);
                              if (alternate_sizes[alt_size][0] == arrayPosition0 + ',' + arrayPosition1) {
                                  map.addSize(browser_sizes[browser][0].split(',').map(Number), alternate_sizes[alt_size][1]);
                              }
                          }
                          map.addSize(browser_sizes[browser][0].split(',').map(Number), position['sizes'][size]);
                      }
                  }
              }
          }
          map.addSize([0, 0], []);

          theUnit.defineSizeMapping(map.build());

      }


      window.addEventListener('resize', function () {
          var currentWidth = window.innerWidth;
          if (windowWidth !== currentWidth) {
              clearTimeout(resizeTimer);
              resizeTimer = setTimeout(resizer, 500);
              windowWidth = currentWidth;
          }
      });

      /**
       * @param variable
       * @returns {boolean}
       */
      function checkForUndefined(variable) {
          if (variable == undefined) {
              return false;
          }
          return true;
      }


      /**
       * [resizer description]
       * @return {[type]} [description]
       */
      function resizer() {
          googletag.pubads().refresh();
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

      // Generates Ad Slots
      load_ad_positions(dfp_ad_data.positions);

      // Collapse Empty Divs
      googletag.pubads().collapseEmptyDivs();

      // Targeting
      if (jQuery('body.home').length === 0) {
          set_targeting(dfp_ad_data.page_targeting);
      } else {
          set_targeting({"Page":["Home"]});
      }

      // Asynchronous Loading
      if (dfp_ad_data.asynch === true) {
          googletag.pubads().enableAsyncRendering();
      }
      // Enable Single Request
      googletag.pubads().enableSingleRequest();
      // Go
      googletag.pubads().disableInitialLoad();

      jQuery(document).ready(function() {
          destroy_unnecessary_ad_positions();
          console.log("enabling services");
          googletag.enableServices();
          googletag.cmd.push(function(){googletag.pubads().refresh();});
      });

  });
