'use strict';

angular.module('Squared')
  .service('SpacesService', ['$rootScope', '$http', 'Storage', 'Config', 'Log', 'Auth', 'Authinfo',
    function ($rootScope, $http, Storage, Config, Log, Auth, Authinfo) {

      var deviceUrl = Config.getAdminServiceUrl() + 'organization/' + Authinfo.getOrgId() + '/devices';

      return {
        listDevices: function (callback) {
          $http.get(deviceUrl)
            .success(function (data, status) {
              data.success = true;
              callback(data, status);
            })
            .error(function (data, status) {
              data.success = false;
              data.status = status;
              callback(data, status);
            });
        },

        addDevice: function (newDeviceName, callback) {
          var deviceData = {
            'name': newDeviceName
          };

          if (deviceData.name.length > 0) {
            $http.post(deviceUrl, deviceData)
              .success(function (data, status) {
                data.success = true;
                callback(data, status);
              })
              .error(function (data, status) {
                data.success = false;
                data.status = status;
                callback(data, status);
              });
          } else {
            callback('No valid device entered.');
          }

        },

        deleteDevice: function (deviceUuid, callback) {

          if ((deviceUuid !== null) && (deviceUuid.length > 0)) {
            var deleteUrl = deviceUrl + '/' + deviceUuid;
            $http.delete(deleteUrl)
              .success(function (data, status) {
                data.success = true;
                callback(data, status);
              })
              .error(function (data, status) {
                data.success = false;
                data.status = status;
                callback(data, status);
              });
          } else {
            callback('No valid device available to delete.');
          }

        }
      };
    }
  ]);
