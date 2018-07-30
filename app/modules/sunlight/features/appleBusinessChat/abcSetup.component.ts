import { IToolkitModalService } from 'modules/core/modal';
import { CommonSetupCtrl } from '../commonSetupCtrl';
import { AccessibilityService } from 'modules/core/accessibility';
import * as _ from 'lodash';

enum PageFocusKey {
  NAME = 'name',
}

export interface IScopeWithController extends ng.IScope {
  controller?: any;
}

interface IAbcSetupPages {
  [key: string]: boolean;
}

// TODO: refactor - do not use 'ngtemplate-loader' or ng-include directive
// preserve the ng-include module paths
const requireContext = (require as any).context(`ngtemplate-loader?module=Sunlight&relativeTo=app/!modules/sunlight/features/appleBusinessChat/wizardPages/`, false, /^\.\/.*\.tpl\.html$/);
requireContext.keys().map(key => requireContext(key));

/**
 * AbcSetupCtrl
 */
class AbcSetupCtrl extends CommonSetupCtrl {

  public animationTimeout = 10;
  public animation = '';
  public service;
  public states;
  public currentState = '';
  public maxNameLength = 250;
  public maxInputLength50 = 50;
  public maxInputLength250 = 250;
  public validateNameChars = /[<>]/i;
  public businessIdForm: ng.IFormController;
  public statusMessagesForm: ng.IFormController;

  private businessId: string;

  public template = {
    templateId: '',
    name: '',
    configuration: {
      mediaType: this.AbcService.abcServiceCard.type,
      pages: {
        abcBusinessId: {
          enabled: true,
          value: '',
          startTimeInMillis: 0,
          eventName: this.Analytics.sections.APPLE_BUSINESS_CHAT.eventNames.ABC_BUSINESS_ID_PAGE,
        },
        name: {
          enabled: true,
          nameValue: '',
          startTimeInMillis: 0,
          eventName: this.Analytics.sections.APPLE_BUSINESS_CHAT.eventNames.ABC_NAME_PAGE,
        },
        abcCvaSelection: {
          enabled: true,
          selectedCVA: {
            id: undefined,
            name: '',
          },
          configuredCVAs: [<any>{}],
          startTimeInMillis: 0,
          eventName: this.Analytics.sections.APPLE_BUSINESS_CHAT.eventNames.ABC_CVA_SELECTION_PAGE,
        },
        abcStatusMessages: {
          enabled: true,
          waitingMessage: this.$translate.instant('careChatTpl.appleBusinessChat.statusMessage.waitingDefault'),
          leftChatMessage: this.$translate.instant('careChatTpl.appleBusinessChat.statusMessage.leftTheChatDefault'),
          startTimeInMillis: 0,
          eventName: this.Analytics.sections.APPLE_BUSINESS_CHAT.eventNames.ABC_STATUS_MESSAGE,
        },
        abcSummary: {
          enabled: true,
          startTimeInMillis: 0,
          eventName: this.Analytics.sections.APPLE_BUSINESS_CHAT.eventNames.ABC_SUMMARY_PAGE,
        },
      },
    },
  };

  /* @ngInject*/
  constructor(
    public $element: ng.IRootElementService,
    public $scope: ng.IScope,
    public $state: ng.ui.IStateService,
    public $stateParams: ng.ui.IStateParamsService,
    public $modal: IToolkitModalService,
    public $translate: ng.translate.ITranslateService,
    public $timeout: ng.ITimeoutService,
    public $window: ng.IWindowService,
    public AccessibilityService: AccessibilityService,
    public Analytics,
    public Authinfo,
    public CvaService,
    public AbcService,
    public Notification,
    public UrlConfig,
  ) {
    super($element, $modal, $scope, $state, $timeout, $translate, $window, Analytics, Authinfo, Notification, UrlConfig);
    this.service = this.AbcService;
    // states == pages in order as found in storage template
    this.states = Object.keys(this.template.configuration.pages);
    this.currentState = this.states[0];
  }

  /**
   * Initialize the controller
   */
  public $onInit() {
    this.template.configuration.pages.abcBusinessId.startTimeInMillis = Date.now();

    if (this.businessId) {
      this.template.configuration.pages.abcBusinessId.value = this.businessId;
      this.template.configuration.pages.abcBusinessId.enabled = false;
    }
    if (this.$stateParams.isEditFeature) {
      this.isEditFeature = true;
      this.template.templateId = this.$stateParams.template.id;
      this.template.configuration.pages.abcBusinessId.value = this.$stateParams.template.id;
      this.template.configuration.pages.abcBusinessId.enabled = false;
      this.template.configuration.pages.name.nameValue = this.$stateParams.template.name;
      this.template.configuration.pages.abcStatusMessages.waitingMessage = this.$stateParams.template.statusMessages[0].waitingMessage;
      this.template.configuration.pages.abcStatusMessages.leftChatMessage = this.$stateParams.template.statusMessages[0].leftChatMessage;
    }
    this.loadCvaList();
  }

  /**
   * Return full path for current page template html.
   * @returns {string}
   */
  public getCurrentPage(): string {
    return `modules/sunlight/features/appleBusinessChat/wizardPages/${this.currentState}.tpl.html`;
  }

