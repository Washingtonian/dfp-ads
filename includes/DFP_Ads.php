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
     * @var bool $header_bidding_prebid_enabled
     */
    public $header_bidding_prebid_enabled;

    /**
     * Setting for whether header bidding is enabled thru Amazon UAM
     *
     * @since  0.3.1
     * @access public
     * @var bool $header_bidding_amazon_enabled
     */
    public $header_bidding_amazon_enabled;

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
        'Page'       => [],
        'Category'   => [],
        'Tag'        => [],
        'Collection' => [],
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
        ['200,200', '180,90'],
        ['200,400', '180,150'],
        ['300,200', '245,155'],
        ['320,100', '320,50'],
        ['320,200', '320,100'],
        ['320,400', '300,250'],
        ['340,400', '336,280'],
        ['320,400', '300,600'],
        ['400,400', '200,200'],
        ['400,400', '160,600'],
        ['500,200', '468,60'],
        ['500,600', '240,400'],
        ['650,400', '600,300'],
        ['740,200', '728,90'],
        ['990,400', '970,250'],
        ['1,1', '1,1'],
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
        [
            '300,600', [
            [300, 600],
            [300, 250],
        ],
        ],
        [
            '600,300', [
            [600, 300],
            [300, 250],
        ],
        ],
        [
            '970,250', [
            [970, 250],
            [728, 90],
            [970, 90],
        ],
        ],
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
    public function set_header_bidding_prebid($val)
    {
        $this->header_bidding_prebid_enabled = ($val == 'on' ? true : false);

        return (isset($this->header_bidding_prebid_enabled) ? $this->header_bidding_prebid_enabled : false);
    }

    /**
     * Set Header Bidding (Amazon)
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
    public function set_header_bidding_amazon($val)
    {
        $this->header_bidding_amazon_enabled = ($val == 'on' ? true : false);

        return (isset($this->header_bidding_amazon_enabled) ? $this->header_bidding_amazon_enabled : false);
    }



    /**
     * Set Header Bidding Amazon UAM Publisher ID
     *
     * By default, the setting is blank
     *
     * @since  0.3.1
     * @access public
     *
     * @param string $val
     *
     * @return bool|string
     */
    public function set_header_bidding_amazon_publisher_id($val)
    {
        $this->header_bidding_amazon_publisher_id = ($val ? $val : false);

        return ($this->header_bidding_amazon_publisher_id);
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

        $this->page_targeting['Collection'] = $this->get_collections_targeting();
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

        return (count($array) < 1 ? 'Home' : $string);
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
        if (is_category()) {
            $cat = get_category(get_query_var('cat'));
            $targets[] = preg_replace("/[^A-Za-z0-9 ]/","",html_entity_decode($cat->name));
        } elseif ($post) {
            $categories = get_the_category($post->ID);
            foreach ($categories as $c) {
                $cat       = get_category($c);
                $targets[] = preg_replace("/[^A-Za-z0-9 ]/","",html_entity_decode($cat->name));
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
            if (is_array($tags) > 0) {
                foreach ($tags as $tag) {
                    $targets[] = preg_replace("/[^A-Za-z0-9 ]/","",html_entity_decode($tag->name));
                }
            }

            $restaurant_lists = get_the_terms($post->ID, "restaurant_lists");
            if (is_array($restaurant_lists)) {
                foreach ($restaurant_lists as $restaurant_list) {
                    $targets[] = $restaurant_list->name;
                }
            }
        }

        $string = mb_strimwidth(implode(",", $targets), 0, 40, "");

        return (count($targets) < 1 ? '' : $string);
    }


    /**
     * Gather the collections for each post
     *
     * @since  0.0.1
     * @access protected
     * @return null|string
     */
    protected function get_collections_targeting()
    {
        global $post;
        $targets = [];
        if ($post) {

            $parents = get_posts([
                'post_type'  => 'post',
                'meta_query' => [
                    [
                        'key'     => 'collection',
                        'value'   => '"' . $post->ID . '"',
                        'compare' => 'LIKE',
                    ],
                    'orderby' => 'meta_value_num post_date',
                    'order'   => 'DESC',
                ],
            ]);
            if (count($parents) > 0) {
                foreach ($parents as $p) {
                    $targets[] = $p->post_title;

                }
            }
            $string = mb_strimwidth(implode(",", $targets), 0, 40, "");

            return (count($targets) < 1 ? '' : $string);
        }
    }


    /**
     * @param DFP_Ads $dfp_ads
     *
     * @return DFP_Ads
     */
    public function send_header_bidding_amazon_to_js($dfp_ads)
    {

        // Copy the original
        $params            = clone $this;
        $params->positions = dfp_get_ad_positions();
        // $object = [];
        $object = [];
        $slots = [];
        $amazon = $params->header_bidding_amazon_enabled;
        if ($amazon) {
            foreach ($params->positions as $pos) {
                if ($pos->post_id) {
                    $enabled = get_field("header_bidding_prebid_enabled", $pos->post_id);
                    if ($enabled) {
                        $thisunit = [];
                        $thisunit['slotID'] = $pos->position_tag;
                        $thisunit['slotName']  = $pos->ad_name;
                        $thisunit['sizes'] = $pos->sizes;
                        array_push($slots, $thisunit);
                    }
                }
            }
        }
        $object['slots'] = $slots;
        return $object;
    }

    /**
     * @param DFP_Ads $dfp_ads
     *
     * @return DFP_Ads
     */
    public function send_header_bidding_prebid_to_js($dfp_ads)
    {
        // Copy the original
        $params            = clone $this;
        $params->positions = dfp_get_ad_positions();
        // $object = [];
        $object = [];

        if ($params->header_bidding_prebid_enabled) {
            foreach ($params->positions as $pos) {
                if ($pos->post_id) {
                    $enabled = get_field("header_bidding_prebid_enabled", $pos->post_id);

                    if ($enabled) {
                        $thisunit          = [];
                        $thisunit['code']  = $pos->position_tag;
                        $thisunit['sizes'] = $pos->sizes;
                        $sizeArray         = $pos->sizes;
                        if ( ! is_array($sizeArray[0])) {
                            $sizeArray = [$sizeArray];
                        }
                        $mappingsArray = dfp_swap_size_mapping_array($this->browser_sizes);

                        $thisunit['sizeMapping'] = [];

                        foreach ($sizeArray as $size) {

                            foreach ($mappingsArray as $prospect) {
                                if (dfp_pixels_to_string($size) == $prospect[0]) {
                                    $browser_size    = dfp_pixels_to_array($prospect[1]);
                                    $key["minWidth"] = $browser_size[0];
                                    $key["sizes"]    = [];
                                    array_push($key["sizes"], $size);
                                    foreach ($this->alternate_sizes as $alternate) {
                                        if (dfp_pixels_to_string($size) == $alternate[0]) {
                                            foreach ($alternate[1] as $newSize) {
                                                if (in_array($newSize, $sizeArray)) {
                                                    array_push($key["sizes"], $newSize);
                                                }
                                            }
                                        }
                                    }
                                    // This fails on multidim arrays.
                                    // $key["sizes"] = array_unique ($key["sizes"]);
                                    array_push($thisunit['sizeMapping'], $key);
                                }
                            }
                        }

                        $bidders = get_field("prebid_bidders", $pos->post_id);
                        $thisunit['bids'] = [];
                        foreach ($bidders as $bidder) {
                            if (array_key_exists('params', $bidder)) {
                                foreach ($bidder['params'] as $param) {
                                    if (preg_match("/^[0-9]*$/", $param['value']) === 1) {
                                        $param['value'] = intval($param['value']);
                                    } else {
                                        if (preg_match("/^[0-9\.]*$/", $param['value']) === 1) {
                                            $param['value'] = floatval($param['value']);
                                        } else {
                                            if (substr($param['value'], 0, 1) === "[") {
                                                $param['value'] = json_decode($param['value']);
                                            }
                                        }
                                    }
                                    $bidder['newparams'][$param['name']] = $param['value'];
                                }
                                unset($bidder['params']);
                                $bidder['params'] = $bidder['newparams'];
                                unset($bidder['newparams']);
                            }
                            array_push($thisunit['bids'], $bidder);
                        }
                        array_push($object, $thisunit);
                    }
                }
            }
        }

        return $object;
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
        $gads_script_url    = $this->dir_uri . '/assets/js/google-ads.js';
        $dfp_ads_script_url = $this->dir_uri . '/assets/js/dfp-ads.js';

        /* Get the Final Ad Positions */
        $ad_positions = apply_filters('pre_dfp_ads_to_js', $this);
        // wp_enqueue_script($this->google_ad_script_name);
        $header_bidding_prebid_params = apply_filters('pre_dfp_header_bidding_prebid_to_js', $this);
        $header_bidding_amazon_params = apply_filters('pre_dfp_header_bidding_amazon_to_js', $this);

        // Add mandatory DFP inline scripts
        add_action('wp_head', 'inline_dfp_header_scripts', 100);
        add_action('wp_footer', 'inline_dfp_footer_scripts', 100);

        // Preps the script
        wp_register_script($this->script_name, $dfp_ads_script_url, ['jquery'], false, false);

        // Send data to front end.
        wp_localize_script($this->script_name, 'dfp_ad_object', [$ad_positions]);
        wp_localize_script($this->script_name, 'header_bidding_prebid_params', $header_bidding_prebid_params);
        wp_localize_script($this->script_name, 'header_bidding_prebid_enabled', [$this->header_bidding_prebid_enabled]);
        wp_localize_script($this->script_name, 'header_bidding_amazon_params', $header_bidding_amazon_params);
        wp_localize_script($this->script_name, 'header_bidding_amazon_enabled', [$this->header_bidding_amazon_enabled]);
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
