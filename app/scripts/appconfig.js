'use strict';
angular
  .module('wx2AdminWebClientApp')
  .config(['$httpProvider', '$stateProvider', '$urlRouterProvider', '$translateProvider',
    function ($httpProvider, $stateProvider, $urlRouterProvider, $translateProvider) {
      $urlRouterProvider.otherwise('login');
      $stateProvider
        .state('login', {
          url: '/login',
          views: {
            'main@': {
              templateUrl: 'modules/core/login/login.tpl.html',
              controller: 'LoginCtrl'
            }
          },
          authenticate: false
        })
        .state('main', {
          views: {
            'main@': {
              templateUrl: 'modules/core/views/main.tpl.html'
            }
          },
          abstract: true,
          sticky: true
        })
        .state('partner', {
          template: '<div ui-view></div>',
          url: '/partner',
          parent: 'main',
          abstract: true
        })
        .state('unauthorized', {
          url: '/unauthorized',
          templateUrl: 'modules/squared/views/unauthorized.html',
          parent: 'main'
        });

      $httpProvider.interceptors.push('TrackingIDInterceptor');
      $httpProvider.responseInterceptors.push('ResponseInterceptor');

      $translateProvider.useStaticFilesLoader({
        prefix: 'l10n/',
        suffix: '.json'
      });

      $translateProvider.addInterpolation('$translateMessageFormatInterpolation');

      //Tell the module what language to use by default
      $translateProvider.preferredLanguage('en_US');
    }
  ]);

