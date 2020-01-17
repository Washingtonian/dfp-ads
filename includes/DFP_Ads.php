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
     * @var bool $asynch
     */
    public $asynch;

    /**
     * Setting for whether to debug to console
     *
     * @since  0.0.1
     * @access public
     *
     * @var string $console_debugging
     */
    public $console_debugging;

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

    public $header_bidding_prebid_bidder_order_fixed;
    public $header_bidding_prebid_enabled;
    public $header_bidding_prebid_price_granularity;
    public $header_bidding_prebid_publisher_domain;
    public $header_bidding_prebid_size_config;
    public $header_bidding_prebid_timeout;

    /**
     * Setting for whether header bidding is enabled thru Amazon UAM
     *
     * @since  0.3.1
     * @access public
     * @var bool $header_bidding_amazon_enabled
     */
    public $header_bidding_amazon_enabled;
    public $header_bidding_amazon_timeout;

    /**
     * Setting for whether to load an ad as it nears viewport
     *
     * @since  0.0.1
     * @access public
     *
     * @var string $lazy_load
     */
    public $lazy_load;

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
        '180,90' => '200,200',
        '180,150' => '200,400',
        '245,155' => '300,200',
        '300,100' => '320,150',
        '320,50' => '320,100',
        '320,100' => '320,200',
        '300,250' => '320,400',
        '300,600' => '320,410',
        '336,280' => '340,400',
        '200,200' => '400,400',
        '160,600' => '400,410',
        '468,60' => '500,200',
        '240,400' => '500,600',
        '600,300' => '650,400',
        '728,90' => '740,200',
        '970,90' => '990,300',
        '970,250' => '990,400',
        '1,1' => '1,1'
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
        '300,600' =>
            [
                ['300,600'],
                ['300,250']
            ]
        , '600,300' =>
            [
                ['600,300'],
                ['300,250']
            ]
        , '970,250' =>
            [
                ['970,250'],
                ['728,90'],
                ['970,90']
            ]
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
     * Set Header Bidding Timeout (prebid.js)
     *
     * By default, the setting is 1000ms
     *
     * @since  0.3.1
     * @access public
     *
     * @param string $val
     *
     * @return bool
     */
    public function set_header_bidding_prebid_timeout($val)
    {
        $this->header_bidding_prebid_timeout = ($val ? $val : 1000);

        return ($this->header_bidding_prebid_timeout);
    }


    /**
     * Set Header Bidding Library Version (prebid.js)
     *
     *
     * @since  0.3.1
     * @access public
     *
     * @param string $val
     *
     * @return bool
     */
    public function set_header_bidding_prebid_version($val)
    {
        $this->header_bidding_prebid_version = ($val ? $val : "prebid3.3.0.js");
        return ($this->header_bidding_prebid_version);
    }

    /**
     * Set Header Bidding Publisher Domain (prebid.js)
     *
     * By default, the setting is 1000ms
     *
     * @since  0.3.1
     * @access public
     *
     * @param string $val
     *
     * @return bool
     */
    public function set_header_bidding_prebid_publisher_domain($val)
    {
        $this->header_bidding_prebid_publisher_domain = ($val ? $val : null);

        return ($this->header_bidding_prebid_publisher_domain);
    }



    /**
     * Set Header Bidding Fixed Bidder Order (prebid.js)
     *
     * By default, the setting is false
     *
     * @since  0.3.1
     * @access public
     *
     * @param string $val
     *
     * @return bool
     */
    public function set_header_bidding_prebid_bidder_order_fixed($val)
    {
        $this->header_bidding_prebid_bidder_order_fixed = ($val ? $val : false);

        return ($this->header_bidding_prebid_bidder_order_fixed);
    }


    /**
     * Set Header Bidding Price Granularity (prebid.js)
     *
     * By default, the setting is "dense"
     *
     * @since  0.3.1
     * @access public
     *
     * @param string $val
     *
     * @return bool
     */
    public function set_header_bidding_prebid_price_granularity($val)
    {
        $this->header_bidding_prebid_price_granularity = ($val ? $val : "dense");

        return ($this->header_bidding_prebid_price_granularity);
    }

    /**
     * Set Header Bidding Size Configs (prebid.js)
     *
     * By default, the setting is "dense"
     *
     * @since  0.3.1
     * @access public
     *
     * @param string $val
     *
     * @return bool
     */
    public function set_header_bidding_prebid_size_config($val)
    {
        $this->header_bidding_prebid_size_config = (json_decode($val) ? json_decode($val) :
        [ [
            'mediaQuery' => '(min-width: 480px, max-width: 767px)',
            'sizesSupported'=> [
              [320, 50],
              [300, 250]
            ],
            'labels'=> ['xs']
        ],
        [
            'mediaQuery'=> '(min-width: 768px, max-width: 991px)',
            'sizesSupported'=> [
            [320, 50],
            [300, 250]
            ],
            'labels'=> ['sm']
        ],
        [
            'mediaQuery'=> '(min-width: 992px, max-width: 1199px)',
            'sizesSupported'=> [
              [320, 50],
              [300, 250]
            ],
            'labels' => ['md']
        ],
        [
            'mediaQuery'=> '(min-width: 1200px)',
            'sizesSupported' => [
            [320, 50],
            [300, 250]
            ],
            'labels'=> ['lg']
        ]  ]  );

        return ($this->header_bidding_prebid_size_config);
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
     * Set Console Debugging
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
    public function set_console_debugging($val)
    {
        $this->console_debugging = ($val == 'on' ? true : false);

        return (isset($this->console_debugging) ? $this->console_debugging : false);
    }


    /**
     * Set Lazy Load
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
    public function set_lazy_load($val)
    {
        $this->lazy_load = ($val == 'on' ? true : false);
        return (isset($this->lazy_load) ? $this->lazy_load : false);
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
     * Set Header Bidding Timeout (prebid.js)
     *
     * By default, the setting is 1000ms
     *
     * @since  0.3.1
     * @access public
     *
     * @param string $val
     *
     * @return bool
     */
    public function set_header_bidding_amazon_timeout($val)
    {
        $this->header_bidding_amazon_timeout = ($val ? $val : 1000);

        return ($this->header_bidding_amazon_timeout);
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
        $terms = [];

        if (is_category()) {

            $terms[] = get_category(get_query_var('cat'));

        } elseif ($post) {

            foreach (get_the_category($post->ID) as $c) {

                $cat = get_category($c);

                foreach (get_ancestors($cat->term_id, 'category') as $ancestor) {

                    $terms[] = get_term($ancestor, 'category');

                }

                $terms[] = $cat; // Add the ancestor first in case of truncation.

            }

        }

        foreach ($terms as $c) {
            $targets[] = preg_replace("/[^A-Za-z0-9 ]/","",html_entity_decode($c->name));
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
                    $enabled = get_field("header_bidding_amazon_enabled", $pos->post_id);
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
                        if (is_array($bidders)) {
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
                        }
                        array_push($object, $thisunit);
                    }
                }
            }
        }

        return $object;
    }



    /**
     * @param DFP_Ads $dfp_ads
     *
     * @return DFP_Ads
     */
    public function send_header_bidding_prebid_1x_to_js($dfp_ads)
    {
        // Copy the original
        $params            = clone $this;
        $params->positions = dfp_get_ad_positions();
        $object = [];
        $sizeConfig = [];

        if ($params->header_bidding_prebid_enabled) {
            foreach ($params->positions as $pos) {
                if ($pos->post_id) {

                    $enabled = get_field("header_bidding_prebid_enabled", $pos->post_id);

                    if ($enabled) {
                        $bidders = get_field("prebid_bidders", $pos->post_id);
                        $mediaTypes = get_field("media_type", $pos->post_id);
                        $match_any_labels = get_field("match_any_labels", $pos->post_id);
                        $match_all_labels = get_field("match_all_labels", $pos->post_id);

                        if ($mediaTypes && !is_array($mediaTypes)) {
                            $mediaTypes = [$mediaTypes => [] ];
                        }

                        if (array_key_exists('banner',$mediaTypes)) {
                            $sizes = $pos->sizes;
                            if (! is_array($sizes[0])) {
                                $sizes = [$sizes];
                            }
                            $mediaTypes['banner']['sizes'] = $sizes;
                        }

                        $thisunit          = [
                            'code' => $pos->position_tag,
                            'mediaTypes' => $mediaTypes,
                            'bids' => []
                        ];

                        if ($match_any_labels) {
                            $thisunit['labelAny'] = $match_any_labels;
                        }

                        if ($match_all_labels) {
                            $thisunit['labelAll'] = $match_all_labels;
                        }

                        if (is_array($bidders)) {
                            foreach ($bidders as $bidderkey => $bidder) {
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
                                if (strpos($bidderkey,"-disabled") < 0) {
                                    array_push($thisunit['bids'], $bidder);
                                }
                            }
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
        $header_bidding_prebid_1x_params = apply_filters('pre_dfp_header_bidding_prebid_1x_to_js', $this);
        $header_bidding_amazon_params = apply_filters('pre_dfp_header_bidding_amazon_to_js', $this);

        // Add mandatory DFP inline scripts
        add_action('wp_head', 'inline_dfp_header_scripts', 10);
        add_action('wp_footer', 'inline_dfp_footer_scripts', 100);

        // Preps the script
        wp_register_script($this->script_name, $dfp_ads_script_url, ['jquery'], false, false);

        // Send data to front end.
        wp_localize_script($this->script_name, 'dfp_ad_object', [$ad_positions]);
        wp_localize_script($this->script_name, 'header_bidding_prebid_params', $header_bidding_prebid_params);
        wp_localize_script($this->script_name, 'header_bidding_prebid_1x_params', $header_bidding_prebid_1x_params);
        wp_localize_script($this->script_name, 'header_bidding_amazon_params', $header_bidding_amazon_params);
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
