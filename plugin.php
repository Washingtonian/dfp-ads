<?php
/**
 * DFP Ad Manager Bootstrap File
 *
 * @wordpress-plugin
 * Plugin Name:       DFP - DoubleClick Ad Manager
 * Plugin URI:        http://www.chriswgerber.com/dfp-ads/
 * Description:       Manages ad code for DoubleClick for Publishers
 * Author:            Chris W. Gerber
 * Author URI:        http://www.chriswgerber.com/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       dfp-ads
 * Github Plugin URI: https://github.com/ThatGerber/dfp-ads
 * GitHub Branch:     stable
 * Version:           0.3.2
 *
 * The Plugin File
 *
 * @link              http://www.chriswgerber.com/dfp-ads
 * @since             0.0.1
 * @subpackage        DFP-Ads
 */
/* Autoload */
require_once 'vendor/autoload.php';
/* Includes */
include 'includes/Functions.php';
include 'includes/Globals_Container.php';
include 'includes/DFP_Ads.php';
include 'includes/Post_Type.php';
include 'includes/Position.php';
include 'includes/admin/Form.php';
include 'includes/admin/Input.php';
include 'includes/admin/Settings_Form.php';
include 'includes/admin/Import_Form.php';
include 'includes/admin/Admin.php';
include 'widget/widget.ad_position.php';

/* Namespaces */
use DFP_Ads\Admin as DFP_Ads_Admin;
use DFP_Ads\Admin\Import_Form as DFP_Ads_Import_Form;
use DFP_Ads\Admin\Input as DFP_Ads_Input;
use DFP_Ads\Admin\Settings_Form as DFP_Ads_Settings_Form;
use DFP_Ads\DFP_Ads as DFP_Ads;
use DFP_Ads\Post_Type as DFP_Ads_Post_Type;

if ( ! defined('DFP_CONCAT_SCRIPTS')) {
	define('DFP_CONCAT_SCRIPTS', true);
}
/*
 * Initialization for Post Type
 */
$dfp_post_type = new DFP_Ads_Post_Type();
add_action('init', [$dfp_post_type, 'create_post_type'], 0, 0);
add_action('add_meta_boxes', [$dfp_post_type, 'add_meta_boxes'], 10, 2);
add_action("save_post_{$dfp_post_type->name}", [$dfp_post_type, 'save_meta_box'], 10, 2);
add_action('dfp_ads_fields', [$dfp_post_type, 'add_inputs']);
/* Custom Columns */
add_filter("manage_{$dfp_post_type->name}_posts_columns", [$dfp_post_type, 'add_shortcode_column']);
add_action("manage_{$dfp_post_type->name}_posts_custom_column", [$dfp_post_type, 'shortcode_column_value'], 10, 1);
// Ads Shortcode Reference
add_action('dfp_ads_metabox_top', [$dfp_post_type, 'ad_position_shortcode']);
// Creates the settings table
add_action('dfp_ads_metabox_middle', [$dfp_post_type, 'settings_table'], 9);
/* Begin creating the new ads objects */
$dfp_ads          = new DFP_Ads();
$dfp_ads->dir_uri = plugins_url(null, __FILE__);
$dfp_ads->set_account_id(dfp_get_settings_value('dfp_property_code'));
$dfp_ads->set_asynchronous_loading(dfp_get_settings_value('dfp_synchronous_tags'));
$dfp_ads->set_console_debugging(dfp_get_settings_value('dfp_console_debugging'));
$dfp_ads->set_lazy_load(dfp_get_settings_value('dfp_lazy_load'));
$dfp_ads->set_header_bidding_prebid(dfp_get_settings_value('dfp_header_bidding_prebid_enabled'));
$dfp_ads->set_header_bidding_prebid_timeout(dfp_get_settings_value('dfp_header_bidding_prebid_timeout'));
$dfp_ads->set_header_bidding_prebid_publisher_domain(dfp_get_settings_value('dfp_header_bidding_prebid_publisher_domain'));
$dfp_ads->set_header_bidding_prebid_bidder_order_fixed(dfp_get_settings_value('dfp_header_bidding_prebid_bidder_order_fixed'));
$dfp_ads->set_header_bidding_prebid_price_granularity(dfp_get_settings_value('dfp_header_bidding_prebid_price_granularity'));
$dfp_ads->set_header_bidding_prebid_size_config(dfp_get_settings_value('dfp_header_bidding_prebid_size_config'));
$dfp_ads->set_header_bidding_prebid_version(dfp_get_settings_value('dfp_header_bidding_prebid_version'));
$dfp_ads->set_header_bidding_amazon(dfp_get_settings_value('dfp_header_bidding_amazon_enabled'));
$dfp_ads->set_header_bidding_amazon_publisher_id(dfp_get_settings_value('dfp_header_bidding_amazon_publisher_id'));
$dfp_ads->set_header_bidding_amazon_timeout(dfp_get_settings_value('dfp_header_bidding_amazon_timeout'));

