import type { ComponentType, ReactNode } from 'react'
import { IllustrationAnalytics, IllustrationCalendar, IllustrationDocuments, IllustrationMail, IllustrationNotifications, IllustrationSearch } from './app'
import { IllustrationBackups, IllustrationDatabase, IllustrationPipeline, IllustrationStorage, IllustrationWarehouse } from './data'
import { IllustrationCloud, IllustrationEdge, IllustrationLoadBalancer, IllustrationNetwork, IllustrationServerRack } from './infrastructure'
import { IllustrationDeploy, IllustrationEmpty, IllustrationNotFound, IllustrationSecurity, IllustrationSuccess, IllustrationTeam } from './lifecycle'
import { IllustrationDelivery, IllustrationShoppingBag, IllustrationStorefront } from './commerce'
import { IllustrationCalculator, IllustrationCoins, IllustrationInvoice, IllustrationPayment, IllustrationSavings, IllustrationStockChart, IllustrationWallet } from './finance'
import { IllustrationFirstAid, IllustrationFitness, IllustrationHeartRate } from './health'
import { IllustrationBooks, IllustrationGraduation, IllustrationIdea } from './education'
import { IllustrationFlight, IllustrationMap, IllustrationSuitcase } from './travel'
import { IllustrationCoffee, IllustrationGroceries, IllustrationRestaurant } from './food'
import { IllustrationCamera, IllustrationMusic, IllustrationVideo } from './media'
import { IllustrationAnnouncement, IllustrationChat, IllustrationCommunity, IllustrationNewsletter, IllustrationPhoneCall, IllustrationPodcast, IllustrationReactions, IllustrationVideoCall } from './social'
import { IllustrationGift, IllustrationHome, IllustrationPlant } from './home'
import { IllustrationBriefcase, IllustrationChecklist, IllustrationTrophy } from './work'
import { IllustrationBasketball, IllustrationBicycle, IllustrationStopwatch, IllustrationTennis } from './sports'
import { IllustrationArcade, IllustrationDice, IllustrationGameController, IllustrationPuzzle } from './play'
import { IllustrationCake, IllustrationParty, IllustrationShowStage, IllustrationTicket } from './events'
import { IllustrationCatTree, IllustrationDogHouse, IllustrationFishBowl, IllustrationPetBowl } from './pets'
import { IllustrationBakery, IllustrationCocktail, IllustrationCooking, IllustrationPizza } from './food'
import { IllustrationPills, IllustrationStethoscope, IllustrationTooth, IllustrationYoga } from './health'
import { IllustrationAbacus, IllustrationBackpack, IllustrationGlobe, IllustrationLibrary } from './education'
import { IllustrationDesignTools, IllustrationEasel, IllustrationFilmReel, IllustrationGuitar } from './media'
import { IllustrationLightning, IllustrationRain, IllustrationSnowflake, IllustrationSunCloud } from './weather'
import { IllustrationFlower, IllustrationGreenhouse, IllustrationIsland, IllustrationMountain, IllustrationRecycling, IllustrationTree, IllustrationWaterDrop } from './nature'
import { IllustrationBattery, IllustrationEvCharger, IllustrationSolarPanel, IllustrationWindTurbine } from './energy'
import { IllustrationBus, IllustrationCar, IllustrationScooter, IllustrationShip, IllustrationTrain } from './transport'
import { IllustrationBank, IllustrationHospital, IllustrationLighthouse, IllustrationMuseum, IllustrationOfficeTower, IllustrationSchool } from './places'
import { IllustrationBeach, IllustrationBinoculars, IllustrationCompass, IllustrationHotAirBalloon, IllustrationTent } from './outdoors'
import { IllustrationAtom, IllustrationDna, IllustrationLabFlask, IllustrationMicroscope, IllustrationTelescope } from './science'
import { IllustrationFingerprint, IllustrationKey, IllustrationPadlock, IllustrationShield, IllustrationVault } from './security'
import { IllustrationDrone, IllustrationLaptop, IllustrationPhone, IllustrationPrinter, IllustrationSmartwatch, IllustrationVrHeadset } from './devices'
import { IllustrationContract, IllustrationHandshake, IllustrationMeeting, IllustrationOrgChart, IllustrationPresentation, IllustrationScales, IllustrationTarget } from './business'
import type { IllustrationProps } from './kit'
import type { IllustrationCategory } from './categories'

