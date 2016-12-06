/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /** @module pbjs */
	
	var _prebidGlobal = __webpack_require__(1);
	
	var _utils = __webpack_require__(2);
	
	var _video = __webpack_require__(4);
	
	__webpack_require__(25);
	
	var _url = __webpack_require__(11);
	
	var _cpmBucketManager = __webpack_require__(14);
	
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
	
	var pbjs = (0, _prebidGlobal.getGlobal)();
	var CONSTANTS = __webpack_require__(3);
	var utils = __webpack_require__(2);
	var bidmanager = __webpack_require__(13);
	var adaptermanager = __webpack_require__(5);
	var bidfactory = __webpack_require__(12);
	var adloader = __webpack_require__(16);
	var events = __webpack_require__(8);
	var adserver = __webpack_require__(26);
	
	/* private variables */
	
	var objectType_function = 'function';
	var objectType_undefined = 'undefined';
	var objectType_object = 'object';
	var BID_WON = CONSTANTS.EVENTS.BID_WON;
	var AUCTION_END = CONSTANTS.EVENTS.AUCTION_END;
	
	var auctionRunning = false;
	var bidRequestQueue = [];
	var pbTargetingKeys = [];
	
	var eventValidators = {
	  bidWon: checkDefinedPlacement
	};
	
	/* Public vars */
	
	pbjs._bidsRequested = [];
	pbjs._bidsReceived = [];
	// _adUnitCodes stores the current filter to use for adUnits as an array of adUnitCodes
	pbjs._adUnitCodes = [];
	pbjs._winningBids = [];
	pbjs._adsReceived = [];
	pbjs._sendAllBids = false;
	
	pbjs.bidderSettings = pbjs.bidderSettings || {};
	
	//default timeout for all bids
	pbjs.bidderTimeout = pbjs.bidderTimeout || 3000;
	
	// current timeout set in `requestBids` or to default `bidderTimeout`
	pbjs.cbTimeout = pbjs.cbTimeout || 200;
	
	// timeout buffer to adjust for bidder CDN latency
	pbjs.timeoutBuffer = 200;
	
	pbjs.logging = pbjs.logging || false;
	
	//let the world know we are loaded
	pbjs.libLoaded = true;
	
	//version auto generated from build
	pbjs.version = 'v0.15.2-pre';
	utils.logInfo('Prebid.js v0.15.2-pre loaded');
	
	//create adUnit array
	pbjs.adUnits = pbjs.adUnits || [];
	
	/**
	 * Command queue that functions will execute once prebid.js is loaded
	 * @param  {function} cmd Annoymous function to execute
	 * @alias module:pbjs.que.push
	 */
	pbjs.que.push = function (cmd) {
	  if ((typeof cmd === 'undefined' ? 'undefined' : _typeof(cmd)) === objectType_function) {
	    try {
	      cmd.call();
	    } catch (e) {
	      utils.logError('Error processing command :' + e.message);
	    }
	  } else {
	    utils.logError('Commands written into pbjs.que.push must wrapped in a function');
	  }
	};
	
	function processQue() {
	  for (var i = 0; i < pbjs.que.length; i++) {
	    if (_typeof(pbjs.que[i].called) === objectType_undefined) {
	      try {
	        pbjs.que[i].call();
	        pbjs.que[i].called = true;
	      } catch (e) {
	        utils.logError('Error processing command :', 'prebid.js', e);
	      }
	    }
	  }
	}
	
	function checkDefinedPlacement(id) {
	  var placementCodes = pbjs._bidsRequested.map(function (bidSet) {
	    return bidSet.bids.map(function (bid) {
	      return bid.placementCode;
	    });
	  }).reduce(_utils.flatten).filter(_utils.uniques);
	
	  if (!utils.contains(placementCodes, id)) {
	    utils.logError('The "' + id + '" placement is not defined.');
	    return;
	  }
	
	  return true;
	}
	
	function resetPresetTargeting() {
	  if ((0, _utils.isGptPubadsDefined)()) {
	    window.googletag.pubads().getSlots().forEach(function (slot) {
	      pbTargetingKeys.forEach(function (key) {
	        slot.setTargeting(key, null);
	      });
	    });
	  }
	}
	
	function setTargeting(targetingConfig) {
	  window.googletag.pubads().getSlots().forEach(function (slot) {
	    targetingConfig.filter(function (targeting) {
	      return Object.keys(targeting)[0] === slot.getAdUnitPath() || Object.keys(targeting)[0] === slot.getSlotElementId();
	    }).forEach(function (targeting) {
	      return targeting[Object.keys(targeting)[0]].forEach(function (key) {
	        key[Object.keys(key)[0]].map(function (value) {
	          utils.logMessage('Attempting to set key value for slot: ' + slot.getSlotElementId() + ' key: ' + Object.keys(key)[0] + ' value: ' + value);
	          return value;
	        }).forEach(function (value) {
	          slot.setTargeting(Object.keys(key)[0], value);
	        });
	      });
	    });
	  });
	}
	
	function getStandardKeys() {
	  return bidmanager.getStandardBidderAdServerTargeting() // in case using a custom standard key set
	  .map(function (targeting) {
	    return targeting.key;
	  }).concat(CONSTANTS.TARGETING_KEYS).filter(_utils.uniques); // standard keys defined in the library.
	}
	
	function getWinningBids(adUnitCode) {
	  // use the given adUnitCode as a filter if present or all adUnitCodes if not
	  var adUnitCodes = adUnitCode ? [adUnitCode] : pbjs._adUnitCodes;
	
	  return pbjs._bidsReceived.filter(function (bid) {
	    return adUnitCodes.includes(bid.adUnitCode);
	  }).filter(function (bid) {
	    return bid.cpm > 0;
	  }).map(function (bid) {
	    return bid.adUnitCode;
	  }).filter(_utils.uniques).map(function (adUnitCode) {
	    return pbjs._bidsReceived.filter(function (bid) {
	      return bid.adUnitCode === adUnitCode ? bid : null;
	    }).reduce(_utils.getHighestCpm, {
	      adUnitCode: adUnitCode,
	      cpm: 0,
	      adserverTargeting: {},
	      timeToRespond: 0
	    });
	  });
	}
	
	function getWinningBidTargeting() {
	  var winners = getWinningBids();
	
	  // winning bids with deals need an hb_deal targeting key
	  winners.filter(function (bid) {
	    return bid.dealId;
	  }).map(function (bid) {
	    return bid.adserverTargeting.hb_deal = bid.dealId;
	  });
	
	  var standardKeys = getStandardKeys();
	  winners = winners.map(function (winner) {
	    return _defineProperty({}, winner.adUnitCode, Object.keys(winner.adserverTargeting).filter(function (key) {
	      return typeof winner.sendStandardTargeting === "undefined" || winner.sendStandardTargeting || standardKeys.indexOf(key) === -1;
	    }).map(function (key) {
	      return _defineProperty({}, key.substring(0, 20), [winner.adserverTargeting[key]]);
	    }));
	  });
	
	  return winners;
	}
	
	function getDealTargeting() {
	  return pbjs._bidsReceived.filter(function (bid) {
	    return bid.dealId;
	  }).map(function (bid) {
	    var dealKey = 'hb_deal_' + bid.bidderCode;
	    return _defineProperty({}, bid.adUnitCode, getTargetingMap(bid, CONSTANTS.TARGETING_KEYS).concat(_defineProperty({}, dealKey.substring(0, 20), [bid.adserverTargeting[dealKey]])));
	  });
	}
	
	/**
	 * Get custom targeting keys for bids that have `alwaysUseBid=true`.
	 */
	function getAlwaysUseBidTargeting(adUnitCodes) {
	  var standardKeys = getStandardKeys();
	  return pbjs._bidsReceived.filter(_utils.adUnitsFilter.bind(this, adUnitCodes)).map(function (bid) {
	    if (bid.alwaysUseBid) {
	      return _defineProperty({}, bid.adUnitCode, Object.keys(bid.adserverTargeting).map(function (key) {
	        // Get only the non-standard keys of the losing bids, since we
	        // don't want to override the standard keys of the winning bid.
	        if (standardKeys.indexOf(key) > -1) {
	          return;
	        }
	
	        return _defineProperty({}, key.substring(0, 20), [bid.adserverTargeting[key]]);
	      }).filter(function (key) {
	        return key;
	      }));
	    }
	  }).filter(function (bid) {
	    return bid;
	  }); // removes empty elements in array;
	}
	
	function getBidLandscapeTargeting(adUnitCodes) {
	  var standardKeys = CONSTANTS.TARGETING_KEYS;
	
	  return pbjs._bidsReceived.filter(_utils.adUnitsFilter.bind(this, adUnitCodes)).map(function (bid) {
	    if (bid.adserverTargeting) {
	      return _defineProperty({}, bid.adUnitCode, getTargetingMap(bid, standardKeys));
	    }
	  }).filter(function (bid) {
	    return bid;
	  }); // removes empty elements in array
	}
	
	function getTargetingMap(bid, keys) {
	  return keys.map(function (key) {
	    return _defineProperty({}, (key + '_' + bid.bidderCode).substring(0, 20), [bid.adserverTargeting[key]]);
	  });
	}
	
	function getAllTargeting(adUnitCode) {
	  var adUnitCodes = adUnitCode && adUnitCode.length ? [adUnitCode] : pbjs._adUnitCodes;
	
	  // Get targeting for the winning bid. Add targeting for any bids that have
	  // `alwaysUseBid=true`. If sending all bids is enabled, add targeting for losing bids.
	  var targeting = getWinningBidTargeting(adUnitCodes).concat(getAlwaysUseBidTargeting(adUnitCodes)).concat(pbjs._sendAllBids ? getBidLandscapeTargeting(adUnitCodes) : []).concat(getDealTargeting(adUnitCodes));
	
	  //store a reference of the targeting keys
	  targeting.map(function (adUnitCode) {
	    Object.keys(adUnitCode).map(function (key) {
	      adUnitCode[key].map(function (targetKey) {
	        if (pbTargetingKeys.indexOf(Object.keys(targetKey)[0]) === -1) {
	          pbTargetingKeys = Object.keys(targetKey).concat(pbTargetingKeys);
	        }
	      });
	    });
	  });
	  return targeting;
	}
	
	/**
	 * When a request for bids is made any stale bids remaining will be cleared for
	 * a placement included in the outgoing bid request.
	 */
	function clearPlacements() {
	  pbjs._bidsRequested = pbjs._bidsRequested.filter(function (request) {
	    return request.bids.filter(function (bid) {
	      return !pbjs._adUnitCodes.includes(bid.placementCode);
	    }).length > 0;
	  });
	  pbjs._bidsReceived = pbjs._bidsReceived.filter(function (bid) {
	    return !pbjs._adUnitCodes.includes(bid.adUnitCode);
	  });
	}
	
	function setRenderSize(doc, width, height) {
	  if (doc.defaultView && doc.defaultView.frameElement) {
	    doc.defaultView.frameElement.width = width;
	    doc.defaultView.frameElement.height = height;
	  }
	}
	
	//////////////////////////////////
	//                              //
	//    Start Public APIs         //
	//                              //
	//////////////////////////////////
	
	/**
	 * This function returns the query string targeting parameters available at this moment for a given ad unit. Note that some bidder's response may not have been received if you call this function too quickly after the requests are sent.
	 * @param  {string} [adunitCode] adUnitCode to get the bid responses for
	 * @alias module:pbjs.getAdserverTargetingForAdUnitCodeStr
	 * @return {array}  returnObj return bids array
	 */
	pbjs.getAdserverTargetingForAdUnitCodeStr = function (adunitCode) {
	  utils.logInfo('Invoking pbjs.getAdserverTargetingForAdUnitCodeStr', arguments);
	
	  // call to retrieve bids array
	  if (adunitCode) {
	    var res = pbjs.getAdserverTargetingForAdUnitCode(adunitCode);
	    return utils.transformAdServerTargetingObj(res);
	  } else {
	    utils.logMessage('Need to call getAdserverTargetingForAdUnitCodeStr with adunitCode');
	  }
	};
	
	/**
	 * This function returns the query string targeting parameters available at this moment for a given ad unit. Note that some bidder's response may not have been received if you call this function too quickly after the requests are sent.
	 * @param adUnitCode {string} adUnitCode to get the bid responses for
	 * @returns {object}  returnObj return bids
	 */
	pbjs.getAdserverTargetingForAdUnitCode = function (adUnitCode) {
	  return pbjs.getAdserverTargeting(adUnitCode)[adUnitCode];
	};
	
	/**
	 * returns all ad server targeting for all ad units
	 * @return {object} Map of adUnitCodes and targeting values []
	 * @alias module:pbjs.getAdserverTargeting
	 */
	
	pbjs.getAdserverTargeting = function (adUnitCode) {
	  utils.logInfo('Invoking pbjs.getAdserverTargeting', arguments);
	  return getAllTargeting(adUnitCode).map(function (targeting) {
	    return _defineProperty({}, Object.keys(targeting)[0], targeting[Object.keys(targeting)[0]].map(function (target) {
	      return _defineProperty({}, Object.keys(target)[0], target[Object.keys(target)[0]].join(', '));
	    }).reduce(function (p, c) {
	      return _extends(c, p);
	    }, {}));
	  }).reduce(function (accumulator, targeting) {
	    var key = Object.keys(targeting)[0];
	    accumulator[key] = _extends({}, accumulator[key], targeting[key]);
	    return accumulator;
	  }, {});
	};
	
	/**
	 * This function returns the bid responses at the given moment.
	 * @alias module:pbjs.getBidResponses
	 * @return {object}            map | object that contains the bidResponses
	 */
	
	pbjs.getBidResponses = function () {
	  utils.logInfo('Invoking pbjs.getBidResponses', arguments);
	  var responses = pbjs._bidsReceived.filter(_utils.adUnitsFilter.bind(this, pbjs._adUnitCodes));
	
	  // find the last requested id to get responses for most recent auction only
	  var currentRequestId = responses && responses.length && responses[responses.length - 1].requestId;
	
	  return responses.map(function (bid) {
	    return bid.adUnitCode;
	  }).filter(_utils.uniques).map(function (adUnitCode) {
	    return responses.filter(function (bid) {
	      return bid.requestId === currentRequestId && bid.adUnitCode === adUnitCode;
	    });
	  }).filter(function (bids) {
	    return bids && bids[0] && bids[0].adUnitCode;
	  }).map(function (bids) {
	    return _defineProperty({}, bids[0].adUnitCode, { bids: bids });
	  }).reduce(function (a, b) {
	    return _extends(a, b);
	  }, {});
	};
	
	/**
	 * Returns bidResponses for the specified adUnitCode
	 * @param  {String} adUnitCode adUnitCode
	 * @alias module:pbjs.getBidResponsesForAdUnitCode
	 * @return {Object}            bidResponse object
	 */
	
	pbjs.getBidResponsesForAdUnitCode = function (adUnitCode) {
	  var bids = pbjs._bidsReceived.filter(function (bid) {
	    return bid.adUnitCode === adUnitCode;
	  });
	  return {
	    bids: bids
	  };
	};
	
	/**
	 * Set query string targeting on all GPT ad units.
	 * @alias module:pbjs.setTargetingForGPTAsync
	 */
	pbjs.setTargetingForGPTAsync = function () {
	  utils.logInfo('Invoking pbjs.setTargetingForGPTAsync', arguments);
	  if (!(0, _utils.isGptPubadsDefined)()) {
	    utils.logError('window.googletag is not defined on the page');
	    return;
	  }
	
	  //first reset any old targeting
	  resetPresetTargeting();
	  //now set new targeting keys
	  setTargeting(getAllTargeting());
	};
	
	/**
	 * Returns a bool if all the bids have returned or timed out
	 * @alias module:pbjs.allBidsAvailable
	 * @return {bool} all bids available
	 */
	pbjs.allBidsAvailable = function () {
	  utils.logInfo('Invoking pbjs.allBidsAvailable', arguments);
	  return bidmanager.bidsBackAll();
	};
	
	/**
	 * This function will render the ad (based on params) in the given iframe document passed through. Note that doc SHOULD NOT be the parent document page as we can't doc.write() asynchrounsly
	 * @param  {object} doc document
	 * @param  {string} id bid id to locate the ad
	 * @alias module:pbjs.renderAd
	 */
	pbjs.renderAd = function (doc, id) {
	  utils.logInfo('Invoking pbjs.renderAd', arguments);
	  utils.logMessage('Calling renderAd with adId :' + id);
	  if (doc && id) {
	    try {
	      //lookup ad by ad Id
	      var adObject = pbjs._bidsReceived.find(function (bid) {
	        return bid.adId === id;
	      });
	      if (adObject) {
	        //save winning bids
	        pbjs._winningBids.push(adObject);
	        //emit 'bid won' event here
	        events.emit(BID_WON, adObject);
	
	        var height = adObject.height;
	        var width = adObject.width;
	        var url = adObject.adUrl;
	        var ad = adObject.ad;
	
	        if (doc === document || adObject.mediaType === 'video') {
	          utils.logError('Error trying to write ad. Ad render call ad id ' + id + ' was prevented from writing to the main document.');
	        } else if (ad) {
	          doc.write(ad);
	          doc.close();
	          setRenderSize(doc, width, height);
	        } else if (url) {
	          doc.write('<IFRAME SRC="' + url + '" FRAMEBORDER="0" SCROLLING="no" MARGINHEIGHT="0" MARGINWIDTH="0" TOPMARGIN="0" LEFTMARGIN="0" ALLOWTRANSPARENCY="true" WIDTH="' + width + '" HEIGHT="' + height + '"></IFRAME>');
	          doc.close();
	          setRenderSize(doc, width, height);
	        } else {
	          utils.logError('Error trying to write ad. No ad for bid response id: ' + id);
	        }
	      } else {
	        utils.logError('Error trying to write ad. Cannot find ad by given id : ' + id);
	      }
	    } catch (e) {
	      utils.logError('Error trying to write ad Id :' + id + ' to the page:' + e.message);
	    }
	  } else {
	    utils.logError('Error trying to write ad Id :' + id + ' to the page. Missing document or adId');
	  }
	};
	
	/**
	 * Remove adUnit from the pbjs configuration
	 * @param  {String} adUnitCode the adUnitCode to remove
	 * @alias module:pbjs.removeAdUnit
	 */
	pbjs.removeAdUnit = function (adUnitCode) {
	  utils.logInfo('Invoking pbjs.removeAdUnit', arguments);
	  if (adUnitCode) {
	    for (var i = 0; i < pbjs.adUnits.length; i++) {
	      if (pbjs.adUnits[i].code === adUnitCode) {
	        pbjs.adUnits.splice(i, 1);
	      }
	    }
	  }
	};
	
	pbjs.clearAuction = function () {
	  auctionRunning = false;
	  utils.logMessage('Prebid auction cleared');
	  events.emit(AUCTION_END);
	  if (bidRequestQueue.length) {
	    bidRequestQueue.shift()();
	  }
	};
	
	/**
	 *
	 * @param bidsBackHandler
	 * @param timeout
	 * @param adUnits
	 * @param adUnitCodes
	 */
	pbjs.requestBids = function (_ref11) {
	  var bidsBackHandler = _ref11.bidsBackHandler,
	      timeout = _ref11.timeout,
	      adUnits = _ref11.adUnits,
	      adUnitCodes = _ref11.adUnitCodes;
	
	  var cbTimeout = pbjs.cbTimeout = timeout || pbjs.bidderTimeout;
	  adUnits = adUnits || pbjs.adUnits;
	
	  utils.logInfo('Invoking pbjs.requestBids', arguments);
	
	  if (adUnitCodes && adUnitCodes.length) {
	    // if specific adUnitCodes supplied filter adUnits for those codes
	    adUnits = adUnits.filter(function (unit) {
	      return adUnitCodes.includes(unit.code);
	    });
	  } else {
	    // otherwise derive adUnitCodes from adUnits
	    adUnitCodes = adUnits && adUnits.map(function (unit) {
	      return unit.code;
	    });
	  }
	
	  // for video-enabled adUnits, only request bids if all bidders support video
	  var invalidVideoAdUnits = adUnits.filter(_video.videoAdUnit).filter(_video.hasNonVideoBidder);
	  invalidVideoAdUnits.forEach(function (adUnit) {
	    utils.logError('adUnit ' + adUnit.code + ' has \'mediaType\' set to \'video\' but contains a bidder that doesn\'t support video. No Prebid demand requests will be triggered for this adUnit.');
	    for (var i = 0; i < adUnits.length; i++) {
	      if (adUnits[i].code === adUnit.code) {
	        adUnits.splice(i, 1);
	      }
	    }
	  });
	
	  if (auctionRunning) {
	    bidRequestQueue.push(function () {
	      pbjs.requestBids({ bidsBackHandler: bidsBackHandler, timeout: cbTimeout, adUnits: adUnits, adUnitCodes: adUnitCodes });
	    });
	    return;
	  }
	
	  auctionRunning = true;
	
	  utils.logInfo('Invoking pbjs.requestBids', arguments);
	
	  // we will use adUnitCodes for filtering the current auction
	  pbjs._adUnitCodes = adUnitCodes;
	
	  bidmanager.externalCallbackReset();
	  clearPlacements();
	
	  if (!adUnits || adUnits.length === 0) {
	    utils.logMessage('No adUnits configured. No bids requested.');
	    if ((typeof bidsBackHandler === 'undefined' ? 'undefined' : _typeof(bidsBackHandler)) === objectType_function) {
	      bidmanager.addOneTimeCallback(bidsBackHandler, false);
	    }
	    bidmanager.executeCallback();
	    return;
	  }
	
	  //set timeout for all bids
	  var timedOut = true;
	  var timeoutCallback = bidmanager.executeCallback.bind(bidmanager, timedOut);
	  var timer = setTimeout(timeoutCallback, cbTimeout);
	  if ((typeof bidsBackHandler === 'undefined' ? 'undefined' : _typeof(bidsBackHandler)) === objectType_function) {
	    bidmanager.addOneTimeCallback(bidsBackHandler, timer);
	  }
	
	  adaptermanager.callBids({ adUnits: adUnits, adUnitCodes: adUnitCodes, cbTimeout: cbTimeout });
	  if (pbjs._bidsRequested.length === 0) {
	    bidmanager.executeCallback();
	  }
	};
	
	/**
	 *
	 * Add adunit(s)
	 * @param {Array|String} adUnitArr Array of adUnits or single adUnit Object.
	 * @alias module:pbjs.addAdUnits
	 */
	pbjs.addAdUnits = function (adUnitArr) {
	  utils.logInfo('Invoking pbjs.addAdUnits', arguments);
	  if (utils.isArray(adUnitArr)) {
	    //append array to existing
	    pbjs.adUnits.push.apply(pbjs.adUnits, adUnitArr);
	  } else if ((typeof adUnitArr === 'undefined' ? 'undefined' : _typeof(adUnitArr)) === objectType_object) {
	    pbjs.adUnits.push(adUnitArr);
	  }
	};
	
	/**
	 * @param {String} event the name of the event
	 * @param {Function} handler a callback to set on event
	 * @param {String} id an identifier in the context of the event
	 *
	 * This API call allows you to register a callback to handle a Prebid.js event.
	 * An optional `id` parameter provides more finely-grained event callback registration.
	 * This makes it possible to register callback events for a specific item in the
	 * event context. For example, `bidWon` events will accept an `id` for ad unit code.
	 * `bidWon` callbacks registered with an ad unit code id will be called when a bid
	 * for that ad unit code wins the auction. Without an `id` this method registers the
	 * callback for every `bidWon` event.
	 *
	 * Currently `bidWon` is the only event that accepts an `id` parameter.
	 */
	pbjs.onEvent = function (event, handler, id) {
	  utils.logInfo('Invoking pbjs.onEvent', arguments);
	  if (!utils.isFn(handler)) {
	    utils.logError('The event handler provided is not a function and was not set on event "' + event + '".');
	    return;
	  }
	
	  if (id && !eventValidators[event].call(null, id)) {
	    utils.logError('The id provided is not valid for event "' + event + '" and no handler was set.');
	    return;
	  }
	
	  events.on(event, handler, id);
	};
	
	/**
	 * @param {String} event the name of the event
	 * @param {Function} handler a callback to remove from the event
	 * @param {String} id an identifier in the context of the event (see `pbjs.onEvent`)
	 */
	pbjs.offEvent = function (event, handler, id) {
	  utils.logInfo('Invoking pbjs.offEvent', arguments);
	  if (id && !eventValidators[event].call(null, id)) {
	    return;
	  }
	
	  events.off(event, handler, id);
	};
	
	/**
	 * Add a callback event
	 * @param {String} eventStr event to attach callback to Options: "allRequestedBidsBack" | "adUnitBidsBack"
	 * @param {Function} func  function to execute. Paramaters passed into the function: (bidResObj), [adUnitCode]);
	 * @alias module:pbjs.addCallback
	 * @returns {String} id for callback
	 */
	pbjs.addCallback = function (eventStr, func) {
	  utils.logInfo('Invoking pbjs.addCallback', arguments);
	  var id = null;
	  if (!eventStr || !func || (typeof func === 'undefined' ? 'undefined' : _typeof(func)) !== objectType_function) {
	    utils.logError('error registering callback. Check method signature');
	    return id;
	  }
	
	  id = utils.getUniqueIdentifierStr;
	  bidmanager.addCallback(id, func, eventStr);
	  return id;
	};
	
	/**
	 * Remove a callback event
	 * //@param {string} cbId id of the callback to remove
	 * @alias module:pbjs.removeCallback
	 * @returns {String} id for callback
	 */
	pbjs.removeCallback = function () /* cbId */{
	  //todo
	  return null;
	};
	
	/**
	 * Wrapper to register bidderAdapter externally (adaptermanager.registerBidAdapter())
	 * @param  {[type]} bidderAdaptor [description]
	 * @param  {[type]} bidderCode    [description]
	 * @return {[type]}               [description]
	 */
	pbjs.registerBidAdapter = function (bidderAdaptor, bidderCode) {
	  utils.logInfo('Invoking pbjs.registerBidAdapter', arguments);
	  try {
	    adaptermanager.registerBidAdapter(bidderAdaptor(), bidderCode);
	  } catch (e) {
	    utils.logError('Error registering bidder adapter : ' + e.message);
	  }
	};
	
	/**
	 * Wrapper to register analyticsAdapter externally (adaptermanager.registerAnalyticsAdapter())
	 * @param  {[type]} options [description]
	 */
	pbjs.registerAnalyticsAdapter = function (options) {
	  utils.logInfo('Invoking pbjs.registerAnalyticsAdapter', arguments);
	  try {
	    adaptermanager.registerAnalyticsAdapter(options);
	  } catch (e) {
	    utils.logError('Error registering analytics adapter : ' + e.message);
	  }
	};
	
	pbjs.bidsAvailableForAdapter = function (bidderCode) {
	  utils.logInfo('Invoking pbjs.bidsAvailableForAdapter', arguments);
	
	  pbjs._bidsRequested.find(function (bidderRequest) {
	    return bidderRequest.bidderCode === bidderCode;
	  }).bids.map(function (bid) {
	    return _extends(bid, bidfactory.createBid(1), {
	      bidderCode: bidderCode,
	      adUnitCode: bid.placementCode
	    });
	  }).map(function (bid) {
	    return pbjs._bidsReceived.push(bid);
	  });
	};
	
	/**
	 * Wrapper to bidfactory.createBid()
	 * @param  {[type]} statusCode [description]
	 * @return {[type]}            [description]
	 */
	pbjs.createBid = function (statusCode) {
	  utils.logInfo('Invoking pbjs.createBid', arguments);
	  return bidfactory.createBid(statusCode);
	};
	
	/**
	 * Wrapper to bidmanager.addBidResponse
	 * @param {[type]} adUnitCode [description]
	 * @param {[type]} bid        [description]
	 */
	pbjs.addBidResponse = function (adUnitCode, bid) {
	  utils.logInfo('Invoking pbjs.addBidResponse', arguments);
	  bidmanager.addBidResponse(adUnitCode, bid);
	};
	
	/**
	 * Wrapper to adloader.loadScript
	 * @param  {[type]}   tagSrc   [description]
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	pbjs.loadScript = function (tagSrc, callback, useCache) {
	  utils.logInfo('Invoking pbjs.loadScript', arguments);
	  adloader.loadScript(tagSrc, callback, useCache);
	};
	
	/**
	 * Will enable sendinga prebid.js to data provider specified
	 * @param  {object} config object {provider : 'string', options : {}}
	 */
	pbjs.enableAnalytics = function (config) {
	  if (config && !utils.isEmpty(config)) {
	    utils.logInfo('Invoking pbjs.enableAnalytics for: ', config);
	    adaptermanager.enableAnalytics(config);
	  } else {
	    utils.logError('pbjs.enableAnalytics should be called with option {}');
	  }
	};
	
	pbjs.aliasBidder = function (bidderCode, alias) {
	  utils.logInfo('Invoking pbjs.aliasBidder', arguments);
	  if (bidderCode && alias) {
	    adaptermanager.aliasBidAdapter(bidderCode, alias);
	  } else {
	    utils.logError('bidderCode and alias must be passed as arguments', 'pbjs.aliasBidder');
	  }
	};
	
	/**
	 * Sets a default price granularity scheme.
	 * @param {String|Object} granularity - the granularity scheme.
	 * "low": $0.50 increments, capped at $5 CPM
	 * "medium": $0.10 increments, capped at $20 CPM (the default)
	 * "high": $0.01 increments, capped at $20 CPM
	 * "auto": Applies a sliding scale to determine granularity
	 * "dense": Like "auto", but the bid price granularity uses smaller increments, especially at lower CPMs
	 *
	 * Alternatively a custom object can be specified:
	 * { "buckets" : [{"min" : 0,"max" : 20,"increment" : 0.1,"cap" : true}]};
	 * See http://prebid.org/dev-docs/publisher-api-reference.html#module_pbjs.setPriceGranularity for more details
	 */
	pbjs.setPriceGranularity = function (granularity) {
	  utils.logInfo('Invoking pbjs.setPriceGranularity', arguments);
	  if (!granularity) {
	    utils.logError('Prebid Error: no value passed to `setPriceGranularity()`');
	    return;
	  }
	  if (typeof granularity === 'string') {
	    bidmanager.setPriceGranularity(granularity);
	  } else if ((typeof granularity === 'undefined' ? 'undefined' : _typeof(granularity)) === 'object') {
	    if (!(0, _cpmBucketManager.isValidePriceConfig)(granularity)) {
	      utils.logError('Invalid custom price value passed to `setPriceGranularity()`');
	      return;
	    }
	    bidmanager.setCustomPriceBucket(granularity);
	    bidmanager.setPriceGranularity(CONSTANTS.GRANULARITY_OPTIONS.CUSTOM);
	    utils.logMessage('Using custom price granularity');
	  }
	};
	
	pbjs.enableSendAllBids = function () {
	  pbjs._sendAllBids = true;
	};
	
	pbjs.getAllWinningBids = function () {
	  return pbjs._winningBids;
	};
	
	/**
	 * Build master video tag from publishers adserver tag
	 * @param {string} adserverTag default url
	 * @param {object} options options for video tag
	 */
	pbjs.buildMasterVideoTagFromAdserverTag = function (adserverTag, options) {
	  utils.logInfo('Invoking pbjs.buildMasterVideoTagFromAdserverTag', arguments);
	  var urlComponents = (0, _url.parse)(adserverTag);
	
	  //return original adserverTag if no bids received
	  if (pbjs._bidsReceived.length === 0) {
	    return adserverTag;
	  }
	
	  var masterTag = '';
	  if (options.adserver.toLowerCase() === 'dfp') {
	    var dfpAdserverObj = adserver.dfpAdserver(options, urlComponents);
	    if (!dfpAdserverObj.verifyAdserverTag()) {
	      utils.logError('Invalid adserverTag, required google params are missing in query string');
	    }
	    dfpAdserverObj.appendQueryParams();
	    masterTag = (0, _url.format)(dfpAdserverObj.urlComponents);
	  } else {
	    utils.logError('Only DFP adserver is supported');
	    return;
	  }
	  return masterTag;
	};
	
	/**
	 * Set the order bidders are called in. If not set, the bidders are called in
	 * the order they are defined wihin the adUnit.bids array
	 * @param {string} order - Order to call bidders in. Currently the only possible value
	 * is 'random', which randomly shuffles the order
	 */
	pbjs.setBidderSequence = function (order) {
	  if (order === CONSTANTS.ORDER.RANDOM) {
	    adaptermanager.setBidderSequence(CONSTANTS.ORDER.RANDOM);
	  }
	};
	
	/**
	 * Get array of highest cpm bids for all adUnits, or highest cpm bid
	 * object for the given adUnit
	 * @param {string} adUnitCode - optional ad unit code
	 * @return {array} array containing highest cpm bid object(s)
	 */
	pbjs.getHighestCpmBids = function (adUnitCode) {
	  return getWinningBids(adUnitCode);
	};
	
	processQue();

