'use strict';

describe('FirstTimeWizardCtrl', function () {
  beforeEach(module('Core'));
  beforeEach(module('Huron'));
  beforeEach(module('Sunlight'));

  var $controller, $q, $scope, Auth, Authinfo, Controller, FeatureToggleService, Userservice;

  beforeEach(inject(function (_$controller_, _$q_, $rootScope, _Auth_, _Authinfo_,
    _FeatureToggleService_, _Userservice_) {
    $controller = _$controller_;
    $q = _$q_;
    $scope = $rootScope.$new();
    Auth = _Auth_;
    Authinfo = _Authinfo_;
    FeatureToggleService = _FeatureToggleService_;
    Userservice = _Userservice_;
  }));

  describe('Customer Org Admin', function () {

    var successResponse = {
      data: {
        id: 'admin-user',
        roles: 'full_admin',
        entitlements: ['spark']
      },
      status: 200
    };
    var failedResponse = {
      data: '',
      status: 404
    };

    function initController() {
      Controller = $controller('FirstTimeWizardCtrl', {
        $scope: $scope
      });
      $scope.$apply();
    }

    function testData(data) {
      FeatureToggleService.atlasCareTrialsGetStatus.and.returnValue($q.when(data.atlasCareTrialsOn));
      Authinfo.isInDelegatedAdministrationOrg.and.returnValue(data.asDelegatedAdmin);
      Authinfo.getCareServices.and.returnValue(data.careServices);
      Userservice.getUser.and.returnValue($q.when(data.getUserResponse));
      Userservice.updateUserProfile.and.returnValue($q.when(data.updateUserProfileResponse));
    }

    beforeEach(function () {
      spyOn(FeatureToggleService, 'atlasCareTrialsGetStatus');
      spyOn(Userservice, 'getUser');
      spyOn(Userservice, 'updateUserProfile');
      spyOn(Authinfo, 'isInDelegatedAdministrationOrg');
      spyOn(Authinfo, 'getCareServices');
      spyOn(Authinfo, 'getOrgId').and.returnValue('care-org');
      spyOn(Auth, 'logout').and.stub();
    });

    it('should not check care feature toggle, if isInDelegatedAdministrationOrg is true', function () {
      testData({
        asDelegatedAdmin: true
      });

      initController();
      // We will handle partner scenarios later.
      expect(FeatureToggleService.atlasCareTrialsGetStatus).not.toHaveBeenCalled();
    });

    it('should not get user details if there are no care licenses', function () {
      testData({
        asDelegatedAdmin: false,
        atlasCareTrialsOn: true,
        careServices: []
      });

      initController();

      expect(Authinfo.getCareServices).toHaveBeenCalled();
      expect(Userservice.getUser).not.toHaveBeenCalled();
    });

    it('should not patch user if get user failed', function () {
      testData({
        asDelegatedAdmin: false,
        atlasCareTrialsOn: true,
        careServices: [{
          type: 'CDC_xxx'
        }],
        getUserResponse: failedResponse
      });

      initController();

      expect(Authinfo.getCareServices).toHaveBeenCalled();
      expect(Userservice.getUser).toHaveBeenCalled();
      expect(Userservice.updateUserProfile).not.toHaveBeenCalled();
    });

    it('do not logout if patch user failed', function () {
      testData({
        asDelegatedAdmin: false,
        atlasCareTrialsOn: true,
        careServices: [{
          type: 'CDC_xxx'
        }],
        getUserResponse: successResponse,
        updateUserProfileResponse: failedResponse
      });

      initController();

      expect(Authinfo.getCareServices).toHaveBeenCalled();
      expect(Userservice.getUser).toHaveBeenCalled();
      expect(Userservice.updateUserProfile).toHaveBeenCalled();
      expect(Auth.logout).not.toHaveBeenCalled();
    });

    it('should proceed to patch & logout if care admin does not have care roles & care ' +
      'entitlements',
      function () {
        testData({
          asDelegatedAdmin: false,
          atlasCareTrialsOn: true,
          careServices: [{
            type: 'CDC_xxx'
          }],
          getUserResponse: successResponse,
          updateUserProfileResponse: successResponse
        });

        initController();

        expect(Auth.logout).toHaveBeenCalled();
      });
  });
});
