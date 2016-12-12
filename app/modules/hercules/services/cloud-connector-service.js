(function () {
  'use strict';

  angular
    .module('Hercules')
    .factory('CloudConnectorService', CloudConnectorService);

  function CloudConnectorService($q, $timeout, Authinfo) {
    var serviceAccountId = 'google@example.org'; // dummy value for now
    var isGoogleCalendarSetup = true;

    return {
      updateConfig: updateConfig,
      deactivateService: deactivateService,
      getServiceAccount: getServiceAccount,
      getService: getService,
      getStatusCss: getStatusCss
    };

    function extractDataFromResponse(res) {
      return res.data;
    }

    function getService(serviceId/*, orgId */) {
      // Make sure you use the orgId (orgId || Authinfo.getOrgId) when the real API is called
      return $q.resolve({ provisioned: isGoogleCalendarSetup, status: 'OK', serviceAccountId: serviceAccountId })
        .then(function (service) {
          // Align this with the FusionClusterService.getServiceStatus() to make the UI handling simpler
          service.status = translateStatus(service);
          service.statusCss = getStatusCss(service);
          service.serviceId = serviceId;
          service.setup = service.provisioned;
          return service;
        });
    }

    function getServiceAccount(serviceId) {
      return $q(function (resolve, reject) {
        if (serviceId === 'squared-fusion-gcal' && Authinfo.isFusionGoogleCal()) {
          resolve(serviceAccountId);
        } else {
          reject();
        }
      });
    }

    function updateConfig(newServiceAccountId, privateKey, serviceId) {
      return $q(function (resolve, reject) {
        if (serviceId === 'squared-fusion-gcal' && Authinfo.isFusionGoogleCal()) {
          isGoogleCalendarSetup = true;
          $timeout(function () {
            serviceAccountId = newServiceAccountId;
            resolve(extractDataFromResponse({
              data: {},
              status: 200
            }));
          }, 1000);
        } else {
          $timeout(function () {
            reject({
              data: {
                message: 'Not implemented yet!',
                errors: {
                  description: 'API not found!'
                },
                trackingId: 'ATLAS_08193b4d-3061-0cd4-3f2c-96117f019146_15'
              },
              status: 501
            });
          }, 2000);
        }
      });
    }

    function deactivateService(serviceId) {
      return $q(function (resolve, reject) {
        if (serviceId === 'squared-fusion-gcal' && Authinfo.isFusionGoogleCal()) {
          $timeout(function () {
            isGoogleCalendarSetup = false;
            resolve(extractDataFromResponse({
              data: {},
              status: 200
            }));
          }, 300);
        } else {
          $timeout(function () {
            reject({
              data: {
                message: 'Not implemented yet!',
                errors: {
                  description: 'API not found!'
                },
                trackingId: 'ATLAS_08193b4d-3061-0cd4-3f2c-96117f019146_15'
              },
              status: 501
            });
          }, 1000);

        }
      });
    }

    function getStatusCss(service) {
      if (!service || !service.provisioned || !service.status) {
        return 'default';
      }
      switch (service.status.toLowerCase()) {
        case 'ok':
          return 'success';
        case 'error':
          return 'danger';
        case 'warn':
          return 'warning';
        default:
          return 'default';
      }
    }

    function translateStatus(service) {
      if (!service || !service.provisioned || !service.status) {
        return 'setupNotComplete';
      }
      switch (service.status.toLowerCase()) {
        case 'ok':
          return 'operational';
        case 'error':
          return 'outage';
        case 'warn':
          return 'impaired';
        default:
          return 'unknown';
      }
    }
  }

})();
