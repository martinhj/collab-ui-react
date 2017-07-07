import { WindowService } from 'modules/core/window';

export class Notification {
  private static readonly SUCCESS = 'success';
  private static readonly WARNING = 'warning';
  private static readonly ERROR = 'error';
  private static readonly TYPES = [Notification.SUCCESS, Notification.WARNING, Notification.ERROR];
  private static readonly MESSAGES = 'messages';
  private static readonly HTML_MESSAGES = 'htmlMessages';
  private static readonly NO_TIMEOUT = 0;
  private static readonly DEFAULT_TIMEOUT = 3000;
  private static readonly HTTP_STATUS = {
    NOT_FOUND: 404,
    REJECTED: -1,
    UNAUTHORIZED: 401,
    UNKNOWN: 0,
  };
  private failureTimeout: number;
  private successTimeout: number;
  private preventToasters = false;
  private isNetworkOffline = false;

  /* @ngInject */
  constructor(
    private $log: ng.ILogService,
    private $timeout: ng.ITimeoutService,
    private $translate: ng.translate.ITranslateService,
    private WindowService: WindowService,
    private Config,
    private toaster,
  ) {
    this.initTimeouts();
    this.initOfflineListeners();
  }

  public success(messageKey: string, messageParams?: Object, titleKey?: string, allowHtml: boolean = false): void {
    this.notify(this.$translate.instant(messageKey, messageParams), Notification.SUCCESS, this.getTitle(titleKey), allowHtml);
  }

  public warning(messageKey: string, messageParams?: Object, titleKey?: string, allowHtml: boolean = false): void {
    this.notify(this.$translate.instant(messageKey, messageParams), Notification.WARNING, this.getTitle(titleKey), allowHtml);
  }

  public error(messageKey: string, messageParams?: Object, titleKey?: string, allowHtml: boolean = false): void {
    this.notify(this.$translate.instant(messageKey, messageParams), Notification.ERROR, this.getTitle(titleKey), allowHtml);
  }

  public errorWithTrackingId(response: ng.IHttpPromiseCallbackArg<any>, errorKey?: string, errorParams?: Object): void {
    let errorMsg = this.getErrorMessage(errorKey, errorParams);
    errorMsg = this.addResponseMessage(errorMsg, response, false);
    this.notifyErrorResponse(errorMsg, response);
  }

  public processErrorResponse(response: ng.IHttpPromiseCallbackArg<any>, errorKey?: string, errorParams?: Object): string {
    const errorMsg = this.getErrorMessage(errorKey, errorParams);
    return this.addResponseMessage(errorMsg, response, true);
  }

  public errorResponse(response: ng.IHttpPromiseCallbackArg<any>, errorKey?: string, errorParams?: Object): void {
    const errorMsg = this.processErrorResponse(response, errorKey, errorParams);
    this.notifyErrorResponse(errorMsg, response);
  }

  private notifyErrorResponse(errorMsg: string, response: ng.IHttpPromiseCallbackArg<any>): void {
    if (!this.isCancelledResponse(response)) {
      this.notify(errorMsg, Notification.ERROR);
    }
  }

  public notify(notifications: string[] | string, type: string = Notification.ERROR, title?: string, allowHtml: boolean = false): void {
    if (this.preventToasters) {
      this.$log.warn('Deliberately prevented a notification:', notifications);
      return;
    }
    if (!notifications) {
      return;
    }
    if (_.isString(notifications)) {
      notifications = [notifications];
    }
    if (!notifications.length) {
      return;
    }
    const closeHtml = `<button type="button" class="close toast-close-button"><span class="sr-only">${this.$translate.instant('common.close')}</span></button>`;
    const directiveData = {};
    _.set(directiveData, allowHtml ? Notification.HTML_MESSAGES : Notification.MESSAGES , notifications);

    this.toaster.pop({
      title: title,
      type: _.includes(Notification.TYPES, type) ? type : Notification.ERROR,
      body: 'cr-bind-unsafe-html',
      bodyOutputType: 'directive',
      directiveData: directiveData,
      timeout: type === Notification.SUCCESS ? this.successTimeout : this.failureTimeout,
      closeHtml: closeHtml,
    });
  }

  public notifyReadOnly(): void {
    this.notify(this.$translate.instant('readOnlyMessages.notAllowed'), Notification.WARNING);
    this.preventToasters = true;
    this.$timeout(() => this.preventToasters = false, 1000);
  }

  private addResponseMessage(errorMsg: string, response: ng.IHttpPromiseCallbackArg<any>, useResponseData: boolean = false): string {
    const status = _.get<number>(response, 'status');
    if (this.isCancelledResponse(response)) {
      errorMsg = this.addTranslateKeyMessage(errorMsg, 'errors.statusCancelled');
    } else if (this.isOfflineStatus(status)) {
      errorMsg = this.addTranslateKeyMessage(errorMsg, 'errors.statusOffline');
    } else if (this.isRejectedStatus(status)) {
      errorMsg = this.addTranslateKeyMessage(errorMsg, 'errors.statusRejected');
    } else if (this.isNotFoundStatus(status)) {
      errorMsg = this.addTranslateKeyMessage(errorMsg, 'errors.status404');
    } else if (this.isUnauthorizedStatus(status)) {
      errorMsg = this.addTranslateKeyMessage(errorMsg, 'errors.statusUnauthorized');
    } else if (this.isUnknownStatus(status)) {
      errorMsg = this.addTranslateKeyMessage(errorMsg, 'errors.statusUnknown');
    } else if (useResponseData) {
      errorMsg = this.addMessageFromResponseData(errorMsg, response);
    }
    errorMsg = this.addTrackingId(errorMsg, response);
    return _.trim(errorMsg);
  }

