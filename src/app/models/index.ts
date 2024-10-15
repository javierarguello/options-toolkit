export enum TradeType {
  CALL = 'call',
  PUT = 'put',
  SHORT_CALL = 'short-call',
  SHORT_PUT = 'short-put',
}

export interface ITrade {
  id?: number;
  symbol: string;
  strike: number;
  price: number;
  stockPrice: number;
  expirationDate: Date;
  contracts: number;
  exitPrice?: number;
  type: TradeType;
}

export interface IStockOption {
  contractName: string;
  contractSize: string;
  contractPeriod: string;
  currency: string;
  type: string;
  inTheMoney: string;
  lastTradeDateTime: string;
  expirationDate: string;
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  theoretical: number;
  intrinsicValue: number;
  timeValue: number;
  updatedAt: string;
  daysBeforeExpiration: number;
}

export interface IOptionsData {
  expirationDate: string;
  impliedVolatility: number;
  putVolume: number;
  callVolume: number;
  putCallVolumeRatio: number;
  putOpenInterest: number;
  callOpenInterest: number;
  putCallOpenInterestRatio: number;
  optionsCount: number;
  options: {
    CALL: IStockOption[];
    PUT: IStockOption[];
  };
}

export interface IStockData {
  code: string;
  exchange: string;
  lastTradeDate: string;
  lastTradePrice: number;
  data: IOptionsData[];
}

export interface ISymbolFinanceData {
  valid: boolean;
  name?: string;
  price?: number;
  error?: string;
  optionChain?: IStockData;
}