/* Every ready-made scene by id, so a list can show them and a slot can take
 * one by name. Plain data (no hooks, no client boundary), so a server
 * component can read the ids and names too. */

export { illustrationCategories, type IllustrationCategory } from './categories'

export interface IllustrationEntry {
  id: string
  name: string
  category: IllustrationCategory
  /** Extra words search matches on, beyond the name and category. */
  tags?: readonly string[]
  Component: ComponentType<IllustrationProps>
}

export const illustrations = [
  { id: 'database', name: 'Database', category: 'data', tags: ['sql', 'records', 'table', 'query', 'storage'], Component: IllustrationDatabase },
  { id: 'warehouse', name: 'Data warehouse', category: 'data', tags: ['analytics', 'etl', 'tables', 'lake', 'reporting'], Component: IllustrationWarehouse },
  { id: 'pipeline', name: 'Pipeline', category: 'data', tags: ['etl', 'stream', 'sync', 'workflow', 'integration'], Component: IllustrationPipeline },
  { id: 'storage', name: 'Storage', category: 'data', tags: ['files', 'archive', 'cabinet', 'drawer', 'uploads'], Component: IllustrationStorage },
  { id: 'backups', name: 'Backups', category: 'data', tags: ['snapshot', 'restore', 'history', 'versions', 'recovery'], Component: IllustrationBackups },
  { id: 'server-rack', name: 'Server rack', category: 'infrastructure', tags: ['servers', 'hosting', 'datacenter', 'hardware', 'compute'], Component: IllustrationServerRack },
  { id: 'cloud', name: 'Cloud regions', category: 'infrastructure', tags: ['regions', 'hosting', 'global', 'availability', 'zones'], Component: IllustrationCloud },
  { id: 'network', name: 'Network', category: 'infrastructure', tags: ['nodes', 'connections', 'graph', 'mesh', 'topology'], Component: IllustrationNetwork },
  { id: 'load-balancer', name: 'Load balancer', category: 'infrastructure', tags: ['traffic', 'routing', 'scaling', 'proxy', 'requests'], Component: IllustrationLoadBalancer },
  { id: 'edge', name: 'Edge network', category: 'infrastructure', tags: ['cdn', 'latency', 'global', 'caching', 'distribution'], Component: IllustrationEdge },
  { id: 'mail', name: 'Mail', category: 'app', tags: ['email', 'inbox', 'message', 'letter', 'newsletter'], Component: IllustrationMail },
  { id: 'calendar', name: 'Calendar', category: 'app', tags: ['schedule', 'event', 'date', 'meeting', 'booking'], Component: IllustrationCalendar },
  { id: 'documents', name: 'Documents', category: 'app', tags: ['files', 'pages', 'docs', 'paper', 'notes'], Component: IllustrationDocuments },
  { id: 'analytics', name: 'Analytics', category: 'app', tags: ['chart', 'metrics', 'stats', 'reporting', 'growth'], Component: IllustrationAnalytics },
  { id: 'search', name: 'Search', category: 'app', tags: ['find', 'lookup', 'results', 'magnifier', 'query'], Component: IllustrationSearch },
  { id: 'notifications', name: 'Notifications', category: 'app', tags: ['bell', 'alerts', 'reminder', 'ping', 'badge'], Component: IllustrationNotifications },
  { id: 'deploy', name: 'Deploy', category: 'lifecycle', tags: ['launch', 'rocket', 'release', 'ship', 'startup'], Component: IllustrationDeploy },
  { id: 'security', name: 'Security', category: 'lifecycle', tags: ['vault', 'lock', 'safe', 'privacy', 'protection'], Component: IllustrationSecurity },
  { id: 'team', name: 'Team', category: 'lifecycle', tags: ['people', 'collaboration', 'members', 'meeting', 'group'], Component: IllustrationTeam },
  { id: 'success', name: 'Success', category: 'lifecycle', tags: ['done', 'complete', 'check', 'celebration', 'confetti'], Component: IllustrationSuccess },
  { id: 'not-found', name: 'Not found', category: 'lifecycle', tags: ['404', 'missing', 'error', 'lost', 'gap'], Component: IllustrationNotFound },
  { id: 'empty', name: 'Empty', category: 'lifecycle', tags: ['blank', 'nothing', 'zero', 'box', 'placeholder'], Component: IllustrationEmpty },
  { id: 'storefront', name: 'Shop front', category: 'commerce', tags: ['store', 'retail', 'boutique', 'market', 'awning'], Component: IllustrationStorefront },
  { id: 'shopping-bag', name: 'Shopping bag', category: 'commerce', tags: ['purchase', 'retail', 'order', 'buy', 'fashion'], Component: IllustrationShoppingBag },
  { id: 'delivery', name: 'Delivery', category: 'commerce', tags: ['shipping', 'parcel', 'package', 'courier', 'logistics'], Component: IllustrationDelivery },
  { id: 'payment', name: 'Payment', category: 'finance', tags: ['card', 'checkout', 'terminal', 'contactless', 'pay'], Component: IllustrationPayment },
  { id: 'wallet', name: 'Wallet', category: 'finance', tags: ['cards', 'money', 'cash', 'coins', 'balance'], Component: IllustrationWallet },
  { id: 'savings', name: 'Savings', category: 'finance', tags: ['jar', 'coins', 'budget', 'piggy', 'money'], Component: IllustrationSavings },
  { id: 'heart-rate', name: 'Heart rate', category: 'health', tags: ['pulse', 'monitor', 'cardio', 'heartbeat', 'vitals'], Component: IllustrationHeartRate },
  { id: 'fitness', name: 'Fitness', category: 'health', tags: ['gym', 'workout', 'dumbbell', 'exercise', 'training'], Component: IllustrationFitness },
  { id: 'first-aid', name: 'First aid', category: 'health', tags: ['medical', 'emergency', 'care', 'doctor', 'kit'], Component: IllustrationFirstAid },
  { id: 'books', name: 'Books', category: 'education', tags: ['reading', 'library', 'study', 'learning', 'pencil'], Component: IllustrationBooks },
  { id: 'graduation', name: 'Graduation', category: 'education', tags: ['diploma', 'school', 'degree', 'cap', 'university'], Component: IllustrationGraduation },
  { id: 'idea', name: 'Idea', category: 'education', tags: ['lightbulb', 'insight', 'brainstorm', 'inspiration', 'tip'], Component: IllustrationIdea },
  { id: 'suitcase', name: 'Suitcase', category: 'travel', tags: ['luggage', 'trip', 'baggage', 'vacation', 'packing'], Component: IllustrationSuitcase },
  { id: 'flight', name: 'Flight', category: 'travel', tags: ['plane', 'airport', 'trip', 'booking', 'departure'], Component: IllustrationFlight },
  { id: 'map', name: 'Map', category: 'travel', tags: ['route', 'directions', 'location', 'pin', 'navigation'], Component: IllustrationMap },
  { id: 'coffee', name: 'Coffee', category: 'food', tags: ['cafe', 'drink', 'cup', 'break', 'morning'], Component: IllustrationCoffee },
  { id: 'restaurant', name: 'Restaurant', category: 'food', tags: ['dining', 'meal', 'table', 'dinner', 'reservation'], Component: IllustrationRestaurant },
  { id: 'groceries', name: 'Groceries', category: 'food', tags: ['basket', 'shopping', 'produce', 'market', 'apple'], Component: IllustrationGroceries },
  { id: 'camera', name: 'Camera', category: 'media', tags: ['photo', 'photography', 'lens', 'picture', 'snapshot'], Component: IllustrationCamera },
  { id: 'music', name: 'Music', category: 'media', tags: ['record', 'vinyl', 'audio', 'song', 'playlist'], Component: IllustrationMusic },
  { id: 'video', name: 'Video', category: 'media', tags: ['play', 'player', 'screen', 'stream', 'movie'], Component: IllustrationVideo },
  { id: 'chat', name: 'Chat', category: 'social', tags: ['message', 'conversation', 'reply', 'typing', 'support'], Component: IllustrationChat },
  { id: 'video-call', name: 'Video call', category: 'social', tags: ['meeting', 'conference', 'laptop', 'remote', 'webcam'], Component: IllustrationVideoCall },
  { id: 'announcement', name: 'Announcement', category: 'social', tags: ['megaphone', 'news', 'broadcast', 'launch', 'marketing'], Component: IllustrationAnnouncement },
  { id: 'home', name: 'Home', category: 'home', tags: ['house', 'property', 'tree', 'roof', 'living'], Component: IllustrationHome },
  { id: 'plant', name: 'Plant', category: 'home', tags: ['pot', 'sprout', 'growth', 'garden', 'nature'], Component: IllustrationPlant },
  { id: 'gift', name: 'Gift', category: 'home', tags: ['present', 'reward', 'birthday', 'ribbon', 'surprise'], Component: IllustrationGift },
  { id: 'checklist', name: 'Checklist', category: 'work', tags: ['tasks', 'todo', 'clipboard', 'done', 'checkbox'], Component: IllustrationChecklist },
  { id: 'briefcase', name: 'Briefcase', category: 'work', tags: ['job', 'business', 'career', 'office', 'portfolio'], Component: IllustrationBriefcase },
  { id: 'trophy', name: 'Trophy', category: 'work', tags: ['award', 'winner', 'achievement', 'prize', 'podium'], Component: IllustrationTrophy },
  { id: 'bicycle', name: 'Bicycle', category: 'sports', tags: ['bike', 'cycling', 'ride', 'commute'], Component: IllustrationBicycle },
  { id: 'basketball', name: 'Basketball', category: 'sports', tags: ['hoop', 'ball', 'court', 'score', 'game'], Component: IllustrationBasketball },
  { id: 'stopwatch', name: 'Stopwatch', category: 'sports', tags: ['timer', 'time', 'race', 'lap', 'speed'], Component: IllustrationStopwatch },
  { id: 'tennis', name: 'Tennis', category: 'sports', tags: ['racket', 'ball', 'court', 'match'], Component: IllustrationTennis },
  { id: 'game-controller', name: 'Game controller', category: 'play', tags: ['gamepad', 'gaming', 'console', 'joystick'], Component: IllustrationGameController },
  { id: 'arcade', name: 'Arcade', category: 'play', tags: ['cabinet', 'retro', 'pixel', 'gaming', 'coin'], Component: IllustrationArcade },
  { id: 'dice', name: 'Dice', category: 'play', tags: ['roll', 'luck', 'chance', 'board', 'random'], Component: IllustrationDice },
  { id: 'puzzle', name: 'Puzzle', category: 'play', tags: ['jigsaw', 'piece', 'fit', 'solve'], Component: IllustrationPuzzle },
  { id: 'party', name: 'Party', category: 'events', tags: ['balloons', 'birthday', 'celebrate', 'confetti'], Component: IllustrationParty },
  { id: 'ticket', name: 'Ticket', category: 'events', tags: ['admission', 'pass', 'concert', 'booking', 'entry'], Component: IllustrationTicket },
  { id: 'stage', name: 'Stage', category: 'events', tags: ['theatre', 'curtain', 'show', 'spotlight', 'performance'], Component: IllustrationShowStage },
  { id: 'cake', name: 'Cake', category: 'events', tags: ['birthday', 'celebration', 'candles', 'anniversary'], Component: IllustrationCake },
  { id: 'dog-house', name: 'Dog house', category: 'pets', tags: ['dog', 'kennel', 'puppy', 'yard'], Component: IllustrationDogHouse },
  { id: 'fish-bowl', name: 'Fish bowl', category: 'pets', tags: ['fish', 'goldfish', 'aquarium', 'water'], Component: IllustrationFishBowl },
  { id: 'pet-bowl', name: 'Pet bowl', category: 'pets', tags: ['food', 'treat', 'feeding', 'dog', 'cat'], Component: IllustrationPetBowl },
  { id: 'cat-tree', name: 'Cat tree', category: 'pets', tags: ['cat', 'kitten', 'scratching', 'toy'], Component: IllustrationCatTree },
  { id: 'sun-cloud', name: 'Sun and cloud', category: 'weather', tags: ['sunny', 'cloudy', 'forecast', 'sky', 'day'], Component: IllustrationSunCloud },
  { id: 'rain', name: 'Rain', category: 'weather', tags: ['rainy', 'drops', 'shower', 'forecast', 'wet'], Component: IllustrationRain },
  { id: 'snowflake', name: 'Snowflake', category: 'weather', tags: ['snow', 'winter', 'cold', 'frost', 'forecast'], Component: IllustrationSnowflake },
  { id: 'lightning', name: 'Lightning', category: 'weather', tags: ['storm', 'thunder', 'bolt', 'flash', 'forecast'], Component: IllustrationLightning },
  { id: 'tree', name: 'Tree', category: 'nature', tags: ['apple', 'park', 'garden', 'forest', 'outdoors'], Component: IllustrationTree },
  { id: 'mountain', name: 'Mountain', category: 'nature', tags: ['peak', 'summit', 'hiking', 'climb', 'goal'], Component: IllustrationMountain },
  { id: 'island', name: 'Island', category: 'nature', tags: ['beach', 'palm', 'sea', 'holiday', 'tropical'], Component: IllustrationIsland },
  { id: 'flower', name: 'Flower', category: 'nature', tags: ['bloom', 'daisy', 'vase', 'spring', 'garden'], Component: IllustrationFlower },
  { id: 'recycling', name: 'Recycling', category: 'nature', tags: ['recycle', 'bin', 'waste', 'bottle', 'sustainability'], Component: IllustrationRecycling },
  { id: 'greenhouse', name: 'Greenhouse', category: 'nature', tags: ['garden', 'seedlings', 'grow', 'glass', 'plants'], Component: IllustrationGreenhouse },
  { id: 'water-drop', name: 'Water drop', category: 'nature', tags: ['water', 'droplet', 'ripple', 'liquid', 'hydration'], Component: IllustrationWaterDrop },
  { id: 'solar-panel', name: 'Solar panel', category: 'energy', tags: ['solar', 'sun', 'renewable', 'power', 'electricity'], Component: IllustrationSolarPanel },
  { id: 'wind-turbine', name: 'Wind turbine', category: 'energy', tags: ['wind', 'windmill', 'renewable', 'power', 'electricity'], Component: IllustrationWindTurbine },
  { id: 'battery', name: 'Battery', category: 'energy', tags: ['charge', 'charging', 'power', 'level', 'storage'], Component: IllustrationBattery },
  { id: 'ev-charger', name: 'EV charger', category: 'energy', tags: ['electric', 'car', 'charging', 'plug', 'station'], Component: IllustrationEvCharger },
  { id: 'car', name: 'Car', category: 'transport', tags: ['vehicle', 'drive', 'ride', 'parking', 'road'], Component: IllustrationCar },
  { id: 'bus', name: 'Bus', category: 'transport', tags: ['transit', 'commute', 'stop', 'public', 'city'], Component: IllustrationBus },
  { id: 'train', name: 'Train', category: 'transport', tags: ['rail', 'railway', 'transit', 'commute', 'station'], Component: IllustrationTrain },
  { id: 'scooter', name: 'Scooter', category: 'transport', tags: ['kick', 'ride', 'electric', 'commute', 'city'], Component: IllustrationScooter },
  { id: 'ship', name: 'Ship', category: 'transport', tags: ['boat', 'cargo', 'shipping', 'freight', 'sea', 'port'], Component: IllustrationShip },
  { id: 'office-tower', name: 'Office tower', category: 'places', tags: ['building', 'office', 'skyscraper', 'city', 'business'], Component: IllustrationOfficeTower },
  { id: 'bank', name: 'Bank', category: 'places', tags: ['money', 'finance', 'building', 'branch', 'deposit'], Component: IllustrationBank },
  { id: 'hospital', name: 'Hospital', category: 'places', tags: ['health', 'medical', 'clinic', 'emergency', 'helicopter'], Component: IllustrationHospital },
  { id: 'school', name: 'School', category: 'places', tags: ['education', 'class', 'campus', 'building', 'flag'], Component: IllustrationSchool },
  { id: 'museum', name: 'Museum', category: 'places', tags: ['gallery', 'art', 'exhibit', 'culture', 'history'], Component: IllustrationMuseum },
  { id: 'lighthouse', name: 'Lighthouse', category: 'places', tags: ['coast', 'sea', 'beacon', 'light', 'harbour'], Component: IllustrationLighthouse },
  { id: 'tent', name: 'Tent', category: 'outdoors', tags: ['camping', 'campfire', 'trip', 'nature', 'night'], Component: IllustrationTent },
  { id: 'compass', name: 'Compass', category: 'outdoors', tags: ['direction', 'navigation', 'north', 'explore', 'hiking'], Component: IllustrationCompass },
  { id: 'binoculars', name: 'Binoculars', category: 'outdoors', tags: ['look', 'explore', 'birdwatching', 'view', 'discover'], Component: IllustrationBinoculars },
  { id: 'hot-air-balloon', name: 'Hot-air balloon', category: 'outdoors', tags: ['balloon', 'flight', 'sky', 'adventure', 'travel'], Component: IllustrationHotAirBalloon },
  { id: 'beach', name: 'Beach', category: 'outdoors', tags: ['holiday', 'summer', 'umbrella', 'towel', 'sand', 'vacation'], Component: IllustrationBeach },
  { id: 'microscope', name: 'Microscope', category: 'science', tags: ['lab', 'research', 'biology', 'zoom', 'sample'], Component: IllustrationMicroscope },
  { id: 'lab-flask', name: 'Lab flask', category: 'science', tags: ['chemistry', 'experiment', 'lab', 'beta', 'test'], Component: IllustrationLabFlask },
  { id: 'atom', name: 'Atom', category: 'science', tags: ['physics', 'energy', 'particle', 'electron', 'nuclear'], Component: IllustrationAtom },
  { id: 'telescope', name: 'Telescope', category: 'science', tags: ['astronomy', 'space', 'stars', 'discover', 'observe'], Component: IllustrationTelescope },
  { id: 'dna', name: 'DNA', category: 'science', tags: ['genetics', 'biology', 'helix', 'gene', 'health'], Component: IllustrationDna },
  { id: 'padlock', name: 'Padlock', category: 'security', tags: ['lock', 'locked', 'unlock', 'privacy', 'secure'], Component: IllustrationPadlock },
  { id: 'key', name: 'Key', category: 'security', tags: ['access', 'password', 'unlock', 'credentials', 'login'], Component: IllustrationKey },
  { id: 'fingerprint', name: 'Fingerprint', category: 'security', tags: ['biometric', 'identity', 'touch', 'scan', 'login'], Component: IllustrationFingerprint },
  { id: 'shield', name: 'Shield', category: 'security', tags: ['protection', 'antivirus', 'safe', 'guard', 'verified'], Component: IllustrationShield },
  { id: 'vault', name: 'Vault', category: 'security', tags: ['safe', 'gold', 'valuables', 'secure', 'savings'], Component: IllustrationVault },
  { id: 'phone', name: 'Phone', category: 'devices', tags: ['mobile', 'smartphone', 'app', 'notification', 'cell'], Component: IllustrationPhone },
  { id: 'laptop', name: 'Laptop', category: 'devices', tags: ['computer', 'notebook', 'desktop', 'code', 'screen'], Component: IllustrationLaptop },
  { id: 'smartwatch', name: 'Smartwatch', category: 'devices', tags: ['watch', 'wearable', 'fitness', 'time', 'activity'], Component: IllustrationSmartwatch },
  { id: 'vr-headset', name: 'VR headset', category: 'devices', tags: ['virtual', 'reality', 'goggles', 'immersive', '3d'], Component: IllustrationVrHeadset },
  { id: 'printer', name: 'Printer', category: 'devices', tags: ['print', 'paper', 'office', 'document', 'page'], Component: IllustrationPrinter },
  { id: 'drone', name: 'Drone', category: 'devices', tags: ['quadcopter', 'flying', 'aerial', 'camera', 'delivery'], Component: IllustrationDrone },
  { id: 'handshake', name: 'Handshake', category: 'business', tags: ['deal', 'agreement', 'partner', 'welcome', 'trust'], Component: IllustrationHandshake },
  { id: 'presentation', name: 'Presentation', category: 'business', tags: ['pitch', 'slides', 'easel', 'chart', 'meeting'], Component: IllustrationPresentation },
  { id: 'meeting', name: 'Meeting', category: 'business', tags: ['boardroom', 'conference', 'table', 'chairs', 'discussion'], Component: IllustrationMeeting },
  { id: 'org-chart', name: 'Org chart', category: 'business', tags: ['hierarchy', 'team', 'structure', 'company', 'people'], Component: IllustrationOrgChart },
  { id: 'target', name: 'Target', category: 'business', tags: ['goal', 'aim', 'bullseye', 'dart', 'focus'], Component: IllustrationTarget },
  { id: 'contract', name: 'Contract', category: 'business', tags: ['agreement', 'sign', 'signature', 'document', 'legal'], Component: IllustrationContract },
  { id: 'scales', name: 'Scales', category: 'business', tags: ['justice', 'balance', 'law', 'legal', 'fair', 'weigh'], Component: IllustrationScales },
  { id: 'stock-chart', name: 'Stock chart', category: 'finance', tags: ['stocks', 'trading', 'market', 'candles', 'invest'], Component: IllustrationStockChart },
  { id: 'calculator', name: 'Calculator', category: 'finance', tags: ['math', 'budget', 'accounting', 'sum', 'tax'], Component: IllustrationCalculator },
  { id: 'coins', name: 'Coins', category: 'finance', tags: ['money', 'cash', 'change', 'savings', 'earnings'], Component: IllustrationCoins },
  { id: 'invoice', name: 'Invoice', category: 'finance', tags: ['bill', 'receipt', 'billing', 'payment', 'print'], Component: IllustrationInvoice },
  { id: 'phone-call', name: 'Phone call', category: 'social', tags: ['call', 'ring', 'telephone', 'support', 'contact'], Component: IllustrationPhoneCall },
  { id: 'newsletter', name: 'Newsletter', category: 'social', tags: ['subscribe', 'mailbox', 'news', 'updates', 'inbox'], Component: IllustrationNewsletter },
  { id: 'podcast', name: 'Podcast', category: 'social', tags: ['mic', 'microphone', 'audio', 'record', 'show'], Component: IllustrationPodcast },
  { id: 'community', name: 'Community', category: 'social', tags: ['people', 'group', 'gathering', 'members', 'campfire'], Component: IllustrationCommunity },
  { id: 'reactions', name: 'Reactions', category: 'social', tags: ['like', 'heart', 'emoji', 'feedback', 'post'], Component: IllustrationReactions },
  { id: 'pizza', name: 'Pizza', category: 'food', tags: ['slice', 'takeaway', 'dinner', 'order'], Component: IllustrationPizza },
  { id: 'bakery', name: 'Bakery', category: 'food', tags: ['bread', 'loaf', 'toast', 'breakfast'], Component: IllustrationBakery },
  { id: 'cocktail', name: 'Cocktail', category: 'food', tags: ['drink', 'bar', 'glass', 'party'], Component: IllustrationCocktail },
  { id: 'cooking', name: 'Cooking', category: 'food', tags: ['pot', 'stove', 'kitchen', 'recipe', 'steam'], Component: IllustrationCooking },
  { id: 'pills', name: 'Pills', category: 'health', tags: ['medicine', 'pharmacy', 'prescription', 'capsule'], Component: IllustrationPills },
  { id: 'stethoscope', name: 'Stethoscope', category: 'health', tags: ['doctor', 'checkup', 'clinic', 'medical'], Component: IllustrationStethoscope },
  { id: 'tooth', name: 'Tooth', category: 'health', tags: ['dentist', 'dental', 'teeth', 'toothbrush'], Component: IllustrationTooth },
  { id: 'yoga', name: 'Yoga', category: 'health', tags: ['meditation', 'mindfulness', 'wellness', 'calm', 'mat'], Component: IllustrationYoga },
  { id: 'globe', name: 'Globe', category: 'education', tags: ['world', 'geography', 'earth', 'international', 'language'], Component: IllustrationGlobe },
  { id: 'school-backpack', name: 'School backpack', category: 'education', tags: ['bag', 'student', 'kids', 'homework'], Component: IllustrationBackpack },
  { id: 'library', name: 'Library', category: 'education', tags: ['bookcase', 'shelf', 'reading', 'books', 'catalog'], Component: IllustrationLibrary },
  { id: 'abacus', name: 'Abacus', category: 'education', tags: ['counting', 'math', 'numbers', 'beads'], Component: IllustrationAbacus },
  { id: 'easel', name: 'Easel', category: 'media', tags: ['painting', 'art', 'canvas', 'palette', 'creative'], Component: IllustrationEasel },
  { id: 'guitar', name: 'Guitar', category: 'media', tags: ['music', 'instrument', 'amp', 'band'], Component: IllustrationGuitar },
  { id: 'film-reel', name: 'Film reel', category: 'media', tags: ['movie', 'cinema', 'film', 'video'], Component: IllustrationFilmReel },
  { id: 'design-tools', name: 'Design tools', category: 'media', tags: ['pen', 'vector', 'ruler', 'drawing', 'bezier'], Component: IllustrationDesignTools },
] as const satisfies readonly IllustrationEntry[]