  private addTranslateKeyMessage(message: string, translateKey: string): string {
    return `${this.addTrailingPeriod(message)} ${this.$translate.instant(translateKey)}`;
  }

  private isCancelledResponse(response: ng.IHttpPromiseCallbackArg<any>): boolean {
    return this.isRejectedStatus(_.get<number>(response, 'status')) && _.get(response, 'config.timeout.$$state.status') > 0;
  }
  private isOfflineStatus(status: number): boolean {
    return this.isNetworkOffline && this.isRejectedStatus(status);
  }

  private isRejectedStatus(status: number): boolean {
    return status === Notification.HTTP_STATUS.REJECTED;
  }

  private isNotFoundStatus(status: number): boolean {
    return status === Notification.HTTP_STATUS.NOT_FOUND;
  }

  private isUnknownStatus(status: number): boolean {
    return status === Notification.HTTP_STATUS.UNKNOWN;
  }

  private isUnauthorizedStatus(status: number): boolean {
    return status === Notification.HTTP_STATUS.UNAUTHORIZED;
  }

  private addMessageFromResponseData(errorMsg: string, response: ng.IHttpPromiseCallbackArg<any>): string {
    let error: string;
    let errors: any[] | string;
    let responseMessage: string | undefined;
    if ((errors = _.get(response, 'data.error.message', [])) && (_.isArray(errors) || _.isString(errors)) && errors.length) { // for CCATG API spec
      responseMessage = this.getMessageFromErrorDataStructure(errors);
    } else if ((errors = _.get(response, 'data.errors', [])) && (_.isArray(errors) || _.isString(errors)) && errors.length) {  // fallback for Atlas responses
      responseMessage = this.getMessageFromErrorDataStructure(errors);
    } else if ((error = _.get(response, 'data.errorMessage', '')) && _.isString(error) && error.length) {  // fallback for legacy/huron
      responseMessage = error;
    } else if ((error = _.get(response, 'data.error', '')) && _.isString(error) && error.length) { // fallback for old data structure
      responseMessage = error;
    } else if ((error = _.get(response, 'data.message', '')) && _.isString(error) && error.length) { // fallback for format seen from services using ServerException from cisco-spark-base
      responseMessage = error;
    } else if (_.isString(response)) {  // fallback for custom string rejections
      responseMessage = response;
    } else {
      this.$log.warn('Unable to notify an error response', response);
    }
    if (responseMessage) {
      errorMsg = `${this.addTrailingPeriod(errorMsg)} ${responseMessage}`;
    }
    return errorMsg;
  }

  /**
   * https://wiki.cisco.com/display/WX2RESTAPI/CCATG+RESTful+API+Design+Guidelines#CCATGRESTfulAPIDesignGuidelines-3.9StatusCodes
   */
  private getMessageFromErrorDataStructure(errors: (string|Object)[] | string): string {
    if (_.isString(errors)) {
      return errors;
    }

    return _.chain(errors)
      .map((error) => {
        let errorString;
        if (_.isString(error)) {
          errorString = error;
        } else {
          errorString = _.get(error, 'description', '');
        }
        return this.addTrailingPeriod(errorString);
      })
      .reject(_.isEmpty)
      .join(' ')
      .value();
  }

  private addTrackingId(errorMsg: string, response: ng.IHttpPromiseCallbackArg<any>): string {
    const headers = _.get(response, 'headers');
    let trackingId = _.isFunction(headers) && headers('TrackingID');  // exposed via CORS headers
    if (!trackingId) {
      trackingId = _.get(response, 'data.trackingId'); // for CCATG API spec
    }
    if (!trackingId) {
      trackingId = _.get(response, 'data.error.trackingId');  // fallback to old data structure
    }
    if (!trackingId) {
      trackingId = _.get(response, 'config.headers.TrackingID');  // fallback for when request could not be made
    }
    if (_.isString(trackingId) && trackingId.length) {
      errorMsg = `${this.addTrailingPeriod(errorMsg)} TrackingID: ${trackingId}`;
    }
    return errorMsg;
  }

  private addTrailingPeriod(message?: string): string {
    if (message) {
      if (_.endsWith(message, '.')) {
        return message;
      } else {
        return `${message}.`;
      }
    } else {
      return '';
    }
  }

  private getErrorMessage(key?: string, params?: Object): string {
    return _.isString(key) ? this.$translate.instant(key, params) : '';
  }

  private getTitle(titleKey?: string): string | undefined {
    return _.isString(titleKey) ? this.$translate.instant(titleKey) : undefined;
  }

  private initTimeouts(): void {
    this.failureTimeout = Notification.NO_TIMEOUT;
    this.successTimeout = this.Config.isE2E() ? Notification.NO_TIMEOUT : Notification.DEFAULT_TIMEOUT;
  }

  private setNetworkOffline(): void {
    this.isNetworkOffline = true;
  }

  private setNetworkOnline(): void {
    this.isNetworkOffline = false;
  }

  private initOfflineListeners(): void {
    this.WindowService.registerEventListener('offline', this.setNetworkOffline.bind(this));
    this.WindowService.registerEventListener('online', this.setNetworkOnline.bind(this));
  }
}