/*
 * Enqueues the styles and scripts into WordPress. When this action runs
 * it also will grab all of the positions and other filtered in information
 */
add_action('wp_enqueue_scripts', [$dfp_ads, 'scripts_and_styles'], 100);
/* Sets Menu Position. Default 20 */
add_filter('dfp_ads_menu_position', (function ($pos) {
	return 79;
}), 10);
/*
 * Adds input fields to the DFP_Ads post type.
 *
 * Any number can be added at any time, they must have the array keys listed
 * below.
 *
 * @see DFP_Ads_Input
 *
 * Mandatory values
 * array(
 *     'id'    => '',
 *     'type'  => '',
 *     'name'  => '',
 *     'label' => '',
 *     'value' => ''
 * )
 *
 */
add_filter(DFP_Ads_Post_Type::FIELDS_FILTER, (function ($fields) {
	// Ad Code
	$fields[] = new DFP_Ads_Input([
			'id'    => 'dfp_ad_code', // Input ID
			'type'  => 'text',        // Type of Input
			'name'  => 'dfp_ad_code', // Name of Input
			'label' => 'Code',        // Label / Setting Name
			'value' => '',            // Value for the field
		]);
	// Ad Position Name
	$fields[] = new DFP_Ads_Input([
			'id'    => 'dfp_position_name',
			'type'  => 'text',
			'name'  => 'dfp_position_name',
			'label' => 'Name',
			'value' => '',
		]);
	// Sizes
	$fields[] = new DFP_Ads_Input([
			'id'    => 'dfp_position_sizes',
			'type'  => 'textarea',
			'name'  => 'dfp_position_sizes',
			'label' => 'Ad Sizes',
			'value' => '',
		]);
	// Out of Page
	$fields[] = new DFP_Ads_Input([
			'id'    => 'dfp_out_of_page',
			'type'  => 'checkbox',
			'name'  => 'dfp_out_of_page',
			'label' => 'Out of Page Slot',
			'value' => '',
		]);

	return $fields;
}), 10);
/**
 * This filter is run before the ad positions are sent to javascript. It is
 * the time when additional data can be dumped in and sent to front-end scripts.
 *
 * Use it to filter in additional custom positions, targetting data, etc.
 */
add_filter('pre_dfp_ads_to_js', [$dfp_ads, 'send_ads_to_js'], 1);

/**
 * This filter is run before the header bidding details are sent to javascript. It is
 * the time when additional data can be dumped in and sent to front-end scripts.
 *
 * Use it to filter in additional custom positions, targetting data, etc.
 */
add_filter('pre_dfp_header_bidding_prebid_to_js', [$dfp_ads, 'send_header_bidding_prebid_to_js'], 1);
add_filter('pre_dfp_header_bidding_prebid_1x_to_js', [$dfp_ads, 'send_header_bidding_prebid_1x_to_js'], 1);

add_filter('pre_dfp_header_bidding_amazon_to_js', [$dfp_ads, 'send_header_bidding_amazon_to_js'], 1);


