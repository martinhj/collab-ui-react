import { Notification } from 'modules/core/notifications';
import { TelephonyDomainService } from '../telephonyDomain.service';

export interface IGridApiScope extends ng.IScope {
  gridApi?: uiGrid.IGridApi;
}

class GmImportTdCtrl implements ng.IComponentController {

  public gridData;
  public data: any = {};
  public gridOptions = {};
  public selectPlaceholder: string;
  public options: Array<Object> = [];
  public loadingNumbers: boolean = true;
  public loadingContent: boolean = true;
  public isShowNumbers: boolean = false;
  public isHiddenOptions: Array<Object>;
  public selectedGridLinesLength: number = 0;
  public selected = { label: '', value: '' };

  private close;
  private currentTD: any;
  private countries: Object = {};
  private selectedGridLines: Object = {};

  /* @ngInject */
  public constructor(
    private gemService,
    private $scope: IGridApiScope,
    private Notification: Notification,
    private $translate: ng.translate.ITranslateService,
    private TelephonyDomainService: TelephonyDomainService,
  ) {
    this.gridData = [];
    this.isHiddenOptions = [
      { value: 'true', label: this.$translate.instant('gemini.tds.hidden') },
      { value: 'false', label: this.$translate.instant('gemini.tds.display') },
    ];
    this.currentTD = this.gemService.getStorage('currentTelephonyDomain');
    this.selectPlaceholder = this.$translate.instant('gemini.tds.selectTdPlaceholder');
  }

  public $onInit() {
    this.getTelephonyDomainByRegion();
  }

  public onSelectChange() {
    this.isShowNumbers = true;
    this.loadingNumbers = true;
    this.getCountries();
  }

  public onImport() {
    let data = this.gemService.getStorage('currentTelephonyDomain');
    data.numbers = _.values(this.selectedGridLines);

    this.gemService.setStorage('currentTelephonyDomain', data);
    this.close();
  }

  public getGridLinesNumber(): number {
    this.selectedGridLinesLength = _.values(this.selectedGridLines).length;
    return this.selectedGridLinesLength;
  }

  private getTelephonyDomainByRegion() {
    const data = {
      customerId: this.currentTD.customerId,
      regionId: this.currentTD.region.regionId,
      ccaDomainId: this.currentTD.ccaDomainId ? this.currentTD.ccaDomainId : '',
    };

    this.TelephonyDomainService.getRegionDomains(data)
      .then((res) => {
        this.loadingContent = !this.loadingContent;
        const optionsSource: any = _.get(res, 'content.data.body');
        this.options = _.map(optionsSource, (item: any) => {
          return { value: item.ccaDomainId, label: item.domainName };
        });
      })
      .catch((res) => {
        this.Notification.errorResponse(res, 'error'); // TODO, wording
      });
  }

  private setGridOption() {
    const columnDefs = [{
      cellTooltip: true,
      field: 'phone',
      displayName: this.$translate.instant('gemini.tds.numbers.field.phoneNumber'),
    }, {
      field: 'label',
      displayName: this.$translate.instant('gemini.tds.numbers.field.phoneLabel'),
    }, {
      cellTooltip: true,
      field: 'dnisNumberFormat',
      displayName: this.$translate.instant('gemini.tds.numbers.field.accessNumber'),
    }, {
      cellTooltip: true,
      field: 'tollType',
      displayName: this.$translate.instant('gemini.tds.numbers.field.tollType'),
    }, {
      cellTooltip: true,
      field: 'callType',
      displayName: this.$translate.instant('gemini.tds.numbers.field.callType'),
    }, {
      field: 'country',
      cellTooltip: true,
      displayName: this.$translate.instant('gemini.tds.numbers.field.country'),
    }, {
      field: 'isHidden',
      cellTooltip: true,
      displayName: this.$translate.instant('gemini.tds.numbers.field.hiddenOnClient'),
      cellTemplate: '<div class="ui-grid-cell-contents" ng-class="{\'error\': row.entity.phnNumDisplayValidation.invalid}" style="overflow: inherit"><cs-select id="{{row.uid}}-isHidden" is-disabled="row.entity.isHnDisabled" title="{{row.entity.isHidden.label}}" options="grid.appScope.isHiddenOptions" labelfield="label" valuefield="value" ng-change="grid.appScope.resetPhnNumDisplayValidation(row)" ng-model="row.entity.isHidden"></cs-select></div>',
    }];

    this.gridOptions = {
      rowHeight: 44,
      multiSelect: true,
      enableSorting: false,
      enableSelectAll: true,
      headerCellClass: 'h6',
      data: '$ctrl.gridData',
      appScopeProvider: this,
      columnDefs: columnDefs,
      enableRowSelection: true,
      enableColumnMenus: false,
      onRegisterApi: (gridApi) => {
        const api = gridApi;
        api.selection.on.rowSelectionChanged(this.$scope, (row) => { this.addOrDelRow(row); });

        api.selection.on.rowSelectionChangedBatch(this.$scope, (rows) => {
          _.forEach(rows, (row) => { this.addOrDelRow(row); });
        });
      },
    };
  }

  private addOrDelRow(row) {
    if (!row.isSelected) {
      delete this.selectedGridLines[row.entity.dnisId];
      return;
    }
    this.selectedGridLines[row.entity.dnisId] = row.entity;
  }

  private setGridData() {
    const ccaDomainId = this.selected.value;
    this.TelephonyDomainService.getNumbers(this.currentTD.customerId, ccaDomainId)
      .then((res) => {
        this.loadingNumbers = false;
        const data = _.get(res, 'content.data.body', []);
        this.gridData = _.map(data, (item: any) => {
          return _.assignIn({}, item, {
            country: this.countries[item.countryId].countryName,
            callType: this.TelephonyDomainService.transformCSVNumber(item.phoneType),
          });
        });
        this.setGridOption();
      });
  }

  private getCountries() {
    this.gemService.getCountries()
      .then((res) => {
        const countries = _.get(res, 'content.data');
        _.forEach(countries, (item) => { this.countries[item.countryId] = item; });
        this.setGridData();
      });
  }
}
export class GmImportTdComponent implements ng.IComponentOptions {
  public controller = GmImportTdCtrl;
  public bindings = { dismiss: '&', close: '&' };
  public templateUrl = 'modules/gemini/telephonyDomain/details/gmImportTd.html';
}