angular
  .module('Squared')
  .config(['$urlRouterProvider', '$stateProvider',
    function ($urlRouterProvider, $stateProvider) {

      // Modal States Enter and Exit functions
      function modalOnEnter(size) {
        /* @ngInject */
        return function ($modal, $state, $previousState) {
          $previousState.memo(modalMemo);
          $state.modal = $modal.open({
            template: '<div ui-view="modal"></div>',
            size: size
          });
          $state.modal.result.finally(function () {
            $state.modal = null;
            var previousState = $previousState.get(modalMemo);
            if (previousState) {
              return $previousState.go(modalMemo);
            }
          });
        }
      };

      modalOnExit.$inject = ['$state', '$previousState'];

      function modalOnExit($state, $previousState) {
        if ($state.modal) {
          $previousState.forget(modalMemo);
          $state.modal.close();
        }
      };

      var modalMemo = 'modalMemo';
      var wizardmodalMemo = 'wizardmodalMemo';

      $stateProvider
        .state('activate', {
          url: '/activate',
          templateUrl: 'modules/squared/views/activate.html',
          controller: 'ActivateCtrl',
          parent: 'main',
          authenticate: false
        })
        .state('downloads', {
          url: '/downloads',
          templateUrl: 'modules/squared/views/downloads.html',
          controller: 'DownloadsCtrl',
          parent: 'main',
          authenticate: false
        })
        .state('invite', {
          url: '/invite',
          templateUrl: 'modules/squared/views/invite.html',
          controller: 'InviteCtrl',
          parent: 'main',
          authenticate: false
        })
        .state('invitelauncher', {
          url: '/invitelauncher',
          templateUrl: 'modules/squared/views/invitelauncher.html',
          controller: 'InvitelauncherCtrl',
          parent: 'main',
          authenticate: false
        })
        .state('applauncher', {
          url: '/applauncher',
          templateUrl: 'modules/squared/views/applauncher.html',
          controller: 'ApplauncherCtrl',
          parent: 'main',
          authenticate: false
        })
        .state('appdownload', {
          url: '/appdownload',
          templateUrl: 'modules/squared/views/appdownload.html',
          controller: 'AppdownloadCtrl',
          parent: 'main',
          authenticate: false
        })
        .state('processorder', {
          url: '/processorder',
          templateUrl: 'modules/squared/views/processorder.html',
          controller: 'ProcessorderCtrl',
          parent: 'main',
          authenticate: false
        })
        .state('overview', {
          url: '/overview',
          templateUrl: 'modules/core/landingPage/landingPage.tpl.html',
          controller: 'LandingPageCtrl',
          parent: 'main'
        })
        .state('users', {
          abstract: true,
          template: '<div ui-view></div>',
          parent: 'main'
        })
        .state('users.list', {
          url: '/users',
          templateUrl: 'modules/core/users/userList/userList.tpl.html',
          controller: 'ListUsersCtrl',
          params: {
            showAddUsers: {}
          }
        })
        .state('users.list.preview', {
          templateUrl: 'modules/core/users/userPreview/userPreview.tpl.html',
          controller: 'UserPreviewCtrl'
        })
        .state('users.list.preview.conversations', {
          template: '<div user-entitlements current-user="currentUser" entitlements="entitlements" queryuserslist="queryuserslist"></div>'
        })
        .state('users.list.preview.roles', {
          template: '<div class="sub-details-full" user-roles current-user="currentUser" entitlements="entitlements" roles="roles" queryuserslist="queryuserslist"></div>'
        })
        .state('users.list.preview.directorynumber', {
          templateUrl: 'modules/huron/lineSettings/lineSettings.tpl.html',
          controller: 'LineSettingsCtrl',
          params: {
            showAddUsers: {},
            directoryNumber: {}
          }
        })
        .state('users.list.preview.voicemail', {
          template: '<div uc-voicemail></div>'
        })
        .state('users.list.preview.snr', {
          template: '<div uc-single-number-reach></div>'
        })
        .state('users.list.preview.device', {
          templateUrl: 'modules/huron/device/deviceDetail.tpl.html',
          controller: 'DeviceDetailCtrl as ucDeviceDetail',
          params: {
            showAddUsers: {},
            device: {}
          }
        })
        .state('organization', {
          url: '/organization',
          templateUrl: 'modules/core/views/organizations.html',
          controller: 'OrganizationsCtrl',
          parent: 'main'
        })
        .state('templates', {
          url: '/templates',
          templateUrl: 'modules/squared/views/templates.html',
          controller: 'UsersCtrl',
          parent: 'main'
        })
        .state('reports', {
          url: '/reports',
          templateUrl: 'modules/squared/views/reports.html',
          controller: 'ReportsCtrl',
          parent: 'main'
        })
        .state('userprofile', {
          url: '/userprofile/:uid',
          templateUrl: 'modules/squared/views/userprofile.html',
          controller: 'UserProfileCtrl',
          parent: 'main'
        })
        .state('support', {
          url: '/support?search',
          templateUrl: 'modules/squared/views/support.html',
          controller: 'SupportCtrl',
          parent: 'main'
        })
        .state('devices', {
          url: '/devices',
          templateUrl: 'modules/squared/devices/devices.html',
          controller: 'SpacesCtrl',
          parent: 'main'
        })
        .state('partneroverview', {
          parent: 'partner',
          url: '/overview',
          templateUrl: 'modules/core/views/partnerlanding.html',
          controller: 'PartnerHomeCtrl'
        })
        .state('partnerreports', {
          parent: 'partner',
          url: '/reports',
          templateUrl: 'modules/squared/views/partnerreports.html',
          controller: 'PartnerReportsCtrl'
        })
        .state('login_swap', {
          url: '/login/:customerOrgId/:customerOrgName',
          views: {
            'main@': {
              templateUrl: 'modules/core/login/login.tpl.html',
              controller: 'LoginCtrl'
            }
          },
          authenticate: false
        })
        .state('launch_partner_org', {
          url: '/login/:partnerOrgId/:partnerOrgName/:launchPartner',
          views: {
            'main@': {
              templateUrl: 'modules/core/login/login.tpl.html',
              controller: 'LoginCtrl'
            }
          },
          authenticate: false
        })
        .state('partnercustomers', {
          parent: 'partner',
          template: '<div ui-view></div>',
          absract: true
        })
        .state('partnercustomers.list', {
          url: '/customers',
          templateUrl: 'modules/core/customers/customerList/customerList.tpl.html',
          controller: 'PartnerHomeCtrl',
          params: {
            filter: {}
          }
        })
        .state('partnercustomers.list.preview', {
          templateUrl: 'modules/core/customers/customerPreview/customerPreview.tpl.html',
          controller: 'CustomerPreviewCtrl'
        })
        .state('modal', {
          abstract: true,
          onEnter: modalOnEnter(),
          onExit: modalOnExit
        })
        .state('modalLarge', {
          abstract: true,
          onEnter: modalOnEnter('lg'),
          onExit: modalOnExit
        })
        .state('modalSmall', {
          abstract: true,
          onEnter: modalOnEnter('sm'),
          onExit: modalOnExit
        })
        .state('wizardmodal', {
          abstract: true,
          onEnter: ['$modal', '$state', '$previousState',
            function ($modal, $state, $previousState) {
              $previousState.memo(wizardmodalMemo);
              $state.modal = $modal.open({
                template: '<div ui-view="modal"></div>',
                controller: 'ModalWizardCtrl',
                windowTemplateUrl: 'modules/core/modal/wizardWindow.tpl.html'
              });
              $state.modal.result.finally(function () {
                $state.modal = null;
                var previousState = $previousState.get(wizardmodalMemo);
                if (previousState) {
                  return $previousState.go(wizardmodalMemo);
                }
              });
            }
          ],
          onExit: ['$state', '$previousState',
            function ($state, $previousState) {
              if ($state.modal) {
                $previousState.forget(wizardmodalMemo);
                $state.modal.close();
              }
            }
          ]
        })
        .state('firsttimesplash', {
          abstract: true,
          views: {
            'main@': {
              templateUrl: 'modules/core/setupWizard/firstTimeWizard.tpl.html',
              controller: 'FirstTimeWizardCtrl'
            }
          }
        })
        .state('firsttimewizard', {
          parent: 'firsttimesplash',
          template: '<cr-wizard tabs="tabs" finish="finish" is-first-time="true"></cr-wizard>',
          controller: 'SetupWizardCtrl'
        })
        .state('setupwizardmodal', {
          parent: 'wizardmodal',
          views: {
            'modal@': {
              template: '<cr-wizard tabs="tabs" finish="finish"></cr-wizard>',
              controller: 'SetupWizardCtrl'
            }
          }
        });
    }
  ]);

