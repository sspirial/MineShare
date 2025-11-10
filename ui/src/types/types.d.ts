/**
 * TypeScript Type Definitions for Data Marketplace Extension
 * Use these types when migrating to TypeScript or for IDE intellisense
 */

// ============================================================================
// WALLET TYPES
// ============================================================================

interface WalletConnectionResult {
  success: boolean;
  address?: string;
  error?: string;
}

interface WalletStatus {
  connected: boolean;
  address: string | null;
  balance?: number;
}

interface TransactionData {
  from: string;
  to: string;
  value: number;
  gas: number;
  data: string;
}

interface TransactionSignResult {
  success: boolean;
  signature?: string;
  txHash?: string;
  error?: string;
}

interface IWalletService {
  connected: boolean;
  address: string | null;
  balance: number;
  
  connect(): Promise<WalletConnectionResult>;
  disconnect(): Promise<{success: boolean}>;
  signTransaction(txData: TransactionData): Promise<TransactionSignResult>;
  getStatus(): Promise<WalletStatus>;
}

// ============================================================================
// LISTING TYPES
// ============================================================================

type DataType = 'browsing' | 'social' | 'shopping' | 'video' | 'mixed';
type ListingStatus = 'listed' | 'sold' | 'cancelled';

interface ListingMetadata {
  [key: string]: any;
}

interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  dataType: DataType;
  dataSize: number;
  price: number;
  timeRange: string;
  createdAt: number;
  updatedAt?: number;
  status: ListingStatus;
  views: number;
  metadata: ListingMetadata;
}

interface CreateListingData {
  sellerId?: string;
  title: string;
  description: string;
  dataType: DataType;
  dataSize: number;
  price: number;
  timeRange: string;
  metadata?: ListingMetadata;
}

interface CreateListingResult {
  success: boolean;
  listing?: Listing;
  error?: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

interface IListingService {
  createListing(data: CreateListingData): Promise<CreateListingResult>;
  getAllListings(): Promise<Listing[]>;
  getMyListings(sellerId: string): Promise<Listing[]>;
  getMarketplaceListings(excludeSellerId?: string): Promise<Listing[]>;
  updateListingStatus(listingId: string, status: ListingStatus): Promise<{success: boolean; error?: string}>;
  deleteListing(listingId: string): Promise<{success: boolean; error?: string}>;
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

type TransactionStatus = 'completed' | 'pending' | 'failed';

interface Transaction {
  id: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  price: number;
  txHash: string;
  signature: string;
  timestamp: number;
  status: TransactionStatus;
}

interface PurchaseResult {
  success: boolean;
  transaction?: Transaction;
  error?: string;
}

interface ITransactionService {
  purchaseListing(listingId: string, buyerId: string, walletService: IWalletService): Promise<PurchaseResult>;
  getTransactions(userId: string): Promise<Transaction[]>;
  getEarnings(sellerId: string): Promise<number>;
}

// ============================================================================
// DATA COLLECTION TYPES
// ============================================================================

interface CollectedDataInfo {
  size: number;
  timeRange: string;
  isEmpty: boolean;
  events?: ActivityEvent[];
}

interface ActivityEvent {
  type: string;
  ts: number;
  tabId?: number;
  domain?: string;
  title?: string;
  url_hash?: string;
  referrer?: string;
  sessionId?: string;
  category?: string;
  meta?: {
    language?: string;
    screen?: {width: number; height: number};
    os?: string;
  };
  interactionType?: 'click' | 'scroll';
  descriptor?: {tag: string; classes: string[]};
  maxScrollPercent?: number;
  duration_ms?: number;
  keywords?: string[];
}

interface IDataCollectionHelper {
  getCollectedDataInfo(): Promise<CollectedDataInfo>;
}

// ============================================================================
// MARKETPLACE API TYPES
// ============================================================================

interface MarketplaceConfig {
  storageKeys: {
    listings: string;
    transactions: string;
    wallet: string;
  };
  minPrice: number;
  maxPrice: number;
  blockchain: {
    network: string;
    contractAddress: string | null;
    gasLimit: number;
  };
}

interface MarketplaceAPI {
  wallet: IWalletService;
  listing: IListingService;
  transaction: ITransactionService;
  dataHelper: IDataCollectionHelper;
  config: MarketplaceConfig;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

type TabName = 'collection' | 'listings' | 'marketplace';
type FilterType = 'all' | 'browsing' | 'social' | 'shopping' | 'video';
type StatusType = 'info' | 'success' | 'error' | 'warning';

interface CollectionPreferences {
  global: boolean;
  enabled: {
    urls: boolean;
    titles: boolean;
    timeOnPage: boolean;
    interactions: boolean;
    referrers: boolean;
    sessions: boolean;
    categories: boolean;
    metadata: boolean;
    keywords: boolean;
  };
}

interface DomainCount {
  [domain: string]: number;
}

// ============================================================================
// CHROME EXTENSION TYPES
// ============================================================================

interface ChromeTab {
  id?: number;
  url?: string;
  title?: string;
  active?: boolean;
}

interface ChromeMessage {
  type: string;
  event?: any;
  meta?: any;
  [key: string]: any;
}

interface ChromeResponse {
  ok?: boolean;
  visible?: boolean;
  aggregated?: any;
  events?: ActivityEvent[];
  error?: string;
  [key: string]: any;
}

// ============================================================================
// WEB3 INTEGRATION TYPES (Future)
// ============================================================================

/**
 * Placeholder types for Web3 integration
 * Replace these when integrating with ethers.js or web3.js
 */

interface Web3Provider {
  // Placeholder - actual type from ethers.js or web3.js
  send(method: string, params: any[]): Promise<any>;
  getSigner(): Web3Signer;
}

interface Web3Signer {
  // Placeholder - actual type from ethers.js
  sendTransaction(transaction: any): Promise<any>;
  signMessage(message: string): Promise<string>;
}

interface SmartContractInterface {
  // Placeholder for smart contract ABI
  listData(dataHash: string, price: number): Promise<any>;
  purchaseData(listingId: string, value: number): Promise<any>;
  withdrawEarnings(): Promise<any>;
}

// ============================================================================
// GLOBAL DECLARATIONS
// ============================================================================

declare global {
  interface Window {
    MarketplaceAPI: MarketplaceAPI;
    ethereum?: any; // MetaMask provider
  }
}

export {
  // Wallet
  WalletConnectionResult,
  WalletStatus,
  TransactionData,
  TransactionSignResult,
  IWalletService,
  
  // Listings
  DataType,
  ListingStatus,
  Listing,
  CreateListingData,
  CreateListingResult,
  ValidationResult,
  IListingService,
  
  // Transactions
  TransactionStatus,
  Transaction,
  PurchaseResult,
  ITransactionService,
  
  // Data Collection
  CollectedDataInfo,
  ActivityEvent,
  IDataCollectionHelper,
  
  // Marketplace
  MarketplaceConfig,
  MarketplaceAPI,
  
  // UI
  TabName,
  FilterType,
  StatusType,
  CollectionPreferences,
  DomainCount,
  
  // Chrome
  ChromeTab,
  ChromeMessage,
  ChromeResponse,
  
  // Web3 (Future)
  Web3Provider,
  Web3Signer,
  SmartContractInterface
};