  /**
   * Function to obtain translated string off apple business chat's area for strings
   * @param textIdExtension
   * @returns {string}
   */
  public getText(textIdExtension: string, params?: object): string {
    const featureName = this.service.getFeatureName();
    return this.$translate.instant('careChatTpl.appleBusinessChat.' + textIdExtension, (<any>Object).assign({ featureName }, params));
  }

  /**
   * Function to obtain literal key for later lookup/translation.
   * @param textIdExtension
   * @returns {string}
   */
  public getMessageKey(textIdExtension: string): string {
    return 'careChatTpl.appleBusinessChat.' + textIdExtension;
  }

  /**
   * obtain help text for name input
   * @returns {*}
   */
  public getNameHint(): string {
    const featureName = this.service.getFeatureName();
    return this.getText('name.nameHint', { featureName });
  }

  /**
   * obtain description for summary page
   * @returns {*}
   */
  public getSummaryDescription(): string {
    const name = this.template.configuration.pages.name.nameValue;
    let textString = 'summary.abcDesc';
    if (this.isEditFeature) {
      textString += 'Edit';
    }
    return this.getText(textString, { name });
  }

  private pageFocus: IAbcSetupPages = {};
  private unsetFocus() {
    _.forEach(this.pageFocus, (_value, key: PageFocusKey) => {
      this.pageFocus[key] = false;
    });
  }

  /**
   * should next button be rendered.
   * @returns {boolean}
   */
  public nextButton(): any {
    switch (this.currentState) {
      case 'abcBusinessId':
        return this.isBusinessIdPageValid();
      case 'name':
        this.unsetFocus();
        return this.isNamePageValid();
      case 'abcCvaSelection':
        return true;
      case 'abcStatusMessages':
        return this.isStatusMessagesValid();
      case 'abcSummary':
        return 'hidden';
    }
  }

  /**
   * Move backwards to previous page in modal series.
   */
  public previousPage(): void {
    const controller = this;
    controller.animation = 'slide-right';
    controller.saveTemplateErrorOccurred = false;
    controller.templateButtonText = this.$translate.instant('common.finish');
    controller.retryButtonDisabled = false;
    controller.$timeout(function () {
      controller.currentState = controller.getAdjacentEnabledState(controller.getPageIndex(), -1);
    }, controller.animationTimeout);
  }

  public isWaitingMessageValid(): boolean {
    const waitingMessage = (this.template.configuration.pages.abcStatusMessages.waitingMessage || '').trim();
    const isWaitingLengthValid = (_.get(waitingMessage, 'length', 0) <= this.maxInputLength50);
    const areWaitingCharsValid = !RegExp(this.validateNameChars).test(waitingMessage);

    if (this.statusMessagesForm) {
      this.statusMessagesForm.waitingMessageInput.$setValidity('maxlength', isWaitingLengthValid);
      this.statusMessagesForm.waitingMessageInput.$setValidity('invalidInput', areWaitingCharsValid);
    }

    return (isWaitingLengthValid && areWaitingCharsValid);
  }

  public isLeftChatMessageValid(): boolean {
    const leftChatMessage = (this.template.configuration.pages.abcStatusMessages.leftChatMessage || '').trim();
    const isLeftChatLengthValid = (_.get(leftChatMessage, 'length', 0) <= this.maxInputLength250);
    const areLeftChatCharsValid = !RegExp(this.validateNameChars).test(leftChatMessage);
    if (this.statusMessagesForm) {
      this.statusMessagesForm.leftChatMessageInput.$setValidity('maxlength', isLeftChatLengthValid);
      this.statusMessagesForm.leftChatMessageInput.$setValidity('invalidInput', areLeftChatCharsValid);
    }
    return (isLeftChatLengthValid && areLeftChatCharsValid);
  }

  public isStatusMessagesValid(): boolean {
    return this.isWaitingMessageValid() && this.isLeftChatMessageValid();
  }

  public isNameValid(): boolean {
    const name = (this.template.configuration.pages.name.nameValue || '').trim();
    const isLengthValid = (_.get(name, 'length', 0) <= this.maxNameLength);
    const areCharsValid = !RegExp(this.validateNameChars).test(name);
    if (this.nameForm && name) {
      this.nameForm.nameInput.$setValidity(this.NameErrorMessages.ERROR_CHAR_250, isLengthValid);
      this.nameForm.nameInput.$setValidity(this.NameErrorMessages.INVALID_CHARS, areCharsValid);
    }

    return (isLengthValid && areCharsValid);
  }

  public isNamePageValid(): boolean {
    const name = (this.template.configuration.pages.name.nameValue || '').trim();
    return name !== '' && this.isNameValid();
  }

  public isBusinessIdPageValid(): boolean {
    const businessIdValue = (this.template.configuration.pages.abcBusinessId.value || '').trim();
    return businessIdValue !== '';
  }

