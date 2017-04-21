import { Notification } from 'modules/core/notifications';
import { NUMBER_ORDER, PORT_ORDER, BLOCK_ORDER, NXX, NUMTYPE_DID, NUMTYPE_TOLLFREE, NXX_EMPTY, MIN_VALID_CODE, MAX_VALID_CODE, MAX_DID_QUANTITY, TOLLFREE_ORDERING_CAPABILITY, TOKEN_FIELD_ID } from '../index';
import { INumbersModel } from './number.model';

export interface IOrder {
  reservationId?: string;
  orderType: string;
  numberType: string;
  data: any;
}
export class PstnWizardService {
  public STEP_TITLE: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    7: string;
  };
  private tokenfieldId = TOKEN_FIELD_ID;
  private PORTING_NUMBERS: string;
  private advancedOrders: Array<IOrder> = [];
  private swivelOrders: Array<IOrder> = [];
  private portOrders: Array<IOrder> = [];
  private newTollFreeOrders: Array<IOrder> = [];
  private newOrders: Array<IOrder> = [];
  private orderCart: Array<IOrder> = [];

  /* @ngInject */
  constructor(
    private $q: ng.IQService,
    private PstnSetup,
    private PstnSetupService,
    private PstnServiceAddressService,
    private Notification: Notification,
    private $translate: ng.translate.ITranslateService,
    private TelephoneNumberService,
    private Orgservice,
  ) {
    this.PORTING_NUMBERS = this.$translate.instant('pstnSetup.portNumbersLabel');
    this.STEP_TITLE = {
      1: $translate.instant('pstnSetup.setupService'),
      2: $translate.instant('pstnSetup.setupPstn'),
      3: $translate.instant('pstnSetup.setupPstn'),
      4: $translate.instant('pstnSetup.setupNumbers'),
      5: $translate.instant('pstnSetup.setupNumbers'),
      6: $translate.instant('pstnSetup.setupService'),
      7: $translate.instant('pstnSetup.setupService'),
    };
  }

  public init(): ng.IPromise<any> {
    let deferred = this.$q.defer();
    //Get and save organization/customer information
    let params = {
      basicInfo: true,
    };
    this.checkReseller();
    this.checkCustomer();
    this.Orgservice.getOrg(data => {
      if (data.countryCode) {
        this.PstnSetup.setCountryCode(data.countryCode);
      }
      this.PstnSetupService.getCustomerV2(this.PstnSetup.getCustomerId())
      .then(() => {
        this.PstnSetup.setCustomerExists(true);
        deferred.resolve(true);
      }, () => deferred.resolve(true));
    }, this.PstnSetup.getCustomerId(), params);
    return deferred.promise;
  }

  public getContact() {
    return {
      companyName : this.PstnSetup.getCustomerName(),
      firstName : this.PstnSetup.getCustomerFirstName(),
      lastName : this.PstnSetup.getCustomerLastName(),
      emailAddress : this.PstnSetup.getCustomerEmail(),
    };
  }

  public setContact(contact) {
    this.PstnSetup.setCustomerName(contact.companyName);
    this.PstnSetup.setCustomerFirstName(contact.firstName);
    this.PstnSetup.setCustomerLastName(contact.lastName);
    this.PstnSetup.setCustomerEmail(contact.emailAddress);
  }

  public isSwivel(): boolean {
    return this.provider.apiImplementation === 'SWIVEL';
  }

  //PSTN check to verify if the Partner is registered with the Terminus service as a carrier reseller
  private checkReseller(): void {
    if (!this.PstnSetup.isResellerExists()) {
      this.PstnSetupService.getResellerV2().then(() => this.PstnSetup.setResellerExists(true))
      .catch(() => this.createReseller());
    }
  }

  //PSTN register the Partner as a carrier reseller
  private createReseller(): void {
    this.PstnSetupService.createResellerV2().then(() => this.PstnSetup.setResellerExists(true))
    .catch(error => this.Notification.errorResponse(error, 'pstnSetup.resellerCreateError'));
  }

  //PSTN check if customer is setup as a carrier customer.
  private checkCustomer(): void {
    if (!this.PstnSetup.isCustomerExists()) {
      this.PstnSetupService.getCustomer(this.PstnSetup.getCustomerId())
        .then(() => this.PstnSetup.setCustomerExists(true));
    }
  }

  private get provider(): any {
    return this.PstnSetup.getProvider();
  }

  public initSites(): ng.IPromise<any> {
    return this.PstnServiceAddressService.listCustomerSites(this.PstnSetup.getCustomerId())
      .then(sites => {
        // If we have sites, set the flag and store the first site address
        if (_.isArray(sites) && _.size(sites)) {
          this.PstnSetup.setSiteExists(true);
        }
      })
      .catch(response => {
        //TODO temp remove 500 status after terminus if fixed
        if (response && response.status !== 404 && response.status !== 500) {
          this.Notification.errorResponse(response, 'pstnSetup.listSiteError');
        }
      });
  }

  private createSite(): ng.IPromise<any> {
      // Only create site for API providers
    if (this.provider.apiImplementation !== 'SWIVEL' && !this.PstnSetup.isSiteExists()) {
      return this.PstnServiceAddressService.createCustomerSite(this.PstnSetup.getCustomerId(), this.PstnSetup.getCustomerName(), this.PstnSetup.getServiceAddress())
        .then(() => {
          this.PstnSetup.setSiteExists(true);
          return true;
        })
        .catch(response => {
          this.Notification.errorResponse(response, 'pstnSetup.siteCreateError');
          return this.$q.reject(response);
        });
    } else {
      return this.$q.resolve(true);
    }
  }

  private createNumbers(): ng.IPromise<any> {
    let promises: any = [];
    let errors: any = [];
    let promise;

    let pushErrorArray = response => errors.push(this.Notification.processErrorResponse(response));

    if (this.newOrders.length > 0) {
      promise = this.PstnSetupService.orderNumbersV2(this.PstnSetup.getCustomerId(), this.newOrders)
        .catch(pushErrorArray);
      promises.push(promise);
    }

    if (this.newTollFreeOrders.length > 0) {
      promise = this.PstnSetupService.orderNumbersV2(this.PstnSetup.getCustomerId(), this.newTollFreeOrders)
        .catch(pushErrorArray);
      promises.push(promise);
    }

    if (this.portOrders.length > 0) {
      promise = this.PstnSetupService.portNumbers(this.PstnSetup.getCustomerId(), this.PstnSetup.getProviderId(), _.get(this, 'portOrders[0].data.numbers'))
        .catch(pushErrorArray);
      promises.push(promise);
    }

    if (this.swivelOrders.length > 0) {
      promise = this.PstnSetupService.orderNumbers(this.PstnSetup.getCustomerId(), this.PstnSetup.getProviderId(), _.get(this, 'swivelOrders[0].data.numbers'))
        .catch(pushErrorArray);
      promises.push(promise);
    }

    _.forEach(this.advancedOrders, order => {
      if (order.orderType === this.PstnSetupService.BLOCK_ORDER && order.numberType === this.PstnSetupService.NUMTYPE_DID) {
        promise = this.PstnSetupService.orderBlock(this.PstnSetup.getCustomerId(), this.PstnSetup.getProviderId(), order.data.areaCode, order.data.length, order.data.consecutive, order.data.nxx)
          .catch(pushErrorArray);
      } else if (order.orderType === this.PstnSetupService.BLOCK_ORDER && order.numberType === this.PstnSetupService.NUMTYPE_TOLLFREE) {
        promise = this.PstnSetupService.orderTollFreeBlock(this.PstnSetup.getCustomerId(), this.PstnSetup.getProviderId(), order.data.areaCode, order.data.length)
          .catch(pushErrorArray);
      }
      promises.push(promise);
    });

    return this.$q.all(promises).then(() => {
      if (errors.length > 0) {
        errors.splice(0, 0, this.$translate.instant('pstnSetup.orderNumbersError'));
        this.Notification.notify(errors, 'error');
      }
    });
  }

  public setSwivelOrder(order: Array<string>): Array<IOrder> {
    let swivelOrder = [{
      data: { numbers: order },
      numberType: this.PstnSetupService.NUMTYPE_DID,
      orderType: this.PstnSetupService.SWIVEL_ORDER,
    }];
    this.swivelOrders = swivelOrder;
    return this.swivelOrders;
  }

  private updateCustomerCarrier(): ng.IPromise<boolean> {
    return this.PstnSetupService.updateCustomerCarrier(this.PstnSetup.getCustomerId(), this.PstnSetup.getProviderId())
      .then(() => this.PstnSetup.setCarrierExists(true))
      .catch(response => {
        this.Notification.errorResponse(response, 'pstnSetup.customerUpdateError');
        return this.$q.reject(response);
      });
  }

  private createCustomerV2(): ng.IPromise<boolean> {
    return this.PstnSetupService.createCustomerV2(
      this.PstnSetup.getCustomerId(),
      this.PstnSetup.getCustomerName(),
      this.PstnSetup.getCustomerFirstName(),
      this.PstnSetup.getCustomerLastName(),
      this.PstnSetup.getCustomerEmail(),
      this.PstnSetup.getProviderId(),
      this.PstnSetup.getIsTrial(),
    ).catch(response => {
      this.Notification.errorResponse(response, 'pstnSetup.customerCreateError');
      return this.$q.reject(response);
    });
  }

  public placeOrder(): ng.IPromise<any> {
    let promise = this.$q.resolve(true);
    if (!this.PstnSetup.isCustomerExists()) {
      promise = this.createCustomerV2();
    } else if (!this.PstnSetup.isCarrierExists()) {
      promise = this.updateCustomerCarrier();
    }
    return promise
      .then(this.createSite.bind(this))
      .then(this.createNumbers.bind(this));
  }

  public initOrders(): {totalNewAdvancedOrder: number, totalPortNumbers: number} {
    let orderCart: Array<IOrder> = _.cloneDeep(this.PstnSetup.getOrders());
    let totalNewAdvancedOrder, totalPortNumbers;

    this.portOrders = _.remove(orderCart, order => order.orderType === this.PstnSetupService.PORT_ORDER);

    this.newTollFreeOrders = _.remove(orderCart, order => {
      return order.orderType === this.PstnSetupService.NUMBER_ORDER && order.numberType === this.PstnSetupService.NUMTYPE_TOLLFREE;
    });

    let pstnAdvancedOrders: any = _.remove(orderCart, order => {
      return order.orderType === this.PstnSetupService.BLOCK_ORDER && order.numberType === this.PstnSetupService.NUMTYPE_DID;
    });

    this.swivelOrders = _.remove(orderCart, order => order.orderType === this.PstnSetupService.SWIVEL_ORDER);

    let tollFreeAdvancedOrders: any = _.remove(orderCart, order => {
      return order.orderType === this.PstnSetupService.BLOCK_ORDER && order.numberType === this.PstnSetupService.NUMTYPE_TOLLFREE;
    });
    this.advancedOrders = [].concat(pstnAdvancedOrders, tollFreeAdvancedOrders);

    this.newOrders = _.cloneDeep(orderCart);

    if (this.advancedOrders.length > 0 || this.newOrders.length > 0) {
      totalNewAdvancedOrder = this.getTotal(this.newOrders, this.advancedOrders);
    }

    if (this.portOrders.length > 0) {
      totalPortNumbers = _.get(this.portOrders[0].data.numbers, 'length');
    }
    return { totalNewAdvancedOrder, totalPortNumbers };
  }

  private getTotal(newOrders: Array<IOrder>, advancedOrders: Array<IOrder>): number {
    let total = 0;
    _.forEach(newOrders, order => {
      if (_.isString(order.data.numbers)) {
        total += 1;
      } else {
        total += order.data.numbers.length;
      }
    });
    _.forEach(advancedOrders, order => {
      total += order.data.length;
    });
    return total;
  }

  public formatTelephoneNumber(telephoneNumber: IOrder) {
    switch (_.get(telephoneNumber, 'orderType')) {
      case NUMBER_ORDER:
        return this.getCommonPattern(telephoneNumber.data.numbers);
      case PORT_ORDER:
        return this.PORTING_NUMBERS;
      case BLOCK_ORDER: {
        let pstn = 'XXX-XXXX';
        if (_.has(telephoneNumber.data, NXX)) {
          pstn = telephoneNumber.data.nxx + '-' + 'XXXX';
        }
        return '(' + telephoneNumber.data.areaCode + ') ' + pstn;
      }
      case undefined:
        return this.getCommonPattern(telephoneNumber);
      default:
        return undefined;
    }
  }

  private getCommonPattern(telephoneNumber) {
    if (_.isString(telephoneNumber)) {
      return this.TelephoneNumberService.getDIDLabel(telephoneNumber);
    } else {
      let firstNumber = this.TelephoneNumberService.getDIDLabel(_.head(telephoneNumber));
      let lastNumber = this.TelephoneNumberService.getDIDLabel(_.last(telephoneNumber));
      if (this.isConsecutiveArray(telephoneNumber)) {
        return firstNumber + ' - ' + _.last(lastNumber.split('-'));
      } else {
        let commonNumber = this.getLongestCommonSubstring(firstNumber, lastNumber);
        return commonNumber + _.repeat('X', firstNumber.length - commonNumber.length);
      }
    }
  }

  public showOrderQuantity(order): boolean {
    return (_.isArray(order.data.numbers) && !this.isConsecutiveArray(order.data.numbers)) || this.isPortOrder(order) || this.isAdvancedOrder(order);
  }

  private isPortOrder(order: IOrder): boolean {
    return order.orderType === PORT_ORDER;
  }

  private isAdvancedOrder(order: IOrder): boolean {
    return order.orderType === BLOCK_ORDER;
  }

  public getOrderQuantity(order: IOrder): number | undefined {
    switch (order.orderType) {
      case NUMBER_ORDER:
        return order.data.numbers.length;
      case PORT_ORDER:
        return order.data.numbers.length;
      case BLOCK_ORDER:
        return order.data.length;
      case undefined:
        return undefined;
    }
  }

  private isConsecutiveArray(array: Array<string>): boolean {
    return _.every(array, (value, index, arr) => {
      // return true for the first element
      if (index === 0) {
        return true;
      }
      // check the difference with the previous element
      return _.parseInt(value) - _.parseInt(<string>arr[index - 1]) === 1;
    });
  }

  private getLongestCommonSubstring(x: string, y: string): string {
    if (!_.isString(x) || !_.isString(y)) {
      return '';
    }
    let i = 0;
    let length = x.length;
    while (i < length && x.charAt(i) === y.charAt(i)) {
      i++;
    }
    return x.substring(0, i);
  }

  public addToCart(orderType: string, numberType: string, quantity: number, searchResultsModel: {}, orderCart, model: INumbersModel): ng.IPromise<Array<IOrder>> {
    this.orderCart = orderCart;
    if (quantity) {
      if (numberType === NUMTYPE_DID) {
        model.pstn.quantity = quantity;
      } else if (numberType === NUMTYPE_TOLLFREE) {
        model.tollFree.quantity = quantity;
      }
    }
    if (searchResultsModel) {
      if (numberType === NUMTYPE_DID) {
        model.pstn.searchResultsModel = searchResultsModel;
      } else if (numberType === NUMTYPE_TOLLFREE) {
        model.tollFree.searchResultsModel = searchResultsModel;
      }
    }

    switch (orderType) {
      case NUMBER_ORDER:
        return this.addToOrder(numberType, model);
      case PORT_ORDER:
        return this.addPortNumbersToOrder();
      case BLOCK_ORDER:
      default:
        return this.addAdvancedOrder(numberType, model);
    }
  }

  private addToOrder(numberType: string, modelValue: INumbersModel): ng.IPromise<Array<IOrder>> {
    let model;
    let promises: Array<any> = [];
    let reservation;
    // add to cart
    if (numberType === NUMTYPE_DID) {
      model = modelValue.pstn;
    } else if (numberType === NUMTYPE_TOLLFREE) {
      model = modelValue.tollFree;
    } else {
      this.Notification.error('pstnSetup.errors.unsupportedOrderType', numberType);
    }
    _.forIn(model.searchResultsModel, (value, _key) => {
      if (value) {
        let key = _.parseInt(<string>_key);
        let searchResultsIndex = (model.paginateOptions.currentPage * model.paginateOptions.pageSize) + key;
        if (searchResultsIndex < model.searchResults.length) {
          let numbers = model.searchResults[searchResultsIndex];
          if (numberType === NUMTYPE_DID) {
            reservation = this.PstnSetupService.reserveCarrierInventoryV2(this.PstnSetup.getCustomerId(), this.PstnSetup.getProviderId(), numbers, this.PstnSetup.isCustomerExists());
          } else if (numberType === NUMTYPE_TOLLFREE) {
            reservation = this.PstnSetupService.reserveCarrierTollFreeInventory(this.PstnSetup.getCustomerId(), this.PstnSetup.getProviderId(), numbers, this.PstnSetup.isCustomerExists());
          }
          let promise = reservation
            .then(reservationData => {
              let order: IOrder = {
                data: {
                  numbers: numbers,
                },
                numberType: numberType,
                orderType: NUMBER_ORDER,
                reservationId: reservationData.uuid,
              };
              this.orderCart.push(order);
              // return the index to be used in the promise callback
              return {
                searchResultsIndex: searchResultsIndex,
                searchResultsModelIndex: key,
              };
            }).catch(response => this.Notification.errorResponse(response));
          promises.push(promise);
        }
      }
    });
    return this.$q.all(promises).then(results => {
      // sort our successful indexes and process from high to low
      _.forInRight(_.sortBy(results), indices => {
        if (_.isObject(indices) && _.isNumber(indices.searchResultsIndex) && _.isNumber(indices.searchResultsModelIndex)) {
          // clear the checkbox
          _.set(model.searchResultsModel, indices.searchResultsModelIndex, false);
          // remove from search result
          model.searchResults.splice(indices.searchResultsIndex, 1);
        }
      });
      return this.orderCart;
    });
  }

  private addAdvancedOrder(numberType: string, modelValue: INumbersModel): ng.IPromise<Array<IOrder>> {
    let model;
    if (numberType === NUMTYPE_DID) {
      model = modelValue.pstn;
    } else if (numberType === NUMTYPE_TOLLFREE) {
      model = modelValue.tollFree;
    }
    let advancedOrder = {
      data: {
        areaCode: model.areaCode.code,
        length: parseInt(model.quantity, 10),
        consecutive: model.consecutive,
      },
      numberType: numberType,
      orderType: BLOCK_ORDER,
    };
    let nxx = this.getNxxValue(modelValue);
    if (nxx !== null) {
      advancedOrder.data[NXX] = _.get(modelValue, 'pstn.nxx.code');
    }
    this.orderCart.push(advancedOrder);
    model.showAdvancedOrder = false;
    return this.$q.resolve(this.orderCart);
  }

  private addPortNumbersToOrder(): ng.IPromise<Array<IOrder>> {
    let portOrder: any = {
      data: {},
      orderType: PORT_ORDER,
    };
    let portNumbersPartition = _.partition(this.getTokens(), 'invalid');
    portOrder.data.numbers = _.map(portNumbersPartition[1], 'value');
    let existingPortOrder: any = _.find(this.orderCart, {
      orderType: PORT_ORDER,
    });
    if (existingPortOrder) {
      let newPortNumbers = _.difference(portOrder.data.numbers, existingPortOrder.data.numbers);
      Array.prototype.push.apply(existingPortOrder.data.numbers, newPortNumbers);
    } else {
      this.orderCart.push(portOrder);
    }
    return this.$q.resolve(this.orderCart);
  }

  private getTokens(): JQuery {
    return angular.element('#' + this.tokenfieldId).tokenfield('getTokens');
  }

  private getNxxValue(model): string | null {
    if (model.pstn.nxx !== null) {
      if (model.pstn.nxx.code !== NXX_EMPTY) {
        return model.pstn.nxx.code;
      }
    }
    return null;
  }

  public searchCarrierInventory(areaCode: string, block: boolean, quantity: number, consecutive: boolean, model: INumbersModel, isTrial: boolean) {
    if (areaCode) {
      model.pstn.showNoResult = false;
      areaCode = '' + areaCode;
      model.pstn.areaCode = {
        code: areaCode.slice(0, MIN_VALID_CODE),
      };
      model.pstn.block = block;
      model.pstn.quantity = quantity;
      model.pstn.consecutive = consecutive;
      if (areaCode.length === MAX_VALID_CODE) {
        model.pstn.nxx = {
          code: areaCode.slice(MIN_VALID_CODE, areaCode.length),
        };
      } else {
        model.pstn.nxx = {
          code: null,
        };
      }
    }
    model.pstn.showAdvancedOrder = false;
    let params = {
      npa: _.get(model, 'pstn.areaCode.code'),
      count: this.getCount(model),
      sequential: model.pstn.consecutive,
    };

    model.pstn.searchResults = [];
    model.pstn.searchResultsModel = {};
    model.pstn.paginateOptions.currentPage = 0;
    model.pstn.isSingleResult = this.isSingleResult(model);

    return this.PstnSetupService.searchCarrierInventory(this.PstnSetup.getProviderId(), params)
      .then(numberRanges => {
        if (numberRanges.length === 0) {
          if (isTrial) {
            model.pstn.showNoResult = true;
          } else {
            model.pstn.showAdvancedOrder = true;
          }

        } else if (model.pstn.isSingleResult) {
          if (areaCode && areaCode.length > MIN_VALID_CODE) {
            model.pstn.searchResults = _.flatten(numberRanges).filter((number: any) => {
              return number.includes(areaCode);
            });
            if (model.pstn.searchResults.length === 0) {
              if (isTrial) {
                model.pstn.showNoResult = true;
              } else {
                model.pstn.showAdvancedOrder = true;
              }
            }
          } else {
            model.pstn.searchResults = _.flatten(numberRanges);
          }
        } else {
          model.pstn.searchResults = numberRanges;
        }
      })
      .catch(response => this.Notification.errorResponse(response, 'pstnSetup.errors.inventory'));
  }

  public isSingleResult(model): boolean {
    if (!model.pstn.block) {
      return true;
    }
    if (model.pstn.quantity === 1 || model.pstn.quantity === null) {
      return true;
    }
    return false;
  }

  public getCount(model): number {
    if (!model.pstn.block) {
      return MAX_DID_QUANTITY;
    }
    return (model.pstn.quantity ? model.pstn.quantity : MAX_DID_QUANTITY);
  }

  public searchCarrierTollFreeInventory(areaCode: string, block: boolean, quantity: number, consecutive: boolean, model) {
    model.tollFree.showAdvancedOrder = false;
    if (angular.isString(areaCode)) {
      model.tollFree.block = block;
      model.tollFree.quantity = quantity;
      model.tollFree.consecutive = consecutive;
      if (areaCode) {
        areaCode = '' + areaCode;
        model.tollFree.areaCode = {
          code: areaCode.slice(0, MIN_VALID_CODE),
        };
      }
      model.tollFree.isSingleResult = !block;
    }
    let params = {
      npa: _.get(model, 'tollFree.areaCode.code'),
      count: model.tollFree.quantity === 1 ? undefined : model.tollFree.quantity,
    };
    model.tollFree.searchResults = [];
    model.tollFree.searchResultsModel = {};
    model.tollFree.paginateOptions.currentPage = 0;
    if (!angular.isString(areaCode)) {
      model.tollFree.isSingleResult = model.tollFree.quantity === 1;
    }

    return this.PstnSetupService.searchCarrierTollFreeInventory(this.PstnSetup.getProviderId(), params)
      .then(numberRanges => {
        if (numberRanges.length === 0) {
          model.tollFree.showAdvancedOrder = true;
        } else if (model.tollFree.isSingleResult) {
          model.tollFree.searchResults = _.flatten(numberRanges);
        } else {
          model.tollFree.searchResults = numberRanges;
        }
      })
      .catch(response => this.Notification.errorResponse(response, 'pstnSetup.errors.tollfree.inventory'));
  }

  public hasTollFreeCapability() {
    return this.PstnSetupService.getCarrierCapabilities(this.PstnSetup.getProviderId())
        .then(response => {
          let supportedCapabilities: string[] = [];
          Object.keys(response)
            .filter(x => response[x].capability)
            .map(x => supportedCapabilities.push(response[x].capability));
          return supportedCapabilities.indexOf(TOLLFREE_ORDERING_CAPABILITY) !== -1;
        })
        .catch(response => this.Notification.errorResponse(response, 'pstnSetup.errors.capabilities'));
  }

  public removeOrder(order: IOrder): ng.IPromise<any> {
    if (this.isPortOrder(order) || this.isAdvancedOrder(order)) {
      return this.$q.resolve(true);
    } else if (order.orderType === this.PstnSetupService.NUMBER_ORDER && order.numberType === this.PstnSetupService.NUMTYPE_TOLLFREE) {
      return this.PstnSetupService.releaseCarrierTollFreeInventory(this.PstnSetup.getCustomerId(), this.PstnSetup.getProviderId(), order.data.numbers, order.reservationId, this.PstnSetup.isCustomerExists());
    } else {
      return this.PstnSetupService.releaseCarrierInventoryV2(this.PstnSetup.getCustomerId(), order.reservationId, order.data.numbers, this.PstnSetup.isCustomerExists());
    }
  }
}