/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.getGlobal = getGlobal;
	// if pbjs already exists in global document scope, use it, if not, create the object
	// global defination should happen BEFORE imports to avoid global undefined errors.
	window.pbjs = window.pbjs || {};
	window.pbjs.que = window.pbjs.que || [];
	
	function getGlobal() {
	  return window.pbjs;
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	exports.uniques = uniques;
	exports.flatten = flatten;
	exports.getBidRequest = getBidRequest;
	exports.getKeys = getKeys;
	exports.getValue = getValue;
	exports.getBidderCodes = getBidderCodes;
	exports.isGptPubadsDefined = isGptPubadsDefined;
	exports.getHighestCpm = getHighestCpm;
	exports.shuffle = shuffle;
	exports.adUnitsFilter = adUnitsFilter;
	var CONSTANTS = __webpack_require__(3);
	
	var objectType_object = 'object';
	var objectType_string = 'string';
	var objectType_number = 'number';
	
	var _loggingChecked = false;
	
	var t_Arr = 'Array';
	var t_Str = 'String';
	var t_Fn = 'Function';
	var t_Numb = 'Number';
	var toString = Object.prototype.toString;
	var infoLogger = null;
	try {
	  infoLogger = console.info.bind(window.console);
	} catch (e) {}
	
	/*
	 *   Substitutes into a string from a given map using the token
	 *   Usage
	 *   var str = 'text %%REPLACE%% this text with %%SOMETHING%%';
	 *   var map = {};
	 *   map['replace'] = 'it was subbed';
	 *   map['something'] = 'something else';
	 *   console.log(replaceTokenInString(str, map, '%%')); => "text it was subbed this text with something else"
	 */
	exports.replaceTokenInString = function (str, map, token) {
	  this._each(map, function (value, key) {
	    value = value === undefined ? '' : value;
	
	    var keyString = token + key.toUpperCase() + token;
	    var re = new RegExp(keyString, 'g');
	
	    str = str.replace(re, value);
	  });
	
	  return str;
	};
	
	/* utility method to get incremental integer starting from 1 */
	var getIncrementalInteger = function () {
	  var count = 0;
	  return function () {
	    count++;
	    return count;
	  };
	}();
	
	function _getUniqueIdentifierStr() {
	  return getIncrementalInteger() + Math.random().toString(16).substr(2);
	}
	
	//generate a random string (to be used as a dynamic JSONP callback)
	exports.getUniqueIdentifierStr = _getUniqueIdentifierStr;
	
	/**
	 * Returns a random v4 UUID of the form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx,
	 * where each x is replaced with a random hexadecimal digit from 0 to f,
	 * and y is replaced with a random hexadecimal digit from 8 to b.
	 * https://gist.github.com/jed/982883 via node-uuid
	 */
	exports.generateUUID = function generateUUID(placeholder) {
	  return placeholder ? (placeholder ^ Math.random() * 16 >> placeholder / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, generateUUID);
	};
	
	exports.getBidIdParamater = function (key, paramsObj) {
	  if (paramsObj && paramsObj[key]) {
	    return paramsObj[key];
	  }
	
	  return '';
	};
	
	exports.tryAppendQueryString = function (existingUrl, key, value) {
	  if (value) {
	    return existingUrl += key + '=' + encodeURIComponent(value) + '&';
	  }
	
	  return existingUrl;
	};
	
	//parse a query string object passed in bid params
	//bid params should be an object such as {key: "value", key1 : "value1"}
	exports.parseQueryStringParameters = function (queryObj) {
	  var result = '';
	  for (var k in queryObj) {
	    if (queryObj.hasOwnProperty(k)) result += k + '=' + encodeURIComponent(queryObj[k]) + '&';
	  }
	
	  return result;
	};
	
	//transform an AdServer targeting bids into a query string to send to the adserver
	exports.transformAdServerTargetingObj = function (targeting) {
	  // we expect to receive targeting for a single slot at a time
	  if (targeting && Object.getOwnPropertyNames(targeting).length > 0) {
	
	    return getKeys(targeting).map(function (key) {
	      return key + '=' + encodeURIComponent(getValue(targeting, key));
	    }).join('&');
	  } else {
	    return '';
	  }
	};
	
	//Copy all of the properties in the source objects over to the target object
	//return the target object.
	exports.extend = function (target, source) {
	  target = target || {};
	
	  this._each(source, function (value, prop) {
	    if (_typeof(source[prop]) === objectType_object) {
	      target[prop] = this.extend(target[prop], source[prop]);
	    } else {
	      target[prop] = source[prop];
	    }
	  });
	
	  return target;
	};
	
	/**
	 * Parse a GPT-Style general size Array like `[[300, 250]]` or `"300x250,970x90"` into an array of sizes `["300x250"]` or '['300x250', '970x90']'
	 * @param  {array[array|number]} sizeObj Input array or double array [300,250] or [[300,250], [728,90]]
	 * @return {array[string]}  Array of strings like `["300x250"]` or `["300x250", "728x90"]`
	 */
	exports.parseSizesInput = function (sizeObj) {
	  var parsedSizes = [];
	
	  //if a string for now we can assume it is a single size, like "300x250"
	  if ((typeof sizeObj === 'undefined' ? 'undefined' : _typeof(sizeObj)) === objectType_string) {
	    //multiple sizes will be comma-separated
	    var sizes = sizeObj.split(',');
	
	    //regular expression to match strigns like 300x250
	    //start of line, at least 1 number, an "x" , then at least 1 number, and the then end of the line
	    var sizeRegex = /^(\d)+x(\d)+$/i;
	    if (sizes) {
	      for (var curSizePos in sizes) {
	        if (hasOwn(sizes, curSizePos) && sizes[curSizePos].match(sizeRegex)) {
	          parsedSizes.push(sizes[curSizePos]);
	        }
	      }
	    }
	  } else if ((typeof sizeObj === 'undefined' ? 'undefined' : _typeof(sizeObj)) === objectType_object) {
	    var sizeArrayLength = sizeObj.length;
	
	    //don't process empty array
	    if (sizeArrayLength > 0) {
	      //if we are a 2 item array of 2 numbers, we must be a SingleSize array
	      if (sizeArrayLength === 2 && _typeof(sizeObj[0]) === objectType_number && _typeof(sizeObj[1]) === objectType_number) {
	        parsedSizes.push(this.parseGPTSingleSizeArray(sizeObj));
	      } else {
	        //otherwise, we must be a MultiSize array
	        for (var i = 0; i < sizeArrayLength; i++) {
	          parsedSizes.push(this.parseGPTSingleSizeArray(sizeObj[i]));
	        }
	      }
	    }
	  }
	
	  return parsedSizes;
	};
	
	//parse a GPT style sigle size array, (i.e [300,250])
	//into an AppNexus style string, (i.e. 300x250)
	exports.parseGPTSingleSizeArray = function (singleSize) {
	  //if we aren't exactly 2 items in this array, it is invalid
	  if (this.isArray(singleSize) && singleSize.length === 2 && !isNaN(singleSize[0]) && !isNaN(singleSize[1])) {
	    return singleSize[0] + 'x' + singleSize[1];
	  }
	};
	
	exports.getTopWindowLocation = function () {
	  var location = void 0;
	  try {
	    location = window.top.location;
	  } catch (e) {
	    location = window.location;
	  }
	
	  return location;
	};
	
	exports.getTopWindowUrl = function () {
	  var href = void 0;
	  try {
	    href = this.getTopWindowLocation().href;
	  } catch (e) {
	    href = '';
	  }
	
	  return href;
	};
	
	exports.logWarn = function (msg) {
	  if (debugTurnedOn() && console.warn) {
	    console.warn('WARNING: ' + msg);
	  }
	};
	
	exports.logInfo = function (msg, args) {
	  if (debugTurnedOn() && hasConsoleLogger()) {
	    if (infoLogger) {
	      if (!args || args.length === 0) {
	        args = '';
	      }
	
	      infoLogger('INFO: ' + msg + (args === '' ? '' : ' : params : '), args);
	    }
	  }
	};
	
	exports.logMessage = function (msg) {
	  if (debugTurnedOn() && hasConsoleLogger()) {
	    console.log('MESSAGE: ' + msg);
	  }
	};
	
	function hasConsoleLogger() {
	  return window.console && window.console.log;
	}
	
	exports.hasConsoleLogger = hasConsoleLogger;
	
	var errLogFn = function (hasLogger) {
	  if (!hasLogger) return '';
	  return window.console.error ? 'error' : 'log';
	}(hasConsoleLogger());
	
	var debugTurnedOn = function debugTurnedOn() {
	  if (pbjs.logging === false && _loggingChecked === false) {
	    pbjs.logging = getParameterByName(CONSTANTS.DEBUG_MODE).toUpperCase() === 'TRUE';
	    _loggingChecked = true;
	  }
	
	  return !!pbjs.logging;
	};
	
	exports.debugTurnedOn = debugTurnedOn;
	
	exports.logError = function (msg, code, exception) {
	  var errCode = code || 'ERROR';
	  if (debugTurnedOn() && hasConsoleLogger()) {
	    console[errLogFn](console, errCode + ': ' + msg, exception || '');
	  }
	};
	
	exports.createInvisibleIframe = function _createInvisibleIframe() {
	  var f = document.createElement('iframe');
	  f.id = _getUniqueIdentifierStr();
	  f.height = 0;
	  f.width = 0;
	  f.border = '0px';
	  f.hspace = '0';
	  f.vspace = '0';
	  f.marginWidth = '0';
	  f.marginHeight = '0';
	  f.style.border = '0';
	  f.scrolling = 'no';
	  f.frameBorder = '0';
	  f.src = 'about:blank';
	  f.style.display = 'none';
	  return f;
	};
	
	/*
	 *   Check if a given parameter name exists in query string
	 *   and if it does return the value
	 */
	var getParameterByName = function getParameterByName(name) {
	  var regexS = '[\\?&]' + name + '=([^&#]*)';
	  var regex = new RegExp(regexS);
	  var results = regex.exec(window.location.search);
	  if (results === null) {
	    return '';
	  }
	
	  return decodeURIComponent(results[1].replace(/\+/g, ' '));
	};
	
	/**
	 * This function validates paramaters.
	 * @param  {object[string]} paramObj          [description]
	 * @param  {string[]} requiredParamsArr [description]
	 * @return {bool}                   Bool if paramaters are valid
	 */
	exports.hasValidBidRequest = function (paramObj, requiredParamsArr, adapter) {
	  var found = false;
	
	  function findParam(value, key) {
	    if (key === requiredParamsArr[i]) {
	      found = true;
	    }
	  }
	
	  for (var i = 0; i < requiredParamsArr.length; i++) {
	    found = false;
	
	    this._each(paramObj, findParam);
	
	    if (!found) {
	      this.logError('Params are missing for bid request. One of these required paramaters are missing: ' + requiredParamsArr, adapter);
	      return false;
	    }
	  }
	
	  return true;
	};
	
	// Handle addEventListener gracefully in older browsers
	exports.addEventHandler = function (element, event, func) {
	  if (element.addEventListener) {
	    element.addEventListener(event, func, true);
	  } else if (element.attachEvent) {
	    element.attachEvent('on' + event, func);
	  }
	};
	/**
	 * Return if the object is of the
	 * given type.
	 * @param {*} object to test
	 * @param {String} _t type string (e.g., Array)
	 * @return {Boolean} if object is of type _t
	 */
	exports.isA = function (object, _t) {
	  return toString.call(object) === '[object ' + _t + ']';
	};
	
	exports.isFn = function (object) {
	  return this.isA(object, t_Fn);
	};
	
	exports.isStr = function (object) {
	  return this.isA(object, t_Str);
	};
	
	exports.isArray = function (object) {
	  return this.isA(object, t_Arr);
	};
	
	exports.isNumber = function (object) {
	  return this.isA(object, t_Numb);
	};
	
	/**
	 * Return if the object is "empty";
	 * this includes falsey, no keys, or no items at indices
	 * @param {*} object object to test
	 * @return {Boolean} if object is empty
	 */
	exports.isEmpty = function (object) {
	  if (!object) return true;
	  if (this.isArray(object) || this.isStr(object)) {
	    return !(object.length > 0); // jshint ignore:line
	  }
	
	  for (var k in object) {
	    if (hasOwnProperty.call(object, k)) return false;
	  }
	
	  return true;
	};
	
	/**
	 * Return if string is empty, null, or undefined
	 * @param str string to test
	 * @returns {boolean} if string is empty
	 */
	exports.isEmptyStr = function (str) {
	  return this.isStr(str) && (!str || 0 === str.length);
	};
	
	/**
	 * Iterate object with the function
	 * falls back to es5 `forEach`
	 * @param {Array|Object} object
	 * @param {Function(value, key, object)} fn
	 */
	exports._each = function (object, fn) {
	  if (this.isEmpty(object)) return;
	  if (this.isFn(object.forEach)) return object.forEach(fn, this);
	
	  var k = 0;
	  var l = object.length;
	
	  if (l > 0) {
	    for (; k < l; k++) {
	      fn(object[k], k, object);
	    }
	  } else {
	    for (k in object) {
	      if (hasOwnProperty.call(object, k)) fn.call(this, object[k], k);
	    }
	  }
	};
	
	exports.contains = function (a, obj) {
	  if (this.isEmpty(a)) {
	    return false;
	  }
	
	  if (this.isFn(a.indexOf)) {
	    return a.indexOf(obj) !== -1;
	  }
	
	  var i = a.length;
	  while (i--) {
	    if (a[i] === obj) {
	      return true;
	    }
	  }
	
	  return false;
	};
	
	exports.indexOf = function () {
	  if (Array.prototype.indexOf) {
	    return Array.prototype.indexOf;
	  }
	
	  // ie8 no longer supported
	  //return polyfills.indexOf;
	}();
	
	/**
	 * Map an array or object into another array
	 * given a function
	 * @param {Array|Object} object
	 * @param {Function(value, key, object)} callback
	 * @return {Array}
	 */
	exports._map = function (object, callback) {
	  if (this.isEmpty(object)) return [];
	  if (this.isFn(object.map)) return object.map(callback);
	  var output = [];
	  this._each(object, function (value, key) {
	    output.push(callback(value, key, object));
	  });
	
	  return output;
	};
	
	var hasOwn = function hasOwn(objectToCheck, propertyToCheckFor) {
	  if (objectToCheck.hasOwnProperty) {
	    return objectToCheck.hasOwnProperty(propertyToCheckFor);
	  } else {
	    return typeof objectToCheck[propertyToCheckFor] !== 'undefined' && objectToCheck.constructor.prototype[propertyToCheckFor] !== objectToCheck[propertyToCheckFor];
	  }
	};
	/**
	 * Creates a snippet of HTML that retrieves the specified `url`
	 * @param  {string} url URL to be requested
	 * @return {string}     HTML snippet that contains the img src = set to `url`
	 */
	exports.createTrackPixelHtml = function (url) {
	  if (!url) {
	    return '';
	  }
	
	  var escapedUrl = encodeURI(url);
	  var img = '<div style="position:absolute;left:0px;top:0px;visibility:hidden;">';
	  img += '<img src="' + escapedUrl + '"></div>';
	  return img;
	};
	
	/**
	 * Returns iframe document in a browser agnostic way
	 * @param  {object} iframe reference
	 * @return {object}        iframe `document` reference
	 */
	exports.getIframeDocument = function (iframe) {
	  if (!iframe) {
	    return;
	  }
	
	  var doc = void 0;
	  try {
	    if (iframe.contentWindow) {
	      doc = iframe.contentWindow.document;
	    } else if (iframe.contentDocument.document) {
	      doc = iframe.contentDocument.document;
	    } else {
	      doc = iframe.contentDocument;
	    }
	  } catch (e) {
	    this.logError('Cannot get iframe document', e);
	  }
	
	  return doc;
	};
	
	exports.getValueString = function (param, val, defaultValue) {
	  if (val === undefined || val === null) {
	    return defaultValue;
	  }
	  if (this.isStr(val)) {
	    return val;
	  }
	  if (this.isNumber(val)) {
	    return val.toString();
	  }
	  this.logWarn('Unsuported type for param: ' + param + ' required type: String');
	};
	
	function uniques(value, index, arry) {
	  return arry.indexOf(value) === index;
	}
	
	function flatten(a, b) {
	  return a.concat(b);
	}
	
	function getBidRequest(id) {
	  return pbjs._bidsRequested.map(function (bidSet) {
	    return bidSet.bids.find(function (bid) {
	      return bid.bidId === id;
	    });
	  }).find(function (bid) {
	    return bid;
	  });
	}
	
	function getKeys(obj) {
	  return Object.keys(obj);
	}
	
	function getValue(obj, key) {
	  return obj[key];
	}
	
	function getBidderCodes() {
	  var adUnits = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : pbjs.adUnits;
	
	  // this could memoize adUnits
	  return adUnits.map(function (unit) {
	    return unit.bids.map(function (bid) {
	      return bid.bidder;
	    }).reduce(flatten, []);
	  }).reduce(flatten).filter(uniques);
	}
	
	function isGptPubadsDefined() {
	  if (window.googletag && exports.isFn(window.googletag.pubads) && exports.isFn(window.googletag.pubads().getSlots)) {
	    return true;
	  }
	}
	
	function getHighestCpm(previous, current) {
	  if (previous.cpm === current.cpm) {
	    return previous.timeToRespond > current.timeToRespond ? current : previous;
	  }
	
	  return previous.cpm < current.cpm ? current : previous;
	}
	
	/**
	 * Fisher–Yates shuffle
	 * http://stackoverflow.com/a/6274398
	 * https://bost.ocks.org/mike/shuffle/
	 * istanbul ignore next
	 */
	function shuffle(array) {
	  var counter = array.length;
	
	  // while there are elements in the array
	  while (counter > 0) {
	    // pick a random index
	    var index = Math.floor(Math.random() * counter);
	
	    // decrease counter by 1
	    counter--;
	
	    // and swap the last element with it
	    var temp = array[counter];
	    array[counter] = array[index];
	    array[index] = temp;
	  }
	
	  return array;
	}
	
	function adUnitsFilter(filter, bid) {
	  return filter.includes(bid && bid.placementCode || bid && bid.adUnitCode);
	}

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = {
		"JSON_MAPPING": {
			"PL_CODE": "code",
			"PL_SIZE": "sizes",
			"PL_BIDS": "bids",
			"BD_BIDDER": "bidder",
			"BD_ID": "paramsd",
			"BD_PL_ID": "placementId",
			"ADSERVER_TARGETING": "adserverTargeting",
			"BD_SETTING_STANDARD": "standard"
		},
		"REPO_AND_VERSION": "prebid_prebid_0.15.2-pre",
		"DEBUG_MODE": "pbjs_debug",
		"STATUS": {
			"GOOD": 1,
			"NO_BID": 2
		},
		"CB": {
			"TYPE": {
				"ALL_BIDS_BACK": "allRequestedBidsBack",
				"AD_UNIT_BIDS_BACK": "adUnitBidsBack",
				"BID_WON": "bidWon"
			}
		},
		"objectType_function": "function",
		"objectType_undefined": "undefined",
		"objectType_object": "object",
		"objectType_string": "string",
		"objectType_number": "number",
		"EVENTS": {
			"AUCTION_INIT": "auctionInit",
			"AUCTION_END": "auctionEnd",
			"BID_ADJUSTMENT": "bidAdjustment",
			"BID_TIMEOUT": "bidTimeout",
			"BID_REQUESTED": "bidRequested",
			"BID_RESPONSE": "bidResponse",
			"BID_WON": "bidWon"
		},
		"EVENT_ID_PATHS": {
			"bidWon": "adUnitCode"
		},
		"ORDER": {
			"RANDOM": "random"
		},
		"GRANULARITY_OPTIONS": {
			"LOW": "low",
			"MEDIUM": "medium",
			"HIGH": "high",
			"AUTO": "auto",
			"DENSE": "dense",
			"CUSTOM": "custom"
		},
		"TARGETING_KEYS": [
			"hb_bidder",
			"hb_adid",
			"hb_pb",
			"hb_size"
		]
	};

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.hasNonVideoBidder = exports.videoAdUnit = undefined;
	
	var _adaptermanager = __webpack_require__(5);
	
	/**
	 * Helper functions for working with video-enabled adUnits
	 */
	var videoAdUnit = exports.videoAdUnit = function videoAdUnit(adUnit) {
	  return adUnit.mediaType === 'video';
	};
	var nonVideoBidder = function nonVideoBidder(bid) {
	  return !_adaptermanager.videoAdapters.includes(bid.bidder);
	};
	var hasNonVideoBidder = exports.hasNonVideoBidder = function hasNonVideoBidder(adUnit) {
	  return adUnit.bids.filter(nonVideoBidder).length;
	};

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /** @module adaptermanger */
	
	var _utils = __webpack_require__(2);
	
	var _sizeMapping = __webpack_require__(6);
	
	var _baseAdapter = __webpack_require__(7);
	
	var utils = __webpack_require__(2);
	var CONSTANTS = __webpack_require__(3);
	var events = __webpack_require__(8);
	
	
	var _bidderRegistry = {};
	exports.bidderRegistry = _bidderRegistry;
	
	var _analyticsRegistry = {};
	var _bidderSequence = null;
	
	function getBids(_ref) {
	  var bidderCode = _ref.bidderCode,
	      requestId = _ref.requestId,
	      bidderRequestId = _ref.bidderRequestId,
	      adUnits = _ref.adUnits;
	
	  return adUnits.map(function (adUnit) {
	    return adUnit.bids.filter(function (bid) {
	      return bid.bidder === bidderCode;
	    }).map(function (bid) {
	      var sizes = adUnit.sizes;
	      if (adUnit.sizeMapping) {
	        var sizeMapping = (0, _sizeMapping.mapSizes)(adUnit);
	        if (sizeMapping === '') {
	          return '';
	        }
	        sizes = sizeMapping;
	      }
	      return _extends(bid, {
	        placementCode: adUnit.code,
	        mediaType: adUnit.mediaType,
	        sizes: sizes,
	        bidId: utils.getUniqueIdentifierStr(),
	        bidderRequestId: bidderRequestId,
	        requestId: requestId
	      });
	    });
	  }).reduce(_utils.flatten, []).filter(function (val) {
	    return val !== '';
	  });
	}
	
	exports.callBids = function (_ref2) {
	  var adUnits = _ref2.adUnits,
	      cbTimeout = _ref2.cbTimeout;
	
	  var requestId = utils.generateUUID();
	  var auctionStart = Date.now();
	
	  var auctionInit = {
	    timestamp: auctionStart,
	    requestId: requestId
	  };
	  events.emit(CONSTANTS.EVENTS.AUCTION_INIT, auctionInit);
	
	  var bidderCodes = (0, _utils.getBidderCodes)(adUnits);
	  if (_bidderSequence === CONSTANTS.ORDER.RANDOM) {
	    bidderCodes = (0, _utils.shuffle)(bidderCodes);
	  }
	
	  bidderCodes.forEach(function (bidderCode) {
	    var adapter = _bidderRegistry[bidderCode];
	    if (adapter) {
	      var bidderRequestId = utils.getUniqueIdentifierStr();
	      var bidderRequest = {
	        bidderCode: bidderCode,
	        requestId: requestId,
	        bidderRequestId: bidderRequestId,
	        bids: getBids({ bidderCode: bidderCode, requestId: requestId, bidderRequestId: bidderRequestId, adUnits: adUnits }),
	        start: new Date().getTime(),
	        auctionStart: auctionStart,
	        timeout: cbTimeout
	      };
	      if (bidderRequest.bids && bidderRequest.bids.length !== 0) {
	        utils.logMessage('CALLING BIDDER ======= ' + bidderCode);
	        pbjs._bidsRequested.push(bidderRequest);
	        events.emit(CONSTANTS.EVENTS.BID_REQUESTED, bidderRequest);
	        adapter.callBids(bidderRequest);
	      }
	    } else {
	      utils.logError('Adapter trying to be called which does not exist: ' + bidderCode + ' adaptermanager.callBids');
	    }
	  });
	};
	
	exports.registerBidAdapter = function (bidAdaptor, bidderCode) {
	  if (bidAdaptor && bidderCode) {
	
	    if (_typeof(bidAdaptor.callBids) === CONSTANTS.objectType_function) {
	      _bidderRegistry[bidderCode] = bidAdaptor;
	    } else {
	      utils.logError('Bidder adaptor error for bidder code: ' + bidderCode + 'bidder must implement a callBids() function');
	    }
	  } else {
	    utils.logError('bidAdaptor or bidderCode not specified');
	  }
	};
	
	exports.aliasBidAdapter = function (bidderCode, alias) {
	  var existingAlias = _bidderRegistry[alias];
	
	  if ((typeof existingAlias === 'undefined' ? 'undefined' : _typeof(existingAlias)) === CONSTANTS.objectType_undefined) {
	    var bidAdaptor = _bidderRegistry[bidderCode];
	
	    if ((typeof bidAdaptor === 'undefined' ? 'undefined' : _typeof(bidAdaptor)) === CONSTANTS.objectType_undefined) {
	      utils.logError('bidderCode "' + bidderCode + '" is not an existing bidder.', 'adaptermanager.aliasBidAdapter');
	    } else {
	      try {
	        var newAdapter = null;
	        if (bidAdaptor instanceof _baseAdapter.BaseAdapter) {
	          //newAdapter = new bidAdaptor.constructor(alias);
	          utils.logError(bidderCode + ' bidder does not currently support aliasing.', 'adaptermanager.aliasBidAdapter');
	        } else {
	          newAdapter = bidAdaptor.createNew();
	          newAdapter.setBidderCode(alias);
	          this.registerBidAdapter(newAdapter, alias);
	        }
	      } catch (e) {
	        utils.logError(bidderCode + ' bidder does not currently support aliasing.', 'adaptermanager.aliasBidAdapter');
	      }
	    }
	  } else {
	    utils.logMessage('alias name "' + alias + '" has been already specified.');
	  }
	};
	
	exports.registerAnalyticsAdapter = function (_ref3) {
	  var adapter = _ref3.adapter,
	      code = _ref3.code;
	
	  if (adapter && code) {
	
	    if (_typeof(adapter.enableAnalytics) === CONSTANTS.objectType_function) {
	      adapter.code = code;
	      _analyticsRegistry[code] = adapter;
	    } else {
	      utils.logError('Prebid Error: Analytics adaptor error for analytics "' + code + '"\n        analytics adapter must implement an enableAnalytics() function');
	    }
	  } else {
	    utils.logError('Prebid Error: analyticsAdapter or analyticsCode not specified');
	  }
	};
	
	exports.enableAnalytics = function (config) {
	  if (!utils.isArray(config)) {
	    config = [config];
	  }
	
	  utils._each(config, function (adapterConfig) {
	    var adapter = _analyticsRegistry[adapterConfig.provider];
	    if (adapter) {
	      adapter.enableAnalytics(adapterConfig);
	    } else {
	      utils.logError('Prebid Error: no analytics adapter found in registry for\n        ' + adapterConfig.provider + '.');
	    }
	  });
	};
	
	exports.setBidderSequence = function (order) {
	  _bidderSequence = order;
	};
	
	var AolAdapter = __webpack_require__(9);
	exports.registerBidAdapter(new AolAdapter(), 'aol');
	var AppnexusAdapter = __webpack_require__(15);
	exports.registerBidAdapter(new AppnexusAdapter(), 'appnexus');
	var ConversantAdapter = __webpack_require__(18);
	exports.registerBidAdapter(new ConversantAdapter(), 'conversant');
	var PubmaticAdapter = __webpack_require__(19);
	exports.registerBidAdapter(new PubmaticAdapter(), 'pubmatic');
	var PulsepointAdapter = __webpack_require__(20);
	exports.registerBidAdapter(new PulsepointAdapter(), 'pulsepoint');
	var RhythmoneAdapter = __webpack_require__(21);
	exports.registerBidAdapter(new RhythmoneAdapter(), 'rhythmone');
	var SovrnAdapter = __webpack_require__(22);
	exports.registerBidAdapter(new SovrnAdapter(), 'sovrn');
	var YieldbotAdapter = __webpack_require__(23);
	exports.registerBidAdapter(new YieldbotAdapter(), 'yieldbot');
	var CentroAdapter = __webpack_require__(24);
	exports.registerBidAdapter(new CentroAdapter(), 'centro');
	exports.videoAdapters = [];
	
	null;

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.setWindow = exports.getScreenWidth = exports.mapSizes = undefined;
	
	var _utils = __webpack_require__(2);
	
	var utils = _interopRequireWildcard(_utils);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _win = void 0; /**
	                    * @module sizeMapping
	                    */
	
	
	function mapSizes(adUnit) {
	  if (!isSizeMappingValid(adUnit.sizeMapping)) {
	    return adUnit.sizes;
	  }
	  var width = getScreenWidth();
	  if (!width) {
	    //size not detected - get largest value set for desktop
	    var _mapping = adUnit.sizeMapping.reduce(function (prev, curr) {
	      return prev.minWidth < curr.minWidth ? curr : prev;
	    });
	    if (_mapping.sizes) {
	      return _mapping.sizes;
	    }
	    return adUnit.sizes;
	  }
	  var sizes = '';
	  var mapping = adUnit.sizeMapping.find(function (sizeMapping) {
	    return width > sizeMapping.minWidth;
	  });
	  if (mapping && mapping.sizes) {
	    sizes = mapping.sizes;
	    utils.logMessage('AdUnit : ' + adUnit.code + ' resized based on device width to : ' + sizes);
	  } else {
	    utils.logMessage('AdUnit : ' + adUnit.code + ' not mapped to any sizes for device width. This request will be suppressed.');
	  }
	  return sizes;
	}
	
	function isSizeMappingValid(sizeMapping) {
	  if (utils.isArray(sizeMapping) && sizeMapping.length > 0) {
	    return true;
	  }
	  utils.logInfo('No size mapping defined');
	  return false;
	}
	
	function getScreenWidth(win) {
	  var w = win || _win || window;
	  if (w.screen && w.screen.width) {
	    return w.screen.width;
	  }
	  return 0;
	}
	
	function setWindow(win) {
	  _win = win;
	}
	
	exports.mapSizes = mapSizes;
	exports.getScreenWidth = getScreenWidth;
	exports.setWindow = setWindow;

/***/ },
/* 7 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var BaseAdapter = exports.BaseAdapter = function () {
	  function BaseAdapter(code) {
	    _classCallCheck(this, BaseAdapter);
	
	    this.code = code;
	  }
	
	  _createClass(BaseAdapter, [{
	    key: 'getCode',
	    value: function getCode() {
	      return this.code;
	    }
	  }, {
	    key: 'setCode',
	    value: function setCode(code) {
	      this.code = code;
	    }
	  }, {
	    key: 'callBids',
	    value: function callBids() {
	      throw 'adapter implementation must override callBids method';
	    }
	  }]);

	  return BaseAdapter;
	}();

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	/**
	 * events.js
	 */
	var utils = __webpack_require__(2);
	var CONSTANTS = __webpack_require__(3);
	var slice = Array.prototype.slice;
	var push = Array.prototype.push;
	
	//define entire events
	//var allEvents = ['bidRequested','bidResponse','bidWon','bidTimeout'];
	var allEvents = utils._map(CONSTANTS.EVENTS, function (v) {
	  return v;
	});
	
	var idPaths = CONSTANTS.EVENT_ID_PATHS;
	
	//keep a record of all events fired
	var eventsFired = [];
	
	module.exports = function () {
	
	  var _handlers = {};
	  var _public = {};
	
	  /**
	   *
	   * @param {String} eventString  The name of the event.
	   * @param {Array} args  The payload emitted with the event.
	   * @private
	   */
	  function _dispatch(eventString, args) {
	    utils.logMessage('Emitting event for: ' + eventString);
	
	    var eventPayload = args[0] || {};
	    var idPath = idPaths[eventString];
	    var key = eventPayload[idPath];
	    var event = _handlers[eventString] || { que: [] };
	    var eventKeys = utils._map(event, function (v, k) {
	      return k;
	    });
	
	    var callbacks = [];
	
	    //record the event:
	    eventsFired.push({
	      eventType: eventString,
	      args: eventPayload,
	      id: key
	    });
	
	    /** Push each specific callback to the `callbacks` array.
	     * If the `event` map has a key that matches the value of the
	     * event payload id path, e.g. `eventPayload[idPath]`, then apply
	     * each function in the `que` array as an argument to push to the
	     * `callbacks` array
	     * */
	    if (key && utils.contains(eventKeys, key)) {
	      push.apply(callbacks, event[key].que);
	    }
	
	    /** Push each general callback to the `callbacks` array. */
	    push.apply(callbacks, event.que);
	
	    /** call each of the callbacks */
	    utils._each(callbacks, function (fn) {
	      if (!fn) return;
	      try {
	        fn.apply(null, args);
	      } catch (e) {
	        utils.logError('Error executing handler:', 'events.js', e);
	      }
	    });
	  }
	
	  function _checkAvailableEvent(event) {
	    return utils.contains(allEvents, event);
	  }
	
	  _public.on = function (eventString, handler, id) {
	
	    //check whether available event or not
	    if (_checkAvailableEvent(eventString)) {
	      var event = _handlers[eventString] || { que: [] };
	
	      if (id) {
	        event[id] = event[id] || { que: [] };
	        event[id].que.push(handler);
	      } else {
	        event.que.push(handler);
	      }
	
	      _handlers[eventString] = event;
	    } else {
	      utils.logError('Wrong event name : ' + eventString + ' Valid event names :' + allEvents);
	    }
	  };
	
	  _public.emit = function (event) {
	    var args = slice.call(arguments, 1);
	    _dispatch(event, args);
	  };
	
	  _public.off = function (eventString, handler, id) {
	    var event = _handlers[eventString];
	
	    if (utils.isEmpty(event) || utils.isEmpty(event.que) && utils.isEmpty(event[id])) {
	      return;
	    }
	
	    if (id && (utils.isEmpty(event[id]) || utils.isEmpty(event[id].que))) {
	      return;
	    }
	
	    if (id) {
	      utils._each(event[id].que, function (_handler) {
	        var que = event[id].que;
	        if (_handler === handler) {
	          que.splice(utils.indexOf.call(que, _handler), 1);
	        }
	      });
	    } else {
	      utils._each(event.que, function (_handler) {
	        var que = event.que;
	        if (_handler === handler) {
	          que.splice(utils.indexOf.call(que, _handler), 1);
	        }
	      });
	    }
	
	    _handlers[eventString] = event;
	  };
	
	  _public.get = function () {
	    return _handlers;
	  };
	
	  /**
	   * This method can return a copy of all the events fired
	   * @return {Array} array of events fired
	   */
	  _public.getEvents = function () {
	    var arrayCopy = [];
	    utils._each(eventsFired, function (value) {
	      var newProp = utils.extend({}, value);
	      arrayCopy.push(newProp);
	    });
	
	    return arrayCopy;
	  };
	
	  return _public;
	}();

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _templateObject = _taggedTemplateLiteral(['', '://', '/pubapi/3.0/', '/', '/', '/', '/ADTECH;v=2;cmd=bid;cors=yes;alias=', '', ';misc=', ''], ['', '://', '/pubapi/3.0/', '/', '/', '/', '/ADTECH;v=2;cmd=bid;cors=yes;alias=', '', ';misc=', '']);
	
	function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }
	
	var utils = __webpack_require__(2);
	var ajax = __webpack_require__(10).ajax;
	var bidfactory = __webpack_require__(12);
	var bidmanager = __webpack_require__(13);
	
	var AolAdapter = function AolAdapter() {
	
	  var showCpmAdjustmentWarning = true;
	  var pubapiTemplate = template(_templateObject, 'protocol', 'host', 'network', 'placement', 'pageid', 'sizeid', 'alias', 'bidfloor', 'misc');
	  var BIDDER_CODE = 'aol';
	  var SERVER_MAP = {
	    us: 'adserver-us.adtech.advertising.com',
	    eu: 'adserver-eu.adtech.advertising.com',
	    as: 'adserver-as.adtech.advertising.com'
	  };
	
	  function template(strings) {
	    for (var _len = arguments.length, keys = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	      keys[_key - 1] = arguments[_key];
	    }
	
	    return function () {
	      for (var _len2 = arguments.length, values = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	        values[_key2] = arguments[_key2];
	      }
	
	      var dict = values[values.length - 1] || {};
	      var result = [strings[0]];
	      keys.forEach(function (key, i) {
	        var value = Number.isInteger(key) ? values[key] : dict[key];
	        result.push(value, strings[i + 1]);
	      });
	      return result.join('');
	    };
	  }
	
	  function _buildPubapiUrl(bid) {
	    var params = bid.params;
	    var serverParam = params.server;
	    var regionParam = params.region || 'us';
	    var server = void 0;
	
	    if (!SERVER_MAP.hasOwnProperty(regionParam)) {
	      console.warn('Unknown region \'' + regionParam + '\' for AOL bidder.');
	      regionParam = 'us'; // Default region.
	    }
	
	    if (serverParam) {
	      server = serverParam;
	    } else {
	      server = SERVER_MAP[regionParam];
	    }
	
	    // Set region param, used by AOL analytics.
	    params.region = regionParam;
	
	    return pubapiTemplate({
	      protocol: document.location.protocol === 'https:' ? 'https' : 'http',
	      host: server,
	      network: params.network,
	      placement: parseInt(params.placement),
	      pageid: params.pageId || 0,
	      sizeid: params.sizeId || 0,
	      alias: params.alias || utils.getUniqueIdentifierStr(),
	      bidfloor: typeof params.bidFloor !== 'undefined' ? ';bidfloor=' + params.bidFloor.toString() : '',
	      misc: new Date().getTime() // cache busting
	    });
	  }
	
	  function _addErrorBidResponse(bid) {
	    var response = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	
	    var bidResponse = bidfactory.createBid(2, bid);
	    bidResponse.bidderCode = BIDDER_CODE;
	    bidResponse.reason = response.nbr;
	    bidResponse.raw = response;
	    bidmanager.addBidResponse(bid.placementCode, bidResponse);
	  }
	
	  function _addBidResponse(bid, response) {
	    var bidData = void 0;
	
	    try {
	      bidData = response.seatbid[0].bid[0];
	    } catch (e) {
	      _addErrorBidResponse(bid, response);
	      return;
	    }
	
	    var cpm = void 0;
	
	    if (bidData.ext && bidData.ext.encp) {
	      cpm = bidData.ext.encp;
	    } else {
	      cpm = bidData.price;
	
	      if (cpm === null || isNaN(cpm)) {
	        utils.logError('Invalid price in bid response', BIDDER_CODE, bid);
	        _addErrorBidResponse(bid, response);
	        return;
	      }
	    }
	
	    var ad = bidData.adm;
	    if (response.ext && response.ext.pixels) {
	      ad += response.ext.pixels;
	    }
	
	    var bidResponse = bidfactory.createBid(1, bid);
	    bidResponse.bidderCode = BIDDER_CODE;
	    bidResponse.ad = ad;
	    bidResponse.cpm = cpm;
	    bidResponse.width = bidData.w;
	    bidResponse.height = bidData.h;
	    bidResponse.creativeId = bidData.crid;
	    bidResponse.pubapiId = response.id;
	    bidResponse.currencyCode = response.cur;
	    if (bidData.dealid) {
	      bidResponse.dealId = bidData.dealid;
	    }
	
	    bidmanager.addBidResponse(bid.placementCode, bidResponse);
	  }
	
	  function _callBids(params) {
	    utils._each(params.bids, function (bid) {
	      var pubapiUrl = _buildPubapiUrl(bid);
	
	      ajax(pubapiUrl, function (response) {
	        // needs to be here in case bidderSettings are defined after requestBids() is called
	        if (showCpmAdjustmentWarning && pbjs.bidderSettings && pbjs.bidderSettings.aol && typeof pbjs.bidderSettings.aol.bidCpmAdjustment === 'function') {
	          utils.logWarn('bidCpmAdjustment is active for the AOL adapter. ' + 'As of Prebid 0.14, AOL can bid in net – please contact your accounts team to enable.');
	        }
	        showCpmAdjustmentWarning = false; // warning is shown at most once
	
	        if (!response && response.length <= 0) {
	          utils.logError('Empty bid response', BIDDER_CODE, bid);
	          _addErrorBidResponse(bid, response);
	          return;
	        }
	
	        try {
	          response = JSON.parse(response);
	        } catch (e) {
	          utils.logError('Invalid JSON in bid response', BIDDER_CODE, bid);
	          _addErrorBidResponse(bid, response);
	          return;
	        }
	
	        _addBidResponse(bid, response);
	      }, null, { withCredentials: true });
	    });
	  }
	
	  return {
	    callBids: _callBids
	  };
	};
	
	module.exports = AolAdapter;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	exports.ajax = ajax;
	
	var _url = __webpack_require__(11);
	
	var utils = __webpack_require__(2);
	
	var XHR_DONE = 4;
	
	/**
	 * Simple IE9+ and cross-browser ajax request function
	 * Note: x-domain requests in IE9 do not support the use of cookies
	 *
	 * @param url string url
	 * @param callback object callback
	 * @param data mixed data
	 * @param options object
	 */
	
	function ajax(url, callback, data) {
	  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
	
	
	  var x = void 0;
	  var useXDomainRequest = false;
	  var method = options.method || (data ? 'POST' : 'GET');
	  if (!window.XMLHttpRequest) {
	    useXDomainRequest = true;
	  } else {
	    x = new window.XMLHttpRequest();
	    if (x.responseType === undefined) {
	      useXDomainRequest = true;
	    }
	  }
	
	  if (useXDomainRequest) {
	    x = new window.XDomainRequest();
	    x.onload = function () {
	      callback(x.responseText, x);
	    };
	
	    // http://stackoverflow.com/questions/15786966/xdomainrequest-aborts-post-on-ie-9
	    x.onerror = function () {
	      utils.logMessage('xhr onerror');
	    };
	    x.ontimeout = function () {
	      utils.logMessage('xhr timeout');
	    };
	    x.onprogress = function () {
	      utils.logMessage('xhr onprogress');
	    };
	  } else {
	    x.onreadystatechange = handler;
	  }
	
	  if (method === 'GET' && data) {
	    var urlInfo = (0, _url.parse)(url);
	    _extends(urlInfo.search, data);
	    url = (0, _url.format)(urlInfo);
	  }
	
	  x.open(method, url);
	
	  if (!useXDomainRequest) {
	    if (options.withCredentials) {
	      x.withCredentials = true;
	    }
	    if (options.preflight) {
	      x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	    }
	    x.setRequestHeader('Content-Type', options.contentType || 'text/plain');
	  }
	  x.send(method === 'POST' && data);
	
	  function handler() {
	    if (x.readyState === XHR_DONE && callback) {
	      callback(x.responseText, x);
	    }
	  }
	}

