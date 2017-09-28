(function () {
  'use strict';

  module.exports = angular.module('core.accountOrgService', [
    require('modules/core/config/urlConfig'),
    require('modules/core/scripts/services/authinfo'),
  ])
    .service('AccountOrgService', AccountOrgService)
    .name;

  /* @ngInject */
  function AccountOrgService($http, $q, UrlConfig) {
    var accountUrl = UrlConfig.getAdminServiceUrl();

    var FileShareControlType = {
      BLOCK_BOTH: 'BLOCK_BOTH',
      BLOCK_UPLOAD: 'BLOCK_UPLOAD',
      NONE: 'NONE',
    };

    var service = {
      getAccount: getAccount,
      getServices: getServices,
      addMessengerInterop: addMessengerInterop,
      deleteMessengerInterop: deleteMessengerInterop,
      addOrgCloudSipUri: addOrgCloudSipUri,
      addOrgDataRetentionPeriodDays: addOrgDataRetentionPeriodDays,
      modifyOrgDataRetentionPeriodDays: modifyOrgDataRetentionPeriodDays,
      deleteOrgSettings: deleteOrgSettings,
      getOrgSettings: getOrgSettings,
      getAppSecurity: getAppSecurity,
      setAppSecurity: setAppSecurity,
      getBlockExternalCommunication: getBlockExternalCommunication,
      setBlockExternalCommunication: setBlockExternalCommunication,
      getFileSharingControl: getFileSharingControl,
      setFileSharingControl: setFileSharingControl,
    };

    return service;

    //Url returns
    function getDeviceSettingsUrl(org) {
      var url = accountUrl + 'organizations/' + org + '/settings';

      return url;
    }

    function getServicesUrl(org) {
      var url = accountUrl + 'organizations/' + org + '/services';

      return url;
    }

    function getAccountSettingsUrl(org) {
      var url = accountUrl + 'organization/' + org + '/settings';

      return url;
    }

    function getAccount(org) {
      var url = accountUrl + 'organization/' + org + '/accounts';

      return $http.get(url);
    }

    function getServices(org, filter) {
      var url = getServicesUrl(org);
      if (!_.isUndefined(filter) && !_.isNull(filter)) {
        url += '?filter=' + filter;
      }

      return $http.get(url);
    }

    function addMessengerInterop(org) {
      var url = getServicesUrl(org) + '/messengerInterop';
      var request = {};

      return $http.post(url, request);
    }

    function deleteMessengerInterop(org) {
      var url = getServicesUrl(org) + '/messengerInterop';

      return $http.delete(url);
    }

    function addOrgCloudSipUri(org, cloudSipUri) {
      var url = getAccountSettingsUrl(org);
      var request = {
        id: org,
        settings: [{
          key: 'orgCloudSipUri',
          value: cloudSipUri + '.ciscospark.com',
        }],
      };

      return $http.put(url, request);
    }

    function addOrgDataRetentionPeriodDays(org, dataRetentionPeriodDays) {
      var url = getAccountSettingsUrl(org);
      var request = {
        id: org,
        settings: [{
          key: 'dataRetentionPeriodDays',
          value: dataRetentionPeriodDays,
        }],
      };

      return $http.put(url, request);
    }

    function modifyOrgDataRetentionPeriodDays(org, dataRetentionPeriodDays) {
      var url = getAccountSettingsUrl(org);
      var request = {
        id: org,
        settings: [{
          key: 'dataRetentionPeriodDays',
          value: dataRetentionPeriodDays,
        }],
      };

      return $http.patch(url, request);
    }

    function deleteOrgSettings(org) {
      var url = getAccountSettingsUrl(org) + '/' + org;

      return $http.delete(url);
    }

    function getOrgSettings(org) {
      var url = getAccountSettingsUrl(org) + '/' + org;

      return $http.get(url);
    }

    // Get the account App Security Status from the clientSecurityPolicy API(boolean)
    function getAppSecurity(org) {
      if (!org || org === '') {
        return $q.reject('A Valid organization ID must be Entered');
      }
      var url = getDeviceSettingsUrl(org) + '/clientSecurityPolicy';

      return $http.get(url);
    }

    // Sets the updated App Security Status to clientSecurityPolicy API on Save button event
    function setAppSecurity(org, appSecurityStatus) {
      if (!org || org === '') {
        return $q.reject('A Valid organization ID must be Entered');
      }

      var url = getDeviceSettingsUrl(org) + '/clientSecurityPolicy';

      return $http.put(url, {
        clientSecurityPolicy: appSecurityStatus,
      });
    }

    // Get block external communication from the blockExternalCommunications API(boolean)
    function getBlockExternalCommunication(org) {
      if (!org || org === '') {
        return $q.reject('A Valid organization ID must be Entered');
      }
      var url = getDeviceSettingsUrl(org) + '/blockExternalCommunications';

      return $http.get(url).then(function (response) {
        return _.get(response, 'data.blockExternalCommunications', false);
      });
    }

    // Sets block external communication to blockExternalCommunications API
    function setBlockExternalCommunication(org, blockExternalCommunication) {
      if (!org || org === '') {
        return $q.reject('A Valid organization ID must be Entered');
      }

      var url = getDeviceSettingsUrl(org) + '/blockExternalCommunications';

      return $http.put(url, {
        blockExternalCommunications: blockExternalCommunication,
      });
    }

    // Get FileSharingControl from the FileSharingControl API(boolean)
    function getFileSharingControl(org) {
      if (!org || org === '') {
        return $q.reject('A Valid organization ID must be Entered');
      }
      // TODO using hardcode first, wait for backend code
      var url = getDeviceSettingsUrl(org);
      return $http.get(url).then(function (response) {
        var fileSharingControl = {
          blockDesktopAppDownload: false,
          blockDesktopAppUpload: false,
          blockMobileAppDownload: false,
          blockMobileAppUpload: false,
          blockWebAppDownload: false,
          blockWebAppUpload: false,
          blockBotsDownload: false,
          blockBotsUpload: false,
        };
        var orgSettings = JSON.parse(response.data.orgSettings[0]);
        if (_.has(orgSettings, 'desktopFileShareControl')) {
          if (_.get(orgSettings, 'desktopFileShareControl') === FileShareControlType.BLOCK_BOTH) {
            fileSharingControl.blockDesktopAppDownload = true;
            fileSharingControl.blockDesktopAppUpload = true;
          } else if (_.get(orgSettings, 'desktopFileShareControl') === FileShareControlType.BLOCK_UPLOAD) {
            fileSharingControl.blockDesktopAppUpload = true;
          }
        }
        if (_.has(orgSettings, 'mobileFileShareControl')) {
          if (_.get(orgSettings, 'mobileFileShareControl') === FileShareControlType.BLOCK_BOTH) {
            fileSharingControl.blockMobileAppDownload = true;
            fileSharingControl.blockMobileAppUpload = true;
          } else if (_.get(orgSettings, 'mobileFileShareControl') === FileShareControlType.BLOCK_UPLOAD) {
            fileSharingControl.blockMobileAppUpload = true;
          }
        }
        if (_.has(orgSettings, 'webFileShareControl')) {
          if (_.get(orgSettings, 'webFileShareControl') === FileShareControlType.BLOCK_BOTH) {
            fileSharingControl.blockWebAppDownload = true;
            fileSharingControl.blockWebAppUpload = true;
          } else if (_.get(orgSettings, 'webFileShareControl') === FileShareControlType.BLOCK_UPLOAD) {
            fileSharingControl.blockWebAppUpload = true;
          }
        }
        if (_.has(orgSettings, 'botFileShareControl')) {
          if (_.get(orgSettings, 'botFileShareControl') === FileShareControlType.BLOCK_BOTH) {
            fileSharingControl.blockBotsDownload = true;
            fileSharingControl.blockBotsUpload = true;
          } else if (_.get(orgSettings, 'botFileShareControl') === FileShareControlType.BLOCK_UPLOAD) {
            fileSharingControl.blockBotsUpload = true;
          }
        }
        return fileSharingControl;
      });
    }

    // Sets FileSharingControl to fileSharingControl API
    function setFileSharingControl(org, fileSharingControl) {
      if (!org || org === '') {
        return $q.reject('A Valid organization ID must be Entered');
      }
      var fileSharingSetting = {};
      if (fileSharingControl.blockDesktopAppDownload && fileSharingControl.blockDesktopAppUpload) {
        fileSharingSetting.desktopFileShareControl = FileShareControlType.BLOCK_BOTH;
      } else if (fileSharingControl.blockDesktopAppUpload) {
        fileSharingSetting.desktopFileShareControl = FileShareControlType.BLOCK_UPLOAD;
      } else {
        fileSharingSetting.desktopFileShareControl = FileShareControlType.NONE;
      }

      if (fileSharingControl.blockMobileAppDownload && fileSharingControl.blockMobileAppUpload) {
        fileSharingSetting.mobileFileShareControl = FileShareControlType.BLOCK_BOTH;
      } else if (fileSharingControl.blockMobileAppUpload) {
        fileSharingSetting.mobileFileShareControl = FileShareControlType.BLOCK_UPLOAD;
      } else {
        fileSharingSetting.mobileFileShareControl = FileShareControlType.NONE;
      }

      if (fileSharingControl.blockWebAppDownload && fileSharingControl.blockWebAppUpload) {
        fileSharingSetting.webFileShareControl = FileShareControlType.BLOCK_BOTH;
      } else if (fileSharingControl.blockWebAppUpload) {
        fileSharingSetting.webFileShareControl = FileShareControlType.BLOCK_UPLOAD;
      } else {
        fileSharingSetting.webFileShareControl = FileShareControlType.NONE;
      }

      if (fileSharingControl.blockBotsDownload && fileSharingControl.blockBotsUpload) {
        fileSharingSetting.botFileShareControl = FileShareControlType.BLOCK_BOTH;
      } else if (fileSharingControl.blockBotsUpload) {
        fileSharingSetting.botFileShareControl = FileShareControlType.BLOCK_UPLOAD;
      } else {
        fileSharingSetting.botFileShareControl = FileShareControlType.NONE;
      }

      var url = getDeviceSettingsUrl(org);
      return $http.patch(url, fileSharingSetting);
    }
  }
})();
