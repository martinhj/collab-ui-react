(function () {
  'use strict';

  angular.module('WebExSiteSettings').controller('WebExSiteSettingsCtrl', [
    '$scope',
    '$rootScope',
    '$log',
    '$translate',
    '$filter',
    '$state',
    '$stateParams',
    'WebExSiteSettingsFact',
    'Notification',
    function (
      $scope,
      $rootScope,
      $log,
      $translate,
      $filter,
      $state,
      $stateParams,
      WebExSiteSettingsFact,
      Notification
    ) {

      this.siteSettingsObj = WebExSiteSettingsFact.getSiteSettingsObj();
      this.siteSettingsObj = WebExSiteSettingsFact.initSiteSettingsObj();
    }
  ]);
})();