/***/ },
/* 11 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();
	
	exports.parseQS = parseQS;
	exports.formatQS = formatQS;
	exports.parse = parse;
	exports.format = format;
	function parseQS(query) {
	  return !query ? {} : query.replace(/^\?/, '').split('&').reduce(function (acc, criteria) {
	    var _criteria$split = criteria.split('='),
	        _criteria$split2 = _slicedToArray(_criteria$split, 2),
	        k = _criteria$split2[0],
	        v = _criteria$split2[1];
	
	    if (/\[\]$/.test(k)) {
	      k = k.replace('[]', '');
	      acc[k] = acc[k] || [];
	      acc[k].push(v);
	    } else {
	      acc[k] = v || '';
	    }
	    return acc;
	  }, {});
	}
	
	function formatQS(query) {
	  return Object.keys(query).map(function (k) {
	    return Array.isArray(query[k]) ? query[k].map(function (v) {
	      return k + '[]=' + v;
	    }).join('&') : k + '=' + query[k];
	  }).join('&');
	}
	
	function parse(url) {
	  var parsed = document.createElement('a');
	  parsed.href = decodeURIComponent(url);
	  return {
	    protocol: (parsed.protocol || '').replace(/:$/, ''),
	    hostname: parsed.hostname,
	    port: +parsed.port,
	    pathname: parsed.pathname,
	    search: parseQS(parsed.search || ''),
	    hash: (parsed.hash || '').replace(/^#/, ''),
	    host: parsed.host
	  };
	}
	
	function format(obj) {
	  return (obj.protocol || 'http') + '://' + (obj.host || obj.hostname + (obj.port ? ':' + obj.port : '')) + (obj.pathname || '') + (obj.search ? '?' + formatQS(obj.search || '') : '') + (obj.hash ? '#' + obj.hash : '');
	}

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(2);
	
	/**
	 Required paramaters
	 bidderCode,
	 height,
	 width,
	 statusCode
	 Optional paramaters
	 adId,
	 cpm,
	 ad,
	 adUrl,
	 dealId,
	 priceKeyString;
	 */
	function Bid(statusCode, bidRequest) {
	  var _bidId = bidRequest && bidRequest.bidId || utils.getUniqueIdentifierStr();
	  var _statusCode = statusCode || 0;
	
	  this.bidderCode = '';
	  this.width = 0;
	  this.height = 0;
	  this.statusMessage = _getStatus();
	  this.adId = _bidId;
	
	  function _getStatus() {
	    switch (_statusCode) {
	      case 0:
	        return 'Pending';
	      case 1:
	        return 'Bid available';
	      case 2:
	        return 'Bid returned empty or error response';
	      case 3:
	        return 'Bid timed out';
	    }
	  }
	
	  this.getStatusCode = function () {
	    return _statusCode;
	  };
	
	  //returns the size of the bid creative. Concatenation of width and height by ‘x’.
	  this.getSize = function () {
	    return this.width + 'x' + this.height;
	  };
	}
	
	// Bid factory function.
	exports.createBid = function () {
	  return new (Function.prototype.bind.apply(Bid, [null].concat(Array.prototype.slice.call(arguments))))();
	};

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _utils = __webpack_require__(2);
	
	var _cpmBucketManager = __webpack_require__(14);
	
	var CONSTANTS = __webpack_require__(3);
	var utils = __webpack_require__(2);
	var events = __webpack_require__(8);
	
	var objectType_function = 'function';
	
	var externalCallbacks = { byAdUnit: [], all: [], oneTime: null, timer: false };
	var _granularity = CONSTANTS.GRANULARITY_OPTIONS.MEDIUM;
	var _customPriceBucket = void 0;
	var defaultBidderSettingsMap = {};
	
	exports.setCustomPriceBucket = function (customConfig) {
	  _customPriceBucket = customConfig;
	};
	
	/**
	 * Returns a list of bidders that we haven't received a response yet
	 * @return {array} [description]
	 */
	exports.getTimedOutBidders = function () {
	  return pbjs._bidsRequested.map(getBidderCode).filter(_utils.uniques).filter(function (bidder) {
	    return pbjs._bidsReceived.map(getBidders).filter(_utils.uniques).indexOf(bidder) < 0;
	  });
	};
	
	function timestamp() {
	  return new Date().getTime();
	}
	
	function getBidderCode(bidSet) {
	  return bidSet.bidderCode;
	}
	
	function getBidders(bid) {
	  return bid.bidder;
	}
	
	function bidsBackAdUnit(adUnitCode) {
	  var _this = this;
	
	  var requested = pbjs._bidsRequested.map(function (request) {
	    return request.bids.filter(_utils.adUnitsFilter.bind(_this, pbjs._adUnitCodes)).filter(function (bid) {
	      return bid.placementCode === adUnitCode;
	    });
	  }).reduce(_utils.flatten).map(function (bid) {
	    return bid.bidder === 'indexExchange' ? bid.sizes.length : 1;
	  }).reduce(add, 0);
	
	  var received = pbjs._bidsReceived.filter(function (bid) {
	    return bid.adUnitCode === adUnitCode;
	  }).length;
	  return requested === received;
	}
	
	function add(a, b) {
	  return a + b;
	}
	
	function bidsBackAll() {
	  var requested = pbjs._bidsRequested.map(function (request) {
	    return request.bids;
	  }).reduce(_utils.flatten).filter(_utils.adUnitsFilter.bind(this, pbjs._adUnitCodes)).map(function (bid) {
	    return bid.bidder === 'indexExchange' ? bid.sizes.length : 1;
	  }).reduce(function (a, b) {
	    return a + b;
	  }, 0);
	
	  var received = pbjs._bidsReceived.filter(_utils.adUnitsFilter.bind(this, pbjs._adUnitCodes)).length;
	
	  return requested === received;
	}
	
	exports.bidsBackAll = function () {
	  return bidsBackAll();
	};
	
	function getBidderRequest(bidder, adUnitCode) {
	  return pbjs._bidsRequested.find(function (request) {
	    return request.bids.filter(function (bid) {
	      return bid.bidder === bidder && bid.placementCode === adUnitCode;
	    }).length > 0;
	  }) || { start: null, requestId: null };
	}
	
	/*
	 *   This function should be called to by the bidder adapter to register a bid response
	 */
	exports.addBidResponse = function (adUnitCode, bid) {
	  if (bid) {
	    var _getBidderRequest = getBidderRequest(bid.bidderCode, adUnitCode),
	        requestId = _getBidderRequest.requestId,
	        start = _getBidderRequest.start;
	
	    _extends(bid, {
	      requestId: requestId,
	      responseTimestamp: timestamp(),
	      requestTimestamp: start,
	      cpm: bid.cpm || 0,
	      bidder: bid.bidderCode,
	      adUnitCode: adUnitCode
	    });
	
	    bid.timeToRespond = bid.responseTimestamp - bid.requestTimestamp;
	
	    if (bid.timeToRespond > pbjs.cbTimeout + pbjs.timeoutBuffer) {
	      var timedOut = true;
	
	      exports.executeCallback(timedOut);
	    }
	
	    //emit the bidAdjustment event before bidResponse, so bid response has the adjusted bid value
	    events.emit(CONSTANTS.EVENTS.BID_ADJUSTMENT, bid);
	
	    //emit the bidResponse event
	    events.emit(CONSTANTS.EVENTS.BID_RESPONSE, bid);
	
	    //append price strings
	    var priceStringsObj = (0, _cpmBucketManager.getPriceBucketString)(bid.cpm, _customPriceBucket);
	    bid.pbLg = priceStringsObj.low;
	    bid.pbMg = priceStringsObj.med;
	    bid.pbHg = priceStringsObj.high;
	    bid.pbAg = priceStringsObj.auto;
	    bid.pbDg = priceStringsObj.dense;
	    bid.pbCg = priceStringsObj.custom;
	
	    //if there is any key value pairs to map do here
	    var keyValues = {};
	    if (bid.bidderCode && bid.cpm !== 0) {
	      keyValues = getKeyValueTargetingPairs(bid.bidderCode, bid);
	
	      if (bid.dealId) {
	        keyValues['hb_deal_' + bid.bidderCode] = bid.dealId;
	      }
	
	      bid.adserverTargeting = keyValues;
	    }
	
	    pbjs._bidsReceived.push(bid);
	  }
	
	  if (bid && bid.adUnitCode && bidsBackAdUnit(bid.adUnitCode)) {
	    triggerAdUnitCallbacks(bid.adUnitCode);
	  }
	
	  if (bidsBackAll()) {
	    exports.executeCallback();
	  }
	};
	
	function getKeyValueTargetingPairs(bidderCode, custBidObj) {
	  var keyValues = {};
	  var bidder_settings = pbjs.bidderSettings;
	
	  //1) set the keys from "standard" setting or from prebid defaults
	  if (custBidObj && bidder_settings) {
	    //initialize default if not set
	    var standardSettings = getStandardBidderSettings();
	    setKeys(keyValues, standardSettings, custBidObj);
	  }
	
	  //2) set keys from specific bidder setting override if they exist
	  if (bidderCode && custBidObj && bidder_settings && bidder_settings[bidderCode] && bidder_settings[bidderCode][CONSTANTS.JSON_MAPPING.ADSERVER_TARGETING]) {
	    setKeys(keyValues, bidder_settings[bidderCode], custBidObj);
	    custBidObj.alwaysUseBid = bidder_settings[bidderCode].alwaysUseBid;
	    custBidObj.sendStandardTargeting = bidder_settings[bidderCode].sendStandardTargeting;
	  }
	
	  //2) set keys from standard setting. NOTE: this API doesn't seem to be in use by any Adapter
	  else if (defaultBidderSettingsMap[bidderCode]) {
	      setKeys(keyValues, defaultBidderSettingsMap[bidderCode], custBidObj);
	      custBidObj.alwaysUseBid = defaultBidderSettingsMap[bidderCode].alwaysUseBid;
	      custBidObj.sendStandardTargeting = defaultBidderSettingsMap[bidderCode].sendStandardTargeting;
	    }
	
	  return keyValues;
	}
	
	exports.getKeyValueTargetingPairs = function () {
	  return getKeyValueTargetingPairs.apply(undefined, arguments);
	};
	
	function setKeys(keyValues, bidderSettings, custBidObj) {
	  var targeting = bidderSettings[CONSTANTS.JSON_MAPPING.ADSERVER_TARGETING];
	  custBidObj.size = custBidObj.getSize();
	
	  utils._each(targeting, function (kvPair) {
	    var key = kvPair.key;
	    var value = kvPair.val;
	
	    if (keyValues[key]) {
	      utils.logWarn('The key: ' + key + ' is getting ovewritten');
	    }
	
	    if (utils.isFn(value)) {
	      try {
	        value = value(custBidObj);
	      } catch (e) {
	        utils.logError('bidmanager', 'ERROR', e);
	      }
	    }
	
	    if (typeof bidderSettings.suppressEmptyKeys !== "undefined" && bidderSettings.suppressEmptyKeys === true && (utils.isEmptyStr(value) || value === null || value === undefined)) {
	      utils.logInfo("suppressing empty key '" + key + "' from adserver targeting");
	    } else {
	      keyValues[key] = value;
	    }
	  });
	
	  return keyValues;
	}
	
	exports.setPriceGranularity = function setPriceGranularity(granularity) {
	  var granularityOptions = CONSTANTS.GRANULARITY_OPTIONS;
	  if (Object.keys(granularityOptions).filter(function (option) {
	    return granularity === granularityOptions[option];
	  })) {
	    _granularity = granularity;
	  } else {
	    utils.logWarn('Prebid Warning: setPriceGranularity was called with invalid setting, using' + ' `medium` as default.');
	    _granularity = CONSTANTS.GRANULARITY_OPTIONS.MEDIUM;
	  }
	};
	
	exports.registerDefaultBidderSetting = function (bidderCode, defaultSetting) {
	  defaultBidderSettingsMap[bidderCode] = defaultSetting;
	};
	
	exports.executeCallback = function (timedOut) {
	  // if there's still a timeout running, clear it now
	  if (!timedOut && externalCallbacks.timer) {
	    clearTimeout(externalCallbacks.timer);
	  }
	
	  if (externalCallbacks.all.called !== true) {
	    processCallbacks(externalCallbacks.all);
	    externalCallbacks.all.called = true;
	
	    if (timedOut) {
	      var timedOutBidders = exports.getTimedOutBidders();
	
	      if (timedOutBidders.length) {
	        events.emit(CONSTANTS.EVENTS.BID_TIMEOUT, timedOutBidders);
	      }
	    }
	  }
	
	  //execute one time callback
	  if (externalCallbacks.oneTime) {
	    try {
	      processCallbacks([externalCallbacks.oneTime]);
	    } finally {
	      externalCallbacks.oneTime = null;
	      externalCallbacks.timer = false;
	      pbjs.clearAuction();
	    }
	  }
	};
	
	exports.externalCallbackReset = function () {
	  externalCallbacks.all.called = false;
	};
	
	function triggerAdUnitCallbacks(adUnitCode) {
	  //todo : get bid responses and send in args
	  var singleAdUnitCode = [adUnitCode];
	  processCallbacks(externalCallbacks.byAdUnit, singleAdUnitCode);
	}
	
	function processCallbacks(callbackQueue, singleAdUnitCode) {
	  var _this2 = this;
	
	  if (utils.isArray(callbackQueue)) {
	    callbackQueue.forEach(function (callback) {
	      var adUnitCodes = singleAdUnitCode || pbjs._adUnitCodes;
	      var bids = [pbjs._bidsReceived.filter(_utils.adUnitsFilter.bind(_this2, adUnitCodes)).reduce(groupByPlacement, {})];
	
	      callback.apply(pbjs, bids);
	    });
	  }
	}
	
	/**
	 * groupByPlacement is a reduce function that converts an array of Bid objects
	 * to an object with placement codes as keys, with each key representing an object
	 * with an array of `Bid` objects for that placement
	 * @param prev previous value as accumulator object
	 * @param item current array item
	 * @param idx current index
	 * @param arr the array being reduced
	 * @returns {*} as { [adUnitCode]: { bids: [Bid, Bid, Bid] } }
	 */
	function groupByPlacement(prev, item, idx, arr) {
	  // this uses a standard "array to map" operation that could be abstracted further
	  if (item.adUnitCode in Object.keys(prev)) {
	    // if the adUnitCode key is present in the accumulator object, continue
	    return prev;
	  } else {
	    // otherwise add the adUnitCode key to the accumulator object and set to an object with an
	    // array of Bids for that adUnitCode
	    prev[item.adUnitCode] = {
	      bids: arr.filter(function (bid) {
	        return bid.adUnitCode === item.adUnitCode;
	      })
	    };
	    return prev;
	  }
	}
	
	/**
	 * Add a one time callback, that is discarded after it is called
	 * @param {Function} callback
	 * @param timer Timer to clear if callback is triggered before timer time's out
	 */
	exports.addOneTimeCallback = function (callback, timer) {
	  externalCallbacks.oneTime = callback;
	  externalCallbacks.timer = timer;
	};
	
	exports.addCallback = function (id, callback, cbEvent) {
	  callback.id = id;
	  if (CONSTANTS.CB.TYPE.ALL_BIDS_BACK === cbEvent) {
	    externalCallbacks.all.push(callback);
	  } else if (CONSTANTS.CB.TYPE.AD_UNIT_BIDS_BACK === cbEvent) {
	    externalCallbacks.byAdUnit.push(callback);
	  }
	};
	
	//register event for bid adjustment
	events.on(CONSTANTS.EVENTS.BID_ADJUSTMENT, function (bid) {
	  adjustBids(bid);
	});
	
	function adjustBids(bid) {
	  var code = bid.bidderCode;
	  var bidPriceAdjusted = bid.cpm;
	  if (code && pbjs.bidderSettings && pbjs.bidderSettings[code]) {
	    if (_typeof(pbjs.bidderSettings[code].bidCpmAdjustment) === objectType_function) {
	      try {
	        bidPriceAdjusted = pbjs.bidderSettings[code].bidCpmAdjustment.call(null, bid.cpm, utils.extend({}, bid));
	      } catch (e) {
	        utils.logError('Error during bid adjustment', 'bidmanager.js', e);
	      }
	    }
	  }
	
	  if (bidPriceAdjusted >= 0) {
	    bid.cpm = bidPriceAdjusted;
	  }
	}
	
	exports.adjustBids = function () {
	  return adjustBids.apply(undefined, arguments);
	};
	
	function getStandardBidderSettings() {
	  var bidder_settings = pbjs.bidderSettings;
	  if (!bidder_settings[CONSTANTS.JSON_MAPPING.BD_SETTING_STANDARD]) {
	    bidder_settings[CONSTANTS.JSON_MAPPING.BD_SETTING_STANDARD] = {
	      adserverTargeting: [{
	        key: 'hb_bidder',
	        val: function val(bidResponse) {
	          return bidResponse.bidderCode;
	        }
	      }, {
	        key: 'hb_adid',
	        val: function val(bidResponse) {
	          return bidResponse.adId;
	        }
	      }, {
	        key: 'hb_pb',
	        val: function val(bidResponse) {
	          if (_granularity === CONSTANTS.GRANULARITY_OPTIONS.AUTO) {
	            return bidResponse.pbAg;
	          } else if (_granularity === CONSTANTS.GRANULARITY_OPTIONS.DENSE) {
	            return bidResponse.pbDg;
	          } else if (_granularity === CONSTANTS.GRANULARITY_OPTIONS.LOW) {
	            return bidResponse.pbLg;
	          } else if (_granularity === CONSTANTS.GRANULARITY_OPTIONS.MEDIUM) {
	            return bidResponse.pbMg;
	          } else if (_granularity === CONSTANTS.GRANULARITY_OPTIONS.HIGH) {
	            return bidResponse.pbHg;
	          } else if (_granularity === CONSTANTS.GRANULARITY_OPTIONS.CUSTOM) {
	            return bidResponse.pbCg;
	          }
	        }
	      }, {
	        key: 'hb_size',
	        val: function val(bidResponse) {
	          return bidResponse.size;
	        }
	      }]
	    };
	  }
	  return bidder_settings[CONSTANTS.JSON_MAPPING.BD_SETTING_STANDARD];
	}
	
	function getStandardBidderAdServerTargeting() {
	  return getStandardBidderSettings()[CONSTANTS.JSON_MAPPING.ADSERVER_TARGETING];
	}
	
	exports.getStandardBidderAdServerTargeting = getStandardBidderAdServerTargeting;

