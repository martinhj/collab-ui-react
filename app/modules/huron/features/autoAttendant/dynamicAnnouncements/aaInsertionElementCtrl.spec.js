'use strict';

describe('Controller: AAInsertionElementCtrl', function () {
  var AutoAttendantCeMenuModelService, AAUiModelService;
  var controller, $controller;
  var $rootScope, $scope, $window;
  var $q;
  var $modal, modal;
  var action;
  var schedule = 'openHours';
  var ui = {
    openHours: {},
  };
  var uiMenu = {};
  var menuEntry = {};
  var index = '0';
  var ele = '<aa-insertion-element element-text="testValue" read-as="testReadValue" element-id="1011"></aa-insertion-element>';

  beforeEach(angular.mock.module('uc.autoattendant'));
  beforeEach(angular.mock.module('Huron'));

  beforeEach(inject(function (_$rootScope_, _$controller_, _$modal_, _AutoAttendantCeMenuModelService_, _AAUiModelService_, _$q_, _$window_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope;
    $controller = _$controller_;
    $modal = _$modal_;
    $scope.schedule = schedule;
    $q = _$q_;
    $scope.index = index;
    $scope.elementId = '1011';
    $window = _$window_;
    AutoAttendantCeMenuModelService = _AutoAttendantCeMenuModelService_;
    AAUiModelService = _AAUiModelService_;
    AutoAttendantCeMenuModelService.clearCeMenuMap();
    uiMenu = AutoAttendantCeMenuModelService.newCeMenu();
    ui[schedule] = uiMenu;
    menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
    uiMenu.addEntryAt(index, menuEntry);

    spyOn(AAUiModelService, 'getUiModel').and.returnValue(ui);
    modal = $q.defer();

    controller = $controller('AAInsertionElementCtrl', {
      $scope: $scope,
    });
    $scope.$apply();
  }));

  afterEach((function () {
    $rootScope = null;
    $scope = null;
    $controller = null;
    $modal = null;
    $q = null;
    $window = null;
    AutoAttendantCeMenuModelService = null;
    AAUiModelService = null;
    uiMenu = null;
    menuEntry = null;
  }));

  describe('activate', function () {
    it('should validate controller creation', function () {
      expect(controller).toBeDefined();
      expect(controller.mainClickFn).toBeDefined();
      expect(controller.closeClickFn).toBeDefined();
    });

    describe('setUp', function () {
      beforeEach(function () {
        controller = null;
      });

      it('should validate setUp', function () {
        $scope.textValue = 'test';
        controller = $controller('AAInsertionElementCtrl', {
          $scope: $scope,
        });
        $scope.$apply();
        expect(controller.elementText).toBe('test');
      });
    });
  });

  describe('mainClickFn', function () {
    beforeEach(function () {
      spyOn($modal, 'open').and.returnValue({
        result: modal.promise,
      });
    });

    it('elementText and readAs values should be updated upon calling mainClickFn', function () {
      action = AutoAttendantCeMenuModelService.newCeActionEntry('dynamic', '');
      action.dynamicList = [{
        say: {
          value: 'testValue',
          voice: '',
          as: 'testValue',
        },
        isDynamic: true,
        htmlModel: encodeURIComponent(ele),
      }];
      menuEntry.addAction(action);
      var variableSelection = {
        label: 'testVar',
        value: 'testVal',
      };
      var readAsSelection = {
        label: 'testRead',
        value: 'testValRead',
      };
      var result = {
        variable: variableSelection,
        readAs: readAsSelection,
      };
      controller.mainClickFn();
      expect($modal.open).toHaveBeenCalled();
      modal.resolve(result);
      $scope.$apply();
      expect(controller.elementText).toBe('testVar');
      expect(controller.readAs).toBe('testValRead');
    });

    it('elementText and readAs values should be updated upon calling mainClickFn from REST block', function () {
      $scope.aaElementType = 'REST';
      controller = $controller('AAInsertionElementCtrl', {
        $scope: $scope,
      });
      $scope.$apply();
      var actionEntry = AutoAttendantCeMenuModelService.newCeActionEntry('dynamic', '');
      actionEntry.dynamicList = [{
        action: {
          eval: {
            value: 'testVar',
          },
        },
        isDynamic: true,
        htmlModel: encodeURIComponent(ele),
      }];
      menuEntry.addAction(actionEntry);
      var variableSelection = {
        label: 'testVar',
        value: 'testVal',
      };
      var result = {
        variable: variableSelection,
      };
      controller.mainClickFn();
      expect($modal.open).toHaveBeenCalled();
      modal.resolve(result);
      $scope.$apply();
      expect(controller.elementText).toBe('testVar');
    });
  });

  describe('closeClickFn', function () {
    beforeEach(function () {
      var scopeElement = {
        insertElement: function (string) {
          return string;
        },
      };
      var dynamicElement = {
        scope: function () {
          return true;
        },
        focus: function () {},
      };
      var rangeGetter = function () {
        var range = {
          collapsed: true,
          endContainer: {
            parentElement: {
              parentElement: {
                parentElement: {
                  remove: function () {
                    return '';
                  },
                },
                className: 'dynamic-prompt aa-message-height',
              },
            },
          },
        };
        return range;
      };
      spyOn(angular, 'element').and.returnValue(dynamicElement);
      spyOn(dynamicElement, 'focus');
      spyOn(dynamicElement, 'scope').and.returnValue(scopeElement);
      spyOn(scopeElement, 'insertElement');
      spyOn($window, 'getSelection').and.returnValue({
        getRangeAt: rangeGetter,
        rangeCount: true,
        removeAllRanges: function () {
          return true;
        },
        addRange: function () {
          return true;
        },
      });
      $scope.dynamicElement = 'test';
      $scope.elementId = 'test';
    });
    it('should clear out elementText and readAs upon calling of closeClickFn from say Message', function () {
      action = AutoAttendantCeMenuModelService.newCeActionEntry('dynamic', '');
      action.dynamicList = [{
        say: {
          value: 'testValue',
          voice: '',
          as: 'testValue',
        },
        isDynamic: true,
        htmlModel: encodeURIComponent(ele),
      }];
      menuEntry.addAction(action);
      controller.closeClickFn();
      expect(controller.elementText).toBe('');
      expect(controller.readAs).toBe('');
    });

    it('should clear out elementText and readAs upon calling of closeClickFn from REST CTRL', function () {
      $scope.aaElementType = 'REST';
      controller = $controller('AAInsertionElementCtrl', {
        $scope: $scope,
      });
      $scope.$apply();
      action = AutoAttendantCeMenuModelService.newCeActionEntry('dynamic', '');
      action.dynamicList = [{
        action: {
          eval: {
            value: 'testValue',
          },
        },
        isDynamic: true,
        htmlModel: encodeURIComponent(ele),
      }];
      menuEntry.addAction(action);
      controller.closeClickFn();
      expect(controller.elementText).toBe('');
      expect(controller.readAs).toBe('');
    });

    it('should clear out elementText and readAs upon calling of closeClickFn from phoneMenu', function () {
      action = AutoAttendantCeMenuModelService.newCeActionEntry('dynamic', '');
      action.dynamicList = [{
        say: {
          value: 'testValue',
          voice: '',
          as: 'testValue',
        },
        isDynamic: true,
        htmlModel: encodeURIComponent(ele),
      }];
      menuEntry.headers = [{
        actions: [],
      }];
      menuEntry.headers[0].actions.push(action);
      controller.closeClickFn();
      expect(controller.elementText).toBe('');
      expect(controller.readAs).toBe('');
    });

    it('should clear out elementText and readAs upon calling of closeClickFn from subMenu', function () {
      action = AutoAttendantCeMenuModelService.newCeActionEntry('dynamic', '');
      action.dynamicList = [{
        say: {
          value: 'testValue',
          voice: '',
          as: 'testValue',
        },
        isDynamic: true,
        htmlModel: encodeURIComponent(ele),
      }];
      menuEntry.headers = [{
        actions: [],
      }];
      menuEntry.entries = [{
        actions: [],
      }];
      menuEntry.entries[0].actions.push(action);
      controller.closeClickFn();
      expect(controller.elementText).toBe('');
      expect(controller.readAs).toBe('');
      expect(controller.elementText).toBe('');
      expect(controller.readAs).toBe('');
      expect(controller.elementText).toBe('');
      expect(controller.readAs).toBe('');
    });
  });
});
