# MineShare Function Call Flow Diagram

## Complete Integration Architecture

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         MINESHARE ECOSYSTEM                              ║
╚══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│                     EXTENSION (Browser Extension)                        │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  PopupApp.jsx                                                     │  │
│  │  ┌────────────────┐    ┌─────────────────┐   ┌────────────────┐ │  │
│  │  │ Collect Data   │ -> │  Encrypt Data   │ ->│ Upload Walrus  │ │  │
│  │  └────────────────┘    └─────────────────┘   └────────┬───────┘ │  │
│  │                                                         │         │  │
│  │                                                         v         │  │
│  │  ┌──────────────────────────────────────────────────────────────┐│  │
│  │  │           sui_api.js: mintDataset()                         ││  │
│  │  │  ➜ Calls: PACKAGE::marketplace::mint_dataset               ││  │
│  │  │  ➜ Input: cidBytes (Walrus blob ID), metadata              ││  │
│  │  │  ➜ Output: Dataset NFT → User's Wallet                     ││  │
│  │  └──────────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      │ Dataset NFT Created
                                      │
                                      v
┌─────────────────────────────────────────────────────────────────────────┐
│                     SUI BLOCKCHAIN (Smart Contract)                      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  PACKAGE::marketplace Module                                     │  │
│  │                                                                   │  │
│  │  ✓ mint_dataset(cid, meta)        → Creates Dataset object      │  │
│  │  ✓ create_listing(dataset, price) → Creates Listing object      │  │
│  │  ✓ buy_listing(listing, payment)  → Transfers funds             │  │
│  │  ✓ claim_dataset(listing)         → Transfers Dataset           │  │
│  │  ✓ collect_proceeds(listing)      → Withdraws balance           │  │
│  │                                                                   │  │
│  │  Events Emitted:                                                 │  │
│  │  • ListingCreated { listing_id }                                │  │
│  │  • ListingPurchased { listing_id, buyer, price }               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      │ Query Events & Objects
                                      │
                                      v
┌─────────────────────────────────────────────────────────────────────────┐
│                          DAPP (Web Application)                          │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Marketplace.jsx                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  sui_api.js: getAllListings()                             │  │  │
│  │  │  ➜ Queries: ListingCreated events                         │  │  │
│  │  │  ➜ Fetches: Listing objects from blockchain               │  │  │
│  │  │  ➜ Displays: All active listings                          │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  CreateListing.jsx                                                │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  sui_api.js: getOwnedDatasets(address)                    │  │  │
│  │  │  ➜ Queries: User's Dataset objects                        │  │  │
│  │  │  ➜ User selects dataset + sets price                      │  │  │
│  │  │                                                            │  │  │
│  │  │  sui_api.js: createListing(datasetId, price)             │  │  │
│  │  │  ➜ Calls: PACKAGE::marketplace::create_listing           │  │  │
│  │  │  ➜ Input: Dataset object ID, price in MIST               │  │  │
│  │  │  ➜ Output: Listing object → Marketplace                  │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ListingCard.jsx (Buyer View)                                    │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  sui_api.js: buyListing(listingId, price, buyer)         │  │  │
│  │  │  ➜ Calls: PACKAGE::marketplace::buy_listing              │  │  │
│  │  │  ➜ Splits SUI coins, sends payment                       │  │  │
│  │  │  ➜ Marks listing as sold                                 │  │  │
│  │  │                                                            │  │  │
│  │  │  sui_api.js: claimDataset(listingId, buyer)             │  │  │
│  │  │  ➜ Calls: PACKAGE::marketplace::claim_dataset           │  │  │
│  │  │  ➜ Extracts Dataset from Listing                        │  │  │
│  │  │  ➜ Transfers Dataset → Buyer's wallet                   │  │  │
│  │  │                                                            │  │  │
│  │  │  walrus_api.js: downloadFromWalrus(blobId, key)         │  │  │
│  │  │  ➜ Downloads encrypted data from Walrus                 │  │  │
│  │  │  ➜ Decrypts with encryption key                         │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ListingCard.jsx (Seller View)                                   │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  sui_api.js: collectProceeds(listingId)                  │  │  │
│  │  │  ➜ Calls: PACKAGE::marketplace::collect_proceeds        │  │  │
│  │  │  ➜ Withdraws accumulated balance                        │  │  │
│  │  │  ➜ Transfers SUI → Seller's wallet                      │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      WALRUS (Decentralized Storage)                      │
│                                                                          │
│  • Publisher endpoint: Upload encrypted data                            │
│  • Aggregator endpoint: Download encrypted data                         │
│  • Returns: Blob ID (used as CID in smart contract)                    │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════

                           DATA FLOW SUMMARY

Extension:  Data Collection → Encryption → Walrus Upload → Mint Dataset NFT
                                                               ↓
Smart Contract:                                       Dataset Object Created
                                                               ↓
dApp:                                    Query Datasets → Create Listing
                                                               ↓
Smart Contract:                                        Listing Object Created
                                                               ↓
dApp (Buyer):                                Browse → Buy → Claim Dataset
                                                     ↓
Smart Contract:                      Payment → Transfer Dataset → Emit Events
                                                     ↓
dApp (Seller):                            View Balance → Collect Proceeds
                                                     ↓
Smart Contract:                                    Withdraw → Send SUI

═══════════════════════════════════════════════════════════════════════════


                        FUNCTION CALL MATRIX

┌─────────────────┬──────────────┬──────────────┬─────────────────────────┐
│ Function        │ Called From  │ User Role    │ Purpose                 │
├─────────────────┼──────────────┼──────────────┼─────────────────────────┤
│ mint_dataset    │ Extension    │ Data Owner   │ Create Dataset NFT      │
│ create_listing  │ dApp         │ Seller       │ List dataset for sale   │
│ buy_listing     │ dApp         │ Buyer        │ Purchase listing        │
│ claim_dataset   │ dApp         │ Buyer        │ Receive dataset         │
│ collect_proceeds│ dApp         │ Seller       │ Withdraw earnings       │
└─────────────────┴──────────────┴──────────────┴─────────────────────────┘


                        API FILE LOCATIONS

Extension:
  • /ui/src/api/sui_api.js       → mintDataset, getOwnedDatasets
  • /ui/src/api/walrus_api.js    → uploadToWalrus, encryption
  • /ui/src/pages/PopupApp.jsx   → Export UI

dApp:
  • /dapp/src/api/sui_api.js     → All smart contract functions
  • /dapp/src/api/walrus_api.js  → downloadFromWalrus, decryption
  • /dapp/src/components/        → UI components for each function

═══════════════════════════════════════════════════════════════════════════
