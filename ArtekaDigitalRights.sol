// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ArtekaDigitalRights {
    struct DigitalWork {
        uint256 id;
        address creator;
        string title;
        string description;
        string workType; // video, image, audio, text
        string ipfsHash; // IPFS hash for the actual file
        string metadataHash; // IPFS hash for metadata
        uint256 timestamp;
        bool isActive;
    }

    struct WorkMetadata {
        string fileName;
        uint256 fileSize;
        string mimeType;
        string originalLanguage;
    }

    mapping(uint256 => DigitalWork) public digitalWorks;
    mapping(address => uint256[]) public creatorWorks;
    mapping(uint256 => WorkMetadata) public workMetadata;
    
    uint256 public workCounter;
    
    event WorkRegistered(
        uint256 indexed workId,
        address indexed creator,
        string title,
        string workType,
        string ipfsHash,
        uint256 timestamp
    );
    
    event WorkDeactivated(uint256 indexed workId);
    
    modifier onlyCreator(uint256 workId) {
        require(
            digitalWorks[workId].creator == msg.sender,
            "Only creator can perform this action"
        );
        _;
    }
    
    function registerWork(
        string memory _title,
        string memory _description,
        string memory _workType,
        string memory _ipfsHash,
        string memory _metadataHash,
        string memory _fileName,
        uint256 _fileSize,
        string memory _mimeType,
        string memory _originalLanguage
    ) public returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        
        workCounter++;
        
        digitalWorks[workCounter] = DigitalWork({
            id: workCounter,
            creator: msg.sender,
            title: _title,
            description: _description,
            workType: _workType,
            ipfsHash: _ipfsHash,
            metadataHash: _metadataHash,
            timestamp: block.timestamp,
            isActive: true
        });
        
        workMetadata[workCounter] = WorkMetadata({
            fileName: _fileName,
            fileSize: _fileSize,
            mimeType: _mimeType,
            originalLanguage: _originalLanguage
        });
        
        creatorWorks[msg.sender].push(workCounter);
        
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
    
    function getWork(uint256 workId) public view returns (
        uint256 id,
        address creator,
        string memory title,
        string memory description,
        string memory workType,
        string memory ipfsHash,
        string memory metadataHash,
        uint256 timestamp,
        bool isActive
    ) {
        DigitalWork memory work = digitalWorks[workId];
        return (
            work.id,
            work.creator,
            work.title,
            work.description,
            work.workType,
            work.ipfsHash,
            work.metadataHash,
            work.timestamp,
            work.isActive
        );
    }
    
    function getWorkMetadata(uint256 workId) public view returns (
        string memory fileName,
        uint256 fileSize,
        string memory mimeType,
        string memory originalLanguage
    ) {
        WorkMetadata memory metadata = workMetadata[workId];
        return (
            metadata.fileName,
            metadata.fileSize,
            metadata.mimeType,
            metadata.originalLanguage
        );
    }
    
    function getCreatorWorks(address creator) public view returns (uint256[] memory) {
        return creatorWorks[creator];
    }
    
    function deactivateWork(uint256 workId) public onlyCreator(workId) {
        digitalWorks[workId].isActive = false;
        emit WorkDeactivated(workId);
    }
    
    function getAllActiveWorks() public view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i <= workCounter; i++) {
            if (digitalWorks[i].isActive) {
                activeCount++;
            }
        }
        
        uint256[] memory activeWorks = new uint256[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= workCounter; i++) {
            if (digitalWorks[i].isActive) {
                activeWorks[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return activeWorks;
    }
    
    function verifyOwnership(uint256 workId, address creator) public view returns (bool) {
        return digitalWorks[workId].creator == creator && digitalWorks[workId].isActive;
    }
}