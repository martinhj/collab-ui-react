export class CallFeaturesPage {
  constructor() {
    this.callFeatures = element(by.css('a[href="/services/call-features"]'));
    this.newFeatureButton = element(by.buttonText('New'));
    this.createNewFeatureModalTitle = element(by.cssContainingText('.modal-title', 'Create New Feature'));
    this.aaFeatureButton = element(by.css('h4.feature-label-container-AA'));
    this.hgFeatureButton = element(by.css('h4.feature-label-container-HG'));
    this.cpFeatureButton = element(by.css('h4.feature-label-container-CP'));
    this.piFeatureButton = element(by.css('h4.feature-label-container-PI'));
    this.pgFeatureButton = element(by.css('h4.feature-label-container-PG'));
    this.closeBtn = element(by.css('button.close'));
    this.pageTitle = element(by.css('h2.page-header__title'));
    this.callLines = element(by.css('a[href="/services/call-lines"]'));
    this.callSettings = element(by.css('a[href="/services/call-settings"]'));
    this.searchBox = element(by.css('i.icon.icon-search'));
    this.all = element(by.cssContainingText('span.name', 'All'));
    this.autoAttendant = element(by.cssContainingText('span.name', 'Auto Attendant'));
    this.callPark = element(by.cssContainingText('span.name', 'Call Park'));
    this.callPickup = element(by.cssContainingText('span.name', 'Call Pickup'));
    this.huntGroup = element(by.cssContainingText('span.name', 'Hunt Group'));
    this.pagingGroup = element(by.cssContainingText('span.name', 'Paging Group'));
    this.newButton = element(by.css('button.btn.btn--people.new-feature-button'));
    this.card = element(by.css('section.card-body'));
    this.cpDetailHeader = element(by.css('div.header-with-right-icon'));
    this.detailHeader = element(by.css('.h4.ellipsis'));
    this.editCancel = element(by.cssContainingText('button', 'Cancel'));
    this.editSave = element(by.cssContainingText('button', 'Save'));
    this.editGroupName = element(by.name('editCallFeatureName'));
    this.nextButton = element(by.css('span.icon-arrow-next'));
    this.backButton = element(by.css('i.icon-arrow-back'));
    this.confirmDelete = element(by.css('button.btn--negative'));
    this.countCard = element.all(by.repeater('huronFeature in huronFeaturesCtrl.listOfFeatures'));
    this.cpHeading = element(by.cssContainingText('h4.section__title', 'Call Park Settings'));
    this.cpuHeading = element(by.cssContainingText('h4.section__title', 'Call Pickup Settings'));
    this.hgHeading = element(by.cssContainingText('h4.section__title', 'Hunt Group Settings'));
    this.pgHeading = element(by.cssContainingText('h4.section__title', 'Paging Group Settings'));
    this.featureCard = element(by.css('article'));
  }
};
