import { NETWORK_TYPE } from '../constants/contextConstants';
import {
  ROUTE_STATS,
  ROUTE_SWAP,
  ROUTE_ANALYTICS,
  ROUTE_MY_SWAP,
  ROUTE_LIQUIDITY_TOKENS,
  ROUTE_LIQUIDITY_POOLS,
  ROUTE_LIQUIDITY_MY_LIQUIDITY,
  ROUTE_LIQUIDITY_ADD_LIQUIDITY_DOUBLE_SIDED,
  ROUTE_LIQUIDITY_REMOVE_LIQUIDITY_DOUBLE_SIDED,
  ROUTE_LIQUIDITY_REWARDS,
  ROUTE_LIQUIDITY_CREATE_PAIR,
  ROUTE_ANALYTICS_STATS,
} from '../router/routes';

export const SWAP = {
  id: 0,
  label: 'Swap',
  route: ROUTE_SWAP,
  activeRoutes: [ROUTE_MY_SWAP],
};
export const LIQUIDITY = {
  id: 1,
  label: 'Liquidity',
  route: ROUTE_LIQUIDITY_TOKENS,
  activeRoutes: [
    ROUTE_LIQUIDITY_POOLS,
    ROUTE_LIQUIDITY_MY_LIQUIDITY,
    ROUTE_LIQUIDITY_ADD_LIQUIDITY_DOUBLE_SIDED,
    ROUTE_LIQUIDITY_REMOVE_LIQUIDITY_DOUBLE_SIDED,
    ROUTE_LIQUIDITY_REWARDS,
    ROUTE_LIQUIDITY_CREATE_PAIR,
  ],
};

export const ANALYTICS = {
  id: 4,
  label: 'Analytics',
  route: ROUTE_ANALYTICS,
  activeRoutes: [ROUTE_ANALYTICS_STATS],
};


export default NETWORK_TYPE === 'development' ? [SWAP, LIQUIDITY, ANALYTICS] : [SWAP, LIQUIDITY, ANALYTICS];

export const gameEditionRoutes = [
  {
    id: 0,
    label: 'Swap',
    route: ROUTE_SWAP,
  },
  {
    id: 1,
    label: 'Stats',
    route: ROUTE_STATS,
  },
  {
    id: 2,
    label: 'History',
    route: ROUTE_MY_SWAP,
  },
];
