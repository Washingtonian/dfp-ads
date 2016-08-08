/**
 * Javascript for Google Ads
 *
 **/

/**
 * Browser sizes [browser size] [ad size]
 * @type {Array}
 */
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
    ['740,250', '728,90'],
    ['990,250', '970,250']
];

var alternate_sizes = [
    ['300,600', [[300, 600], [300, 250]]],
    ['970,250', [[970, 250], [728, 90], [970, 90]]]
];

var windowHight = window.innerHeight;
var windowWidth = window.innerWidth;

googletag.cmd.push(function () {

    var resizeTimer;
    var googleAdUnit;

    // Object from Ajax
    var dfp_ad_data = dfp_ad_object[0],
        acct_id = dfp_ad_data.account_id;

    for (var position in dfp_ad_data['positions']) {

        var target = dfp_ad_data['positions'][position]['position_tag'];

        if (target != null || target != undefined) {
            if (document.getElementById(target) === null) {
                dfp_ad_data['positions'][position] = null;
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
            if (positions[ad_pos] != null) {
                define_ad_slot(positions[ad_pos]);
                set_size_mappings(positions[ad_pos]);
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
            googleAdUnit = googletag.defineOutOfPageSlot(
                acct_id + position.ad_name,
                position.position_tag + '-oop'
            ).setCollapseEmptyDiv(true, true).addService(googletag.pubads());
        } else {
            googleAdUnit = googletag.defineSlot(
                acct_id + position.ad_name,
                position.sizes,
                position.position_tag
            ).setCollapseEmptyDiv(true, true).addService(googletag.pubads());
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
    }

    /**
     * Set Size Mappings
     * @param {[type]} sizes [description]
     */
    function set_size_mappings(position) {

        var map = googletag.sizeMapping();

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

        googleAdUnit.defineSizeMapping(map.build());
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
    }

    /**
     * [resizer description]
     * @return {[type]} [description]
     */
    function resizer() {
        googletag.pubads().refresh();
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
    // Enable Single Request
    googletag.pubads().enableSingleRequest();

    // Go
    googletag.enableServices();
});
