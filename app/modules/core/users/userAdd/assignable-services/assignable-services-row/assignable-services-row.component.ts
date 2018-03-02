import { AssignableServicesItemCategory, ILicenseUsage, ISubscription } from 'modules/core/users/userAdd/assignable-services/shared';
import { OfferName } from 'modules/core/shared';
import { IAutoAssignTemplateData } from 'modules/core/users/shared/auto-assign-template';
import { MessengerInteropService } from 'modules/core/users/userAdd/shared/messenger-interop/messenger-interop.service';

class AssignableServicesRowController implements ng.IComponentController {

  public OFFER_NAME = OfferName;
  public showContent: boolean;
  private static readonly itemCategory = AssignableServicesItemCategory.SUBSCRIPTION;
  private subscription: ISubscription;
  private autoAssignTemplateData: IAutoAssignTemplateData;
  private onUpdate: Function;
  private licenses: ILicenseUsage[];
  private messageLicenses: ILicenseUsage[];
  private callLicenses: ILicenseUsage[];
  private careLicenses: ILicenseUsage[];
  private basicMeetingLicenses: ILicenseUsage[];
  private advancedMeetingLicenses: ILicenseUsage[];
  private advancedMeetingSiteUrls: string[];
  private _subscriptionLabel: string;

  /* @ngInject */
  constructor (
    private $state,
    private $translate,
    private LicenseUsageUtilService,
    private MessengerInteropService: MessengerInteropService,
  ) {}

  public $onInit(): void {
    this.licenses = this.subscription.licenses;
    this.messageLicenses = this.getMessageLicenses();
    this.callLicenses = this.getCallLicenses();
    this.careLicenses = this.getCareLicenses();
    this.basicMeetingLicenses = this.getBasicMeetingLicenses();
    this.advancedMeetingLicenses = this.getAdvancedMeetingLicenses();
    this.advancedMeetingSiteUrls = this.getAdvancedMeetingSiteUrls();

    const entryKey = `${AssignableServicesRowController.itemCategory}["${this.subscription.subscriptionId}"]`;
    this.showContent = _.get(this.autoAssignTemplateData, `viewData.${entryKey}.showContent`, true);

    this._subscriptionLabel = this.$translate.instant('userManage.autoAssignTemplate.edit.rowTitle', {
      subscriptionId: this.subscription.subscriptionId,
    });
  }

  public get subscriptionLabel(): string {
    return this._subscriptionLabel;
  }

  private getMessageLicenses(): ILicenseUsage[] {
    return this.LicenseUsageUtilService.getMessageLicenses(this.licenses);
  }

  private getCallLicenses(): ILicenseUsage[] {
    return this.LicenseUsageUtilService.getCallLicenses(this.licenses);
  }

  private getCareLicenses(): ILicenseUsage[] {
    return this.LicenseUsageUtilService.getCareLicenses(this.licenses);
  }

  private getBasicMeetingLicenses(): ILicenseUsage[] {
    return this.LicenseUsageUtilService.getBasicMeetingLicenses(this.licenses);
  }

  private getAdvancedMeetingLicenses(): ILicenseUsage[] {
    return this.LicenseUsageUtilService.getAdvancedMeetingLicenses(this.licenses);
  }

  private getAdvancedMeetingSiteUrls(): string[] {
    return this.LicenseUsageUtilService.getAdvancedMeetingSiteUrls(this.licenses);
  }

  public getLicenses(filterOptions: Object): ILicenseUsage[] {
    return this.LicenseUsageUtilService.filterLicenses(filterOptions, this.licenses);
  }

  public findLicenseForOfferName(offerName: string): ILicenseUsage | undefined {
    return this.LicenseUsageUtilService.findLicense({ offerName }, this.licenses);
  }

  public hasLicensesWith(filterOptions: Object): boolean {
    return this.LicenseUsageUtilService.hasLicensesWith(filterOptions, this.licenses);
  }

  public getTotalLicenseUsage(offerName: string): number {
    return this.LicenseUsageUtilService.getTotalLicenseUsage(offerName, this.licenses);
  }

  public getTotalLicenseVolume(offerName: string): number {
    return this.LicenseUsageUtilService.getTotalLicenseVolume(offerName, this.licenses);
  }

  // TODO:
  // - this implements a sub-optimal UX design decision to render jabber interop checkboxes within
  //   the subscription rows (which are for presenting licenses, not entitlements)
  // - rm this when no longer needed
  public showJabberInteropCheckbox(): boolean {
    // early out if not the correct UI state
    if (_.get(this.$state, 'current.name') !== 'users.manage.edit-auto-assign-template-modal') {
      return false;
    }
    return this.MessengerInteropService.hasMessengerLicense();
  }

  // notes:
  // - as of 2018-02-02, because Care licenses are allocated in a non-standard way, we disallow them
  //   from being included as selectable items in auto-assign templates
  public disableCareLicenseSelection() {
    return (_.get(this.$state, 'current.name') === 'users.manage.edit-auto-assign-template-modal');
  }

  public recvUpdate($event): void {
    this.showContent = $event.item.showContent;
    this.onUpdate({
      $event: {
        itemId: this.subscription.subscriptionId,
        itemCategory: AssignableServicesRowController.itemCategory,
        item: {
          showContent: this.showContent,
        },
      },
    });
  }
}

export class AssignableServicesRowComponent implements ng.IComponentOptions {
  public controller = AssignableServicesRowController;
  public template = require('./assignable-services-row.html');
  public bindings = {
    isCareEnabled: '<',
    subscription: '<',
    onUpdate: '&',
    autoAssignTemplateData: '<',
  };
}
