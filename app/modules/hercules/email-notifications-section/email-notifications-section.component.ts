import { Notification } from 'modules/core/notifications';

class EmailNotificationsSectionCtrl implements ng.IComponentController {
  public generalSectionTexts = {
    title: 'common.general',
  };
  public localizedAddEmailWatermark = this.$translate.instant('hercules.settings.emailNotificationsWatermark');
  public emailSubscribers: { text: string }[] = [];
  public enableEmailSendingToUser = false;
  public savingEmail = false;
  public hasCalsvcSetOrgLevelDefaultSiteNameFeatureToggle = false;
  public defaultWebExSiteOrgLevel = '';
  public defaultWebExSiteOrgLevelSelectPlaceholder = this.$translate.instant('hercules.settings.defaultWebExSiteOrgLevelSelectPlaceholder');
  public searchable = true;
  public hasCalsvcOneButtonToPushIntervalFeatureToggle = false;
  public oneButtonToPushIntervalOptions = [0, 5, 10 , 15];
  public oneButtonToPushIntervalMinutes: number | null = null;

  private serviceId: string;

  /* @ngInject */
  constructor(
    private $translate: ng.translate.ITranslateService,
    private FeatureToggleService,
    private MailValidatorService,
    private Notification: Notification,
    private ServiceDescriptor,
  ) {}

  public $onChanges(changes: {[bindings: string]: ng.IChangesObject}) {
    const { serviceId } = changes;
    if (serviceId && serviceId.currentValue) {
      this.init(serviceId.currentValue);
    }
  }

  private init(serviceId) {
    this.serviceId = serviceId;
    this.ServiceDescriptor.getEmailSubscribers(serviceId)
      .then((emailSubscribers: string[]) => {
        this.emailSubscribers = _.map(emailSubscribers, user => ({ text: user }));
      });
    this.ServiceDescriptor.getOrgSettings()
      .then(orgSettings => {
        this.enableEmailSendingToUser = !orgSettings.calSvcDisableEmailSendingToEndUser;
        if (orgSettings.calSvcDefaultWebExSite !== undefined) {
          this.defaultWebExSiteOrgLevel = orgSettings.calSvcDefaultWebExSite;
        }
        if (orgSettings.bgbIntervalMinutes !== undefined) {
          this.oneButtonToPushIntervalMinutes = orgSettings.bgbIntervalMinutes;
        }
      });
    this.FeatureToggleService.calsvcSetOrgLevelDefaultSiteNameGetStatus()
      .then(support => {
        this.hasCalsvcSetOrgLevelDefaultSiteNameFeatureToggle = support;
      });
    this.FeatureToggleService.calsvcOneButtonToPushIntervalGetStatus()
      .then(support => {
        this.hasCalsvcOneButtonToPushIntervalFeatureToggle = support;
      });
  }

  public isCalendarService() {
    return this.serviceId === 'squared-fusion-cal' || this.serviceId === 'squared-fusion-gcal';
  }

  public writeConfig() {
    const emailSubscribers = _.map(this.emailSubscribers, 'text').toString();
    if (emailSubscribers && !this.MailValidatorService.isValidEmailCsv(emailSubscribers)) {
      this.Notification.error('hercules.errors.invalidEmail');
    } else {
      this.savingEmail = true;
      this.ServiceDescriptor.setEmailSubscribers(this.serviceId, emailSubscribers)
        .then(response => {
          if (response.status === 204) {
            this.Notification.success('hercules.settings.emailNotificationsSavingSuccess');
          } else {
            this.Notification.error('hercules.settings.emailNotificationsSavingError');
          }
          this.savingEmail = false;
        });
    }
  }

  private writeEnableEmailSendingToUser = _.debounce(value => {
    this.ServiceDescriptor.setDisableEmailSendingToUser(value)
      .then(() => this.Notification.success('hercules.settings.emailUserNotificationsSavingSuccess'))
      .catch(error => {
        this.enableEmailSendingToUser = !this.enableEmailSendingToUser;
        return this.Notification.errorWithTrackingId(error, 'hercules.settings.emailUserNotificationsSavingError');
      });
  }, 2000, {
    leading: true,
    trailing: false,
  });

  public setEnableEmailSendingToUser() {
    this.writeEnableEmailSendingToUser(this.enableEmailSendingToUser);
  }

  public setDefaultWebExSiteOrgLevel = function () {
    this.ServiceDescriptor.setDefaultWebExSiteOrgLevel(this.defaultWebExSiteOrgLevel)
      .then(() => this.Notification.success('hercules.settings.defaultWebExSiteOrgLevelSavingSuccess'))
      .catch(error => this.Notification.errorWithTrackingId(error, 'hercules.settings.defaultWebExSiteOrgLevelSavingError'));
  };

  public setOneButtonToPushIntervalMinutes = function () {
    this.ServiceDescriptor.setOneButtonToPushIntervalMinutes(this.oneButtonToPushIntervalMinutes)
      .then(() => this.Notification.success('hercules.settings.oneButtonToPushIntervalMinutesSavingSuccess'))
      .catch(error => this.Notification.errorWithTrackingId(error, 'hercules.settings.oneButtonToPushIntervalMinutesSavingError'));
  };
}

export class EmailNotificationsSectionComponent implements ng.IComponentOptions {
  public controller = EmailNotificationsSectionCtrl;
  public templateUrl = 'modules/hercules/email-notifications-section/email-notifications-section.html';
  public bindings = {
    serviceId: '<',
  };
}
