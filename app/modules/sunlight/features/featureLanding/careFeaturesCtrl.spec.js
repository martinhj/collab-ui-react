'use strict';

describe('Care Feature Ctrl should ', function () {
  var controller, $filter, $q, $rootScope, $state, $scope, Authinfo, CareFeatureList,
    Log, Notification, deferred, callbackDeferred, chatPlusCallbackDeferred, $translate;
  var spiedAuthinfo = {
    getOrgId: jasmine.createSpy('getOrgId').and.returnValue('Test-Org-Id'),
    isMessageEntitled: jasmine.createSpy('isMessageEntitled').and.returnValue(true),
    isSquaredUC: jasmine.createSpy('isSquaredUC').and.returnValue(true),
  };

  var templateList = getJSONFixture('sunlight/json/features/chatTemplates/chatTemplateList.json');
  var emptyListOfCTs = [];
  var justOneChatTemplate = templateList[0];

  var getTemplatesSuccess = function (mediaType, data) {
    return _.filter(data, function (template) {
      return template.mediaType === mediaType;
    });
  };
  var getTemplateFailure = function () {
    return {
      data: 'Internal Server Error',
      status: 500,
      statusText: 'Internal Server Error',
    };
  };

  beforeEach(angular.mock.module('Sunlight'));
  beforeEach(angular.mock.module('Hercules'));
  beforeEach(angular.mock.module(function ($provide) {
    $provide.value('Authinfo', spiedAuthinfo);
  }));

  beforeEach(inject(function (_$rootScope_, $controller, _$filter_, _$state_, _$q_, _Authinfo_, _CareFeatureList_, _Notification_, _Log_, _$translate_) {
    $rootScope = _$rootScope_;
    $filter = _$filter_;
    $q = _$q_;
    $state = _$state_;
    $scope = _$rootScope_.$new();
    Authinfo = _Authinfo_;
    $translate = _$translate_;
    CareFeatureList = _CareFeatureList_;
    Log = _Log_;
    Notification = _Notification_;

    //create mock deferred object which will be used to return promises
    deferred = $q.defer();
    callbackDeferred = $q.defer();
    chatPlusCallbackDeferred = $q.defer();
    spyOn(CareFeatureList, 'getChatTemplates').and.returnValue(deferred.promise);
    spyOn(CareFeatureList, 'getCallbackTemplates').and.returnValue(callbackDeferred.promise);
    spyOn(CareFeatureList, 'getChatPlusCallbackTemplates').and.returnValue(chatPlusCallbackDeferred.promise);
    spyOn($state, 'go');

    controller = $controller('CareFeaturesCtrl', {
      $scope: $scope,
      $state: $state,
      $filter: $filter,
      Authinfo: Authinfo,
      CareFeatureList: CareFeatureList,
      Log: Log,
      Notification: Notification,
      $translate: $translate,
    });
  }));

  it('initialize and get the list of templates and update pageState ', function () {
    expect(controller.pageState).toEqual('Loading');
    deferred.resolve(getTemplatesSuccess('chat', templateList));
    callbackDeferred.resolve(getTemplatesSuccess('callback', templateList));
    chatPlusCallbackDeferred.resolve(getTemplatesSuccess('chatPlusCallback', templateList));
    $scope.$apply();
    expect(controller.pageState).toEqual('ShowFeatures');
  });

  it('initialize and show error page when get templates fails ', function () {
    expect(controller.pageState).toEqual('Loading');
    deferred.reject(getTemplateFailure);
    $scope.$apply();
    expect(controller.pageState).toEqual('Error');
  });

  it('initialize and show New Feature page when templates are empty ', function () {
    expect(controller.pageState).toEqual('Loading');
    deferred.resolve(getTemplatesSuccess('chat', emptyListOfCTs));
    callbackDeferred.resolve(getTemplatesSuccess('callback', emptyListOfCTs));
    chatPlusCallbackDeferred.resolve(getTemplatesSuccess('chatPlusCallback', emptyListOfCTs));
    $scope.$apply();
    expect(controller.pageState).toEqual('NewFeature');
  });

  it('able to call delete function and inturn the $state service ', function () {
    deferred.resolve(getTemplatesSuccess('chat', templateList));
    callbackDeferred.resolve(getTemplatesSuccess('callback', templateList));
    chatPlusCallbackDeferred.resolve(getTemplatesSuccess('chatPlusCallback', templateList));
    $scope.$apply();
    var featureTobBeDeleted = templateList[0];
    controller.deleteCareFeature(featureTobBeDeleted);
    expect($state.go).toHaveBeenCalledWith('care.Features.DeleteFeature', {
      deleteFeatureName: featureTobBeDeleted.name,
      deleteFeatureId: featureTobBeDeleted.templateId,
      deleteFeatureType: featureTobBeDeleted.featureType,
    });
  });

  it('able to receive the CARE_FEATURE_DELETED event when template gets deleted and template should be deleted from local copy', function () {
    deferred.resolve(getTemplatesSuccess('chat', templateList));
    callbackDeferred.resolve(getTemplatesSuccess('callback', templateList));
    chatPlusCallbackDeferred.resolve(getTemplatesSuccess('chatPlusCallback', templateList));
    $scope.$apply();
    var featureTobBeDeleted = templateList[0];
    controller.deleteCareFeature(featureTobBeDeleted);
    $rootScope.$broadcast('CARE_FEATURE_DELETED', {
      deleteFeatureName: featureTobBeDeleted.name,
      deleteFeatureId: featureTobBeDeleted.templateId,
      deleteFeatureType: featureTobBeDeleted.featureType,
    });
    expect(controller.filteredListOfFeatures).not.toEqual(jasmine.arrayContaining([featureTobBeDeleted]));
  });

  it('able to receive the CARE_FEATURE_DELETED event when template gets deleted and change pageState to NewFeature when no templates to show', function () {
    deferred.resolve(getTemplatesSuccess('chat', [justOneChatTemplate]));
    callbackDeferred.resolve(getTemplatesSuccess('callback', emptyListOfCTs));
    chatPlusCallbackDeferred.resolve(getTemplatesSuccess('chatPlusCallback', emptyListOfCTs));
    $scope.$apply();
    var featureTobBeDeleted = justOneChatTemplate;
    controller.deleteCareFeature(featureTobBeDeleted);
    $rootScope.$broadcast('CARE_FEATURE_DELETED', {
      deleteFeatureName: featureTobBeDeleted.name,
      deleteFeatureId: featureTobBeDeleted.templateId,
      deleteFeatureType: featureTobBeDeleted.featureType,
    });
    expect(controller.filteredListOfFeatures).not.toEqual(jasmine.arrayContaining([featureTobBeDeleted]));
    expect(controller.pageState).toEqual('NewFeature');
  });

  it('should filter a list of Chat templates', function () {
    deferred.resolve(getTemplatesSuccess('chat', templateList));
    callbackDeferred.resolve(getTemplatesSuccess('callback', templateList));
    chatPlusCallbackDeferred.resolve(getTemplatesSuccess('chatPlusCallback', templateList));
    $scope.$apply();
    controller.setFilter('chat');
    expect(controller.filteredListOfFeatures.length).toEqual(3);
    expect(controller.filteredListOfFeatures[0].name).toEqual('Sunlight Dev Template');
  });

  it('should filter a list of Callback templates', function () {
    deferred.resolve(getTemplatesSuccess('chat', templateList));
    callbackDeferred.resolve(getTemplatesSuccess('callback', templateList));
    chatPlusCallbackDeferred.resolve(getTemplatesSuccess('chatPlusCallback', templateList));
    $scope.$apply();
    controller.setFilter('callback');
    expect(controller.filteredListOfFeatures.length).toEqual(3);
    expect(controller.filteredListOfFeatures[0].name).toEqual('Sunlight Callback Dev Template');
  });

  it('should filter a list of Chat+Callback templates', function () {
    deferred.resolve(getTemplatesSuccess('chat', templateList));
    callbackDeferred.resolve(getTemplatesSuccess('callback', templateList));
    chatPlusCallbackDeferred.resolve(getTemplatesSuccess('chatPlusCallback', templateList));
    $scope.$apply();
    controller.setFilter('chatPlusCallback');
    expect(controller.filteredListOfFeatures.length).toEqual(3);
    expect(controller.filteredListOfFeatures[0].name).toEqual('Sunlight Chat+Callback Dev Template');
  });

  it('should filter all the templates', function () {
    deferred.resolve(getTemplatesSuccess('chat', templateList));
    callbackDeferred.resolve(getTemplatesSuccess('callback', templateList));
    chatPlusCallbackDeferred.resolve(getTemplatesSuccess('chatPlusCallback', templateList));
    $scope.$apply();
    controller.setFilter('all');
    expect(controller.filteredListOfFeatures.length).toEqual(templateList.length);
  });

  it('should filter the list of templates to zero length', function () {
    deferred.resolve(getTemplatesSuccess('chat', templateList));
    callbackDeferred.resolve(getTemplatesSuccess('callback', templateList));
    chatPlusCallbackDeferred.resolve(getTemplatesSuccess('chatPlusCallback', templateList));
    $scope.$apply();
    controller.setFilter('XX');
    expect(controller.filteredListOfFeatures.length).toEqual(0);
  });

  it('set the view to searched data and the chat template should come first and then callback template', function () {
    deferred.resolve(getTemplatesSuccess('chat', templateList));
    callbackDeferred.resolve(getTemplatesSuccess('callback', templateList));
    chatPlusCallbackDeferred.resolve(getTemplatesSuccess('chatPlusCallback', templateList));
    $scope.$apply();
    controller.searchData('Dev');
    expect(controller.filteredListOfFeatures.length).toEqual(3);
    expect(controller.filteredListOfFeatures[0].name).toEqual('Sunlight Dev Template');
    expect(controller.filteredListOfFeatures[1].name).toEqual('Sunlight Callback Dev Template');
    expect(controller.filteredListOfFeatures[2].name).toEqual('Sunlight Chat+Callback Dev Template');
  });

  it('set the view to the searched data which is case insensitive and the chat template should come first and then callback template', function () {
    deferred.resolve(getTemplatesSuccess('chat', templateList));
    callbackDeferred.resolve(getTemplatesSuccess('callback', templateList));
    chatPlusCallbackDeferred.resolve(getTemplatesSuccess('chatPlusCallback', templateList));
    $scope.$apply();
    controller.searchData('Dev');
    expect(controller.filteredListOfFeatures.length).toEqual(3);
    expect(controller.filteredListOfFeatures[0].name).toEqual('Sunlight Dev Template');
    expect(controller.filteredListOfFeatures[1].name).toEqual('Sunlight Callback Dev Template');
    expect(controller.filteredListOfFeatures[2].name).toEqual('Sunlight Chat+Callback Dev Template');
    controller.searchData('dev');
    expect(controller.filteredListOfFeatures.length).toEqual(3);
    expect(controller.filteredListOfFeatures[0].name).toEqual('Sunlight Dev Template');
    expect(controller.filteredListOfFeatures[1].name).toEqual('Sunlight Callback Dev Template');
    expect(controller.filteredListOfFeatures[2].name).toEqual('Sunlight Chat+Callback Dev Template');
  });

  it('should filter the searched data from the list of Chat templates only', function () {
    deferred.resolve(getTemplatesSuccess('chat', templateList));
    callbackDeferred.resolve(getTemplatesSuccess('callback', templateList));
    chatPlusCallbackDeferred.resolve(getTemplatesSuccess('chatPlusCallback', templateList));
    $scope.$apply();
    controller.searchData('Dev');
    controller.setFilter('chat');
    expect(controller.filteredListOfFeatures.length).toEqual(1);
    expect(controller.filteredListOfFeatures[0].name).toEqual('Sunlight Dev Template');
  });

  it('should filter the searched data from the list of Callback templates only', function () {
    deferred.resolve(getTemplatesSuccess('chat', templateList));
    callbackDeferred.resolve(getTemplatesSuccess('callback', templateList));
    chatPlusCallbackDeferred.resolve(getTemplatesSuccess('chatPlusCallback', templateList));
    $scope.$apply();
    controller.searchData('Dev');
    controller.setFilter('callback');
    expect(controller.filteredListOfFeatures.length).toEqual(1);
    expect(controller.filteredListOfFeatures[0].name).toEqual('Sunlight Callback Dev Template');
  });

  it('should filter the searched data from the list of Chat+Callback templates only', function () {
    deferred.resolve(getTemplatesSuccess('chat', templateList));
    callbackDeferred.resolve(getTemplatesSuccess('callback', templateList));
    chatPlusCallbackDeferred.resolve(getTemplatesSuccess('chatPlusCallback', templateList));
    $scope.$apply();
    controller.searchData('Dev');
    controller.setFilter('chatPlusCallback');
    expect(controller.filteredListOfFeatures.length).toEqual(1);
    expect(controller.filteredListOfFeatures[0].name).toEqual('Sunlight Chat+Callback Dev Template');
  });
});