/***/ },
/* 14 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var _defaultPrecision = 2;
	var _lgPriceConfig = {
	  'buckets': [{
	    'min': 0,
	    'max': 5,
	    'increment': 0.5
	  }]
	};
	var _mgPriceConfig = {
	  'buckets': [{
	    'min': 0,
	    'max': 20,
	    'increment': 0.1
	  }]
	};
	var _hgPriceConfig = {
	  'buckets': [{
	    'min': 0,
	    'max': 20,
	    'increment': 0.01
	  }]
	};
	var _densePriceConfig = {
	  'buckets': [{
	    'min': 0,
	    'max': 3,
	    'increment': 0.01
	  }, {
	    'min': 3,
	    'max': 8,
	    'increment': 0.05
	  }, {
	    'min': 8,
	    'max': 20,
	    'increment': 0.5
	  }]
	};
	var _autoPriceConfig = {
	  'buckets': [{
	    'min': 0,
	    'max': 5,
	    'increment': 0.05
	  }, {
	    'min': 5,
	    'max': 10,
	    'increment': 0.1
	  }, {
	    'min': 10,
	    'max': 20,
	    'increment': 0.5
	  }]
	};
	
	function getPriceBucketString(cpm, customConfig) {
	  var cpmFloat = 0;
	  cpmFloat = parseFloat(cpm);
	  if (isNaN(cpmFloat)) {
	    cpmFloat = '';
	  }
	
	  return {
	    low: cpmFloat === '' ? '' : getCpmStringValue(cpm, _lgPriceConfig),
	    med: cpmFloat === '' ? '' : getCpmStringValue(cpm, _mgPriceConfig),
	    high: cpmFloat === '' ? '' : getCpmStringValue(cpm, _hgPriceConfig),
	    auto: cpmFloat === '' ? '' : getCpmStringValue(cpm, _autoPriceConfig),
	    dense: cpmFloat === '' ? '' : getCpmStringValue(cpm, _densePriceConfig),
	    custom: cpmFloat === '' ? '' : getCpmStringValue(cpm, customConfig)
	  };
	}
	
	function getCpmStringValue(cpm, config) {
	  var cpmStr = '';
	  if (!isValidePriceConfig(config)) {
	    return cpmStr;
	  }
	  var cap = config.buckets.reduce(function (prev, curr) {
	    if (prev.max > curr.max) {
	      return prev;
	    }
	    return curr;
	  }, {
	    'max': 0
	  });
	  var bucket = config.buckets.find(function (bucket) {
	    if (cpm > cap.max) {
	      var precision = bucket.precision || _defaultPrecision;
	      cpmStr = bucket.max.toFixed(precision);
	    } else if (cpm <= bucket.max && cpm >= bucket.min) {
	      return bucket;
	    }
	  });
	  if (bucket) {
	    cpmStr = getCpmTarget(cpm, bucket.increment, bucket.precision);
	  }
	  return cpmStr;
	}
	
	function isValidePriceConfig(config) {
	  if (!config || !config.buckets || !Array.isArray(config.buckets)) {
	    return false;
	  }
	  var isValid = true;
	  config.buckets.forEach(function (bucket) {
	    if (typeof bucket.min === 'undefined' || !bucket.max || !bucket.increment) {
	      isValid = false;
	    }
	  });
	  return isValid;
	}
	
	function getCpmTarget(cpm, increment, precision) {
	  if (!precision) {
	    precision = _defaultPrecision;
	  }
	  var bucketSize = 1 / increment;
	  return (Math.floor(cpm * bucketSize) / bucketSize).toFixed(precision);
	}
	
	exports.getPriceBucketString = getPriceBucketString;
	exports.isValidePriceConfig = isValidePriceConfig;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _utils = __webpack_require__(2);
	
	var CONSTANTS = __webpack_require__(3);
	var utils = __webpack_require__(2);
	var adloader = __webpack_require__(16);
	var bidmanager = __webpack_require__(13);
	var bidfactory = __webpack_require__(12);
	var Adapter = __webpack_require__(17);
	
	var AppNexusAdapter;
	AppNexusAdapter = function AppNexusAdapter() {
	  var baseAdapter = Adapter.createNew('appnexus');
	
	  baseAdapter.callBids = function (params) {
	    //var bidCode = baseAdapter.getBidderCode();
	
	    var anArr = params.bids;
	
	    //var bidsCount = anArr.length;
	
	    //set expected bids count for callback execution
	    //bidmanager.setExpectedBidsCount(bidCode, bidsCount);
	
	    for (var i = 0; i < anArr.length; i++) {
	      var bidRequest = anArr[i];
	      var callbackId = bidRequest.bidId;
	      adloader.loadScript(buildJPTCall(bidRequest, callbackId));
	
	      //store a reference to the bidRequest from the callback id
	      //bidmanager.pbCallbackMap[callbackId] = bidRequest;
	    }
	  };
	
	  function buildJPTCall(bid, callbackId) {
	
	    //determine tag params
	    var placementId = utils.getBidIdParamater('placementId', bid.params);
	
	    //memberId will be deprecated, use member instead
	    var memberId = utils.getBidIdParamater('memberId', bid.params);
	    var member = utils.getBidIdParamater('member', bid.params);
	    var inventoryCode = utils.getBidIdParamater('invCode', bid.params);
	    var query = utils.getBidIdParamater('query', bid.params);
	    var referrer = utils.getBidIdParamater('referrer', bid.params);
	    var altReferrer = utils.getBidIdParamater('alt_referrer', bid.params);
	
	    //build our base tag, based on if we are http or https
	
	    var jptCall = 'http' + (document.location.protocol === 'https:' ? 's://secure.adnxs.com/jpt?' : '://ib.adnxs.com/jpt?');
	
	    jptCall = utils.tryAppendQueryString(jptCall, 'callback', 'pbjs.handleAnCB');
	    jptCall = utils.tryAppendQueryString(jptCall, 'callback_uid', callbackId);
	    jptCall = utils.tryAppendQueryString(jptCall, 'psa', '0');
	    jptCall = utils.tryAppendQueryString(jptCall, 'id', placementId);
	    if (member) {
	      jptCall = utils.tryAppendQueryString(jptCall, 'member', member);
	    } else if (memberId) {
	      jptCall = utils.tryAppendQueryString(jptCall, 'member', memberId);
	      utils.logMessage('appnexus.callBids: "memberId" will be deprecated soon. Please use "member" instead');
	    }
	
	    jptCall = utils.tryAppendQueryString(jptCall, 'code', inventoryCode);
	
	    //sizes takes a bit more logic
	    var sizeQueryString = '';
	    var parsedSizes = utils.parseSizesInput(bid.sizes);
	
	    //combine string into proper querystring for impbus
	    var parsedSizesLength = parsedSizes.length;
	    if (parsedSizesLength > 0) {
	      //first value should be "size"
	      sizeQueryString = 'size=' + parsedSizes[0];
	      if (parsedSizesLength > 1) {
	        //any subsequent values should be "promo_sizes"
	        sizeQueryString += '&promo_sizes=';
	        for (var j = 1; j < parsedSizesLength; j++) {
	          sizeQueryString += parsedSizes[j] += ',';
	        }
	
	        //remove trailing comma
	        if (sizeQueryString && sizeQueryString.charAt(sizeQueryString.length - 1) === ',') {
	          sizeQueryString = sizeQueryString.slice(0, sizeQueryString.length - 1);
	        }
	      }
	    }
	
	    if (sizeQueryString) {
	      jptCall += sizeQueryString + '&';
	    }
	
	    //this will be deprecated soon
	    var targetingParams = utils.parseQueryStringParameters(query);
	
	    if (targetingParams) {
	      //don't append a & here, we have already done it in parseQueryStringParameters
	      jptCall += targetingParams;
	    }
	
	    //append custom attributes:
	    var paramsCopy = utils.extend({}, bid.params);
	
	    //delete attributes already used
	    delete paramsCopy.placementId;
	    delete paramsCopy.memberId;
	    delete paramsCopy.invCode;
	    delete paramsCopy.query;
	    delete paramsCopy.referrer;
	    delete paramsCopy.alt_referrer;
	    delete paramsCopy.member;
	
	    //get the reminder
	    var queryParams = utils.parseQueryStringParameters(paramsCopy);
	
	    //append
	    if (queryParams) {
	      jptCall += queryParams;
	    }
	
	    //append referrer
	    if (referrer === '') {
	      referrer = utils.getTopWindowUrl();
	    }
	
	    jptCall = utils.tryAppendQueryString(jptCall, 'referrer', referrer);
	    jptCall = utils.tryAppendQueryString(jptCall, 'alt_referrer', altReferrer);
	
	    //remove the trailing "&"
	    if (jptCall.lastIndexOf('&') === jptCall.length - 1) {
	      jptCall = jptCall.substring(0, jptCall.length - 1);
	    }
	
	    // @if NODE_ENV='debug'
	    utils.logMessage('jpt request built: ' + jptCall);
	
	    // @endif
	
	    //append a timer here to track latency
	    bid.startTime = new Date().getTime();
	
	    return jptCall;
	  }
	
	  //expose the callback to the global object:
	  pbjs.handleAnCB = function (jptResponseObj) {
	
	    var bidCode;
	
	    if (jptResponseObj && jptResponseObj.callback_uid) {
	
	      var responseCPM;
	      var id = jptResponseObj.callback_uid;
	      var placementCode = '';
	      var bidObj = (0, _utils.getBidRequest)(id);
	      if (bidObj) {
	
	        bidCode = bidObj.bidder;
	
	        placementCode = bidObj.placementCode;
	
	        //set the status
	        bidObj.status = CONSTANTS.STATUS.GOOD;
	      }
	
	      // @if NODE_ENV='debug'
	      utils.logMessage('JSONP callback function called for ad ID: ' + id);
	
	      // @endif
	      var bid = [];
	      if (jptResponseObj.result && jptResponseObj.result.cpm && jptResponseObj.result.cpm !== 0) {
	        responseCPM = parseInt(jptResponseObj.result.cpm, 10);
	
	        //CPM response from /jpt is dollar/cent multiplied by 10000
	        //in order to avoid using floats
	        //switch CPM to "dollar/cent"
	        responseCPM = responseCPM / 10000;
	
	        //store bid response
	        //bid status is good (indicating 1)
	        var adId = jptResponseObj.result.creative_id;
	        bid = bidfactory.createBid(1);
	        bid.creative_id = adId;
	        bid.bidderCode = bidCode;
	        bid.cpm = responseCPM;
	        bid.adUrl = jptResponseObj.result.ad;
	        bid.width = jptResponseObj.result.width;
	        bid.height = jptResponseObj.result.height;
	        bid.dealId = jptResponseObj.result.deal_id;
	
	        bidmanager.addBidResponse(placementCode, bid);
	      } else {
	        //no response data
	        // @if NODE_ENV='debug'
	        utils.logMessage('No prebid response from AppNexus for placement code ' + placementCode);
	
	        // @endif
	        //indicate that there is no bid for this placement
	        bid = bidfactory.createBid(2);
	        bid.bidderCode = bidCode;
	        bidmanager.addBidResponse(placementCode, bid);
	      }
	    } else {
	      //no response data
	      // @if NODE_ENV='debug'
	      utils.logMessage('No prebid response for placement %%PLACEMENT%%');
	
	      // @endif
	    }
	  };
	
	  return {
	    callBids: baseAdapter.callBids,
	    setBidderCode: baseAdapter.setBidderCode,
	    createNew: AppNexusAdapter.createNew,
	    buildJPTCall: buildJPTCall
	  };
	};
	
	AppNexusAdapter.createNew = function () {
	  return new AppNexusAdapter();
	};
	
	module.exports = AppNexusAdapter;

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(2);
	var _requestCache = {};
	
	//add a script tag to the page, used to add /jpt call to page
	exports.loadScript = function (tagSrc, callback, cacheRequest) {
	  //var noop = () => {};
	  //
	  //callback = callback || noop;
	  if (!tagSrc) {
	    utils.logError('Error attempting to request empty URL', 'adloader.js:loadScript');
	    return;
	  }
	
	  if (cacheRequest) {
	    if (_requestCache[tagSrc]) {
	      if (callback && typeof callback === 'function') {
	        if (_requestCache[tagSrc].loaded) {
	          //invokeCallbacks immediately
	          callback();
	        } else {
	          //queue the callback
	          _requestCache[tagSrc].callbacks.push(callback);
	        }
	      }
	    } else {
	      _requestCache[tagSrc] = {
	        loaded: false,
	        callbacks: []
	      };
	      if (callback && typeof callback === 'function') {
	        _requestCache[tagSrc].callbacks.push(callback);
	      }
	
	      requestResource(tagSrc, function () {
	        _requestCache[tagSrc].loaded = true;
	        try {
	          for (var i = 0; i < _requestCache[tagSrc].callbacks.length; i++) {
	            _requestCache[tagSrc].callbacks[i]();
	          }
	        } catch (e) {
	          utils.logError('Error executing callback', 'adloader.js:loadScript', e);
	        }
	      });
	    }
	  }
	
	  //trigger one time request
	  else {
	      requestResource(tagSrc, callback);
	    }
	};
	
	function requestResource(tagSrc, callback) {
	  var jptScript = document.createElement('script');
	  jptScript.type = 'text/javascript';
	  jptScript.async = true;
	
	  // Execute a callback if necessary
	  if (callback && typeof callback === 'function') {
	    if (jptScript.readyState) {
	      jptScript.onreadystatechange = function () {
	        if (jptScript.readyState === 'loaded' || jptScript.readyState === 'complete') {
	          jptScript.onreadystatechange = null;
	          callback();
	        }
	      };
	    } else {
	      jptScript.onload = function () {
	        callback();
	      };
	    }
	  }
	
	  jptScript.src = tagSrc;
	
	  //add the new script tag to the page
	  var elToAppend = document.getElementsByTagName('head');
	  elToAppend = elToAppend.length ? elToAppend : document.getElementsByTagName('body');
	  if (elToAppend.length) {
	    elToAppend = elToAppend[0];
	    elToAppend.insertBefore(jptScript, elToAppend.firstChild);
	  }
	}
	
	//track a impbus tracking pixel
	//TODO: Decide if tracking via AJAX is sufficent, or do we need to
	//run impression trackers via page pixels?
	exports.trackPixel = function (pixelUrl) {
	  var delimiter = void 0;
	  var trackingPixel = void 0;
	
	  if (!pixelUrl || typeof pixelUrl !== 'string') {
	    utils.logMessage('Missing or invalid pixelUrl.');
	    return;
	  }
	
	  delimiter = pixelUrl.indexOf('?') > 0 ? '&' : '?';
	
	  //add a cachebuster so we don't end up dropping any impressions
	  trackingPixel = pixelUrl + delimiter + 'rnd=' + Math.floor(Math.random() * 1E7);
	  new Image().src = trackingPixel;
	  return trackingPixel;
	};

/***/ },
/* 17 */
/***/ function(module, exports) {

	"use strict";
	
	function Adapter(code) {
	  var bidderCode = code;
	
	  function setBidderCode(code) {
	    bidderCode = code;
	  }
	
	  function getBidderCode() {
	    return bidderCode;
	  }
	
	  function callBids() {}
	
	  return {
	    callBids: callBids,
	    setBidderCode: setBidderCode,
	    getBidderCode: getBidderCode
	  };
	}
	
	exports.createNew = function (bidderCode) {
	  return new Adapter(bidderCode);
	};

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var VERSION = '2.0.1',
	    CONSTANTS = __webpack_require__(3),
	    utils = __webpack_require__(2),
	    bidfactory = __webpack_require__(12),
	    bidmanager = __webpack_require__(13),
	    adloader = __webpack_require__(16);
	
	/**
	 * Adapter for requesting bids from Conversant
	 */
	var ConversantAdapter = function ConversantAdapter() {
	  var w = window,
	      n = navigator;
	
	  // production endpoint
	  var conversantUrl = '//media.msg.dotomi.com/s2s/header?callback=pbjs.conversantResponse';
	
	  // SSAPI returns JSONP with window.pbjs.conversantResponse as the cb
	  var appendScript = function appendScript(code) {
	    var script = document.createElement('script');
	    script.type = 'text/javascript';
	    script.className = 'cnvr-response';
	
	    try {
	      script.appendChild(document.createTextNode(code));
	      document.getElementsByTagName('head')[0].appendChild(script);
	    } catch (e) {
	      script.text = code;
	      document.getElementsByTagName('head')[0].appendChild(script);
	    }
	  };
	
	  var httpPOSTAsync = function httpPOSTAsync(url, data) {
	    var xmlHttp = new w.XMLHttpRequest();
	
	    xmlHttp.onload = function () {
	      appendScript(xmlHttp.responseText);
	    };
	    xmlHttp.open('POST', url, true); // true for asynchronous
	    xmlHttp.withCredentials = true;
	    xmlHttp.send(data);
	  };
	
	  var getDNT = function getDNT() {
	    return n.doNotTrack === '1' || w.doNotTrack === '1' || n.msDoNotTrack === '1' || n.doNotTrack === 'yes';
	  };
	
	  var getDevice = function getDevice() {
	    var language = n.language ? 'language' : 'userLanguage';
	    return {
	      h: screen.height,
	      w: screen.width,
	      dnt: getDNT() ? 1 : 0,
	      language: n[language].split('-')[0],
	      make: n.vendor ? n.vendor : '',
	      ua: n.userAgent
	    };
	  };
	
	  var callBids = function callBids(params) {
	    var conversantBids = params.bids || [];
	    requestBids(conversantBids);
	  };
	
	  var requestBids = function requestBids(bidReqs) {
	    // build bid request object
	    var page = location.pathname + location.search + location.hash,
	        siteId = '',
	        conversantImps = [],
	        conversantBidReqs,
	        secure = 0;
	
	    //build impression array for conversant
	    utils._each(bidReqs, function (bid) {
	      var bidfloor = utils.getBidIdParamater('bidfloor', bid.params),
	          sizeArrayLength = bid.sizes.length,
	          adW = 0,
	          adH = 0,
	          imp;
	
	      secure = utils.getBidIdParamater('secure', bid.params) ? 1 : secure;
	      siteId = utils.getBidIdParamater('site_id', bid.params);
	
	      if (sizeArrayLength === 2 && typeof bid.sizes[0] === 'number' && typeof bid.sizes[1] === 'number') {
	        adW = bid.sizes[0];
	        adH = bid.sizes[1];
	      } else {
	        adW = bid.sizes[0][0];
	        adH = bid.sizes[0][1];
	      }
	
	      imp = {
	        id: bid.bidId,
	        banner: {
	          w: adW,
	          h: adH
	        },
	        secure: secure,
	        bidfloor: bidfloor ? bidfloor : 0,
	        displaymanager: 'Prebid.js',
	        displaymanagerver: VERSION
	      };
	
	      conversantImps.push(imp);
	    });
	
	    conversantBidReqs = {
	      'id': utils.getUniqueIdentifierStr(),
	      'imp': conversantImps,
	
	      'site': {
	        'id': siteId,
	        'mobile': document.querySelector('meta[name="viewport"][content*="width=device-width"]') !== null ? 1 : 0,
	        'page': page
	      },
	
	      'device': getDevice(),
	      'at': 1
	    };
	
	    var url = secure ? 'https:' + conversantUrl : location.protocol + conversantUrl;
	    httpPOSTAsync(url, JSON.stringify(conversantBidReqs));
	  };
	
	  var addEmptyBidResponses = function addEmptyBidResponses(placementsWithBidsBack) {
	    var allConversantBidRequests = pbjs._bidsRequested.find(function (bidSet) {
	      return bidSet.bidderCode === 'conversant';
	    });
	
	    if (allConversantBidRequests && allConversantBidRequests.bids) {
	      utils._each(allConversantBidRequests.bids, function (conversantBid) {
	        if (!utils.contains(placementsWithBidsBack, conversantBid.placementCode)) {
	          // Add a no-bid response for this placement.
	          var bid = bidfactory.createBid(2, conversantBid);
	          bid.bidderCode = 'conversant';
	          bidmanager.addBidResponse(conversantBid.placementCode, bid);
	        }
	      });
	    }
	  };
	
	  var parseSeatbid = function parseSeatbid(bidResponse) {
	    var placementsWithBidsBack = [];
	    utils._each(bidResponse.bid, function (conversantBid) {
	      var responseCPM,
	          placementCode = '',
	          id = conversantBid.impid,
	          bid = {},
	          responseAd,
	          responseNurl,
	          sizeArrayLength;
	
	      // Bid request we sent Conversant
	      var bidRequested = pbjs._bidsRequested.find(function (bidSet) {
	        return bidSet.bidderCode === 'conversant';
	      }).bids.find(function (bid) {
	        return bid.bidId === id;
	      });
	
	      if (bidRequested) {
	        placementCode = bidRequested.placementCode;
	        bidRequested.status = CONSTANTS.STATUS.GOOD;
	        responseCPM = parseFloat(conversantBid.price);
	
	        if (responseCPM !== 0.0) {
	          conversantBid.placementCode = placementCode;
	          placementsWithBidsBack.push(placementCode);
	          conversantBid.size = bidRequested.sizes;
	          responseAd = conversantBid.adm || '';
	          responseNurl = conversantBid.nurl || '';
	
	          // Our bid!
	          bid = bidfactory.createBid(1, bidRequested);
	          bid.creative_id = conversantBid.id || '';
	          bid.bidderCode = 'conversant';
	
	          bid.cpm = responseCPM;
	
	          // Track impression image onto returned html
	          bid.ad = responseAd + '<img src=\"' + responseNurl + '\" />';
	
	          sizeArrayLength = bidRequested.sizes.length;
	          if (sizeArrayLength === 2 && typeof bidRequested.sizes[0] === 'number' && typeof bidRequested.sizes[1] === 'number') {
	            bid.width = bidRequested.sizes[0];
	            bid.height = bidRequested.sizes[1];
	          } else {
	            bid.width = bidRequested.sizes[0][0];
	            bid.height = bidRequested.sizes[0][1];
	          }
	
	          bidmanager.addBidResponse(placementCode, bid);
	        }
	      }
	    });
	    addEmptyBidResponses(placementsWithBidsBack);
	  };
	
	  // Register our callback to the global object:
	  pbjs.conversantResponse = function (conversantResponseObj, path) {
	    // valid object?
	    if (conversantResponseObj && conversantResponseObj.id) {
	      if (conversantResponseObj.seatbid && conversantResponseObj.seatbid.length > 0 && conversantResponseObj.seatbid[0].bid && conversantResponseObj.seatbid[0].bid.length > 0) {
	        utils._each(conversantResponseObj.seatbid, parseSeatbid);
	      } else {
	        //no response data for any placements
	        addEmptyBidResponses([]);
	      }
	    } else {
	      //no response data for any placements
	      addEmptyBidResponses([]);
	    }
	    // for debugging purposes
	    if (path) {
	      adloader.loadScript(path, function () {
	        var allConversantBidRequests = pbjs._bidsRequested.find(function (bidSet) {
	          return bidSet.bidderCode === 'conversant';
	        });
	
	        if (pbjs.conversantDebugResponse) {
	          pbjs.conversantDebugResponse(allConversantBidRequests);
	        }
	      });
	    }
	  }; // conversantResponse
	
	  return {
	    callBids: callBids
	  };
	};
	
	module.exports = ConversantAdapter;

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(2);
	var bidfactory = __webpack_require__(12);
	var bidmanager = __webpack_require__(13);
	
	/**
	 * Adapter for requesting bids from Pubmatic.
	 *
	 * @returns {{callBids: _callBids}}
	 * @constructor
	 */
	var PubmaticAdapter = function PubmaticAdapter() {
	
	  var bids;
	  var _pm_pub_id;
	  var _pm_optimize_adslots = [];
	  var iframe = void 0;
	
	  function _callBids(params) {
	    bids = params.bids;
	    for (var i = 0; i < bids.length; i++) {
	      var bid = bids[i];
	      //bidmanager.pbCallbackMap['' + bid.params.adSlot] = bid;
	      _pm_pub_id = _pm_pub_id || bid.params.publisherId;
	      _pm_optimize_adslots.push(bid.params.adSlot);
	    }
	
	    // Load pubmatic script in an iframe, because they call document.write
	    _getBids();
	  }
	
	  function _getBids() {
	
	    //create the iframe
	    iframe = utils.createInvisibleIframe();
	
	    var elToAppend = document.getElementsByTagName('head')[0];
	
	    //insert the iframe into document
	    elToAppend.insertBefore(iframe, elToAppend.firstChild);
	
	    var iframeDoc = utils.getIframeDocument(iframe);
	    iframeDoc.write(_createRequestContent());
	    iframeDoc.close();
	  }
	
	  function _createRequestContent() {
	    var content = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"' + ' "http://www.w3.org/TR/html4/loose.dtd"><html><head><base target="_top" /><scr' + 'ipt>inDapIF=true;</scr' + 'ipt></head>';
	    content += '<body>';
	    content += '<scr' + 'ipt>';
	    content += '' + 'window.pm_pub_id  = "%%PM_PUB_ID%%";' + 'window.pm_optimize_adslots     = [%%PM_OPTIMIZE_ADSLOTS%%];' + 'window.pm_async_callback_fn = "window.parent.pbjs.handlePubmaticCallback";';
	    content += '</scr' + 'ipt>';
	
	    var map = {};
	    map.PM_PUB_ID = _pm_pub_id;
	    map.PM_OPTIMIZE_ADSLOTS = _pm_optimize_adslots.map(function (adSlot) {
	      return "'" + adSlot + "'";
	    }).join(',');
	
	    content += '<scr' + 'ipt src="https://ads.pubmatic.com/AdServer/js/gshowad.js"></scr' + 'ipt>';
	    content += '<scr' + 'ipt>';
	    content += '</scr' + 'ipt>';
	    content += '</body></html>';
	    content = utils.replaceTokenInString(content, map, '%%');
	
	    return content;
	  }
	
	  pbjs.handlePubmaticCallback = function () {
	    var bidDetailsMap = {};
	    var progKeyValueMap = {};
	    try {
	      bidDetailsMap = iframe.contentWindow.bidDetailsMap;
	      progKeyValueMap = iframe.contentWindow.progKeyValueMap;
	    } catch (e) {
	      utils.logError(e, 'Error parsing Pubmatic response');
	    }
	
	    var i;
	    var adUnit;
	    var adUnitInfo;
	    var bid;
	    var bidResponseMap = bidDetailsMap || {};
	    var bidInfoMap = progKeyValueMap || {};
	    var dimensions;
	
	    for (i = 0; i < bids.length; i++) {
	      var adResponse;
	      bid = bids[i].params;
	
	      adUnit = bidResponseMap[bid.adSlot] || {};
	
	      // adUnitInfo example: bidstatus=0;bid=0.0000;bidid=39620189@320x50;wdeal=
	
	      // if using DFP GPT, the params string comes in the format:
	      // "bidstatus;1;bid;5.0000;bidid;hb_test@468x60;wdeal;"
	      // the code below detects and handles this.
	      if (bidInfoMap[bid.adSlot] && bidInfoMap[bid.adSlot].indexOf('=') === -1) {
	        bidInfoMap[bid.adSlot] = bidInfoMap[bid.adSlot].replace(/([a-z]+);(.[^;]*)/ig, '$1=$2');
	      }
	
	      adUnitInfo = (bidInfoMap[bid.adSlot] || '').split(';').reduce(function (result, pair) {
	        var parts = pair.split('=');
	        result[parts[0]] = parts[1];
	        return result;
	      }, {});
	
	      if (adUnitInfo.bidstatus === '1') {
	        dimensions = adUnitInfo.bidid.split('@')[1].split('x');
	        adResponse = bidfactory.createBid(1);
	        adResponse.bidderCode = 'pubmatic';
	        adResponse.adSlot = bid.adSlot;
	        adResponse.cpm = Number(adUnitInfo.bid);
	        adResponse.ad = unescape(adUnit.creative_tag); // jshint ignore:line
	        adResponse.ad += utils.createTrackPixelHtml(decodeURIComponent(adUnit.tracking_url));
	        adResponse.width = dimensions[0];
	        adResponse.height = dimensions[1];
	        adResponse.dealId = adUnitInfo.wdeal;
	
	        bidmanager.addBidResponse(bids[i].placementCode, adResponse);
	      } else {
	        // Indicate an ad was not returned
	        adResponse = bidfactory.createBid(2);
	        adResponse.bidderCode = 'pubmatic';
	        bidmanager.addBidResponse(bids[i].placementCode, adResponse);
	      }
	    }
	  };
	
	  return {
	    callBids: _callBids
	  };
	};
	
	module.exports = PubmaticAdapter;

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var bidfactory = __webpack_require__(12);
	var bidmanager = __webpack_require__(13);
	var adloader = __webpack_require__(16);
	
	var PulsePointAdapter = function PulsePointAdapter() {
	
	  var getJsStaticUrl = window.location.protocol + '//tag.contextweb.com/getjs.static.js';
	  var bidUrl = window.location.protocol + '//bid.contextweb.com/header/tag';
	
	  function _callBids(params) {
	    if (typeof window.pp === 'undefined') {
	      adloader.loadScript(getJsStaticUrl, function () {
	        bid(params);
	      }, true);
	    } else {
	      bid(params);
	    }
	  }
	
	  function bid(params) {
	    var bids = params.bids;
	    for (var i = 0; i < bids.length; i++) {
	      var bidRequest = bids[i];
	      var ppBidRequest = new window.pp.Ad(bidRequestOptions(bidRequest));
	      ppBidRequest.display();
	    }
	  }
	
	  function bidRequestOptions(bidRequest) {
	    var callback = bidResponseCallback(bidRequest);
	    var options = {
	      cn: 1,
	      ca: window.pp.requestActions.BID,
	      cu: bidUrl,
	      adUnitId: bidRequest.placementCode,
	      callback: callback
	    };
	    for (var param in bidRequest.params) {
	      if (bidRequest.params.hasOwnProperty(param)) {
	        options[param] = bidRequest.params[param];
	      }
	    }
	    return options;
	  }
	
	  function bidResponseCallback(bid) {
	    return function (bidResponse) {
	      bidResponseAvailable(bid, bidResponse);
	    };
	  }
	
	  function bidResponseAvailable(bidRequest, bidResponse) {
	    if (bidResponse) {
	      var adSize = bidRequest.params.cf.toUpperCase().split('X');
	      var bid = bidfactory.createBid(1, bidRequest);
	      bid.bidderCode = bidRequest.bidder;
	      bid.cpm = bidResponse.bidCpm;
	      bid.ad = bidResponse.html;
	      bid.width = adSize[0];
	      bid.height = adSize[1];
	      bidmanager.addBidResponse(bidRequest.placementCode, bid);
	    } else {
	      var passback = bidfactory.createBid(2, bidRequest);
	      passback.bidderCode = bidRequest.bidder;
	      bidmanager.addBidResponse(bidRequest.placementCode, passback);
	    }
	  }
	
	  return {
	    callBids: _callBids
	  };
	};
	
	module.exports = PulsePointAdapter;

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var _ajax = __webpack_require__(10);
	
	var bidmanager = __webpack_require__(13),
	    bidfactory = __webpack_require__(12),
	    utils = __webpack_require__(2),
	    CONSTANTS = __webpack_require__(3);
	
	function track(debug, p1, p2, p3) {
	  if (debug === true) {
	    console.log('GA: %s %s %s', p1, p2, p3 || '');
	  }
	}
	
	var w = typeof window !== "undefined" ? window : {};
	w.trackR1Impression = track;
	
	module.exports = function (bidManager, global, loader) {
	
	  var version = "0.9.0.0",
	      defaultZone = "1r",
	      defaultPath = "mvo",
	      bidfloor = 0,
	      currency = "USD",
	      debug = false,
	      auctionEnded = false,
	      requestCompleted = false,
	      placementCodes = {};
	
	  if (typeof global === "undefined") global = window;
	
	  if (typeof bidManager === "undefined") bidManager = bidmanager;
	
	  if (typeof loader === "undefined") loader = _ajax.ajax;
	
	  function applyMacros(txt, values) {
	    return txt.replace(/\{([^\}]+)\}/g, function (match) {
	      var v = values[match.replace(/[\{\}]/g, "").toLowerCase()];
	      if (typeof v !== "undefined") return v;
	      return match;
	    });
	  }
	
	  function load(bidParams, url, postData, callback) {
	    if (bidParams.method === "get") {
	      loader(url, function (responseText, response) {
	        if (response.status === 200) callback(200, "success", response.responseText);else callback(-1, "http error " + response.status, response.responseText);
	      }, false, { method: "GET" });
	    } else {
	      loader(url, function (responseText, response) {
	        if (response.status === 200) callback(200, "success", response.responseText);else callback(-1, "http error " + response.status, response.responseText);
	      }, postData, { method: "POST", contentType: "application/json" });
	    }
	  }
	
	  var bidderCode = "rhythmone",
	      bidLostTimeout = null;
	
	  function setIfPresent(o, key, value) {
	    try {
	      if (typeof value === "function") o[key] = value();
	    } catch (ex) {}
	  }
	
	  function logToConsole(txt) {
	    if (debug) console.log(txt);
	  }
	
	  function sniffAuctionEnd() {
	
	    global.pbjs.onEvent('bidWon', function (e) {
	
	      if (e.bidderCode === bidderCode) {
	        placementCodes[e.adUnitCode] = true;
	        track(debug, 'hb', "bidWon");
	      }
	
	      if (auctionEnded) {
	        clearTimeout(bidLostTimeout);
	        bidLostTimeout = setTimeout(function () {
	          for (var k in placementCodes) {
	            if (placementCodes[k] === false) track(debug, 'hb', "bidLost");
	          }
	        }, 50);
	      }
	    });
	
	    global.pbjs.onEvent('auctionEnd', function () {
	
	      auctionEnded = true;
	
	      if (requestCompleted === false) track(debug, 'hb', 'rmpReplyFail', "prebid timeout post auction");
	    });
	  }
	
	  function getBidParameters(bids) {
	    for (var i = 0; i < bids.length; i++) {
	      if (_typeof(bids[i].params) === "object" && bids[i].params.placementId) return bids[i].params;
	    }return null;
	  }
	
	  function noBids(params) {
	    for (var i = 0; i < params.bids.length; i++) {
	      if (params.bids[i].success !== 1) {
	        var bid = bidfactory.createBid(CONSTANTS.STATUS.NO_BID);
	        bid.bidderCode = bidderCode;
	        track(debug, 'hb', 'bidResponse', 0);
	        bidmanager.addBidResponse(params.bids[i].placementCode, bid);
	      }
	    }
	  }
	
	  function getRMPURL(bidParams, ortbJSON, bids) {
	    var endpoint = "//tag.1rx.io/rmp/{placementId}/0/{path}?z={zone}",
	        query = [];
	
	    if (typeof bidParams.endpoint === "string") endpoint = bidParams.endpoint;
	
	    if (typeof bidParams.zone === "string") defaultZone = bidParams.zone;
	
	    if (typeof bidParams.path === "string") defaultPath = bidParams.path;
	
	    if (bidParams.debug === true) debug = true;
	
	    if (bidParams.trace === true) query.push("trace=true");
	
	    endpoint = applyMacros(endpoint, {
	      placementid: bidParams.placementId,
	      zone: defaultZone,
	      path: defaultPath
	    });
	
	    function p(k, v) {
	      if (typeof v !== "undefined") query.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
	    }
	
	    if (bidParams.method === "get") {
	
	      p("domain", ortbJSON.site.domain);
	      p("title", ortbJSON.site.name);
	      p("url", ortbJSON.site.page);
	      p("dsh", ortbJSON.device.h);
	      p("dsw", ortbJSON.device.w);
	      p("tz", new Date().getTimezoneOffset());
	      p("dtype", ortbJSON.device.devicetype);
	
	      var placementCodes = [],
	          heights = [],
	          widths = [],
	          floors = [];
	
	      for (var i = 0; i < bids.length; i++) {
	
	        track(debug, 'hb', 'bidRequest');
	        var th = [],
	            tw = [];
	
	        for (var j = 0; j < bids[i].sizes.length; j++) {
	          tw.push(bids[i].sizes[j][0]);
	          th.push(bids[i].sizes[j][1]);
	        }
	        placementCodes.push(bids[i].placementCode);
	        heights.push(th.join("|"));
	        widths.push(tw.join("|"));
	        floors.push(0);
	      }
	
	      p("imp", placementCodes.join(","));
	      p("w", widths.join(","));
	      p("h", heights.join(","));
	      p("floor", floors.join(","));
	    }
	
	    endpoint += "&" + query.join("&");
	
	    return endpoint;
	  }
	
	  function getORTBJSON(bids, slotMap, bidParams) {
	    var o = {
	      "device": {
	        "langauge": global.navigator.language,
	        "dnt": global.navigator.doNotTrack === 1 ? 1 : 0
	      },
	      "at": 2,
	      "site": {},
	      "tmax": 3000,
	      "cur": [currency],
	      "id": utils.generateUUID(),
	      "imp": []
	    };
	
	    setIfPresent(o.site, "page", function () {
	      var l;
	      try {
	        l = global.top.document.location.href.toString();
	      } catch (ex) {
	        l = document.location.href.toString();
	      }
	      return l;
	    });
	    setIfPresent(o.site, "domain", function () {
	      var d = document.location.ancestorOrigins;
	      if (d && d.length > 0) return d[d.length - 1];
	      return global.top.document.location.hostname;
	    });
	    setIfPresent(o.site, "name", function () {
	      return global.top.document.title;
	    });
	
	    o.device.devicetype = /(ios|ipod|ipad|iphone|android)/i.test(global.navigator.userAgent) ? 1 : /(smart[-]?tv|hbbtv|appletv|googletv|hdmi|netcast\.tv|viera|nettv|roku|\bdtv\b|sonydtv|inettvbrowser|\btv\b)/i.test(global.navigator.userAgent) ? 3 : 2;
	
	    setIfPresent(o.device, "h", function () {
	      return global.screen.height;
	    });
	    setIfPresent(o.device, "w", function () {
	      return global.screen.width;
	    });
	
	    for (var i = 0; i < bids.length; i++) {
	      var bidID = utils.generateUUID();
	      slotMap[bidID] = bids[i];
	      slotMap[bids[i].placementCode] = bids[i];
	
	      if (bidParams.method === "post") track(debug, 'hb', 'bidRequest');
	
	      for (var j = 0; j < bids[i].sizes.length; j++) {
	        o.imp.push({
	          "id": bidID,
	          "tagId": bids[i].placementCode,
	          "bidfloor": bidfloor,
	          "bidfloorcur": currency,
	          "banner": {
	            "id": utils.generateUUID(),
	            "pos": 0,
	            "w": bids[i].sizes[j][0],
	            "h": bids[i].sizes[j][1]
	          }
	        });
	      }
	    }
	
	    return o;
	  }
	
	  this.callBids = function (params) {
	
	    var slotMap = {},
	        bidParams = getBidParameters(params.bids);
	
	    debug = bidParams !== null && bidParams.debug === true;
	
	    track(debug, 'hb', 'callBids');
	
	    if (bidParams === null) {
	      noBids(params);
	      track(debug, 'hb', 'misconfiguration');
	      return;
	    }
	
	    // default to GET request
	    if (typeof bidParams.method !== "string") bidParams.method = "get";
	
	    bidParams.method = bidParams.method.toLowerCase();
	
	    sniffAuctionEnd();
	
	    track(debug, 'hb', 'rmpRequest');
	
	    var ortbJSON = getORTBJSON(params.bids, slotMap, bidParams);
	
	    load(bidParams, getRMPURL(bidParams, ortbJSON, params.bids), JSON.stringify(ortbJSON), function (code, msg, txt) {
	
	      if (auctionEnded === true) return;
	
	      requestCompleted = true;
	
	      logToConsole(txt);
	
	      var bidCount = 0;
	
	      if (code === -1) track(debug, 'hb', 'rmpReplyFail', msg);else {
	        try {
	          var result = JSON.parse(txt),
	              registerBid = function registerBid(bid) {
	
	            slotMap[bid.impid].success = 1;
	
	            var pbResponse = bidfactory.createBid(CONSTANTS.STATUS.GOOD),
	                placementCode = slotMap[bid.impid].placementCode;
	
	            placementCodes[placementCode] = false;
	
	            pbResponse.bidderCode = bidderCode;
	            pbResponse.cpm = parseFloat(bid.price);
	            pbResponse.width = bid.w;
	            pbResponse.height = bid.h;
	            pbResponse.ad = bid.adm;
	
	            logToConsole("registering bid " + placementCode + " " + JSON.stringify(pbResponse));
	
	            track(debug, 'hb', 'bidResponse', 1);
	            bidManager.addBidResponse(placementCode, pbResponse);
	            bidCount++;
	          };
	
	          track(debug, 'hb', 'rmpReplySuccess');
	
	          for (var i = 0; result.seatbid && i < result.seatbid.length; i++) {
	            for (var j = 0; result.seatbid[i].bid && j < result.seatbid[i].bid.length; j++) {
	              registerBid(result.seatbid[i].bid[j]);
	            }
	          }
	        } catch (ex) {
	          track(debug, 'hb', 'rmpReplyFail', 'invalid json in rmp response');
	        }
	      }
	
	      // if no bids are successful, inform prebid
	      if (bidCount === 0) noBids(params);
	
	      // when all bids are complete, log a report
	      track(debug, 'hb', 'bidsComplete');
	    });
	
	    logToConsole("version: " + version);
	  };
	};

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var CONSTANTS = __webpack_require__(3);
	var utils = __webpack_require__(2);
	var bidfactory = __webpack_require__(12);
	var bidmanager = __webpack_require__(13);
	var adloader = __webpack_require__(16);
	
	/**
	 * Adapter for requesting bids from Sovrn
	 */
	var SovrnAdapter = function SovrnAdapter() {
	  var sovrnUrl = 'ap.lijit.com/rtb/bid';
	
	  function _callBids(params) {
	    var sovrnBids = params.bids || [];
	
	    _requestBids(sovrnBids);
	  }
	
	  function _requestBids(bidReqs) {
	    // build bid request object
	    var domain = window.location.host;
	    var page = window.location.pathname + location.search + location.hash;
	
	    var sovrnImps = [];
	
	    //build impression array for sovrn
	    utils._each(bidReqs, function (bid) {
	      var tagId = utils.getBidIdParamater('tagid', bid.params);
	      var bidFloor = utils.getBidIdParamater('bidfloor', bid.params);
	      var adW = 0;
	      var adH = 0;
	
	      //sovrn supports only one size per tagid, so we just take the first size if there are more
	      //if we are a 2 item array of 2 numbers, we must be a SingleSize array
	      var bidSizes = Array.isArray(bid.params.sizes) ? bid.params.sizes : bid.sizes;
	      var sizeArrayLength = bidSizes.length;
	      if (sizeArrayLength === 2 && typeof bidSizes[0] === 'number' && typeof bidSizes[1] === 'number') {
	        adW = bidSizes[0];
	        adH = bidSizes[1];
	      } else {
	        adW = bidSizes[0][0];
	        adH = bidSizes[0][1];
	      }
	
	      var imp = {
	        id: bid.bidId,
	        banner: {
	          w: adW,
	          h: adH
	        },
	        tagid: tagId,
	        bidfloor: bidFloor
	      };
	      sovrnImps.push(imp);
	    });
	
	    // build bid request with impressions
	    var sovrnBidReq = {
	      id: utils.getUniqueIdentifierStr(),
	      imp: sovrnImps,
	      site: {
	        domain: domain,
	        page: page
	      }
	    };
	
	    var scriptUrl = '//' + sovrnUrl + '?callback=window.pbjs.sovrnResponse' + '&src=' + CONSTANTS.REPO_AND_VERSION + '&br=' + encodeURIComponent(JSON.stringify(sovrnBidReq));
	    adloader.loadScript(scriptUrl);
	  }
	
	  function addBlankBidResponses(impidsWithBidBack) {
	    var missing = pbjs._bidsRequested.find(function (bidSet) {
	      return bidSet.bidderCode === 'sovrn';
	    });
	    if (missing) {
	      missing = missing.bids.filter(function (bid) {
	        return impidsWithBidBack.indexOf(bid.bidId) < 0;
	      });
	    } else {
	      missing = [];
	    }
	
	    missing.forEach(function (bidRequest) {
	      // Add a no-bid response for this bid request.
	      var bid = {};
	      bid = bidfactory.createBid(2, bidRequest);
	      bid.bidderCode = 'sovrn';
	      bidmanager.addBidResponse(bidRequest.placementCode, bid);
	    });
	  }
	
	  //expose the callback to the global object:
	  pbjs.sovrnResponse = function (sovrnResponseObj) {
	    // valid object?
	    if (sovrnResponseObj && sovrnResponseObj.id) {
	      // valid object w/ bid responses?
	      if (sovrnResponseObj.seatbid && sovrnResponseObj.seatbid.length !== 0 && sovrnResponseObj.seatbid[0].bid && sovrnResponseObj.seatbid[0].bid.length !== 0) {
	        var impidsWithBidBack = [];
	        sovrnResponseObj.seatbid[0].bid.forEach(function (sovrnBid) {
	
	          var responseCPM;
	          var placementCode = '';
	          var id = sovrnBid.impid;
	          var bid = {};
	
	          // try to fetch the bid request we sent Sovrn
	          var bidObj = pbjs._bidsRequested.find(function (bidSet) {
	            return bidSet.bidderCode === 'sovrn';
	          }).bids.find(function (bid) {
	            return bid.bidId === id;
	          });
	
	          if (bidObj) {
	            placementCode = bidObj.placementCode;
	            bidObj.status = CONSTANTS.STATUS.GOOD;
	
	            //place ad response on bidmanager._adResponsesByBidderId
	            responseCPM = parseFloat(sovrnBid.price);
	
	            if (responseCPM !== 0) {
	              sovrnBid.placementCode = placementCode;
	              sovrnBid.size = bidObj.sizes;
	              var responseAd = sovrnBid.adm;
	
	              // build impression url from response
	              var responseNurl = '<img src="' + sovrnBid.nurl + '">';
	
	              //store bid response
	              //bid status is good (indicating 1)
	              bid = bidfactory.createBid(1, bidObj);
	              bid.creative_id = sovrnBid.id;
	              bid.bidderCode = 'sovrn';
	              bid.cpm = responseCPM;
	
	              //set ad content + impression url
	              // sovrn returns <script> block, so use bid.ad, not bid.adurl
	              bid.ad = decodeURIComponent(responseAd + responseNurl);
	
	              // Set width and height from response now
	              bid.width = parseInt(sovrnBid.w);
	              bid.height = parseInt(sovrnBid.h);
	
	              bidmanager.addBidResponse(placementCode, bid);
	              impidsWithBidBack.push(id);
	            }
	          }
	        });
	
	        addBlankBidResponses(impidsWithBidBack);
	      } else {
	        //no response data for all requests
	        addBlankBidResponses([]);
	      }
	    } else {
	      //no response data for all requests
	      addBlankBidResponses([]);
	    }
	  }; // sovrnResponse
	
	  return {
	    callBids: _callBids
	  };
	};
	
	module.exports = SovrnAdapter;

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	/**
	 * @overview Yieldbot sponsored Prebid.js adapter.
	 * @author elljoh
	 */
	var adloader = __webpack_require__(16);
	var bidfactory = __webpack_require__(12);
	var bidmanager = __webpack_require__(13);
	var utils = __webpack_require__(2);
	
	/**
	 * Adapter for requesting bids from Yieldbot.
	 *
	 * @returns {Object} Object containing implementation for invocation in {@link module:adaptermanger.callBids}
	 * @class
	 */
	var YieldbotAdapter = function YieldbotAdapter() {
	
	  window.ybotq = window.ybotq || [];
	
	  var ybotlib = {
	    BID_STATUS: {
	      PENDING: 0,
	      AVAILABLE: 1,
	      EMPTY: 2
	    },
	    definedSlots: [],
	    pageLevelOption: false,
	    /**
	     * Builds the Yieldbot creative tag.
	     *
	     * @param {String} slot - The slot name to bid for
	     * @param {String} size - The dimenstions of the slot
	     * @private
	     */
	    buildCreative: function buildCreative(slot, size) {
	      return '<script type="text/javascript" src="//cdn.yldbt.com/js/yieldbot.intent.js"></script>' + '<script type="text/javascript">var ybotq = ybotq || [];' + 'ybotq.push(function () {yieldbot.renderAd(\'' + slot + ':' + size + '\');});</script>';
	    },
	    /**
	     * Bid response builder.
	     *
	     * @param {Object} slotCriteria  - Yieldbot bid criteria
	     * @private
	     */
	    buildBid: function buildBid(slotCriteria) {
	      var bid = {};
	
	      if (slotCriteria && slotCriteria.ybot_ad && slotCriteria.ybot_ad !== 'n') {
	
	        bid = bidfactory.createBid(ybotlib.BID_STATUS.AVAILABLE);
	
	        bid.cpm = parseInt(slotCriteria.ybot_cpm) / 100.0 || 0; // Yieldbot CPM bids are in cents
	
	        var szArr = slotCriteria.ybot_size ? slotCriteria.ybot_size.split('x') : [0, 0];
	        var slot = slotCriteria.ybot_slot || '';
	        var sizeStr = slotCriteria.ybot_size || ''; // Creative template needs the dimensions string
	
	        bid.width = szArr[0] || 0;
	        bid.height = szArr[1] || 0;
	
	        bid.ad = ybotlib.buildCreative(slot, sizeStr);
	
	        // Add Yieldbot parameters to allow publisher bidderSettings.yieldbot specific targeting
	        for (var k in slotCriteria) {
	          bid[k] = slotCriteria[k];
	        }
	      } else {
	        bid = bidfactory.createBid(ybotlib.BID_STATUS.EMPTY);
	      }
	
	      bid.bidderCode = 'yieldbot';
	      return bid;
	    },
	    /**
	     * Yieldbot implementation of {@link module:adaptermanger.callBids}
	     * @param {Object} params - Adapter bid configuration object
	     * @private
	     */
	    callBids: function callBids(params) {
	
	      var bids = params.bids || [];
	      var ybotq = window.ybotq || [];
	
	      ybotlib.pageLevelOption = false;
	
	      ybotq.push(function () {
	        var yieldbot = window.yieldbot;
	
	        utils._each(bids, function (v) {
	          var bid = v;
	          var psn = bid.params && bid.params.psn || 'ERROR_DEFINE_YB_PSN';
	          var slot = bid.params && bid.params.slot || 'ERROR_DEFINE_YB_SLOT';
	
	          yieldbot.pub(psn);
	          yieldbot.defineSlot(slot, { sizes: bid.sizes || [] });
	
	          ybotlib.definedSlots.push(bid.bidId);
	        });
	
	        yieldbot.enableAsync();
	        yieldbot.go();
	      });
	
	      ybotq.push(function () {
	        ybotlib.handleUpdateState();
	      });
	
	      adloader.loadScript('//cdn.yldbt.com/js/yieldbot.intent.js', null, true);
	    },
	    /**
	     * Yieldbot bid request callback handler.
	     *
	     * @see {@link YieldbotAdapter~_callBids}
	     * @private
	     */
	    handleUpdateState: function handleUpdateState() {
	      var yieldbot = window.yieldbot;
	
	      utils._each(ybotlib.definedSlots, function (v) {
	        var slot;
	        var criteria;
	        var placementCode;
	        var adapterConfig;
	
	        adapterConfig = pbjs._bidsRequested.find(function (bidderRequest) {
	          return bidderRequest.bidderCode === 'yieldbot';
	        }).bids.find(function (bid) {
	          return bid.bidId === v;
	        }) || {};
	        slot = adapterConfig.params.slot || '';
	        criteria = yieldbot.getSlotCriteria(slot);
	
	        placementCode = adapterConfig.placementCode || 'ERROR_YB_NO_PLACEMENT';
	        var bid = ybotlib.buildBid(criteria);
	
	        bidmanager.addBidResponse(placementCode, bid);
	      });
	    }
	  };
	  return {
	    callBids: ybotlib.callBids
	  };
	};
	
	module.exports = YieldbotAdapter;

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(2);
	var bidfactory = __webpack_require__(12);
	var bidmanager = __webpack_require__(13);
	var adloader = __webpack_require__(16);
	
	var CentroAdapter = function CentroAdapter() {
	  var baseUrl = '//t.brand-server.com/hb',
	      devUrl = '//staging.brand-server.com/hb',
	      bidderCode = 'centro',
	      handlerPrefix = 'adCentroHandler_',
	      LOG_ERROR_MESS = {
	    noUnit: 'Bid has no unit',
	    noAdTag: 'Bid has missmatch format.',
	    noBid: 'Response has no bid.',
	    anotherCode: 'Bid has another bidderCode - ',
	    undefBid: 'Bid is undefined',
	    unitNum: 'Requested unit is '
	  };
	
	  function _makeHandler(handlerName, unit, placementCode) {
	    return function (response) {
	      try {
	        delete window[handlerName];
	      } catch (err) {
	        //catching for old IE
	        window[handlerName] = undefined;
	      }
	      _responseProcessing(response, unit, placementCode);
	    };
	  }
	
	  function _sendBidRequest(bid) {
	    var placementCode = bid.placementCode,
	        size = bid.sizes && bid.sizes[0];
	
	    bid = bid.params;
	    if (!bid.unit) {
	      //throw exception, or call utils.logError
	      utils.logError(LOG_ERROR_MESS.noUnit, bidderCode);
	      return;
	    }
	    var query = ['s=' + bid.unit]; //,'url=www.abc15.com','sz=320x50'];
	    var isDev = bid.unit.toString() === '28136';
	
	    if (bid.page_url) {
	      query.push('url=' + encodeURIComponent(bid.page_url));
	    } else {
	      try {
	        query.push('url=' + encodeURIComponent(window.location.href));
	      } catch (err) {
	        utils.logWarn('Could not retrieve window.location.href to pass to Centro');
	      }
	    }
	
	    //check size format
	    if (size instanceof Array && size.length === 2 && typeof size[0] === 'number' && typeof size[1] === 'number') {
	      query.push('sz=' + size.join('x'));
	    }
	    //make handler name for JSONP request
	    var handlerName = handlerPrefix + bid.unit + size.join('x');
	    query.push('callback=' + handlerName);
	
	    //maybe is needed add some random parameter to disable cache
	    //query.push('r='+Math.round(Math.random() * 1e5));
	
	    window[handlerName] = _makeHandler(handlerName, bid.unit, placementCode);
	
	    adloader.loadScript((document.location.protocol === 'https:' ? 'https:' : 'http:') + (isDev ? devUrl : baseUrl) + '?' + query.join('&'));
	  }
	
	  /*
	   "sectionID": 7302,
	   "height": 250,
	   "width": 300,
	   "value": 3.2,
	   "adTag":''
	   */
	  function _responseProcessing(resp, unit, placementCode) {
	    var bidObject;
	    var bid = resp && resp.bid || resp;
	
	    if (bid && bid.adTag && bid.sectionID === unit) {
	      bidObject = bidfactory.createBid(1);
	      bidObject.cpm = bid.value;
	      bidObject.ad = bid.adTag;
	      bidObject.width = bid.width;
	      bidObject.height = bid.height;
	    } else {
	      //throw exception, or call utils.logError with resp.statusMessage
	      utils.logError(LOG_ERROR_MESS.unitNum + unit + '. ' + (bid ? bid.statusMessage || LOG_ERROR_MESS.noAdTag : LOG_ERROR_MESS.noBid), bidderCode);
	      bidObject = bidfactory.createBid(2);
	    }
	    bidObject.bidderCode = bidderCode;
	    bidmanager.addBidResponse(placementCode, bidObject);
	  }
	
	  /*
	   {
	   bidderCode: "centro",
	   bids: [
	   {
	   unit:  '3242432',
	   page_url: "http://",
	   size: [300, 250]
	   */
	  function _callBids(params) {
	    var bid,
	        bids = params.bids || [];
	    for (var i = 0; i < bids.length; i++) {
	      bid = bids[i];
	      if (bid && bid.bidder === bidderCode) {
	        _sendBidRequest(bid);
	      }
	    }
	  }
	
	  return {
	    callBids: _callBids
	  };
	};
	
	module.exports = CentroAdapter;

