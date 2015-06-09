'use strict';

/* global $ */

angular.module('Core')
  .controller('OrganizationOverviewCtrl', ['$rootScope', '$scope', '$state', '$location', 'Storage', 'Log', '$filter', 'Orgservice', 'Authinfo', 'UserListService', 'Notification', '$dialogs',
    function ($rootScope, $scope, $state, $location, Storage, Log, $filter, Orgservice, Authinfo, UserListService, Notification, $dialogs) {

      $scope.orgName = Authinfo.getOrgName();

      var getorgInfo = function () {
        Orgservice.getOrg(function (data, status) {
          if (data.success) {
            $scope.org = data;
            if (data.services) {
              $scope.svcs = data.services;
            }

          } else {
            Log.debug('Get existing org failed. Status: ' + status);
          }
        });
      };

      getorgInfo();

      //Making sure the search field is cleared
      $('#search-input').val('');

      //A div used to cover the export button when it's disabled.
      $('#btncover').hide();

      $scope.exportBtn = {
        title: $filter('translate')('organizationsPage.exportBtn'),
        disabled: false
      };

      if ($rootScope.exporting === true) {
        $scope.exportBtn.title = $filter('translate')('organizationsPage.loadingMsg');
        $scope.exportBtn.disabled = true;
        $('#btncover').show();
      }

      $scope.$on('EXPORT_FINISHED', function () {
        $scope.exportBtn.disabled = false;
      });

      $scope.exportCSV = function () {
        var promise = UserListService.exportCSV($scope);
        promise.then(null, function (error) {
          Notification.notify(Array.new(error), 'error');
        });

        return promise;
      };

      $scope.$on('AuthinfoUpdated', function () {
        getorgInfo();
      });

      $scope.resetOrg = function () {
        getorgInfo();
      };

      $scope.enableSSO = function () {
        var dlg = $dialogs.create('modules/core/organizations/organizationOverview/setupsso.html', 'setupSSODialogCtrl');
        dlg.result.then(function () {

        });
      };

      $scope.popupDirsync = function () {
        var dlg = $dialogs.create('modules/core/organizations/organizationOverview/setupdirsync.html', 'setupDirSyncDialogCtrl');
        dlg.result.then(function () {

        });
      };

      $scope.openAddOrganizationModal = function () {
        $state.go('organizationAdd.info').then(function () {
          $state.modal.result.then(function () {
          });
        });
      };
    }
  ]);
