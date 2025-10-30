// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ArtekaDigitalRights {
    struct DigitalWork {
        uint256 id;
        address creator;
        address currentOwner;
        string title;
        string description;
        string workType; // video, image, audio, text
        string ipfsHash; // IPFS hash for the actual file
        string metadataHash; // IPFS hash for metadata
        uint256 timestamp;
        uint256 registrationBlock;
        bool isActive;
        uint256 royaltyPercentage; // Basis points (100 = 1%)
        uint256 transferCount;
    }

    struct WorkMetadata {
        string fileName;
        uint256 fileSize;
        string mimeType;
        string originalLanguage;
        string[] tags;
        string category;
    }

    struct License {
        uint256 workId;
        address licensee;
        uint256 startTime;
        uint256 expiryTime;
        string licenseType; // commercial, personal, educational, etc.
        uint256 price;
        bool isActive;
    }

    struct TransferRecord {
        address from;
        address to;
        uint256 timestamp;
        uint256 blockNumber;
        string transferType; // sale, gift, inheritance, etc.
        uint256 price;
    }

    struct RoyaltyPayment {
        address payer;
        address recipient;
        uint256 amount;
        uint256 timestamp;
        uint256 workId;
    }

    // State variables
    mapping(uint256 => DigitalWork) public digitalWorks;
    mapping(address => uint256[]) public creatorWorks;
    mapping(address => uint256[]) public ownedWorks;
    mapping(uint256 => WorkMetadata) public workMetadata;
    mapping(uint256 => TransferRecord[]) public transferHistory;
    mapping(uint256 => License[]) public workLicenses;
    mapping(uint256 => RoyaltyPayment[]) public royaltyHistory;
    mapping(bytes32 => bool) public usedSignatures;
    mapping(uint256 => mapping(address => bool)) public hasLicense;
    
    uint256 public workCounter;
    uint256 public totalRoyaltiesPaid;
    uint256 public platformFeePercentage = 250; // 2.5% in basis points
    address public platformWallet;
    
    // Events
    event WorkRegistered(
        uint256 indexed workId,
        address indexed creator,
        string title,
        string workType,
        string ipfsHash,
        uint256 timestamp
    );
    
    event WorkTransferred(
        uint256 indexed workId,
        address indexed from,
        address indexed to,
        uint256 timestamp,
        string transferType,
        uint256 price
    );
    
    event WorkDeactivated(uint256 indexed workId);
    
    event LicenseGranted(
        uint256 indexed workId,
        address indexed licensee,
        string licenseType,
        uint256 expiryTime,
        uint256 price
    );
    
    event RoyaltyPaid(
        uint256 indexed workId,
        address indexed creator,
        address indexed payer,
        uint256 amount
    );

    event WorkUpdated(
        uint256 indexed workId,
        string updateType
    );
    
    // Modifiers
    modifier onlyCreator(uint256 workId) {
        require(
            digitalWorks[workId].creator == msg.sender,
            "Only creator can perform this action"
        );
        _;
    }

    modifier onlyOwner(uint256 workId) {
        require(
            digitalWorks[workId].currentOwner == msg.sender,
            "Only current owner can perform this action"
        );
        _;
    }

    modifier workExists(uint256 workId) {
        require(workId > 0 && workId <= workCounter, "Work does not exist");
        require(digitalWorks[workId].isActive, "Work is not active");
        _;
    }

    constructor() {
        platformWallet = msg.sender;
    }

    // Core Functions
    function registerWork(
        string memory _title,
        string memory _description,
        string memory _workType,
        string memory _ipfsHash,
        string memory _metadataHash,
        string memory _fileName,
        uint256 _fileSize,
        string memory _mimeType,
        string memory _originalLanguage,
        string[] memory _tags,
        string memory _category,
        uint256 _royaltyPercentage
    ) public returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(_royaltyPercentage <= 5000, "Royalty cannot exceed 50%");
        
        workCounter++;
        
        digitalWorks[workCounter] = DigitalWork({
            id: workCounter,
            creator: msg.sender,
            currentOwner: msg.sender,
            title: _title,
            description: _description,
            workType: _workType,
            ipfsHash: _ipfsHash,
            metadataHash: _metadataHash,
            timestamp: block.timestamp,
            registrationBlock: block.number,
            isActive: true,
            royaltyPercentage: _royaltyPercentage,
            transferCount: 0
        });
        
        workMetadata[workCounter] = WorkMetadata({
            fileName: _fileName,
            fileSize: _fileSize,
            mimeType: _mimeType,
            originalLanguage: _originalLanguage,
            tags: _tags,
            category: _category
        });
        
        creatorWorks[msg.sender].push(workCounter);
        ownedWorks[msg.sender].push(workCounter);
        
        emit WorkRegistered(
            workCounter,
            msg.sender,
            _title,
            _workType,
            _ipfsHash,
            block.timestamp
        );
        
        return workCounter;
    }

    // Transfer with signature verification
    function transferOwnership(
        uint256 workId,
        address newOwner,
        string memory transferType,
        uint256 price,
        bytes memory signature
    ) public payable onlyOwner(workId) workExists(workId) {
        require(newOwner != address(0), "Invalid new owner address");
        require(newOwner != msg.sender, "Cannot transfer to yourself");
        
        // Verify signature
        bytes32 messageHash = getTransferMessageHash(workId, newOwner, price, block.timestamp);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        require(!usedSignatures[ethSignedMessageHash], "Signature already used");
        require(recoverSigner(ethSignedMessageHash, signature) == msg.sender, "Invalid signature");
        
        usedSignatures[ethSignedMessageHash] = true;
        
        address previousOwner = digitalWorks[workId].currentOwner;
        address creator = digitalWorks[workId].creator;
        
        // Handle payment and royalties if price > 0
        if (price > 0) {
            require(msg.value >= price, "Insufficient payment");
            
            uint256 royaltyAmount = 0;
            uint256 platformFee = 0;
            
            // Calculate royalty if not creator
            if (creator != previousOwner && digitalWorks[workId].royaltyPercentage > 0) {
                royaltyAmount = (price * digitalWorks[workId].royaltyPercentage) / 10000;
                payable(creator).transfer(royaltyAmount);
                
                royaltyHistory[workId].push(RoyaltyPayment({
                    payer: newOwner,
                    recipient: creator,
                    amount: royaltyAmount,
                    timestamp: block.timestamp,
                    workId: workId
                }));
                
                totalRoyaltiesPaid += royaltyAmount;
                emit RoyaltyPaid(workId, creator, newOwner, royaltyAmount);
            }
            
            // Platform fee
            platformFee = (price * platformFeePercentage) / 10000;
            payable(platformWallet).transfer(platformFee);
            
            // Transfer remaining amount to previous owner
            uint256 sellerAmount = price - royaltyAmount - platformFee;
            payable(previousOwner).transfer(sellerAmount);
            
            // Refund excess payment
            if (msg.value > price) {
                payable(msg.sender).transfer(msg.value - price);
            }
        }
        
        // Update ownership
        digitalWorks[workId].currentOwner = newOwner;
        digitalWorks[workId].transferCount++;
        
        // Update owned works mappings
        _removeFromOwnedWorks(previousOwner, workId);
        ownedWorks[newOwner].push(workId);
        
        // Record transfer
        transferHistory[workId].push(TransferRecord({
            from: previousOwner,
            to: newOwner,
            timestamp: block.timestamp,
            blockNumber: block.number,
            transferType: transferType,
            price: price
        }));
        
        emit WorkTransferred(workId, previousOwner, newOwner, block.timestamp, transferType, price);
    }

    // License management
    function grantLicense(
        uint256 workId,
        address licensee,
        uint256 duration,
        string memory licenseType
    ) public payable onlyOwner(workId) workExists(workId) {
        require(licensee != address(0), "Invalid licensee address");
        require(duration > 0, "Duration must be greater than 0");
        require(msg.value > 0, "License fee required");
        
        uint256 expiryTime = block.timestamp + duration;
        
        // Handle payment with royalties
        address creator = digitalWorks[workId].creator;
        uint256 royaltyAmount = 0;
        
        if (creator != msg.sender && digitalWorks[workId].royaltyPercentage > 0) {
            royaltyAmount = (msg.value * digitalWorks[workId].royaltyPercentage) / 10000;
            payable(creator).transfer(royaltyAmount);
            
            royaltyHistory[workId].push(RoyaltyPayment({
                payer: licensee,
                recipient: creator,
                amount: royaltyAmount,
                timestamp: block.timestamp,
                workId: workId
            }));
            
            totalRoyaltiesPaid += royaltyAmount;
            emit RoyaltyPaid(workId, creator, licensee, royaltyAmount);
        }
        
        // Platform fee
        uint256 platformFee = (msg.value * platformFeePercentage) / 10000;
        payable(platformWallet).transfer(platformFee);
        
        // Transfer remaining to owner
        payable(msg.sender).transfer(msg.value - royaltyAmount - platformFee);
        
        workLicenses[workId].push(License({
            workId: workId,
            licensee: licensee,
            startTime: block.timestamp,
            expiryTime: expiryTime,
            licenseType: licenseType,
            price: msg.value,
            isActive: true
        }));
        
        hasLicense[workId][licensee] = true;
        
        emit LicenseGranted(workId, licensee, licenseType, expiryTime, msg.value);
    }

    // View functions
    function getWork(uint256 workId) public view returns (
        uint256 id,
        address creator,
        address currentOwner,
        string memory title,
        string memory description,
        string memory workType,
        string memory ipfsHash,
        string memory metadataHash,
        uint256 timestamp,
        bool isActive,
        uint256 royaltyPercentage,
        uint256 transferCount
    ) {
        DigitalWork memory work = digitalWorks[workId];
        return (
            work.id,
            work.creator,
            work.currentOwner,
            work.title,
            work.description,
            work.workType,
            work.ipfsHash,
            work.metadataHash,
            work.timestamp,
            work.isActive,
            work.royaltyPercentage,
            work.transferCount
        );
    }

    function getTransferHistory(uint256 workId) public view returns (TransferRecord[] memory) {
        return transferHistory[workId];
    }

    function getWorkLicenses(uint256 workId) public view returns (License[] memory) {
        return workLicenses[workId];
    }

    function getRoyaltyHistory(uint256 workId) public view returns (RoyaltyPayment[] memory) {
        return royaltyHistory[workId];
    }

    function verifyLicense(uint256 workId, address licensee) public view returns (bool) {
        if (!hasLicense[workId][licensee]) return false;
        
        License[] memory licenses = workLicenses[workId];
        for (uint256 i = 0; i < licenses.length; i++) {
            if (licenses[i].licensee == licensee && 
                licenses[i].isActive && 
                block.timestamp <= licenses[i].expiryTime) {
                return true;
            }
        }
        return false;
    }

    function getOwnedWorks(address owner) public view returns (uint256[] memory) {
        return ownedWorks[owner];
    }

    function getCreatorWorks(address creator) public view returns (uint256[] memory) {
        return creatorWorks[creator];
    }

    // Update functions
    function updateWorkMetadata(
        uint256 workId,
        string memory _description,
        string[] memory _tags
    ) public onlyOwner(workId) workExists(workId) {
        digitalWorks[workId].description = _description;
        workMetadata[workId].tags = _tags;
        emit WorkUpdated(workId, "metadata");
    }

    function updateRoyaltyPercentage(
        uint256 workId,
        uint256 newPercentage
    ) public onlyCreator(workId) workExists(workId) {
        require(newPercentage <= 5000, "Royalty cannot exceed 50%");
        digitalWorks[workId].royaltyPercentage = newPercentage;
        emit WorkUpdated(workId, "royalty");
    }

    function deactivateWork(uint256 workId) public onlyCreator(workId) {
        digitalWorks[workId].isActive = false;
        emit WorkDeactivated(workId);
    }

    // Signature helper functions
    function getTransferMessageHash(
        uint256 workId,
        address newOwner,
        uint256 price,
        uint256 timestamp
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(workId, newOwner, price, timestamp));
    }

    function getEthSignedMessageHash(bytes32 messageHash) public pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
    }

    function recoverSigner(bytes32 ethSignedMessageHash, bytes memory signature) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    // Admin functions
    function setPlatformFee(uint256 newFee) public {
        require(msg.sender == platformWallet, "Only platform wallet");
        require(newFee <= 1000, "Fee cannot exceed 10%");
        platformFeePercentage = newFee;
    }

    function setPlatformWallet(address newWallet) public {
        require(msg.sender == platformWallet, "Only platform wallet");
        require(newWallet != address(0), "Invalid address");
        platformWallet = newWallet;
    }

    // Internal helper functions
    function _removeFromOwnedWorks(address owner, uint256 workId) internal {
        uint256[] storage works = ownedWorks[owner];
        for (uint256 i = 0; i < works.length; i++) {
            if (works[i] == workId) {
                works[i] = works[works.length - 1];
                works.pop();
                break;
            }
        }
    }

    function verifyOwnership(uint256 workId, address owner) public view returns (bool) {
        return digitalWorks[workId].currentOwner == owner && digitalWorks[workId].isActive;
    }

    function verifyCreator(uint256 workId, address creator) public view returns (bool) {
        return digitalWorks[workId].creator == creator && digitalWorks[workId].isActive;
    }
}