(function () {
  'use strict';

  var $q, $controller, Authinfo, Notification, CiService, SyncService;
  var $scope;
  var ctrl;

  describe('Controller: CiSyncCtrl', function () {
    beforeEach(angular.mock.module('Core'));
    beforeEach(angular.mock.module('Huron'));
    beforeEach(angular.mock.module('Sunlight'));
    beforeEach(angular.mock.module('Messenger'));

    beforeEach(inject(function (_$controller_, _$q_, _$rootScope_, _Authinfo_, _Notification_, _CiService_, _SyncService_) {
      $scope = _$rootScope_.$new();
      $q = _$q_;
      Authinfo = _Authinfo_;
      Notification = _Notification_;
      CiService = _CiService_;
      SyncService = _SyncService_;
      $controller = _$controller_;
    }));

    afterEach(function () {
      ctrl = $scope = $q = $controller = Authinfo = Notification = CiService = SyncService = undefined;
    });

    function initController() {
      ctrl = $controller('CiSyncCtrl');
      $scope.$apply();
    }

    describe('Initialization Tests', function () {
      beforeEach(function () {
        spyOn(CiService, 'getCiAdmins');
        spyOn(CiService, 'getCiNonAdmins');
        spyOn(SyncService, 'getSyncStatus').and.returnValue($q.resolve());
      });

      it('should initialize user with adminTypes.READ', function () {
        spyOn(Authinfo, 'isReadOnlyAdmin').and.returnValue(true);

        initController();

        expect(ctrl.adminType).toBe(ctrl.adminTypes.READ);
      });

      it('should initialize user with adminTypes.OPS with help desk user', function () {
        spyOn(Authinfo, 'isReadOnlyAdmin').and.returnValue(false);
        spyOn(Authinfo, 'isCustomerAdmin').and.returnValue(false);
        spyOn(Authinfo, 'isHelpDeskUser').and.returnValue(true);
        spyOn(CiService, 'isOrgManager').and.returnValue($q.resolve(true));

        initController();

        expect(ctrl.adminType).toBe(ctrl.adminTypes.OPS);
      });

      it('should initialize user with adminTypes.ORG with non-org-manager Customer Admin', function () {
        spyOn(Authinfo, 'isReadOnlyAdmin').and.returnValue(false);
        spyOn(Authinfo, 'isCustomerAdmin').and.returnValue(true);
        spyOn(CiService, 'hasRole').and.returnValue($q.resolve());
        spyOn(Authinfo, 'isWebexSquared').and.returnValue(true);
        spyOn(Authinfo, 'isWebexMessenger').and.returnValue(true);
        spyOn(CiService, 'isOrgManager').and.returnValue($q.resolve(false));
        initController();
        expect(ctrl.adminType).toBe(ctrl.adminTypes.ORG);
      });

      it('should initialize user with adminTypes.OPS with Customer Admin & Org Manager', function () {
        spyOn(Authinfo, 'isReadOnlyAdmin').and.returnValue(false);
        spyOn(Authinfo, 'isCustomerAdmin').and.returnValue(true);
        spyOn(CiService, 'hasRole').and.returnValue($q.resolve());
        spyOn(Authinfo, 'isWebexSquared').and.returnValue(true);
        spyOn(Authinfo, 'isWebexMessenger').and.returnValue(true);
        spyOn(CiService, 'isOrgManager').and.returnValue($q.resolve(true));
        initController();
        expect(ctrl.adminType).toBe(ctrl.adminTypes.OPS);
      });

      it('should initialize with errorFailedCheckingCustSuccessRole error and user is adminTypes.UNKNOWN with Customer Admin',
        function () {
          spyOn(Authinfo, 'isReadOnlyAdmin').and.returnValue(false);
          spyOn(Authinfo, 'isCustomerAdmin').and.returnValue(true);
          spyOn(CiService, 'hasRole').and.returnValue($q.reject(''));
          spyOn(Notification, 'error');

          initController();

          // Variables not being translated in test environment. So, checking error message based on the variable(s) instead of
          // text of the error message.
          expect(Notification.error)
            .toHaveBeenCalledWith('messengerCiSync.errorAuthFailedmessengerCiSync.errorFailedCheckingCustSuccessRole');
          expect(ctrl.adminType).toBe(ctrl.adminTypes.UNKNOWN);
        });

      it('should initialize with errorLacksEntitlements error and user is adminTypes.UNKNOWN with Customer Admin',
        function () {
          spyOn(Authinfo, 'isReadOnlyAdmin').and.returnValue(false);
          spyOn(Authinfo, 'isCustomerAdmin').and.returnValue(true);
          spyOn(CiService, 'hasRole').and.returnValue($q.resolve());
          spyOn(Authinfo, 'isWebexSquared').and.returnValue(false);
          spyOn(Notification, 'error');

          initController();

          // Variables not being translated in test environment. So, checking error message based on the variable(s) instead of
          // text of the error message.
          expect(Notification.error)
            .toHaveBeenCalledWith('messengerCiSync.errorAuthFailedmessengerCiSync.errorLacksEntitlementswebex-squared,webex-messenger');
          expect(ctrl.adminType).toBe(ctrl.adminTypes.UNKNOWN);
        });

      it('should initialize with errorLacksRole error and user is adminTypes.UNKNOWN', function () {
        spyOn(Authinfo, 'isReadOnlyAdmin').and.returnValue(false);
        spyOn(Authinfo, 'isCustomerAdmin').and.returnValue(false);
        spyOn(Authinfo, 'isHelpDeskUser').and.returnValue(false);
        spyOn(Notification, 'error');

        initController();

        // Variables not being translated in test environment. So, checking error message based on the variable(s) instead of
        // text of the error message.
        expect(Notification.error).toHaveBeenCalledWith('messengerCiSync.errorAuthFailedmessengerCiSync.errorLacksRole');
        expect(ctrl.adminType).toBe(ctrl.adminTypes.UNKNOWN);
      });

      it('should initialize with errorNotInManagedOrg error and user is adminTypes.UNKNOWN with Help Desk', function () {
        spyOn(Authinfo, 'isReadOnlyAdmin').and.returnValue(false);
        spyOn(Authinfo, 'isCustomerAdmin').and.returnValue(false);
        spyOn(Authinfo, 'isHelpDeskUser').and.returnValue(true);
        spyOn(CiService, 'isOrgManager').and.returnValue($q.resolve(false));
        spyOn(Notification, 'error');

        initController();

        // Variables not being translated in test environment. So, checking error message based on the variable(s) instead of
        // text of the error message.
        expect(Notification.error).toHaveBeenCalledWith('messengerCiSync.errorAuthFailedmessengerCiSync.errorNotOrgManager');
        expect(ctrl.adminType).toBe(ctrl.adminTypes.UNKNOWN);
      });

      it('should initialize with errorFailedCheckingOrgInManagedOrgs error and user is adminTypes.UNKNOWN with Help Desk', function () {
        spyOn(Authinfo, 'isReadOnlyAdmin').and.returnValue(false);
        spyOn(Authinfo, 'isCustomerAdmin').and.returnValue(false);
        spyOn(Authinfo, 'isHelpDeskUser').and.returnValue(true);
        spyOn(CiService, 'isOrgManager').and.returnValue($q.reject(''));
        spyOn(Notification, 'error');

        initController();

        // Variables not being translated in test environment. So, checking error message based on the variable(s) instead of
        // text of the error message.
        expect(Notification.error).toHaveBeenCalledWith('messengerCiSync.errorAuthFailedmessengerCiSync.errorFailedCheckingOrgInManagedOrgs');
        expect(ctrl.adminType).toBe(ctrl.adminTypes.UNKNOWN);
      });
    });

    describe('helper functions:', function () {
      it('should set "settings.syncInfo.*" properties only if they are already predefined on the controller', function () {
        initController();
        ctrl.setSyncInfoProperty('settings.syncInfo.messengerOrgName', 'fake-org-name');
        expect(ctrl.settings.syncInfo.messengerOrgName).toBe('fake-org-name');

        ctrl.setSyncInfoProperty('settings.syncInfo.messengerOrgId', 'fake-org-id');
        expect(ctrl.settings.syncInfo.messengerOrgId).toBe('fake-org-id');

        ctrl.setSyncInfoProperty('settings.syncInfo.linkDate', 'fake-link-date');
        expect(ctrl.settings.syncInfo.linkDate).toBe('fake-link-date');

        ctrl.setSyncInfoProperty('settings.syncInfo.isAuthRedirect', true);
        expect(ctrl.settings.syncInfo.isAuthRedirect).toBe(true);

        ctrl.setSyncInfoProperty('settings.syncInfo.isSyncEnabled', true);
        expect(ctrl.settings.syncInfo.isSyncEnabled).toBe(true);

        ctrl.setSyncInfoProperty('settings.syncInfo.isMessengerSyncRawMode', true);
        expect(ctrl.settings.syncInfo.isMessengerSyncRawMode).toBe(true);

        ctrl.setSyncInfoProperty('settings.syncInfo.isNewDataFormat', true);
        expect(ctrl.settings.syncInfo.isNewDataFormat).toBe(true);

        ctrl.setSyncInfoProperty('settings.syncInfo.isPwdSync', true);
        expect(ctrl.settings.syncInfo.isPwdSync).toBe(true);

        ctrl.setSyncInfoProperty('settings.syncInfo.isSparkEnt', true);
        expect(ctrl.settings.syncInfo.isSparkEnt).toBe(true);

        ctrl.setSyncInfoProperty('settings.syncInfo.isUsrDis', true);
        expect(ctrl.settings.syncInfo.isUsrDis).toBe(true);

        ctrl.setSyncInfoProperty('settings.syncInfo.isUsrDel', true);
        expect(ctrl.settings.syncInfo.isUsrDel).toBe(true);

        ctrl.setSyncInfoProperty('settings.syncInfo.fakeNewProperty', true);
        expect(ctrl.settings.syncInfo.fakeNewProperty).toBe(undefined);
      });
    });
  });
})();