export type IllustrationId = (typeof illustrations)[number]['id']

/** What an illustration slot takes: a scene by id, or any node of your own (`null` for none). */
export type IllustrationSlot = IllustrationId | Exclude<ReactNode, string>

const byId = new Map<string, IllustrationEntry>(illustrations.map((entry) => [entry.id, entry]))

export const isIllustrationId = (value: unknown): value is IllustrationId => typeof value === 'string' && byId.has(value)

/** The entry for an id, or undefined for one that isn't registered. */
export const getIllustration = (id: string): IllustrationEntry | undefined => byId.get(id)

export interface IllustrationComponentProps extends IllustrationProps {
  /** A scene by id, or a node drawn as given. `null` or `false` draws nothing. */
  scene?: IllustrationSlot | string
  /** The scene drawn when `scene` is left out or names no registered scene. */
  fallback?: IllustrationId
}

/** Draws an illustration slot: a registered scene by id (with these props), or the node it was given. */
export function Illustration({ scene, fallback, ...props }: IllustrationComponentProps) {
  const value = scene === undefined || (typeof scene === 'string' && !byId.has(scene)) ? fallback : scene
  if (typeof value === 'string') {
    const { Component } = byId.get(value)!
    return <Component {...props} />
  }
  return <>{value}</>
}