/***/ },
/* 25 */
/***/ function(module, exports) {

	'use strict';
	
	/** @module polyfill
	Misc polyfills
	*/
	/*jshint -W121 */
	if (!Array.prototype.find) {
	  Object.defineProperty(Array.prototype, "find", {
	    value: function value(predicate) {
	      if (this === null) {
	        throw new TypeError('Array.prototype.find called on null or undefined');
	      }
	      if (typeof predicate !== 'function') {
	        throw new TypeError('predicate must be a function');
	      }
	      var list = Object(this);
	      var length = list.length >>> 0;
	      var thisArg = arguments[1];
	      var value;
	
	      for (var i = 0; i < length; i++) {
	        value = list[i];
	        if (predicate.call(thisArg, value, i, list)) {
	          return value;
	        }
	      }
	      return undefined;
	    }
	  });
	}
	
	if (!Array.prototype.includes) {
	  Object.defineProperty(Array.prototype, "includes", {
	    value: function value(searchElement) {
	      var O = Object(this);
	      var len = parseInt(O.length, 10) || 0;
	      if (len === 0) {
	        return false;
	      }
	      var n = parseInt(arguments[1], 10) || 0;
	      var k;
	      if (n >= 0) {
	        k = n;
	      } else {
	        k = len + n;
	        if (k < 0) {
	          k = 0;
	        }
	      }
	      var currentElement;
	      while (k < len) {
	        currentElement = O[k];
	        if (searchElement === currentElement || searchElement !== searchElement && currentElement !== currentElement) {
	          // NaN !== NaN
	          return true;
	        }
	        k++;
	      }
	      return false;
	    }
	  });
	}
	
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
	Number.isInteger = Number.isInteger || function (value) {
	  return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
	};

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _url = __webpack_require__(11);
	
	//Adserver parent class
	var AdServer = function AdServer(attr) {
	  this.name = attr.adserver;
	  this.code = attr.code;
	  this.getWinningBidByCode = function () {
	    var _this = this;
	
	    var bidObject = pbjs._bidsReceived.find(function (bid) {
	      return bid.adUnitCode === _this.code;
	    });
	    return bidObject;
	  };
	};
	
	//DFP ad server
	exports.dfpAdserver = function (options, urlComponents) {
	  var adserver = new AdServer(options);
	  adserver.urlComponents = urlComponents;
	
	  var dfpReqParams = {
	    'env': 'vp',
	    'gdfp_req': '1',
	    'impl': 's',
	    'unviewed_position_start': '1'
	  };
	
	  var dfpParamsWithVariableValue = ['output', 'iu', 'sz', 'url', 'correlator', 'description_url', 'hl'];
	
	  var getCustomParams = function getCustomParams(targeting) {
	    return encodeURIComponent((0, _url.formatQS)(targeting));
	  };
	
	  adserver.appendQueryParams = function () {
	    var bid = adserver.getWinningBidByCode();
	    this.urlComponents.search.description_url = encodeURIComponent(bid.vastUrl);
	    this.urlComponents.search.cust_params = getCustomParams(bid.adserverTargeting);
	    this.urlComponents.correlator = Date.now();
	  };
	
	  adserver.verifyAdserverTag = function () {
	    for (var key in dfpReqParams) {
	      if (!this.urlComponents.search.hasOwnProperty(key) || this.urlComponents.search[key] !== dfpReqParams[key]) {
	        return false;
	      }
	    }
	    for (var i in dfpParamsWithVariableValue) {
	      if (!this.urlComponents.search.hasOwnProperty(dfpParamsWithVariableValue[i])) {
	        return false;
	      }
	    }
	    return true;
	  };
	
	  return adserver;
	};

/***/ }
/******/ ]);
//# sourceMappingURL=prebid.js.map