  private loadCvaList(): void {
    const controller = this;
    this.CvaService.listConfigs().then(function (result) {
      controller.template.configuration.pages.abcCvaSelection.configuredCVAs = [{ name: controller.getText('cvaSelection.virtualAssistantSelectText') }];
      const sortedCVAs = _.sortBy(result.items, [item => item.name.toLowerCase()]);
      controller.template.configuration.pages.abcCvaSelection.configuredCVAs.push(...sortedCVAs);
      controller.setSelectedCva();
    }, function (error) {
      controller.template.configuration.pages.abcCvaSelection.configuredCVAs = [];
      controller.Notification.errorWithTrackingId(error, 'abcService.getCustomerVirtualAssistantListError');
    });
  }

  private setSelectedCva(): void {
    //show selected CVA on edit
    if (this.isEditFeature) {
      const selectedCva = _.find(this.template.configuration.pages.abcCvaSelection.configuredCVAs, {
        id: this.$stateParams.template.cvaId,
      });
      if (selectedCva) {
        this.template.configuration.pages.abcCvaSelection.selectedCVA.name = selectedCva.name;
        this.template.configuration.pages.abcCvaSelection.selectedCVA.id = selectedCva.id;
      }
    }
  }

  public submitFeature(): void {
    const businessId = this.template.configuration.pages.abcBusinessId.value.trim();
    const name = this.template.configuration.pages.name.nameValue.trim();
    const cvaId = this.template.configuration.pages.abcCvaSelection.selectedCVA.id;
    const waitingMessage = this.template.configuration.pages.abcStatusMessages.waitingMessage.trim();
    const leftChatMessage = this.template.configuration.pages.abcStatusMessages.leftChatMessage.trim();
    this.creatingTemplate = true;
    if (this.isEditFeature) {
      this.updateFeature(businessId, name, this.orgId, waitingMessage, leftChatMessage, cvaId);
    } else {
      this.createFeature(businessId, name, this.orgId, waitingMessage, leftChatMessage, cvaId);
    }
  }

  /**
   * update the current feature
   * @param businessId
   * @param name
   * @param orgId
   * @param cvaId optional
   */
  private updateFeature(businessId: string, name: string, orgId: string, waitingMessage: string, leftChatMessage: string, cvaId?: string): void {
    const controller = this;
    controller.service.updateAbcConfig(businessId, name, orgId, waitingMessage, leftChatMessage, cvaId)
      .then(function () {
        controller.handleFeatureUpdate();
        controller.writeMetrics();
      })
      .catch(function (response) {
        controller.handleFeatureError();
        controller.Notification.errorWithTrackingId(response, 'careChatTpl.virtualAssistant.messages.updateConfigFailureText', {
          featureName: controller.$translate.instant('careChatTpl.appleBusinessChat.featureText.name'),
        });
      });
  }

  /**
   * create and store the current feature
   * @param businessId
   * @param name
   * @param orgId
   * @param cvaId optional
   */
  private createFeature(businessId: string, name: string, orgId: string, waitingMessage: string, leftChatMessage: string, cvaId?: string): void {
    const controller = this;
    controller.service.addAbcConfig(businessId, name, orgId, waitingMessage, leftChatMessage, cvaId)
      .then(function () {
        controller.handleFeatureCreation();
        controller.writeMetrics();
      })
      .catch(function (response) {
        controller.handleFeatureError();
        controller.Notification.errorWithTrackingId(response, 'careChatTpl.virtualAssistant.messages.createConfigFailureText', {
          featureName: controller.$translate.instant('careChatTpl.appleBusinessChat.featureText.name'),
        });
        controller.Analytics.trackEvent(controller.Analytics.sections.APPLE_BUSINESS_CHAT.eventNames.ABC_CREATE_FAILURE);
      });
  }

  /**
   * Writing the metrics to the mixpanel for the last page and the overall wizard
   */
  private writeMetrics(): void {
    const currentTimeInMillis = Date.now();
    let durationInMillis = currentTimeInMillis - this.template.configuration.pages.abcSummary.startTimeInMillis;
    let analyticProps = { durationInMillis: durationInMillis };
    this.Analytics.trackEvent(this.Analytics.sections.APPLE_BUSINESS_CHAT.eventNames.ABC_SUMMARY_PAGE, analyticProps);
    durationInMillis = currentTimeInMillis - this.template.configuration.pages.abcBusinessId.startTimeInMillis;
    analyticProps = { durationInMillis: durationInMillis };
    this.Analytics.trackEvent(this.Analytics.sections.APPLE_BUSINESS_CHAT.eventNames.ABC_START_FINISH, analyticProps);
    this.Analytics.trackEvent(this.Analytics.sections.APPLE_BUSINESS_CHAT.eventNames.ABC_CREATE_SUCCESS);
  }
}

/**
 * Abc Setup Component used for Creating new Apple Business Chat
 */
export class AbcSetupComponent implements ng.IComponentOptions {
  public controller = AbcSetupCtrl;
  public template = require('modules/sunlight/features/appleBusinessChat/abcSetup.tpl.html');
  public bindings = {
    dismiss: '&',
    businessId: '<',
  };
}

export default angular
  .module('Sunlight')
  .component('abcSetup', new AbcSetupComponent());