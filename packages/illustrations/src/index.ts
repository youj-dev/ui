// @youj/illustrations: an isometric drawing kit in SVG, shaded from the
// theme's tokens. A scene and its projection, boxes, cylinders, stacks that
// explode with callouts, plinths, and drafting-paper backdrops; and the
// ready-made illustrations built from them, listed by id.

export {
  IsoScene,
  IsoPiece,
  useIsoScene,
  useIsoPoint,
  type IsoSceneProps,
  type IsoPieceProps,
  type IsoShape,
  type IsoSize,
} from './components/youj/graphics/iso-scene'
export { IsoBox, type IsoBoxProps, type IsoShapeProps } from './components/youj/graphics/iso-box'
export { IsoCylinder, type IsoCylinderProps } from './components/youj/graphics/iso-cylinder'
export { IsoPlatform, type IsoPlatformProps } from './components/youj/graphics/iso-platform'
export { IsoStack, type IsoStackProps, type IsoStackLayer } from './components/youj/graphics/iso-stack'
export { IsoCallout, type IsoCalloutProps } from './components/youj/graphics/iso-callout'
export {
  DotGrid,
  LineGrid,
  IsoGrid,
  IsoFloor,
  type DotGridProps,
  type LineGridProps,
  type IsoFloorProps,
  type GridFade,
} from './components/youj/graphics/grids'
export { faceVars, type IsoHue, type IsoTone, type IsoVariant } from './components/youj/graphics/tones'
export {
  project,
  axisStep,
  boxFaces,
  isoEllipse,
  isoSort,
  sceneViewBox,
  toPoints,
  type IsoBounds,
  type ScreenPoint,
  type ScenePad,
  type ViewBox,
} from './components/youj/graphics/iso'
export {
  Illustration,
  illustrations,
  illustrationCategories,
  getIllustration,
  isIllustrationId,
  type IllustrationCategory,
  type IllustrationComponentProps,
  type IllustrationEntry,
  type IllustrationId,
  type IllustrationSlot,
} from './components/youj/graphics/illustrations/registry'
export type { IllustrationProps } from './components/youj/graphics/illustrations/kit'
export {
  IllustrationDatabase,
  IllustrationWarehouse,
  IllustrationPipeline,
  IllustrationStorage,
  IllustrationBackups,
} from './components/youj/graphics/illustrations/data'
export {
  IllustrationServerRack,
  IllustrationCloud,
  IllustrationNetwork,
  IllustrationLoadBalancer,
  IllustrationEdge,
} from './components/youj/graphics/illustrations/infrastructure'
export {
  IllustrationMail,
  IllustrationCalendar,
  IllustrationDocuments,
  IllustrationAnalytics,
  IllustrationSearch,
  IllustrationNotifications,
} from './components/youj/graphics/illustrations/app'
export {
  IllustrationDeploy,
  IllustrationSecurity,
  IllustrationTeam,
  IllustrationSuccess,
  IllustrationNotFound,
  IllustrationEmpty,
} from './components/youj/graphics/illustrations/lifecycle'
export { IllustrationStorefront, IllustrationShoppingBag, IllustrationDelivery } from './components/youj/graphics/illustrations/commerce'
export { IllustrationPayment, IllustrationWallet, IllustrationSavings, IllustrationCalculator, IllustrationCoins, IllustrationInvoice, IllustrationStockChart } from './components/youj/graphics/illustrations/finance'
export { IllustrationHeartRate, IllustrationFitness, IllustrationFirstAid, IllustrationPills, IllustrationStethoscope, IllustrationTooth, IllustrationYoga } from './components/youj/graphics/illustrations/health'
export { IllustrationBooks, IllustrationGraduation, IllustrationIdea, IllustrationAbacus, IllustrationBackpack, IllustrationGlobe, IllustrationLibrary } from './components/youj/graphics/illustrations/education'
export { IllustrationSuitcase, IllustrationFlight, IllustrationMap } from './components/youj/graphics/illustrations/travel'
export { IllustrationCoffee, IllustrationRestaurant, IllustrationGroceries, IllustrationBakery, IllustrationCocktail, IllustrationCooking, IllustrationPizza } from './components/youj/graphics/illustrations/food'
export { IllustrationCamera, IllustrationMusic, IllustrationVideo, IllustrationDesignTools, IllustrationEasel, IllustrationFilmReel, IllustrationGuitar } from './components/youj/graphics/illustrations/media'
export { IllustrationChat, IllustrationVideoCall, IllustrationAnnouncement, IllustrationCommunity, IllustrationNewsletter, IllustrationPhoneCall, IllustrationPodcast, IllustrationReactions } from './components/youj/graphics/illustrations/social'
export { IllustrationHome, IllustrationPlant, IllustrationGift } from './components/youj/graphics/illustrations/home'
export { IllustrationChecklist, IllustrationBriefcase, IllustrationTrophy } from './components/youj/graphics/illustrations/work'
export { IllustrationBasketball, IllustrationBicycle, IllustrationStopwatch, IllustrationTennis } from './components/youj/graphics/illustrations/sports'
export { IllustrationArcade, IllustrationDice, IllustrationGameController, IllustrationPuzzle } from './components/youj/graphics/illustrations/play'
export { IllustrationCake, IllustrationParty, IllustrationShowStage, IllustrationTicket } from './components/youj/graphics/illustrations/events'
export { IllustrationCatTree, IllustrationDogHouse, IllustrationFishBowl, IllustrationPetBowl } from './components/youj/graphics/illustrations/pets'
export { IllustrationLightning, IllustrationRain, IllustrationSnowflake, IllustrationSunCloud } from './components/youj/graphics/illustrations/weather'
export { IllustrationFlower, IllustrationGreenhouse, IllustrationIsland, IllustrationMountain, IllustrationRecycling, IllustrationTree, IllustrationWaterDrop } from './components/youj/graphics/illustrations/nature'
export { IllustrationBattery, IllustrationEvCharger, IllustrationSolarPanel, IllustrationWindTurbine } from './components/youj/graphics/illustrations/energy'
export { IllustrationBus, IllustrationCar, IllustrationScooter, IllustrationShip, IllustrationTrain } from './components/youj/graphics/illustrations/transport'
export { IllustrationBank, IllustrationHospital, IllustrationLighthouse, IllustrationMuseum, IllustrationOfficeTower, IllustrationSchool } from './components/youj/graphics/illustrations/places'
export { IllustrationBeach, IllustrationBinoculars, IllustrationCompass, IllustrationHotAirBalloon, IllustrationTent } from './components/youj/graphics/illustrations/outdoors'
export { IllustrationAtom, IllustrationDna, IllustrationLabFlask, IllustrationMicroscope, IllustrationTelescope } from './components/youj/graphics/illustrations/science'
export { IllustrationFingerprint, IllustrationKey, IllustrationPadlock, IllustrationShield, IllustrationVault } from './components/youj/graphics/illustrations/security'
export { IllustrationDrone, IllustrationLaptop, IllustrationPhone, IllustrationPrinter, IllustrationSmartwatch, IllustrationVrHeadset } from './components/youj/graphics/illustrations/devices'
export { IllustrationContract, IllustrationHandshake, IllustrationMeeting, IllustrationOrgChart, IllustrationPresentation, IllustrationScales, IllustrationTarget } from './components/youj/graphics/illustrations/business'
