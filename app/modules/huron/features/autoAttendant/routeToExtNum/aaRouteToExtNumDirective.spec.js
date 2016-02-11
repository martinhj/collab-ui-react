'use strict';

describe('Directive: aaRouteToExtNum', function () {
  var $compile, $rootScope, $scope, $q;
  var AAUiModelService, AutoAttendantCeMenuModelService;

  var aaUiModel = {
    openHours: {},
    ceInfo: {
      name: 'aa'
    }
  };

  var schedule = 'openHours';
  var index = '0';
  var keyIndex = '0';

  beforeEach(module('Huron'));

  beforeEach(inject(function ($injector, _$compile_, _$rootScope_, _$q_, _AAUiModelService_, _AutoAttendantCeMenuModelService_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $scope = _$rootScope_;
    $q = _$q_;

    AAUiModelService = _AAUiModelService_;
    AutoAttendantCeMenuModelService = _AutoAttendantCeMenuModelService_;

    $scope.schedule = schedule;
    $scope.index = index;
    $scope.aaKey = keyIndex;
    $scope.keyIndex = keyIndex;

    spyOn(AAUiModelService, 'getUiModel').and.returnValue(aaUiModel);
    aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
    aaUiModel[schedule].addEntryAt(index, AutoAttendantCeMenuModelService.newCeMenu());

    var menuKeyEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
    var action = AutoAttendantCeMenuModelService.newCeActionEntry('route', '+14084744088');
    menuKeyEntry.addAction(action);

    aaUiModel[schedule].entries[keyIndex].addEntry(menuKeyEntry);
  }));

  it('replaces the element with the appropriate content', function () {
    var element = $compile("<aa-route-to-ext-num aa-schedule='openHours' aa-index='0' aa-key-index='0'></aa-route-to-ext-num>")($rootScope);
    $rootScope.$digest();

    expect(element.html()).toContain("aaRouteToExtNum");
  });
});