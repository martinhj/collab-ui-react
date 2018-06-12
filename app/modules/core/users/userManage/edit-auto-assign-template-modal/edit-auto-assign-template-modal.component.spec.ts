import moduleName from './index';
import { Analytics } from 'modules/core/analytics';
import { AssignableServicesItemCategory } from 'modules/core/users/userAdd/assignable-services/shared/license-usage-util.interfaces';
import { AssignableServicesComponent } from 'modules/core/users/userAdd/assignable-services/assignable-services.component';
import { AutoAssignTemplateService } from 'modules/core/users/shared/auto-assign-template';
import { EditAutoAssignTemplateModalController } from './edit-auto-assign-template-modal.component';
import { HybridServicesEntitlementsPanelComponent } from 'modules/core/users/userAdd/hybrid-services-entitlements-panel/hybrid-services-entitlements-panel.component';
import { Notification } from 'modules/core/notifications';

type Test = atlas.test.IComponentTest<EditAutoAssignTemplateModalController, {
  $httpBackend: ng.IHttpBackendService,
  $q: ng.IQService,
  $scope: ng.IScope,
  $state: ng.ui.IStateService,
  Analytics: Analytics,
  AutoAssignTemplateService: AutoAssignTemplateService,
  Notification: Notification,
}, {
  components: {
    assignableServices: atlas.test.IComponentSpy<AssignableServicesComponent>,
    hybridServicesEntitlementsPanel: atlas.test.IComponentSpy<HybridServicesEntitlementsPanelComponent>,
  },
  getDefaultStateDataDeferred: ng.IDeferred<any>,
}>;