angular
  .module('Huron')
  .config(['$stateProvider',
    function ($stateProvider) {
      $stateProvider
        .state('callroutingBase', {
          abstract: true,
          parent: 'main',
          templateUrl: 'modules/huron/callRouting/callRouting.tpl.html'
        })
        .state('callrouting', {
          url: '/callrouting',
          parent: 'callroutingBase',
          views: {
            'header': {
              templateUrl: 'modules/huron/callRouting/callRoutingHeader.tpl.html'
            },
            'nav': {
              templateUrl: 'modules/huron/callRouting/callRoutingNav.tpl.html',
              controller: 'CallRoutingNavCtrl',
              controllerAs: 'nav'
            },
            'main': {
              template: '<div ui-view></div>'
            }
          }
        })
        .state('autoattendant', {
          url: '/autoattendant',
          parent: 'callrouting',
          template: '<div></div>'
        })
        .state('callpark', {
          url: '/callpark',
          parent: 'callrouting',
          templateUrl: 'modules/huron/callRouting/callPark/callPark.tpl.html',
          controller: 'CallParkCtrl',
          controllerAs: 'cp'
        })
        .state('callpickup', {
          url: '/callpickup',
          parent: 'callrouting',
          template: '<div></div>'
        })
        .state('intercomgroups', {
          url: '/intercomgroups',
          parent: 'callrouting',
          template: '<div></div>'
        })
        .state('paginggroups', {
          url: '/paginggroups',
          parent: 'callrouting',
          template: '<div></div>'
        })
        .state('huntgroups', {
          url: '/huntgroups',
          parent: 'callrouting',
          template: '<div></div>'
        })
        .state('mediaonhold', {
          parent: 'modalLarge',
          url: '/mediaonhold',
          views: {
            'modal@': {
              templateUrl: 'modules/huron/moh/moh.tpl.html',
              controller: 'MohCtrl',
              controllerAs: 'moh'
            }
          }
        })
        .state('generateauthcode', {
          parent: 'modal',
          url: '/generateauthcode',
          params: {
            currentUser: {},
            activationCode: {}
          },
          views: {
            'modal@': {
              templateUrl: 'modules/huron/device/generateActivationCodeModal.tpl.html',
              controller: 'GenerateActivationCodeCtrl',
              controllerAs: 'genAuthCode'
            }
          }
        })
        .state('didadd', {
          parent: 'modal',
          url: '/didadd',
          params: {
            currentOrg: {}
          },
          views: {
            'modal@': {
              templateUrl: 'modules/huron/didAdd/didAdd.tpl.html',
              controller: 'DidAddCtrl',
              controllerAs: 'didAdd'
            }
          }
        });
    }
  ]);

angular
  .module('Hercules')
  .config(['$stateProvider',
    function ($stateProvider) {
      $stateProvider
        .state('fusion', {
          url: '/fusion',
          templateUrl: 'modules/hercules/dashboard/dashboard.html',
          controller: 'DashboardController',
          parent: 'main'
        });
    }
  ]);

angular
  .module('Mediafusion')
  .config(['$stateProvider',
    function ($stateProvider) {
      $stateProvider
        .state('meetings', {
          abstract: true,
          template: '<div ui-view></div>',
          //url: '/meetings',
          //templateUrl: 'modules/mediafusion/meetings/meetingList/meetingList.tpl.html',
          //controller: 'ListMeetingsCtrl',
          parent: 'main'
        })
        .state('meetings.list', {
          url: '/meetings',
          templateUrl: 'modules/mediafusion/meetings/meetingList/meetingList.tpl.html',
          controller: 'ListMeetingsCtrl',
          params: {
            showAddUsers: {}
          }
        })
        .state('meetings.list.preview', {
          templateUrl: 'modules/mediafusion/meetings/meetingPreview/meetingPreview.tpl.html',
          controller: 'MeetingPreviewCtrl'
        })
        .state('vts', {
          abstract: true,
          template: '<div ui-view></div>',
          parent: 'main'
        })
        .state('vts.list', {
          url: '/vts',
          templateUrl: 'modules/mediafusion/enterpriseResource/enterpriseResourceList/enterpriseResourceList.tpl.html',
          controller: 'ListVtsCtrl'
        })
        .state('vts.list.preview', {
          templateUrl: 'modules/mediafusion/enterpriseResource/enterpriseResourcePreview/enterpriseResourcePreview.tpl.html',
          controller: 'VtsPreviewCtrl'
        });
    }
  ]);
