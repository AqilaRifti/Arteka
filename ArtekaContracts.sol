// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Marketplace Contract for selling works and services
contract ArtekaMarketplace {
    struct Listing {
        uint256 listingId;
        uint256 workId; // Reference to digital rights work
        address seller;
        string listingType; // "product" or "service"
        string title;
        string description;
        uint256 price; // in wei
        bool isActive;
        uint256 createdAt;
        uint256 soldCount;
    }

    struct Purchase {
        uint256 purchaseId;
        uint256 listingId;
        address buyer;
        address seller;
        uint256 price;
        uint256 timestamp;
        string status; // "pending", "completed", "disputed"
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Purchase) public purchases;
    mapping(address => uint256[]) public sellerListings;
    mapping(address => uint256[]) public buyerPurchases;
    
    uint256 public listingCounter;
    uint256 public purchaseCounter;
    
    // Platform fee (2.5%)
    uint256 public platformFeePercent = 250; // 250 = 2.5% (basis points)
    address public platformWallet;
    
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        string listingType,
        uint256 price,
        uint256 timestamp
    );
    
    event PurchaseMade(
        uint256 indexed purchaseId,
        uint256 indexed listingId,
        address indexed buyer,
        address seller,
        uint256 price,
        uint256 timestamp
    );
    
    event ListingDeactivated(uint256 indexed listingId);
    
    constructor() {
        platformWallet = msg.sender;
    }
    
    function createListing(
        uint256 _workId,
        string memory _listingType,
        string memory _title,
        string memory _description,
        uint256 _price
    ) public returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(_price > 0, "Price must be greater than 0");
        require(
            keccak256(bytes(_listingType)) == keccak256(bytes("product")) ||
            keccak256(bytes(_listingType)) == keccak256(bytes("service")),
            "Invalid listing type"
        );
        
        listingCounter++;
        
        listings[listingCounter] = Listing({
            listingId: listingCounter,
            workId: _workId,
            seller: msg.sender,
            listingType: _listingType,
            title: _title,
            description: _description,
            price: _price,
            isActive: true,
            createdAt: block.timestamp,
            soldCount: 0
        });
        
        sellerListings[msg.sender].push(listingCounter);
        
        emit ListingCreated(
            listingCounter,
            msg.sender,
            _listingType,
            _price,
            block.timestamp
        );
        
        return listingCounter;
    }
    
    function purchaseListing(uint256 _listingId) public payable returns (uint256) {
        Listing storage listing = listings[_listingId];
        
        require(listing.isActive, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy own listing");
        
        purchaseCounter++;
        
        // Calculate platform fee
        uint256 platformFee = (listing.price * platformFeePercent) / 10000;
        uint256 sellerAmount = listing.price - platformFee;
        
        // Transfer funds
        payable(listing.seller).transfer(sellerAmount);
        payable(platformWallet).transfer(platformFee);
        
        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
        
        purchases[purchaseCounter] = Purchase({
            purchaseId: purchaseCounter,
            listingId: _listingId,
            buyer: msg.sender,
            seller: listing.seller,
            price: listing.price,
            timestamp: block.timestamp,
            status: "completed"
        });
        
        listing.soldCount++;
        buyerPurchases[msg.sender].push(purchaseCounter);
        
        emit PurchaseMade(
            purchaseCounter,
            _listingId,
            msg.sender,
            listing.seller,
            listing.price,
            block.timestamp
        );
        
        return purchaseCounter;
    }
    
    function deactivateListing(uint256 _listingId) public {
        require(
            listings[_listingId].seller == msg.sender,
            "Only seller can deactivate"
        );
        listings[_listingId].isActive = false;
        emit ListingDeactivated(_listingId);
    }
    
    function getListing(uint256 _listingId) public view returns (
        uint256 listingId,
        uint256 workId,
        address seller,
        string memory listingType,
        string memory title,
        string memory description,
        uint256 price,
        bool isActive,
        uint256 createdAt,
        uint256 soldCount
    ) {
        Listing memory listing = listings[_listingId];
        return (
            listing.listingId,
            listing.workId,
            listing.seller,
            listing.listingType,
            listing.title,
            listing.description,
            listing.price,
            listing.isActive,
            listing.createdAt,
            listing.soldCount
        );
    }
    
    function getSellerListings(address _seller) public view returns (uint256[] memory) {
        return sellerListings[_seller];
    }
    
    function getBuyerPurchases(address _buyer) public view returns (uint256[] memory) {
        return buyerPurchases[_buyer];
    }
}
