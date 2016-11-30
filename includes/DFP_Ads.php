<?php
/**
 * Class DFP_Ads
 *
 * @link       http://www.chriwgerber.com/dfp-ads/
 * @since      0.0.1
 *
 * @package    WordPress
 * @subpackage DFP-Ads
 */
namespace DFP_Ads;

Class DFP_Ads
{

    /**
     * Loads Google Ads JS to header
     *
     * @since  0.0.1
     * @access public
     *
     * @var string $google_ad_script_name
     */
    public $google_ad_script_name = 'google_ad_js';

    /**
     * Name of the javascript file.
     *
     * @since  0.0.1
     * @access public
     *
     * @var string $script_name
     */
    public $script_name = 'dfp_ads';

    /**
     * DFP Account ID. Includes the two slashes
     *
     * @since  0.0.1
     * @access public
     * @var string $account_id
     */
    public $account_id;

    /**
     * Setting for whether to load an ad as asynchronous
     * or synchronous
     *
     * @since  0.3.1
     * @access public
     * @var bool $account_id
     */
    public $asynch;

    /**
     * Stores the URI of the directory
     *
     * @since  0.0.1
     * @access public
     *
     * @var string $dir_uri
     */
    public $dir_uri;

    /**
     * Setting for whether header bidding is enabled thru Prebid.js
     *
     * @since  0.3.1
     * @access public
     * @var bool $headerbidding
     */
    public $headerbidding;

    /**
     * Ad Positions - Array
     *
     * @since  0.0.1
     * @access public
     *
     * @var Position DFP_Ads Position
     */
    public $positions;

    /**
     * Sets page level targeting
     *
     * @access public
     * @since  0.0.1
     *
     * @var array
     */
    public $page_targeting = [
        'Page'     => [],
        'Category' => [],
        'Tag'      => [],
    ];

    /**
     * Defines minimum browser sizes for each ad size
     *
     * @access public
     * @since  0.0.1
     *
     * @var array
     */
    public $browser_sizes = [
        ['200,100', '180,90'],
        ['200,180', '180,150'],
        ['220,220', '200,200'],
        ['300,200', '245,155'],
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

    /**
     * Defines which ad sizes should be unrolled into multiple sizes
     *
     * @access public
     * @since  0.0.1
     *
     * @var array
     */
    public $alternate_sizes = [
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

    /**
     * PHP5 Constructor
     *
     * @since  0.0.1
     * @access public
     */
    public function __construct()
    {
        /** Creates DFP_Ads Shortcode */
        add_shortcode('dfp_ads', [$this, 'shortcode']);
    }


    /**
     * Set DFP Property Code
     *
     * Sets the DFP Property Code. An 8-digit integer
     *
     * @since  0.0.1
     * @access public
     *
     * @param $id int Code ID Number
     *
     * @return bool|string
     */
    public function set_account_id($id)
    {
        $this->account_id = '/' . $id . '/';

        return (isset($this->account_id) ? $this->account_id : false);
    }


    /**
     * Set Asynchronous Loading
     *
     * Sets the flag for how the ads should load. By default, the setting is off,
     * so it will send 'on' when it's set to load synchronously, rather than
     * the normal, correct way. This is because asynchronous is default and some
     * people want to be able to turn it off.
     *
     * @since  0.3.1
     * @access public
     *
     * @param string $val
     *
     * @return bool
     */
    public function set_asynchronous_loading($val)
    {
        $this->asynch = ($val == 'on' ? false : true);

        return (isset($this->asynch) ? $this->asynch : false);
    }


    /**
     * Set Header Bidding (prebid.js)
     *
     * By default, the setting is off
     *
     * @since  0.3.1
     * @access public
     *
     * @param string $val
     *
     * @return bool
     */
    public function set_header_bidding($val)
    {
        $this->headerbidding = ($val == 'on' ? true : false);

        return (isset($this->headerbidding) ? $this->headerbidding : false);
    }


    /**
     * @param DFP_Ads $dfp_ads
     *
     * @return DFP_Ads
     */
    public function send_ads_to_js($dfp_ads)
    {
        // Copy the original
        $object = clone $this;

        $object->set_targeting();
        $object->positions   = dfp_get_ad_positions();
        $object->script_name = null;
        $object->dir_uri     = null;

        return $object;
    }


    /**
     * @param DFP_Ads $dfp_ads
     *
     * @return DFP_Ads
     */
    public function send_header_bidding_to_js($dfp_ads)
    {
        // Copy the original
        $params = clone $this;
        $params->positions   = dfp_get_ad_positions();
        // $object = [];
        $object = [];

        if ($params->headerbidding == false) {
          return [];

        }
        foreach ($params->positions as $pos) {
          if ($pos->post_id)  {
            $enabled = get_field("header_bidding_enabled",$pos->post_id);

            if ($enabled) {
              $thisunit = [];
              $thisunit['code'] = $pos->position_tag;
              $thisunit['sizes'] = $pos->sizes;
              $sizeArray = $pos->sizes;
              if (! is_array($sizeArray[0])) {
                  $sizeArray = [ $sizeArray ] ;
              }
              $mappingsArray = dfp_swap_size_mapping_array($this->browser_sizes);

              $thisunit['sizeMapping'] = [];
              // $thisunit['debug']=$mappingsArray;
              foreach ($sizeArray as $size) {

                  foreach ($mappingsArray as $prospect) {
                    // $thisunit['debug-size'] = dfp_pixels_to_string($size);
                    // $thisunit['debug-prospect-key'] = $prospect[0];
                    // $thisunit['debug-prospect-value'] = $prospect[1];

                      if (dfp_pixels_to_string($size)==$prospect[0]) {
                          $browser_size = dfp_pixels_to_array($prospect[1]);
                          $key["minWidth"]=$browser_size[0];
                          $key["sizes"]=[];
                          array_push($key["sizes"],$size);
                          foreach ($this->alternate_sizes as $alternate) {
                              if (dfp_pixels_to_string($size) == $alternate[0]) {
                                foreach ($alternate[1] as $newSize) {
                                  if (in_array($newSize,$sizeArray)) {
                                    array_push($key["sizes"],$newSize);
                                  }
                                }
                              }
                            }
                          // This fails on multidim arrays.
                          // $key["sizes"] = array_unique ($key["sizes"]);
                          array_push($thisunit['sizeMapping'],$key);
                      }
                  }
              }

              $bids = get_field("bids",$pos->post_id);
              $thisunit['bids'] = [];
              foreach ($bids as $bid) {
                if (array_key_exists('params',$bid)) {
                  foreach ($bid[params] as $param) {
                    if (preg_match("/^[0-9]*$/",$param['value'])===1) {
                      $param['value']=intval($param['value']);
                    } else if (preg_match("/^[0-9\.]*$/",$param['value'])===1) {
                      $param['value']=floatval($param['value']);
                    } else if (substr($param['value'],0,1)==="[") {
                      $param['value']=json_decode($param['value']);
                    }
                    $bid['newparams'][ $param['name'] ] = $param['value'];
                    // unset ($bids->['params']->['param']);
                    // unset ($bids->params[$param]); // why no workie
                  }
                  unset($bid['params']);
                  $bid['params']=$bid['newparams'];
                  unset($bid['newparams']);
                }
                array_push($thisunit['bids'], $bid);
              }
              array_push($object, $thisunit);
            }
          }
        }

        return $object;
    }

    /**
     * Sets all ad targeting
     *
     * @since  0.0.1
     * @access public
     *
     * @return mixed
     */
    public function set_targeting()
    {
        // Page Title
        $this->page_targeting['Page'] = $this->get_page_targeting();
        // Categories
        $this->page_targeting['Category'] = $this->get_category_targeting();
        // Tags
        $this->page_targeting['Tag'] = $this->get_tag_targeting();
    }


    /**
     * Adds URL sections to targeting
     *
     * This function will return an array of page directories without the URL.
     *
     * Example: [ '2015', '10', '11', 'post_slug' ]
     *
     * @since  0.0.1
     * @access protected
     *
     * @return array|string
     */
    protected function get_page_targeting()
    {
        global $wp;
        /*
         * WP Core replacement for the URL parsing being done before.
         */
        if ($wp->request != null) {
            $current_url = $wp->request;
            $array       = explode('/', $current_url);
        } else {
            $current_url = $wp->query_string;
            $url_parts   = explode('=', $current_url);
            if (count($url_parts) >= 2) {
                $array[$url_parts[0]] = $url_parts[1];
            } else {
                $array = [];
            }

        }
        $string = mb_strimwidth(implode(",", $array), 0, 40, "");
        return (count($array) < 1 ? ['Home'] : $string);
    }


    /**
     * Sets the category targeting on the object
     *
     * @since  0.0.1
     * @access protected
     *
     * @return array|string
     */
    protected function get_category_targeting()
    {
        global $post;
        $targets = [];
        if ($post) {
            $categories = get_the_category($post->ID);
            foreach ($categories as $c) {
                $cat       = get_category($c);
                $targets[] = $cat->name;
            }
        }

        $string = mb_strimwidth(implode(",", $targets), 0, 40, "");
        return (count($targets) < 1 ? '' : $string);
    }


    /**
     * Sets the tag targeting on the object
     *
     * @since  0.0.1
     * @access protected
     *
     * @return array|string
     */
    protected function get_tag_targeting()
    {
        global $post;
        $targets = [];
        if ($post) {
            $tags = get_the_tags($post->ID);
            if ($tags) {
                foreach ($tags as $tag) {
                    $targets[] = $tag->name;
                }
            }
        }

        $string = mb_strimwidth(implode(",", $targets), 0, 40, "");
        return (count($targets) < 1 ? '' : $string);
    }

    /**
     * Registers Scripts. Localizes data to interstitial_ad.js
     *
     * @access public
     * @since  0.0.1
     *
     * @return mixed
     */
    public function scripts_and_styles()
    {
        if (defined('DFP_CONCAT_SCRIPTS') && true === DFP_CONCAT_SCRIPTS) {
            $gads_script_url    = $this->dir_uri . '/assets/js/google-ads.min.js';
            $dfp_ads_script_url = $this->dir_uri . '/assets/js/dfp-ads.min.js';
        } else {
            $gads_script_url    = $this->dir_uri . '/assets/js/google-ads.js';
            $dfp_ads_script_url = $this->dir_uri . '/assets/js/dfp-ads.js';
        }


        // // Google Ads JS Script
        // wp_register_script($this->google_ad_script_name, $gads_script_url, ['jquery'], false, false);

        /* Get the Final Ad Positions */
        $ad_positions = apply_filters('pre_dfp_ads_to_js', $this);
        // wp_enqueue_script($this->google_ad_script_name);
        $header_bidding_params = apply_filters('pre_dfp_header_bidding_to_js', $this);

        // Add mandatory DFP inline scripts
        add_action('wp_head','inline_dfp_scripts',5);
        add_action('wp_footer','inline_dfp_footer_scripts',100);

        // Preps the script
        wp_register_script($this->script_name, $dfp_ads_script_url, ['jquery'], false, false);

        // Send data to front end.
        wp_localize_script($this->script_name, 'dfp_ad_object', [$ad_positions]);
        wp_localize_script($this->script_name, 'header_bidding_params', $header_bidding_params);
        wp_localize_script($this->script_name, 'headerBiddingEnabled', [$this->headerbidding]);
        wp_localize_script($this->script_name, 'browser_sizes', $this->browser_sizes);
        wp_localize_script($this->script_name, 'alternate_sizes', $this->alternate_sizes);

        wp_enqueue_script($this->script_name);
    }

    /**
     * Display Shortcode
     *
     * @since  0.0.1
     * @access public
     *
     * @param $atts array
     *
     * @return mixed Returns HTML data for the position
     */
    public function shortcode($atts)
    {
        $position = dfp_get_ad_position($atts['id']);

        if (is_object($position)) {
            return $position->get_position();
        }
    }

}
