import { ServicesOverviewHybridCard } from './ServicesOverviewHybridCard';
import { ICardButton, CardType } from './ServicesOverviewCard';

export class ServicesOverviewHybridMediaCard extends ServicesOverviewHybridCard {
  public getShowMoreButton(): ICardButton | undefined {
    return undefined;
  }

  private _setupButton: ICardButton = {
    name: 'servicesOverview.genericButtons.setup',
    routerState: 'media-service-v2.list',
    buttonClass: 'btn',
  };

  private _buttons: Array<ICardButton> = [{
    name: 'servicesOverview.cards.hybridMedia.buttons.resources',
    routerState: 'media-service-v2.list',
    buttonClass: 'btn-link',
  }, {
    name: 'servicesOverview.cards.hybridMedia.buttons.settings',
    routerState: 'media-service-v2.settings',
    buttonClass: 'btn-link',
  }];

  public getButtons(): Array<ICardButton> {
    if (this.active) {
      return this._buttons;
    }
    return [this._setupButton];
  }

  public hybridMediaFeatureToggleEventHandler(hasFeature: boolean) {
    const hasRequiredRoles = _.includes(this.Authinfo.getRoles(), this.Config.roles.full_admin) ||
      _.includes(this.Authinfo.getRoles(), this.Config.roles.readonly_admin);
    this.display = hasRequiredRoles && this.Authinfo.isFusionMedia() && hasFeature;
  }

  /* @ngInject */
  public constructor(
    private Authinfo,
    private Config,
    FusionClusterStatesService,
  ) {
    super({
      active: false,
      cardClass: 'media',
      cardType: CardType.hybrid,
      description: 'servicesOverview.cards.hybridMedia.description',
      display : false,
      name: 'servicesOverview.cards.hybridMedia.title',
      routerState: 'media-service-v2.list',
      service: 'squared-fusion-media',
    }, FusionClusterStatesService);
  }
}