describe('Component: editAutoAssignTemplateModal:', () => {
  beforeEach(function (this: Test) {
    this.components = {
      assignableServices: this.spyOnComponent('assignableServices'),
      hybridServicesEntitlementsPanel: this.spyOnComponent('hybridServicesEntitlementsPanel'),
    };
    this.initModules(
      moduleName,
      this.components.assignableServices,
      this.components.hybridServicesEntitlementsPanel,
    );
    this.injectDependencies(
      '$httpBackend',
      '$q',
      '$scope',
      '$state',
      'Analytics',
      'AutoAssignTemplateService',
      'Notification',
    );
    this.autoAssignTemplateData = {};
    this.$scope.dismiss = _.noop;
    this.getDefaultStateDataDeferred = this.$q.defer();
    spyOn(this.AutoAssignTemplateService, 'getDefaultStateData').and.returnValue(this.getDefaultStateDataDeferred.promise);
  });

  afterEach(function (this: Test) {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  enum View {
    ASSIGNABLE_SERVICES = 'assignable-services',
    BACK_BUTTON = 'button.btn.back',
    CLOSE_BUTTON = 'button.close[aria-label="common.close"]',
    HYBRID_SERVICES = 'hybrid-services-entitlements-panel',
    LOADING_SPINNER = '.text-center .icon.icon-5x.icon-spinner',
    NEXT_BUTTON = 'button.btn.next',
  }

  describe('primary behaviors (view):', () => {
    beforeEach(function (this: Test) {
      this.compileComponent('editAutoAssignTemplateModal', {});
    });

    it('should always render a title, a header, a description, and a tooltip', function (this: Test) {
      expect(this.view.find('.modal-header > h3[translate]').get(0)).toHaveText('userManage.autoAssignTemplate.edit.title');
      expect(this.view.find('.modal-body > h4[translate]').get(0)).toHaveText('userManage.autoAssignTemplate.edit.header');
      expect(this.view.find('.modal-body > p[translate]').get(0)).toHaveText('userManage.autoAssignTemplate.edit.description');
      expect(this.view.find('.modal-body > p > span[translate]').get(0)).toHaveText('userManage.autoAssignTemplate.edit.note');
      expect(this.view.find('.modal-body > p > a > i.icon-info[tooltip="userManage.autoAssignTemplate.edit.tooltip"]').length).toBe(1);
    });

    it('should always render a back and a next button', function (this: Test) {
      expect(this.view.find(View.BACK_BUTTON)).toExist();
      expect(this.view.find(View.NEXT_BUTTON)).toExist();
    });

    it('should render loading until getDefaultStateData() resolves', function (this: Test) {
      expect(this.view.find(View.LOADING_SPINNER)).toExist();
      expect(this.view.find(View.ASSIGNABLE_SERVICES)).not.toExist();
      expect(this.view.find(View.HYBRID_SERVICES)).not.toExist();

      this.getDefaultStateDataDeferred.resolve(this.autoAssignTemplateData);
      this.$scope.$apply();

      expect(this.view.find(View.LOADING_SPINNER)).not.toExist();
      expect(this.view.find(View.ASSIGNABLE_SERVICES)).toExist();
      expect(this.view.find(View.HYBRID_SERVICES)).toExist();
    });

    it('should show an error and go back to the previous state if getDefaultStateData() rejects', function (this: Test) {
      spyOn(this.controller, 'back');
      spyOn(this.Notification, 'errorResponse');

      this.getDefaultStateDataDeferred.reject('fake-get-default-state-data-rejection');
      this.$scope.$apply();

      expect(this.Notification.errorResponse).toHaveBeenCalledWith('fake-get-default-state-data-rejection', 'userManage.org.modifyAutoAssign.modifyError');
      expect(this.controller.back).toHaveBeenCalled();
    });

    it('should not show loading if autoAssignTemplateData is provided to component', function (this: Test) {
      this.compileComponent('editAutoAssignTemplateModal', {
        autoAssignTemplateData: this.autoAssignTemplateData,
      });
      expect(this.view.find(View.LOADING_SPINNER)).not.toExist();
      expect(this.view.find(View.ASSIGNABLE_SERVICES)).toExist();
      expect(this.view.find(View.HYBRID_SERVICES)).toExist();
    });
  });

  describe('primary behaviors (child component bindings):', () => {
    beforeEach(function (this: Test) {
      this.getDefaultStateDataDeferred.resolve(this.autoAssignTemplateData);
      this.compileComponent('editAutoAssignTemplateModal', {});
    });

    it('should receive updates from "hybrid-services-entitlements-panel" component with "recvHybridServicesEntitlementsUpdate()"', function () {
      spyOn(this.controller, 'recvHybridServicesEntitlementsUpdate');
      this.components.hybridServicesEntitlementsPanel.bindings[0].entitlementsCallback();
      expect(this.controller.recvHybridServicesEntitlementsUpdate).toHaveBeenCalled();
    });

    it('should receive updates from "assignable-services" component with "recvUpdate"', function () {
      spyOn(this.controller, 'recvUpdate');
      this.components.assignableServices.bindings[0].onUpdate();
      expect(this.controller.recvUpdate).toHaveBeenCalled();
    });
  });

  describe('primary behaviors (controller):', () => {
    beforeEach(function (this: Test) {
      spyOn(this.$state, 'go');
      _.set(this.autoAssignTemplateData, 'subscriptions', []);
      spyOn(this.Analytics, 'trackAddUsers');
      this.compileComponent('editAutoAssignTemplateModal', {
        prevState: "'fake-previous-state'",
        isEditTemplateMode: true,
        autoAssignTemplateData: this.autoAssignTemplateData,
        dismiss: 'dismiss',
      });
    });

    it('should navigate to previous state when back button is clicked', function (this: Test) {
      this.view.find(View.BACK_BUTTON).click();
      expect(this.$state.go).toHaveBeenCalledWith('users.manage.org');
    });

    it('should navigate to the next state when next button is clicked', function (this: Test) {
      this.view.find(View.NEXT_BUTTON).click();
      expect(this.$state.go).toHaveBeenCalledWith('users.manage.edit-summary-auto-assign-template-modal', {
        autoAssignTemplateData: this.autoAssignTemplateData,
        isEditTemplateMode: true,
      });
    });

    it('should track the event when the modal is dismissed', function (this: Test) {
      this.view.find(View.CLOSE_BUTTON).click();
      expect(this.Analytics.trackAddUsers).toHaveBeenCalledWith(this.Analytics.eventNames.CANCEL_MODAL);
    });

    it('isHybridCallSelected should be true if squaredFusionUC.isSelected is true and call license should be disabled', function () {
      this.$scope.fakePrevState = 'fake-prev-state';
      _.set(this.autoAssignTemplateData, 'viewData.USER_ENTITLEMENT.squaredFusionUC.isSelected', true);
      _.set(this.autoAssignTemplateData, 'viewData.LICENSE', {
        isDisabled: this.controller.isHybridCallSelected,
        license: {
          offerName: 'CO',
        },
      });
      this.compileComponent('editAutoAssignTemplateModal', {
        prevState: 'fakePrevState',
        isEditTemplateMode: false,
        autoAssignTemplateData: this.autoAssignTemplateData,
        dismiss: 'dismiss',
      });
      expect(this.controller.isHybridCallSelected).toBe(true);
      expect(this.autoAssignTemplateData.viewData.LICENSE.isDisabled).toBe(true);
    });

    it('should disable huron call licenses if "recvHybridServicesEntitlementsUpdate()" is called with an active hybrid call entitlement', function () {
      this.$scope.fakePrevState = 'fake-prev-state';
      _.set(this.autoAssignTemplateData, 'viewData.LICENSE', {
        'fake-license-id-1': {
          isDisabled: false,
          license: {
            offerName: 'CO',
          },
        },
        'fake-license-id-2': {
          isDisabled: false,
          license: {
            offerName: 'CO',
          },
        },
        'fake-license-id-3': {
          isDisabled: false,
          license: {
            offerName: 'MS',
          },
        },
      });
      this.compileComponent('editAutoAssignTemplateModal', {
        autoAssignTemplateData: this.autoAssignTemplateData,
      });
      const fakeEntitlements = [{
        entitlementName: 'squaredFusionUC',
        entitlementState: 'ACTIVE',
      }];
      spyOn(this.controller, 'updateHuronCallLicenses').and.callThrough();
      this.controller.recvHybridServicesEntitlementsUpdate(fakeEntitlements);
      expect(this.controller.updateHuronCallLicenses).toHaveBeenCalled();
      expect(this.controller.autoAssignTemplateData.viewData.LICENSE['fake-license-id-1'].isDisabled).toBe(true);
      expect(this.controller.autoAssignTemplateData.viewData.LICENSE['fake-license-id-2'].isDisabled).toBe(true);
      expect(this.controller.autoAssignTemplateData.viewData.LICENSE['fake-license-id-3'].isDisabled).toBe(false);
    });
  });

  describe('helper methods:', () => {
    beforeEach(function () {
      this.compileComponent('editAutoAssignTemplateModal', {
        autoAssignTemplateData: {
          viewData: {},
        },
      });
    });

    describe('updateAutoAssignTemplateDataViewData()', () => {
      it('should set an item entry in view data', function () {
        const itemId = 'fakeLicenseId';
        const itemCategory = AssignableServicesItemCategory.LICENSE;
        const item = 'fake-item';
        this.controller.updateAutoAssignTemplateDataViewData({ itemId, itemCategory, item });
        expect(this.controller.autoAssignTemplateData.viewData.LICENSE['fakeLicenseId']).toBe('fake-item');
      });
    });

    describe('trackItemSelectionChange()', () => {
      it('should delete the existing entry if item was already tracked for the opposite "isSelected" value', function () {
        const fakeItemSelectionChange = {
          itemId: 'fakeItemId',
          itemCategory: 'fakeItemCategory',
          isSelected: false,
        };
        // item change (false), existing entry (true) => existing entry is deleted
        _.set(fakeItemSelectionChange, 'isSelected', false);
        _.set(this.controller, `autoAssignTemplateData.userChangesData.fakeItemCategory.fakeItemId.isSelected`, true);
        this.controller.trackItemSelectionChange(fakeItemSelectionChange);
        expect(_.get(this.controller, `autoAssignTemplateData.userChangesData.fakeItemCategory.fakeItemId`)).not.toBeDefined();

        // item change (false), existing entry (false) => existing entry remains
        _.set(fakeItemSelectionChange, 'isSelected', false);
        _.set(this.controller, `autoAssignTemplateData.userChangesData.fakeItemCategory.fakeItemId.isSelected`, false);
        this.controller.trackItemSelectionChange(fakeItemSelectionChange);
        expect(_.get(this.controller, `autoAssignTemplateData.userChangesData.fakeItemCategory.fakeItemId`)).toBeDefined();

        // item change (true), existing entry (false) => existing entry is deleted
        _.set(fakeItemSelectionChange, 'isSelected', true);
        _.set(this.controller, `autoAssignTemplateData.userChangesData.fakeItemCategory.fakeItemId.isSelected`, false);
        this.controller.trackItemSelectionChange(fakeItemSelectionChange);
        expect(_.get(this.controller, `autoAssignTemplateData.userChangesData.fakeItemCategory.fakeItemId`)).not.toBeDefined();

        // item change (true), existing entry (true) => existing entry remains
        _.set(fakeItemSelectionChange, 'isSelected', true);
        _.set(this.controller, `autoAssignTemplateData.userChangesData.fakeItemCategory.fakeItemId.isSelected`, true);
        this.controller.trackItemSelectionChange(fakeItemSelectionChange);
        expect(_.get(this.controller, `autoAssignTemplateData.userChangesData.fakeItemCategory.fakeItemId`)).toBeDefined();
      });

      it('should skip creating an entry if an item change is already represented by the existing template', function () {
        const fakeItemSelectionChange = {};
        // no changes tracked yet
        _.set(this.controller, 'autoAssignTemplateData.userChangesData', {});

        // change already represented
        spyOn(this.controller, 'isChangeAlreadyRepresented').and.returnValue(true);

        // no entry added
        this.controller.trackItemSelectionChange(fakeItemSelectionChange);
        expect(_.isEmpty(this.controller.autoAssignTemplateData.userChangesData)).toBe(true);
      });

      it('should create an entry if an item change has not yet been tracked, and is not represented by the existing template', function () {
        const fakeItemSelectionChange = {
          itemId: 'fakeItemId',
          itemCategory: 'fakeItemCategory',
          isSelected: true,
        };
        // no changes tracked yet
        _.set(this.controller, 'autoAssignTemplateData.userChangesData', {});

        // change is not represented
        spyOn(this.controller, 'isChangeAlreadyRepresented').and.returnValue(false);

        // entry is added
        this.controller.trackItemSelectionChange(fakeItemSelectionChange);
        expect(this.controller.autoAssignTemplateData.userChangesData.fakeItemCategory.fakeItemId).toEqual({
          isSelected: true,
        });
      });
    });

    describe('isChangeAlreadyRepresented()', () => {
      it('should return the opposite of "isSelected", if item is not found in existing template', function () {
        // license
        const fakeItemSelectionChange = {
          itemId: 'fakeLicenseId',
          itemCategory: AssignableServicesItemCategory.LICENSE,
          isSelected: false,
        };

        // item not found
        spyOn(this.AutoAssignTemplateService, 'getLicenseOrUserEntitlement').and.returnValue(undefined);
        expect(this.controller.isChangeAlreadyRepresented(fakeItemSelectionChange)).toBe(true);

        _.set(fakeItemSelectionChange, 'isSelected', true);
        expect(this.controller.isChangeAlreadyRepresented(fakeItemSelectionChange)).toBe(false);

        // user entitlement
        _.set(fakeItemSelectionChange, 'itemId', 'fakeUserEntitlementId');
        _.set(fakeItemSelectionChange, 'itemCategory', AssignableServicesItemCategory.USER_ENTITLEMENT);
        _.set(fakeItemSelectionChange, 'isSelected', false);
        expect(this.controller.isChangeAlreadyRepresented(fakeItemSelectionChange)).toBe(true);

        _.set(fakeItemSelectionChange, 'isSelected', true);
        expect(this.controller.isChangeAlreadyRepresented(fakeItemSelectionChange)).toBe(false);
      });

      it('should return true if "isSelected" matches the enabled state of the existing item', function () {
        const fakeItemSelectionChange = {};
        spyOn(this.AutoAssignTemplateService, 'getLicenseOrUserEntitlement').and.returnValue('fake-getLicenseOrUserEntitlement-result');

        // false === false
        _.set(fakeItemSelectionChange, 'isSelected', false);
        spyOn(this.AutoAssignTemplateService, 'getIsEnabled').and.returnValue(false);
        expect(this.controller.isChangeAlreadyRepresented(fakeItemSelectionChange)).toBe(true);

        // true === false
        _.set(fakeItemSelectionChange, 'isSelected', true);
        this.AutoAssignTemplateService.getIsEnabled.and.returnValue(false);
        expect(this.controller.isChangeAlreadyRepresented(fakeItemSelectionChange)).toBe(false);

        // false === true
        _.set(fakeItemSelectionChange, 'isSelected', false);
        this.AutoAssignTemplateService.getIsEnabled.and.returnValue(true);
        expect(this.controller.isChangeAlreadyRepresented(fakeItemSelectionChange)).toBe(false);

        // true === true
        _.set(fakeItemSelectionChange, 'isSelected', true);
        this.AutoAssignTemplateService.getIsEnabled.and.returnValue(true);
        expect(this.controller.isChangeAlreadyRepresented(fakeItemSelectionChange)).toBe(true);
      });
    });

    describe('allowNext()', () => {
      it('should return true if both "hasSelectionChanges()" and "targetStateViewDataHasSelections()" are true, false otherwise', function () {
        spyOn(this.controller, 'hasSelectionChanges').and.returnValue(true);
        spyOn(this.controller, 'targetStateViewDataHasSelections').and.returnValue(true);
        expect(this.controller.allowNext()).toBe(true);

        this.controller.hasSelectionChanges.and.returnValue(false);
        this.controller.targetStateViewDataHasSelections.and.returnValue(true);
        expect(this.controller.allowNext()).toBe(false);

        this.controller.hasSelectionChanges.and.returnValue(true);
        this.controller.targetStateViewDataHasSelections.and.returnValue(false);
        expect(this.controller.allowNext()).toBe(false);

        this.controller.hasSelectionChanges.and.returnValue(false);
        this.controller.targetStateViewDataHasSelections.and.returnValue(false);
        expect(this.controller.allowNext()).toBe(false);
      });
    });

    describe('mkTargetStateViewData()', () => {
      it('calls "AutoAssignTemplateService.toViewData()" to get an initial state object', function () {
        const fakeTemplateData = {};
        _.set(this.controller, 'autoAssignTemplateData.apiData.template', fakeTemplateData);
        spyOn(this.AutoAssignTemplateService, 'toViewData').and.callThrough();
        this.controller.mkTargetStateViewData();
        expect(this.AutoAssignTemplateService.toViewData).toHaveBeenCalledWith(fakeTemplateData);
      });

      it('should return an object composed of existing template data overlayed with user changes data', function () {
        function mkFakeViewData () {
          const fakeViewData = {};
          _.set(fakeViewData, `${AssignableServicesItemCategory.LICENSE}.fakeLicenseId.isSelected`, true);
          _.set(fakeViewData, `${AssignableServicesItemCategory.USER_ENTITLEMENT}.fakeUserEntitlementId.isSelected`, true);
          return fakeViewData;
        }
        spyOn(this.AutoAssignTemplateService, 'toViewData').and.returnValue(mkFakeViewData());

        // no user changes data, just use existing template data
        let result = this.controller.mkTargetStateViewData();
        expect(result.LICENSE).toEqual({
          fakeLicenseId: {
            isSelected: true,
          },
        });
        expect(result.USER_ENTITLEMENT).toEqual({
          fakeUserEntitlementId: {
            isSelected: true,
          },
        });

        // user changes data has license item unselected
        this.AutoAssignTemplateService.toViewData.and.returnValue(mkFakeViewData());
        _.set(this.controller, `autoAssignTemplateData.userChangesData.${AssignableServicesItemCategory.LICENSE}.fakeLicenseId.isSelected`, false);
        result = this.controller.mkTargetStateViewData();
        expect(result.LICENSE).toEqual({
          fakeLicenseId: {
            isSelected: false,
          },
        });
        expect(result.USER_ENTITLEMENT).toEqual({
          fakeUserEntitlementId: {
            isSelected: true,
          },
        });

        // user changes data has license item and user-entitlement item unselected
        this.AutoAssignTemplateService.toViewData.and.returnValue(mkFakeViewData());
        _.set(this.controller, `autoAssignTemplateData.userChangesData.${AssignableServicesItemCategory.USER_ENTITLEMENT}.fakeUserEntitlementId.isSelected`, false);
        result = this.controller.mkTargetStateViewData();
        expect(result.LICENSE).toEqual({
          fakeLicenseId: {
            isSelected: false,
          },
        });
        expect(result.USER_ENTITLEMENT).toEqual({
          fakeUserEntitlementId: {
            isSelected: false,
          },
        });

        // user changes data has other items selected (results are union of both sources)
        this.AutoAssignTemplateService.toViewData.and.returnValue(mkFakeViewData());
        _.unset(this.controller, `autoAssignTemplateData.userChangesData`);
        _.set(this.controller, `autoAssignTemplateData.userChangesData.${AssignableServicesItemCategory.LICENSE}.fakeLicenseId2.isSelected`, false);
        _.set(this.controller, `autoAssignTemplateData.userChangesData.${AssignableServicesItemCategory.USER_ENTITLEMENT}.fakeUserEntitlementId2.isSelected`, false);
        result = this.controller.mkTargetStateViewData();
        expect(result.LICENSE).toEqual({
          fakeLicenseId: {
            isSelected: true,
          },
          fakeLicenseId2: {
            isSelected: false,
          },
        });
        expect(result.USER_ENTITLEMENT).toEqual({
          fakeUserEntitlementId: {
            isSelected: true,
          },
          fakeUserEntitlementId2: {
            isSelected: false,
          },
        });
      });
    });

    describe('targetStateViewDataHasSelections()', () => {
      it('should return true if either "targetStateHasLicenseSelections()" or "targetStateHasUserEntitlementSelections()" return true', function () {
        spyOn(this.controller, 'mkTargetStateViewData');
        spyOn(this.controller, 'targetStateHasLicenseSelections').and.returnValue(false);
        spyOn(this.controller, 'targetStateHasUserEntitlementSelections').and.returnValue(false);
        expect(this.controller.targetStateViewDataHasSelections()).toBe(false);

        this.controller.targetStateHasLicenseSelections.and.returnValue(true);
        this.controller.targetStateHasUserEntitlementSelections.and.returnValue(false);
        expect(this.controller.targetStateViewDataHasSelections()).toBe(true);

        this.controller.targetStateHasLicenseSelections.and.returnValue(false);
        this.controller.targetStateHasUserEntitlementSelections.and.returnValue(true);
        expect(this.controller.targetStateViewDataHasSelections()).toBe(true);

        this.controller.targetStateHasLicenseSelections.and.returnValue(true);
        this.controller.targetStateHasUserEntitlementSelections.and.returnValue(true);
        expect(this.controller.targetStateViewDataHasSelections()).toBe(true);
      });
    });

    describe('targetStateHasLicenseSelections()', () => {
      it('should return true if at least one license item in view data is selected', function () {
        const fakeViewData = {};
        expect(this.controller.targetStateHasLicenseSelections(fakeViewData)).toBe(false);
        _.set(fakeViewData, `${AssignableServicesItemCategory.LICENSE}.fakeLicenseId`, { isSelected: false });
        expect(this.controller.targetStateHasLicenseSelections(fakeViewData)).toBe(false);
        _.set(fakeViewData, `${AssignableServicesItemCategory.LICENSE}.fakeLicenseId`, { isSelected: true });
        expect(this.controller.targetStateHasLicenseSelections(fakeViewData)).toBe(true);
      });
    });

    describe('targetStateHasUserEntitlementSelections()', () => {
      it('should return true if at least one user-entitlement item in view data is selected', function () {
        const fakeViewData = {};
        expect(this.controller.targetStateHasUserEntitlementSelections(fakeViewData)).toBe(false);
        _.set(fakeViewData, `${AssignableServicesItemCategory.USER_ENTITLEMENT}.fakeUserEntitlementId`, { isSelected: false });
        expect(this.controller.targetStateHasUserEntitlementSelections(fakeViewData)).toBe(false);
        _.set(fakeViewData, `${AssignableServicesItemCategory.USER_ENTITLEMENT}.fakeUserEntitlementId`, { isSelected: true });
        expect(this.controller.targetStateHasUserEntitlementSelections(fakeViewData)).toBe(true);
      });
    });

    describe('hasSelectionChanges()', () => {
      it('should return true if either "userChangesData.LICENSE" or "userChangesData.USER_ENTITLEMENT" collections in are not empty', function () {
        expect(this.controller.hasSelectionChanges()).toBe(false);
        _.set(this.controller, `autoAssignTemplateData.userChangesData.${AssignableServicesItemCategory.LICENSE}.fakeLicenseId`, 'fake-license-item');
        expect(this.controller.hasSelectionChanges()).toBe(true);
        _.unset(this.controller, `autoAssignTemplateData.userChangesData.${AssignableServicesItemCategory.LICENSE}.fakeLicenseId`);
        expect(this.controller.hasSelectionChanges()).toBe(false);
        _.set(this.controller, `autoAssignTemplateData.userChangesData.${AssignableServicesItemCategory.USER_ENTITLEMENT}.fakeUserEntitlementId`, 'fake-user-entitlement-item');
        expect(this.controller.hasSelectionChanges()).toBe(true);
      });
    });

    describe('(get) footerWarningL10nKey:', () => {
      it('should return empty string if not in edit template mode, if the pending template has selections, or "autoAssignTemplateData" property is not initialized yet', function () {
        spyOn(this.controller, 'targetStateViewDataHasSelections');
        this.controller.isEditTemplateMode = false;
        this.controller.targetStateViewDataHasSelections.and.returnValue(true);
        this.controller.autoAssignTemplateData = undefined;
        expect(this.controller.footerWarningL10nKey).toBe('');

        this.controller.isEditTemplateMode = true;
        this.controller.targetStateViewDataHasSelections.and.returnValue(true);
        this.controller.autoAssignTemplateData = undefined;
        expect(this.controller.footerWarningL10nKey).toBe('');

        this.controller.isEditTemplateMode = true;
        this.controller.targetStateViewDataHasSelections.and.returnValue(false);
        this.controller.autoAssignTemplateData = undefined;
        expect(this.controller.footerWarningL10nKey).toBe('');
      });

      it('should return l10n key for footer warning message if in edit mode, pending template has no selections, and "autoAssignTemplateData" property has been initialized', function () {
        this.controller.isEditTemplateMode = true;
        spyOn(this.controller, 'targetStateViewDataHasSelections').and.returnValue(false);
        this.controller.autoAssignTemplateData = 'fake-autoAssignTemplateData';
        expect(this.controller.footerWarningL10nKey).toBe('userManage.autoAssignTemplate.edit.warningFooter');
      });
    });
  });
});