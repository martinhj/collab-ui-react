'use strict';

describe('Controller: CustomerListCtrl', function () {
  var $httpBackend, $q, $rootScope, $scope, $state, $stateParams, $templateCache, $translate, $window, Authinfo, Config, HuronConfig, Log, Notification, Orgservice, PartnerService, TrialService;
  var controller, $controller;

  var adminJSONFixture = getJSONFixture('core/json/organizations/adminServices.json');
  var partnerService = getJSONFixture('core/json/partner/partner.service.json');
  var managedOrgsResponse = partnerService.managedOrgsResponse;
  var trialsResponse = partnerService.trialsResponse;
  var orgId = 1;
  var orgName = 'testOrg';
  var testOrg = {
    customerOrgId: '1234-34534-afdagfg-425345-afaf',
    customerName: 'ControllerTestOrg',
    customerEmail: 'customer@cisco.com',
    communications: {
      isTrial: false
    }
  };
  var numberResponse = {
    numbers: [1, 2, 3]
  };
  var noNumberResponse = {
    numbers: []
  };

  beforeEach(module('Core'));
  beforeEach(module('Huron'));

  beforeEach(inject(function (_$controller_, _$httpBackend_, _$q_, $rootScope, _$state_, _$stateParams_, _$translate_, _$window_, _Authinfo_, _HuronConfig_, _Notification_, _Orgservice_, _PartnerService_, _TrialService_) {
    $controller = _$controller_;
    $httpBackend = _$httpBackend_;
    $q = _$q_;
    $scope = $rootScope.$new();
    $state = _$state_;
    $stateParams = _$stateParams_;
    $translate = _$translate_;
    $window = _$window_;
    Authinfo = _Authinfo_;
    HuronConfig = _HuronConfig_;
    Notification = _Notification_;
    Orgservice = _Orgservice_;
    PartnerService = _PartnerService_;
    TrialService = _TrialService_;
    $scope.timeoutVal = 1;
    $rootScope.typeOfExport = {
      USER: 1,
      CUSTOMER: 2
    };

    spyOn($state, 'go');
    spyOn(Notification, 'error');

    spyOn(Authinfo, 'getOrgId').and.returnValue(orgId);
    spyOn(Authinfo, 'getOrgName').and.returnValue(orgName);
    spyOn(Authinfo, 'isPartnerAdmin').and.returnValue(true);

    spyOn(PartnerService, 'getManagedOrgsList').and.returnValue($q.when(managedOrgsResponse));
    spyOn(PartnerService, 'getUserAuthInfo').and.returnValue($q.when({}));

    spyOn(Orgservice, 'getAdminOrg').and.callFake(function (callback, status) {
      callback(adminJSONFixture.getAdminOrg, 200);
    });
    spyOn(Orgservice, 'getOrg').and.callFake(function (callback, orgId) {
      callback(getJSONFixture('core/json/organizations/Orgservice.json').getOrg, 200);
    });

    spyOn(TrialService, 'getTrial').and.returnValue($q.when());
    spyOn(TrialService, 'getTrialsList').and.returnValue($q.when(trialsResponse));
  }));

  function initController() {
    controller = $controller('CustomerListCtrl', {
      $scope: $scope,
      $state: $state,
      Authinfo: Authinfo,
      Config: Config
    });

    $scope.$apply();
  }

  describe('Controller', function () {
    beforeEach(initController);

    it('should initialize', function () {
      expect($scope.activeFilter).toBe('all');
    });
  });

  describe('Click setup PSTN', function () {
    beforeEach(initController);

    it('not Terminus customer and has e164 numbers, should route to DID add', function () {
      $httpBackend.expectGET(HuronConfig.getTerminusUrl() + '/customers/' + testOrg.customerOrgId).respond(404);
      $httpBackend.expectGET(HuronConfig.getCmiV2Url() + '/customers/' + testOrg.customerOrgId + '/numbers?type=external').respond(numberResponse);
      $scope.addNumbers(testOrg);
      $httpBackend.flush();
      expect($state.go).toHaveBeenCalledWith('didadd', {
        currentOrg: testOrg
      });
    });

    it('not Terminus customer and has no e164 numbers, should route to PSTN setup', function () {
      $httpBackend.expectGET(HuronConfig.getTerminusUrl() + '/customers/' + testOrg.customerOrgId).respond(404);
      $httpBackend.expectGET(HuronConfig.getCmiV2Url() + '/customers/' + testOrg.customerOrgId + '/numbers?type=external').respond(noNumberResponse);
      $scope.addNumbers(testOrg);
      $httpBackend.flush();
      expect($state.go).toHaveBeenCalledWith('pstnSetup', {
        customerId: testOrg.customerOrgId,
        customerName: testOrg.customerName,
        customerEmail: testOrg.customerEmail,
        customerCommunicationLicenseIsTrial: testOrg.communications.isTrial
      });
    });

    it('exists as Terminus customer, should route to PSTN setup', function () {
      $httpBackend.expectGET(HuronConfig.getTerminusUrl() + '/customers/' + testOrg.customerOrgId).respond(200);
      $scope.addNumbers(testOrg);
      $httpBackend.flush();
      expect($state.go).toHaveBeenCalledWith('pstnSetup', {
        customerId: testOrg.customerOrgId,
        customerName: testOrg.customerName,
        customerEmail: testOrg.customerEmail,
        customerCommunicationLicenseIsTrial: testOrg.communications.isTrial
      });
    });
  });

  describe('filterAction', function () {
    beforeEach(initController);

    it('a proper query wshould call out to partnerService and trialservice', function () {
      $scope.filterAction('1234');
      expect($scope.searchStr).toBe('1234');
      //this tests that getManagedOrgsList is  called , it is called once at init , so the count is expected to be 2 here
      expect(PartnerService.getManagedOrgsList.calls.count()).toEqual(2);
      expect(PartnerService.getManagedOrgsList).toHaveBeenCalledWith('1234');
      expect(TrialService.getTrialsList.calls.count()).toEqual(2);
      expect(TrialService.getTrialsList).toHaveBeenCalledWith('1234');
    });

  });

  describe('customerCommunicationLicenseIsTrial flag', function () {
    beforeEach(initController);

    it('should be true if communication license is a trial.', function () {
      var org = {
        customerOrgId: '1234-34534-afdagfg-425345-afaf',
        customerName: 'ControllerTestOrg',
        customerEmail: 'customer@cisco.com',
        communications: {
          isTrial: true
        }
      };
      $httpBackend.expectGET(HuronConfig.getTerminusUrl() + '/customers/' + org.customerOrgId).respond(200);
      $scope.addNumbers(org);
      $httpBackend.flush();
      expect($state.go).toHaveBeenCalledWith('pstnSetup', {
        customerId: org.customerOrgId,
        customerName: org.customerName,
        customerEmail: org.customerEmail,
        customerCommunicationLicenseIsTrial: true
      });
    });

    it('should be false if communication license is not a trial.', function () {
      var org = {
        customerOrgId: '1234-34534-afdagfg-425345-afaf',
        customerName: 'ControllerTestOrg',
        customerEmail: 'customer@cisco.com',
        communications: {
          isTrial: false
        }
      };
      $httpBackend.expectGET(HuronConfig.getTerminusUrl() + '/customers/' + org.customerOrgId).respond(200);
      $scope.addNumbers(org);
      $httpBackend.flush();
      expect($state.go).toHaveBeenCalledWith('pstnSetup', {
        customerId: org.customerOrgId,
        customerName: org.customerName,
        customerEmail: org.customerEmail,
        customerCommunicationLicenseIsTrial: false
      });
    });

    it('should be true if trial data is missing.', function () {
      var org = {
        customerOrgId: '1234-34534-afdagfg-425345-afaf',
        customerName: 'ControllerTestOrg',
        customerEmail: 'customer@cisco.com'
      };
      $httpBackend.expectGET(HuronConfig.getTerminusUrl() + '/customers/' + org.customerOrgId).respond(200);
      $scope.addNumbers(org);
      $httpBackend.flush();
      expect($state.go).toHaveBeenCalledWith('pstnSetup', {
        customerId: org.customerOrgId,
        customerName: org.customerName,
        customerEmail: org.customerEmail,
        customerCommunicationLicenseIsTrial: true
      });
    });

    it('should always be false if isPartner is true.', function () {
      var org = {
        customerOrgId: '1234-34534-afdagfg-425345-afaf',
        customerName: 'ControllerTestOrg',
        customerEmail: 'customer@cisco.com',
        isPartner: true,
        communications: {
          isTrial: true
        }
      };
      $httpBackend.expectGET(HuronConfig.getTerminusUrl() + '/customers/' + org.customerOrgId).respond(200);
      $scope.addNumbers(org);
      $httpBackend.flush();
      expect($state.go).toHaveBeenCalledWith('pstnSetup', {
        customerId: org.customerOrgId,
        customerName: org.customerName,
        customerEmail: org.customerEmail,
        customerCommunicationLicenseIsTrial: false
      });
    });
  });

  describe('getUserAuthInfo should be called correctly', function () {
    beforeEach(initController);

    it('should have called PartnerService.getUserAuthInfo', function () {
      expect(testOrg.customerOrgId).toBe('1234-34534-afdagfg-425345-afaf');
      $scope.getUserAuthInfo(testOrg.customerOrgId);
      expect(PartnerService.getUserAuthInfo).toHaveBeenCalled();
    });
  });
});