<?php
/**
 * Helper functions for the plugin
 *
 * Various functions.
 *
 * @link       http://www.chriswgerber.com/dfp-ads
 * @since      0.0.1
 *
 * @package    WordPress
 * @subpackage DFP-Ads
 */
use DFP_Ads\Position as DFP_Ad_Position;
use DFP_Ads\Post_type as DFP_Ads_Post_Type;

/**
 * Helper function to run the shortcode.
 *
 * @since 0.0.1
 *
 * @param $id int
 */
function dfp_ad_position($id)
{
    $position = new DFP_Ad_Position($id);
    $position->display_position();
}

/**
 * Returns array of DFP_Ad_Position objects
 *
 * @since 0.2.5
 *
 * @return array
 */
function dfp_get_ad_positions()
{
    $args = [
        'post_type'           => 'dfp_ads',
        'post_status'         => 'publish',
        'posts_per_page'      => -1,
        'ignore_sticky_posts' => 1,
    ];
    /**
     * @var WP_Query $all_ads
     */
    $all_ads = new WP_Query($args);

    $positions = [];
    if ($all_ads->have_posts()) {
        while ($all_ads->have_posts()) :
            $all_ads->the_post();
            $positions[] = new DFP_Ad_Position(get_the_ID());
        endwhile;
    }

    foreach ($positions as $key => $position) {
        if ($position->post_id == null) {
            unset($positions[$key]);
        }
    }

    wp_reset_query();

    return $positions;
}

/**
 * Returns DFP Ad Post
 *
 * Creates filter that allows a WP_Post object to be filtered before being returned.
 *
 * @since 0.0.1
 *
 * @param $id int
 *
 * @return null|DFP_Ad_position
 */
function dfp_get_ad_position($id)
{
    $position = apply_filters('get_dfp_ad_position', get_post($id));

    if ($position !== null && $position->post_type === 'dfp_ads') {

        return new DFP_Ad_Position($position->ID);
    } else {

        return false;
    }
}

/**
 * Returns DFP Ad Post by name
 *
 * Creates filter that allows a WP_Post object to be filtered before being returned.
 *
 * @since 0.0.1
 *
 * @param $title string
 *
 * @return null|DFP_Ad_position
 */
function dfp_get_ad_position_by_name($title)
{
    $position = apply_filters('get_dfp_ad_position', get_page_by_title($title, $output = 'OBJECT', $post_type = 'dfp_ads'));

    return ($position->post_type !== 'dfp_ads' ? false : new DFP_Ad_Position($position->ID));
}

/**
 * Applies filters and returns the inputs/Fields
 *
 * @since 0.0.1
 *
 * @return mixed|void
 */
function dfp_get_fields()
{

    return apply_filters(DFP_Ads_Post_Type::FIELDS_FILTER, []);
}

/**
 * Takes a string of sizes '300x250, 300x600' and returns array
 *
 * @since 0.0.1
 *
 * @param $size_string string
 *
 * @return array
 */
function dfp_get_ad_sizes($size_string)
{
    $sizes_array = [];
    // Check if there are any sizes to explode
    if (strlen($size_string) > 0) {
        $sizes = explode(',', $size_string);
    } else {
        return null;
    }

    if (count($sizes) > 1) {
        foreach ($sizes as $size) {

            if (strpos($size, 'x') !== false) {
                $sizes_array[] = explode('x', $size);
            } else {
                $sizes_array[] = $size;
            }
        }
    } else {
        if (strpos($sizes[0], 'x') !== false) {
            $sizes_array = explode('x', $sizes[0]);
        } else {
            $sizes_array[] = $sizes[0];
        }
    }

    // Trim array and eval everything into integers
    return dfp_intval_array(dfp_trim_array($sizes_array));
}

/**
 * Intvals an entire array recursively.
 *
 * @since 0.0.1
 *
 * @param array $array Input array
 *
 * @return array
 */
function dfp_intval_array($array)
{

    if ( ! is_array($array)) {

        if (is_numeric($array)) {
            return intval($array);
        }
        return $array;
    }

    return array_map('dfp_intval_array', $array);
}

/**
 * Trims an entire array recursively.
 *
 * It is suggested that you do not rely on this. It will disappear.
 *
 * @since       0.0.1
 *
 * @author      Jonas John
 * @version     0.2
 * @link        http://www.jonasjohn.de/snippets/php/trim-array.htm
 *
 * @param       array $input Input array
 *
 * @return array
 */
function dfp_trim_array($input)
{

    if ( ! is_array($input)) {

        return trim($input);
    }

    return array_map('dfp_trim_array', $input);
}

/**
 * Creates Shortcode Input Field
 *
 * @TODO  Add Labels
 *
 * @since 0.0.1
 *
 * @param $post_id int
 */
function dfp_ads_shortcode_field($post_id)
{
    ?>
    <input style="text-align:center;" type="text" readonly
           value="<?php printf(__('[dfp_ads id=%1s]', 'dfp-ads'), $post_id); ?>"/>
    <?php
}

/**
 * Uses Global Post
 *
 * @deprecated deprecated since version 0.3.1
 *
 * Will be phased out before version 0.4.0. Has been replaced with WordPress
 * core functionality instead.
 *
 * @since      0.0.1
 *
 * @return string
 */
