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
              $bids = get_field("bidders",$pos->post_id)[0];
              if (array_key_exists('params',$bids)) {
                foreach ($bids[params] as $param) {
                  $bids['newparams'][ $param['name'] ] = $param['value'];
                  // unset ($bids->['params']->['param']);
                  // unset ($bids->params[$param]); // why no workie
                }
                unset($bids['params']);
                $bids['params']=$bids['newparams'];
                unset($bids['newparams']);

              } else {
              }
              $thisunit['bids'] = $bids;
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
        wp_localize_script($this->script_name, 'header_bidding_params', [$header_bidding_params]);
        wp_localize_script($this->script_name, 'headerBiddingEnabled', true);
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
