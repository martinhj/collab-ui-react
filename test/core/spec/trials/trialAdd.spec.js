'use strict';

describe('Controller: TrialAddCtrl', function () {
  var controller, $scope, $httpBackend, $translate, $modal, modalInstance, Notification, partnerService, huronCustomer;

  beforeEach(module('ui.bootstrap'));
  beforeEach(module('dialogs'));
  beforeEach(module('ngResource'));
  beforeEach(module('ui.router'));
  beforeEach(module('Squared'));
  beforeEach(module('Huron'));
  beforeEach(module('Core'));

  var authInfo = {
    getOrgId: sinon.stub().returns('1')
  };

  beforeEach(module(function($provide) {
    $provide.value("Authinfo", authInfo);
  }));

  beforeEach(inject(function($modal) {
    sinon.spy($modal, 'open');
  }));

  beforeEach(inject(function(Notification) {
    sinon.spy(Notification, "notify");
  }));

  beforeEach(inject(function ($rootScope, $controller, _$translate_, _$modal_, _$httpBackend_, _Notification_, _PartnerService_, _HuronCustomer_) {
    $scope = $rootScope.$new();
    $translate = _$translate_;
    $modal = _$modal_;
    $httpBackend = _$httpBackend_;
    Notification = _Notification_;
    partnerService = _PartnerService_;
    huronCustomer = _HuronCustomer_;
    controller = $controller('TrialAddCtrl', {
      $scope: $scope,
      $translate: $translate,
      $modal: $modal,
      PartnerService: partnerService,
      HuronCustomer: huronCustomer,
      Notification: Notification
    });
     $rootScope.$apply();
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('TrialAddCtrl controller', function () {
    it('should be created successfully', function () {
      expect(controller).toBeDefined;
    });
  });
});