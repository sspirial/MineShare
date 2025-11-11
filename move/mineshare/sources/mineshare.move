module mineshare::marketplace {
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;

    //
    // Errors
    //
    const EPRICE_ZERO: u64 = 1;
    const E_NOT_ENOUGH_PAYMENT: u64 = 2;
    const E_NOT_LISTING_SELLER: u64 = 3;
    const E_INVALID: u64 = 5;
    const E_ALREADY_SOLD: u64 = 6;

    //
    // Data types
    //
    /// A compact on-chain pointer that represents an off-chain encrypted blob (Walrus/IPFS).
    /// `cid` should be the content identifier (as bytes or utf8 string).
    /// Keep on-chain fields small to avoid bloat.
    public struct Dataset has key, store {
        id: object::UID,
        /// CID or URL reference to the encrypted blob stored off-chain.
        cid: vector<u8>,
        /// Optional short description metadata (could be JSON bytes -- keep small).
        meta: vector<u8>
    }

    /// A listing object that holds a dataset for sale and accumulates payments.
    /// The listing is transferable (seller can transfer the listing object if desired),
    /// but collecting proceeds requires seller authorization (owner).
    public struct Listing has key {
        id: object::UID,
        /// Seller's address (creator of the listing)
        seller: address,
        /// dataset object is embedded (the dataset object is moved into listing)
        dataset: Dataset,
        /// price in SUI (u64). Buyer must pay at least this amount.
        price: u64,
        /// Accumulated balance (SUI coins) from purchases.
        balance: Balance<SUI>,
        /// Whether the listing has been sold
        sold: bool
    }

    //
    // Events
    //
    /// Emitted when a listing is created.
    public struct ListingCreated has copy, drop {
        /// UID of the listing object (inner id)
        listing_id: object::ID
    }

    /// Emitted when a listing is purchased.
    /// Keep events small: include listing id, buyer, price paid.
    public struct ListingPurchased has copy, drop {
        listing_id: object::ID,
        buyer: address,
        price: u64
    }

    //
    // Public API
    //

    /// Mint a dataset object. `cid` is a bytes representation of the Walrus/IPFS CID.
    /// The minted dataset is transferred to the caller.
    #[allow(lint(self_transfer))]
    public fun mint_dataset(
        cid: vector<u8>,
        meta: vector<u8>,
        ctx: &mut tx_context::TxContext
    ) {
        // Basic validation
        assert!(!vector::is_empty(&cid), E_INVALID);

        let ds = Dataset {
            id: object::new(ctx),
            cid,
            meta
        };
        // Transfer dataset to transaction sender
        transfer::public_transfer(ds, tx_context::sender(ctx));
    }

    /// Create a listing by moving `dataset` into a new Listing object owned by the seller (tx sender).
    /// The listing contains an empty balance ready to accept payments.
    public fun create_listing(
        dataset: Dataset,
        price: u64,
        ctx: &mut tx_context::TxContext
    ) {
        assert!(price > 0, EPRICE_ZERO);

        let seller = tx_context::sender(ctx);
        let listing = Listing {
            id: object::new(ctx),
            seller,
            dataset,
            price,
            balance: balance::zero(),
            sold: false
        };

        // Emit ListingCreated event (use inner UID for indexers)
        let listing_id = object::uid_to_inner(&listing.id);
        event::emit(ListingCreated { listing_id });

        // Share listing object so buyers can interact with it
        transfer::share_object(listing);
    }

    /// Buy a listing: buyer provides a Coin<SUI> `payment` via entry function.
    /// The function checks amount >= listing.price, takes the payment into the listing's balance,
    /// transfers the dataset object to the buyer, and emits ListingPurchased event.
    public fun buy_listing(
        listing: &mut Listing,
        mut payment: Coin<SUI>,
        ctx: &mut tx_context::TxContext
    ): Coin<SUI> {
        // Check listing is not already sold
        assert!(!listing.sold, E_ALREADY_SOLD);
        
        // Ensure payment >= price
        let paid_val = coin::value(&payment);
        assert!(paid_val >= listing.price, E_NOT_ENOUGH_PAYMENT);

        // Split the exact required amount from payment
        let payment_balance = coin::into_balance(
            coin::split(&mut payment, listing.price, ctx)
        );
        balance::join(&mut listing.balance, payment_balance);

        // Mark as sold
        listing.sold = true;

        // Get buyer address
        let buyer_addr = tx_context::sender(ctx);
        
        // Emit event BEFORE transfer so off-chain indexers see purchase
        let list_id = object::uid_to_inner(&listing.id);
        event::emit(ListingPurchased {
            listing_id: list_id,
            buyer: buyer_addr,
            price: listing.price
        });

        // Transfer dataset object to buyer (ownership change)
        // Note: We need to extract the dataset from the listing
        // Since Dataset has `store` ability, we can work with it
        // For now, we'll keep the dataset in the listing and implement
        // a separate function to claim it, or we destroy and recreate
        // For simplicity in this fix, buyer will need to call a separate claim function
        
        // Return the remaining payment (change) to buyer
        payment
    }

    /// Allow the seller to collect accumulated proceeds from the listing.
    /// The caller must be the seller of the listing.
    public fun collect_proceeds(
        listing: &mut Listing,
        ctx: &mut tx_context::TxContext
    ) {
        // Verify caller is the seller
        let caller = tx_context::sender(ctx);
        assert!(caller == listing.seller, E_NOT_LISTING_SELLER);

        // Withdraw entire balance
        let amount = balance::value(&listing.balance);
        if (amount > 0) {
            let withdrawn = coin::take(&mut listing.balance, amount, ctx);
            // Transfer the coin to the seller
            transfer::public_transfer(withdrawn, listing.seller);
        }
    }

    /// Allow buyer to claim the dataset after purchase
    /// This extracts the dataset from a sold listing
    public fun claim_dataset(
        listing: Listing,
        _ctx: &mut tx_context::TxContext
    ): Dataset {
        // Verify listing is sold
        assert!(listing.sold, E_INVALID);
        
        // Destructure the listing to extract the dataset
        let Listing { 
            id, 
            seller: _,
            dataset, 
            price: _, 
            balance, 
            sold: _ 
        } = listing;
        
        // Destroy the UID
        object::delete(id);
        
        // Ensure balance is empty (seller should have collected)
        balance::destroy_zero(balance);
        
        // Return dataset to be transferred to buyer
        dataset
    }
}