function dfp_get_url()
{
    $pageURL = 'http';
    if (isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] == "on") {
        $pageURL .= "s";
    }
    $pageURL .= "://";
    if ($_SERVER["SERVER_PORT"] != "80") {
        $pageURL .= $_SERVER["SERVER_NAME"] . ":" . $_SERVER["SERVER_PORT"] . $_SERVER["REQUEST_URI"];
    } else {
        $pageURL .= $_SERVER["SERVER_NAME"] . $_SERVER["REQUEST_URI"];
    }

    return $pageURL;
}

/**
 * DFP Get Value
 *
 * Returns value from Admin
 *
 * @since 0.0.1
 *
 * @param $setting string Setting to return a value
 *
 * @return array|string|int|bool|null
 */
function dfp_get_settings_value($setting)
{
    $option_array = get_option('DFP_Ads_Settings');

    return (isset($option_array[$setting]) ? $option_array[$setting] : null);
}

/**
 * Creates Select Options for widget
 *
 * @since  0.2.0
 * @access public
 *
 * @param int|string $value Value
 */
function dfp_ad_select_options($value)
{
    echo '<option value="false">Select Position</option>';
    $positions = dfp_get_ad_positions();
    foreach ($positions as $position) {
        echo '<option' . selected($value, $position->post_id) . ' value="' . $position->post_id . '">(' . $position->post_id . ') ' . $position->title . '</option>';
    }
}


/**
 * Inline scripts
 *
 * @since  0.0.1
 * @access protected
 *
 * @return array|string
 */

function inline_dfp_header_scripts()
{

    $prebid = dfp_get_settings_value('dfp_header_bidding_prebid_enabled');
    $prebid_publisher_domain = dfp_get_settings_value('dfp_header_bidding_prebid_publisher_domain');
    $prebid_bidder_order_fixed = dfp_get_settings_value('dfp_header_bidding_prebid_bidder_order_fixed');
    $prebid_bidder_order = $prebid_bidder_order_fixed ? 'fixed' : 'random';
    $prebid_price_granularity = dfp_get_settings_value('dfp_header_bidding_prebid_price_granularity');
    if (! $prebid_price_granularity) { $prebid_price_granularity = "dense"; }



    $amazon = dfp_get_settings_value('dfp_header_bidding_amazon_enabled');
    $amazon_publisher_id = dfp_get_settings_value('dfp_header_bidding_amazon_publisher_id');
    $hb = $prebid || $amazon;

    echo '
    <!-- Google Publisher Tag -->

    <script async="async" src="https://www.googletagservices.com/tag/js/gpt.js"></script>

    <script>
    var googletag = googletag || {};
    googletag.cmd = googletag.cmd || [];

    window.dfp_ad_slot_objects = window.dfp_ad_slot_objects || [];
    window.dfp_ready_states = window.dfp_ready_states || {};
    window.dfp_ready_states["gpt"] = false;
    window.dfpAdsDebug = dfp_ad_object[0]["console_debugging"];

    ';
    if ($hb) {
        echo '
          googletag.cmd.push(function () {
            googletag.pubads().setTargeting("hb_active","true");
          });
        ';
    }
    echo ' </script>';

    if ($prebid) {
        echo '
            <!-- prebid.js main -->

            <script async="async" src="/wp-content/plugins/dfp-ads/assets/js/' . dfp_get_settings_value('dfp_header_bidding_prebid_version') . '"></script>
        ';


    }

    if ($amazon && $amazon_publisher_id) {
        echo '
        <script>
            !function(a9,a,p,s,t,A,g){if(a[a9])return;function q(c,r){a[a9]._Q.push([c,r])}a[a9]={init:function(){q("i",arguments)},fetchBids:function(){q("f",arguments)},setDisplayBids:function(){},targetingKeys:function(){return[]},_Q:[]};A=p.createElement(s);A.async=!0;A.src=t;g=p.getElementsByTagName(s)[0];g.parentNode.insertBefore(A,g)}("apstag",window,document,"script","//c.amazon-adsystem.com/aax2/apstag.js");

        </script>
        ';

    }


}

/**
 * Inline DFP footer scripts
 *
 * @since  0.0.1
 * @access protected
 *
 * @return array|string
 */

function inline_dfp_footer_scripts()
{
    $prebid = dfp_get_settings_value('dfp_header_bidding_prebid_enabled');
    $amazon = dfp_get_settings_value('dfp_header_bidding_amazon_enabled');
    $hb = $prebid || $amazon;
}


/**
 * Swap Size Mapping Array
 *
 * @TODO  Add Labels
 *
 * @since 0.0.1
 *
 * @param $array array
 */
function dfp_swap_size_mapping_array($array)
{
  $newarray = [];
  foreach ($array as $item) {
    $scratch = $item[0];
    $item[0] = $item[1];
    $item[1] = $scratch;
    array_push($newarray,$item);
  }
  return $newarray;
}


/**
 * Turn an array-based pixel dimension into a string
 *
 * @TODO  Add Labels
 *
 * @since 0.0.1
 *
 * @param $array array
 */
function dfp_pixels_to_string($array)
{
  return implode(",",$array);
}


/**
 * Turn a string pixel dimension into an array
 *
 * @TODO  Add Labels
 *
 * @since 0.0.1
 *
 * @param $array array
 */
function dfp_pixels_to_array($string)
{
    if (strpos($string, "x") && ! strpos($string, "[")) {
      $string = preg_replace("/,/","DELIM",$string);
      $string = preg_replace("/x/",",",$string);
      $string = preg_replace("/DELIM/",'],[',$string);
      $string = '[' . $string . ']';
    }
    if (substr_count($string, "[") < substr_count($string, ",") )  {
      $string = "[" . $string . "]";
    }
    return json_decode($string);
}