/* Settings/Import Page */
if (is_admin()) {
	/* Section headings */
	add_filter('dfp_ads_settings_sections', (function ($sections) {
		$sections['general_settings'] = [
			'id'    => 'general_settings',
			'title' => 'General Settings',
		];
		$sections['header_bidding_prebid'] = [
			'id'    => 'header_bidding_prebid',
			'title' => 'Header Bidding: Prebid.js',
		];
		$sections['header_bidding_amazon'] = [
			'id'    => 'header_bidding_amazon',
			'title' => 'Header Bidding: Amazon UAM',
		];

		return $sections;
	}));
	/* Section Fields */
	add_filter('dfp_ads_settings_fields', (function ($fields) {
		$fields['dfp_property_code']    = [
			'id'          => 'dfp_property_code',
			'field'       => 'text',
			'callback'    => 'text',
			'title'       => 'DFP Property Code',
			'section'     => 'general_settings',
			'description' => 'Enter your DoubleClick for Publishers Property Code.',
		];
		$fields['dfp_synchronous_tags'] = [
			'id'          => 'dfp_synchronous_tags',
			'field'       => 'checkbox',
			'callback'    => 'checkbox',
			'title'       => 'Use Synchronous Ad Tags',
			'section'     => 'general_settings',
			'description' => '<em>DFP Ad Manager uses asynchronous tags by default. Choose this option if
								your site is unable to support DoubleClick\'s asynchronous tags</em>',
		];
		$fields['dfp_console_debugging'] = [
			'id'          => 'dfp_console_debugging',
			'field'       => 'checkbox',
			'callback'    => 'checkbox',
			'title'       => 'Use Console Debugging',
			'section'     => 'general_settings',
			'description' => '<em>Show detailed debugging information in the JavaScript console for all visitors.</em>',
		];
		$fields['dfp_lazy_load'] = [
			'id'          => 'dfp_lazy_load',
			'field'       => 'checkbox',
			'callback'    => 'checkbox',
			'title'       => 'Use Lazy Load',
			'section'     => 'general_settings',
			'description' => "<em>Don't load ads until they approach the viewport.</em>",
		];
		$fields['dfp_header_bidding_prebid_enabled'] = [
			'id'          => 'dfp_header_bidding_prebid_enabled',
			'field'       => 'checkbox',
			'callback'    => 'checkbox',
			'title'       => 'Use Header Bidding (prebid.js)',
			'section'     => 'header_bidding_prebid',
			'description' => '<em>Enable header bidding through prebid.js</em>',
		];
		$fields['dfp_header_bidding_prebid_timeout']    = [
			'id'          => 'dfp_header_bidding_prebid_timeout',
			'field'       => 'text',
			'callback'    => 'text',
			'title'       => 'Prebid Timeout',
			'section'     => 'header_bidding_prebid',
			'description' => 'Enter your desired Prebid.js timeout. Defaults to 1000ms (1 second).',
		];
		$fields['dfp_header_bidding_prebid_publisher_domain']    = [
			'id'          => 'dfp_header_bidding_prebid_publisher_domain',
			'field'       => 'text',
			'callback'    => 'text',
			'title'       => 'Prebid Publisher Domain',
			'section'     => 'header_bidding_prebid',
			'description' => 'Enter your publisher domain for SafeFrame ads.',
		];
		$fields['dfp_header_bidding_prebid_bidder_order_fixed']    = [
			'id'          => 'dfp_header_bidding_prebid_bidder_order_fixed',
			'field'       => 'text',
			'callback'    => 'text',
			'title'       => 'Use Fixed Bidder Order',
			'section'     => 'header_bidding_prebid',
			'description' => 'In Prebid 1.0+, the default is to randomize the bidder order. Choose this to use the exact order you specify instead.',
		];
		$fields['dfp_header_bidding_prebid_price_granularity']    = [
			'id'          => 'dfp_header_bidding_prebid_price_granularity',
			'field'       => 'text',
			'callback'    => 'text',
			'title'       => 'Price Granularity',
			'section'     => 'header_bidding_prebid',
			'description' => 'Enter one of these: low, med, high, dense, auto. Needs to match the line items you created in DFP.',
		];
		$fields['dfp_header_bidding_prebid_size_config']    = [
			'id'          => 'dfp_header_bidding_prebid_size_config',
			'field'       => 'textarea',
			'callback'    => 'textarea',
			'title'       => 'Prebid 1.x+ Sizes Configuration',
			'section'     => 'header_bidding_prebid',
			'description' => 'Paste in a JSON size config <a href="http://prebid.org/dev-docs/prebid-1.0-API.html#size-mapping-changes" target="_blank">like the one here.</a>',
		];
		$fields['dfp_header_bidding_prebid_version']    = [
			'id'          => 'dfp_header_bidding_prebid_version',
			'field'       => 'version_dropdown',
			'callback'    => 'version_dropdown',
			'title'       => 'Enabled Prebid Version',
			'section'     => 'header_bidding_prebid',
			'description' => 'Choose which Prebid JS file to use.',
		];
		$fields['dfp_header_bidding_amazon_enabled'] = [
			'id'          => 'dfp_header_bidding_amazon_enabled',
			'field'       => 'checkbox',
			'callback'    => 'checkbox',
			'title'       => 'Use Header Bidding (Amazon UAM)',
			'section'     => 'header_bidding_amazon',
			'description' => '<em>Enable header bidding through Amazon UAM</em>',
		];
		$fields['dfp_header_bidding_amazon_publisher_id']    = [
			'id'          => 'dfp_header_bidding_amazon_publisher_id',
			'field'       => 'text',
			'callback'    => 'text',
			'title'       => 'Amazon UAM Publisher ID',
			'section'     => 'header_bidding_amazon',
			'description' => 'Enter your Amazon UAM publisher ID. Required for Amazon UAM',
		];
		$fields['dfp_header_bidding_amazon_timeout']    = [
			'id'          => 'dfp_header_bidding_amazon_timeout',
			'field'       => 'text',
			'callback'    => 'text',
			'title'       => 'Amazon UAM Timeout',
			'section'     => 'header_bidding_amazon',
			'description' => 'Enter your desired Amazon UAM timeout. Defaults to 1000ms (1 second).',
		];
		return $fields;
	}));
	// Settings Page
	$ad_form               = new DFP_Ads_Settings_Form;
	$ad_admin              = new DFP_Ads_Admin($ad_form);
	$ad_admin->menu_title  = 'Settings';
	$ad_admin->plugin_slug = 'settings';
	$ad_admin->options_str = 'DFP_Ads_Settings';
	$ad_admin->options_grp = 'DFP_Ads_Settings_group';
	$ad_admin->page_title  = 'Ad Manager Settings';
	$ad_admin->user_cap    = 'manage_options';
	$ad_admin->post_type   = $dfp_post_type->name;
	add_action('admin_menu', [$ad_admin, 'register_menu_page']);
	add_action('admin_init', [$ad_admin, 'menu_page_init']);
	/*
	 * Import Page
	 */
	add_filter('dfp_ads_import_sections', (function ($sections) {
		$sections['import_data'] = [
			'id'    => 'import_data',
			'title' => 'Import from CSV',
		];

		return $sections;
	}));
	add_filter('dfp_ads_import_fields', (function ($fields) {
		$fields['file_import'] = [
			'id'          => 'import_csv',
			'field'       => 'file',
			'callback'    => 'file',
			'title'       => 'Import CSV from DFP',
			'section'     => 'import_data',
			'description' => 'Upload a CSV File directly from DoubleClick for Publishers',
		];

		return $fields;
	}));
	$import_form           = new DFP_Ads_Import_Form;
	$ad_admin              = new DFP_Ads_Admin($import_form);
	$ad_admin->menu_title  = 'Import';
	$ad_admin->plugin_slug = 'import';
	$ad_admin->options_str = 'DFP_Ads_Import';
	$ad_admin->options_grp = 'DFP_Ads_Import_group';
	$ad_admin->page_title  = 'Import Positions';
	$ad_admin->user_cap    = 'manage_options';
	$ad_admin->post_type   = $dfp_post_type->name;
	add_action('admin_menu', [$ad_admin, 'register_menu_page']);
	add_action('admin_init', [$ad_admin, 'menu_page_init']);
}
/*
 * Widget
 */
add_action('widgets_init', (function ($fields) {
	register_widget("DFP_Ads_Widget");
}));
