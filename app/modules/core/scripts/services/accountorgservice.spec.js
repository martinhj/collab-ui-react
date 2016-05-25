'use strict';

describe('Service : AccountOrgService', function () {
  beforeEach(module('Core'));

  var AccountOrgService, $httpBackend, Config, Auth, UrlConfig, Authinfo;
  var appSecurityRegex = /.*\/settings\/enforceClientSecurity\.*/;

  var authInfo = {
    getOrgId: sinon.stub().returns('bcd7afcd-839d-4c61-a7a8-31c6c7f016d7')
  };

  beforeEach(module(function ($provide) {
    $provide.value("Authinfo", authInfo);
  }));

  beforeEach(inject(function (_$httpBackend_, _AccountOrgService_, _Config_, _Auth_, _UrlConfig_) {
    $httpBackend = _$httpBackend_;
    AccountOrgService = _AccountOrgService_;
    Config = _Config_;
    Auth = _Auth_;
    UrlConfig = _UrlConfig_;
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  // Organization validity checks

  describe('it should catch illegal parameter passes and', function () {
    it('should verify that a valid OrgID is passed to getAppSecurity and setAppSecurity', function () {
      AccountOrgService.getAppSecurity().catch(function (response) {
        expect(response).toBe('A Valid organization ID must be Entered');
      });

      AccountOrgService.setAppSecurity().catch(function (response) {
        expect(response).toBe('A Valid organization ID must be Entered');
      });
    });
  });

  describe('App Security ', function () {
    //App Security Setter check
    it('should set Appsecurity setting to enforceClientSecurity', function () {
      $httpBackend.whenPUT(appSecurityRegex).respond([200, {}]);

      AccountOrgService.setAppSecurity(authInfo.getOrgId(), true).then(function (response) {
        expect(response.status).toEqual(200);
      });
      $httpBackend.flush();
    });

    //App Security Getter check
    it('should get Appsecurity setting from enforceClientSecurity', function () {

      $httpBackend.whenGET(appSecurityRegex).respond(function () {
        var data = {
          enforceClientSecurity: true
        };
        return [200, data];
      });

      AccountOrgService.getAppSecurity(authInfo.getOrgId()).then(function (response) {
        expect(response.data.enforceClientSecurity).toBe(true);
      });
      $httpBackend.flush();
    });
  });

});
