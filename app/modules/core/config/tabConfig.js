(function () {
  'use strict';

  var tabs = [{
    tab: 'overviewTab',
    icon: 'icon-home',
    title: 'tabs.overviewTab',
    state: 'overview',
    link: '/overview',
  }, {
    tab: 'overviewTab',
    icon: 'icon-home',
    title: 'tabs.overviewTab',
    state: 'partneroverview',
    link: '/partner/overview',
  }, {
    tab: 'gssTab',
    icon: 'icon-bell',
    title: 'tabs.gssTab',
    desc: 'tabs.gssTabDesc',
    state: 'gss',
    link: '/gss',
  }, {
    tab: 'customerTab',
    icon: 'icon-user',
    title: 'tabs.customerTab',
    state: 'partnercustomers',
    link: '/partner/customers',
  }, {
    tab: 'userTab',
    icon: 'icon-user',
    title: 'tabs.userTab',
    state: 'users',
    link: '/users',
  }, {
    tab: 'placeTab',
    icon: 'icon-location',
    title: 'tabs.placeTab',
    state: 'places',
    link: '/places',
  }, {
    tab: 'servicesTab',
    icon: 'icon-cloud',
    title: 'tabs.servicesTab',
    state: 'services-overview',
    link: 'services',
  }, {
    tab: 'partnerServicesTab',
    icon: 'icon-cloud',
    title: 'tabs.servicesTab',
    state: 'partner-services-overview',
    feature: ['atlas-hosted-cloud-service', 'gem-services-tab'],
    link: '/partner/services-overview',
  }, {
    tab: 'deviceTab',
    icon: 'icon-devices',
    title: 'tabs.deviceTab',
    state: 'devices',
    link: '/devices',
  }, {
    tab: 'reportTab',
    icon: 'icon-bars',
    title: 'tabs.reportTab',
    state: 'reports',
    link: '/reports',
  }, {
    tab: 'reportTab',
    icon: 'icon-bars',
    title: 'tabs.reportTab',
    state: 'partnerreports',
    link: '/partner/reports',
    feature: ['cca-reports', 'atlas-partner-webex-reports', 'atlas-partner-spark-reports'],
  }, {
    tab: 'taasOverviewTab',
    icon: 'icon-outline',
    title: 'tabs.taasOverviewTab',
    state: 'taas',
    link: '/partner/taas',
  }, {
    tab: 'troubleshootingTab',
    icon: 'icon-support',
    title: 'tabs.troubleshootingTab',
    link: '/support/meeting',
    state: 'support.meeting',
  }, {
    tab: 'settingsTab',
    icon: 'icon-settings',
    title: 'tabs.settingsTab',
    state: 'settings',
    link: '/settings',
  }, {
    tab: 'organizationTab',
    icon: 'icon-admin',
    title: 'tabs.organizationTab',
    state: 'organizations',
    link: '/organizations',
  }, {
    // DEPRECATED - REPLACE WITH FEATURE TOGGLES - DO NOT ADD MORE PAGES UNDER developmentTab
    tab: 'developmentTab',
    icon: 'icon-tools',
    title: 'tabs.developmentTab',
    hideProd: true,
    subPages: [
      {
        title: 'tabs.metricsDetailsTab',
        //desc: 'tabs.metricsDetailsTabDesc',
        state: 'media-service-v2',
        link: '#mediaserviceV2',
      }, {
        title: 'tabs.editFeatureToggles',
        state: 'edit-featuretoggles',
        link: '#editfeaturetoggles',
      }],
  }];

  var tabsControlHub = [{
    tab: 'overviewTab',
    icon: 'icon-home-active',
    title: 'tabs.overviewTab',
    state: 'overview',
    link: '/overview',
    iconClass: 'icon-outline',
  }, {
    tab: 'overviewTab',
    icon: 'icon-home-active',
    title: 'tabs.overviewTab',
    state: 'partneroverview',
    link: '/partner/overview',
    iconClass: 'icon-outline',
  }, {
    tab: 'gssTab',
    icon: 'icon-bell',
    title: 'tabs.gssTab',
    desc: 'tabs.gssTabDesc',
    state: 'gss',
    link: '/gss',
  }, {
    tab: 'customerTab',
    icon: 'icon-company-active',
    title: 'tabs.customerTab',
    state: 'partnercustomers',
    link: '/partner/customers',
    iconClass: 'icon-outline',
  }, {
    tab: 'userTab',
    icon: 'icon-people-active',
    title: 'tabs.userTab',
    state: 'users',
    link: '/users',
    iconClass: 'icon-outline',
  }, {
    tab: 'placeTab',
    icon: 'icon-location-active',
    title: 'tabs.placeTab',
    state: 'places',
    link: '/places',
    iconClass: 'icon-outline',
  }, {
    tab: 'servicesTab',
    icon: 'icon-cloud-active',
    title: 'tabs.servicesTab',
    state: 'services-overview',
    link: 'services',
    iconClass: 'icon-outline',
  }, {
    tab: 'partnerServicesTab',
    icon: 'icon-cloud',
    title: 'tabs.servicesTab',
    state: 'partner-services-overview',
    feature: ['atlas-hosted-cloud-service', 'gem-services-tab'],
    link: '/partner/services-overview',
  }, {
    tab: 'deviceTab',
    icon: 'icon-endpoint-active',
    title: 'tabs.deviceTab',
    state: 'devices',
    link: '/devices',
    iconClass: 'icon-outline',
  }, {
    tab: 'reportTab',
    icon: 'icon-analysis-active',
    title: 'tabs.reportTab',
    state: 'reports',
    link: '/reports',
    iconClass: 'icon-outline',
  }, {
    tab: 'reportTab',
    icon: 'icon-analysis-active',
    title: 'tabs.reportTab',
    state: 'partnerreports',
    link: '/partner/reports',
    feature: ['cca-reports', 'atlas-partner-webex-reports', 'atlas-partner-spark-reports'],
    iconClass: 'icon-outline',
  }, {
    tab: 'troubleshootingTab',
    icon: 'icon-support',
    title: 'tabs.troubleshootingTab',
    state: 'partnertroubleshooting.diagnostics',
    link: '/partner/troubleshooting',
    feature: ['diagnostic-partner-f8193-troubleshooting'],
    iconClass: 'icon-outline',
  }, {
    tab: 'supportTab',
    icon: 'icon-diagnostics-active',
    title: 'tabs.troubleshootingTab',
    link: '/support/meeting',
    state: 'support.meeting',
    iconClass: 'icon-outline',
  }, {
    tab: 'settingsTab',
    icon: 'icon-settings-active',
    title: 'tabs.settingsTab',
    state: 'settings',
    link: '/settings',
    iconClass: 'icon-outline',
  }, {
    tab: 'organizationTab',
    icon: 'icon-admin',
    title: 'tabs.organizationTab',
    state: 'organizations',
    link: '/organizations',
  }, {
    // DEPRECATED - REPLACE WITH FEATURE TOGGLES - DO NOT ADD MORE PAGES UNDER developmentTab
    tab: 'developmentTab',
    icon: 'icon-tools-active',
    title: 'tabs.developmentTab',
    hideProd: true,
    subPages: [
      {
        title: 'tabs.metricsDetailsTab',
        //desc: 'tabs.metricsDetailsTabDesc',
        state: 'media-service-v2',
        link: '#mediaserviceV2',
      }, {
        title: 'tabs.editFeatureToggles',
        state: 'edit-featuretoggles',
        link: '#editfeaturetoggles',
      }],
    iconClass: 'icon-outline',
  }];

  module.exports = angular
    .module('core.tabconfig', [])
    .value('tabConfig', tabs)
    .value('tabConfigControlHub', tabsControlHub)
    .name;
}());
