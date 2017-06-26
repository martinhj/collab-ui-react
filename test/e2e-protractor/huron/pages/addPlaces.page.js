export class AddPlacesPage {
  constructor() {
    this.placesTab = element(by.css('i.icon-location'));
    this.addNewPlace = element(by.css('button.add-button'));
    this.newPlaceInput = element(by.id('newPlace'));
    this.nxtBtn = element(by.id('next-button'));
    this.nxtBtn2 = element(by.css('[ng-click="chooseDeviceType.next()"]'));
    this.selectHuron = element(by.css('[ng-click="chooseDeviceType.huron()"]'));
    this.addExtension = element(by.name('internalNumber'));
    this.nxtBtn3 = element(by.css('[ng-click="addLines.next()"]'));
    this.qrCode = element(by.css('div.qrCodeSection'));
    this.closeGrp = element(by.css('button.close'));
    this.searchPlaces = element(by.css('i.icon-search'));
    this.searchBar = element(by.id('searchFilter'));
    this.clickLocation = element(by.cssContainingText('.ui-grid-cell-contents', 'Naboo'));
    this.overviewPg = element(by.cssContainingText('.ng-binding', 'Overview'));
    this.servicesSctn = element(by.cssContainingText('.section-name', 'Services'));
    this.devicesSctn = element(by.cssContainingText('.section-name', 'Devices'));
    this.callClick = element(by.cssContainingText('.feature-label', 'Cisco Spark + Spark Call'));
    this.callStngsPg = element(by.cssContainingText('.ng-binding', 'Call'));
    this.prfrdLang = element(by.cssContainingText('.section-name', 'Preferred Language'));
    this.prfrdLangDd = element(by.css('.csSelect-container[name="languageSelect"]'))
    this.dirNumSct = element(by.cssContainingText('.section-name', 'Directory Numbers'));
    this.featuresSct = element(by.cssContainingText('.section-name', 'Features'));
    this.primaryClick = element(by.cssContainingText('.feature-status', 'Primary'));
    this.LineConfigPg = element(by.cssContainingText('.section-name', 'Line Configuration'));
    this.directoryNumSct = element(by.cssContainingText('.section__title', 'Directory Numbers'));
    this.callFwdSct = element(by.cssContainingText('.section__title', 'Call Forwarding'));
    this.simulCallSct = element(by.cssContainingText('.section__title', 'Simultaneous Calls'));
    this.callerIdSct = element(by.cssContainingText('.section__title', 'Caller ID'));
    this.autoAnsSct = element(by.cssContainingText('.section__title', 'Auto Answer'));
    this.sharedLineSct = element(by.cssContainingText('.section__title', 'Shared Line'));
    this.sideNavClose = element(by.css('button.panel-close'));
  }
};
