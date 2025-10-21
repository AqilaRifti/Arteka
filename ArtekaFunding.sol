// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Funding Campaign Contract for Creative Projects
contract ArtekaFunding {
    struct Campaign {
        uint256 campaignId;
        address creator;
        string title;
        string description;
        string projectType; // album, film, game, book, etc.
        uint256 fundingGoal; // in wei
        uint256 totalFunded;
        uint256 creatorShare; // percentage (e.g., 5000 = 50%)
        uint256 backersShare; // percentage (e.g., 5000 = 50%)
        uint256 deadline;
        bool isActive;
        bool isFunded;
        bool isCompleted;
        uint256 createdAt;
        address revenueWallet; // Wallet that receives all revenue
        uint256 totalRevenue; // Total revenue received
        uint256 totalDistributed; // Total amount distributed
    }
    
    struct Backer {
        address backerAddress;
        uint256 amount;
        uint256 timestamp;
        uint256 claimedRevenue; // Total revenue claimed by this backer
    }
    
    struct RevenuePayment {
        uint256 paymentId;
        uint256 campaignId;
        address payer;
        uint256 amount;
        string source; // "song_purchase", "stream", "merchandise", etc.
        uint256 timestamp;
        bool isDistributed;
    }
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Backer[]) public campaignBackers;
    mapping(uint256 => mapping(address => uint256)) public backerContributions;
    mapping(uint256 => RevenuePayment[]) public campaignRevenues;
    mapping(address => uint256[]) public creatorCampaigns;
    mapping(address => uint256[]) public backerCampaigns;
    
    uint256 public campaignCounter;
    uint256 public revenuePaymentCounter;
    
    // Platform fee for funding (1%)
    uint256 public platformFeePercent = 100; // 100 = 1%
    address public platformWallet;
    
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 fundingGoal,
        uint256 creatorShare,
        uint256 deadline,
        uint256 timestamp
    );
    
    event CampaignFunded(
        uint256 indexed campaignId,
        address indexed backer,
        uint256 amount,
        uint256 totalFunded,
        uint256 timestamp
    );
    
    event CampaignGoalReached(
        uint256 indexed campaignId,
        uint256 totalFunded,
        uint256 timestamp
    );
    
    event RevenueReceived(
        uint256 indexed paymentId,
        uint256 indexed campaignId,
        address indexed payer,
        uint256 amount,
        string source,
        uint256 timestamp
    );
    
    event RevenueDistributed(
        uint256 indexed campaignId,
        uint256 indexed paymentId,
        uint256 creatorAmount,
        uint256 backersAmount,
        uint256 timestamp
    );
    
    event BackerPayout(
        uint256 indexed campaignId,
        address indexed backer,
        uint256 amount,
        uint256 timestamp
    );
    
    constructor() {
        platformWallet = msg.sender;
    }
    
    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _projectType,
        uint256 _fundingGoal,
        uint256 _creatorShare, // Must be between 0-10000 (0-100%)
        uint256 _durationInDays
    ) public returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        require(_creatorShare <= 10000, "Creator share cannot exceed 100%");
        require(_creatorShare > 0, "Creator share must be greater than 0");
        require(_durationInDays > 0, "Duration must be greater than 0");
        
        campaignCounter++;
        
        uint256 backersShare = 10000 - _creatorShare;
        uint256 deadline = block.timestamp + (_durationInDays * 1 days);
        
        campaigns[campaignCounter] = Campaign({
            campaignId: campaignCounter,
            creator: msg.sender,
            title: _title,
            description: _description,
            projectType: _projectType,
            fundingGoal: _fundingGoal,
            totalFunded: 0,
            creatorShare: _creatorShare,
            backersShare: backersShare,
            deadline: deadline,
            isActive: true,
            isFunded: false,
            isCompleted: false,
            createdAt: block.timestamp,
            revenueWallet: address(this), // Contract acts as revenue wallet
            totalRevenue: 0,
            totalDistributed: 0
        });
        
        creatorCampaigns[msg.sender].push(campaignCounter);
        
        emit CampaignCreated(
            campaignCounter,
            msg.sender,
            _title,
            _fundingGoal,
            _creatorShare,
            deadline,
            block.timestamp
        );
        
        return campaignCounter;
    }
    
    function fundCampaign(uint256 _campaignId) public payable {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.isActive, "Campaign not active");
        require(!campaign.isFunded, "Campaign already funded");
        require(block.timestamp < campaign.deadline, "Campaign deadline passed");
        require(msg.value > 0, "Must send funds");
        require(msg.sender != campaign.creator, "Creator cannot fund own campaign");
        
        // Track backer contribution
        if (backerContributions[_campaignId][msg.sender] == 0) {
            // New backer
            campaignBackers[_campaignId].push(Backer({
                backerAddress: msg.sender,
                amount: msg.value,
                timestamp: block.timestamp,
                claimedRevenue: 0
            }));
            backerCampaigns[msg.sender].push(_campaignId);
        } else {
            // Existing backer, update amount
            Backer[] storage backers = campaignBackers[_campaignId];
            for (uint256 i = 0; i < backers.length; i++) {
                if (backers[i].backerAddress == msg.sender) {
                    backers[i].amount += msg.value;
                    break;
                }
            }
        }
        
        backerContributions[_campaignId][msg.sender] += msg.value;
        campaign.totalFunded += msg.value;
        
        emit CampaignFunded(
            _campaignId,
            msg.sender,
            msg.value,
            campaign.totalFunded,
            block.timestamp
        );
        
        // Check if goal reached
        if (campaign.totalFunded >= campaign.fundingGoal) {
            campaign.isFunded = true;
            
            // Take platform fee from funded amount
            uint256 platformFee = (campaign.totalFunded * platformFeePercent) / 10000;
            payable(platformWallet).transfer(platformFee);
            
            emit CampaignGoalReached(
                _campaignId,
                campaign.totalFunded,
                block.timestamp
            );
        }
    }
    
    function receiveRevenue(
        uint256 _campaignId,
        string memory _source
    ) public payable {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.isFunded, "Campaign not funded yet");
        require(msg.value > 0, "Must send revenue");
        
        revenuePaymentCounter++;
        
        campaignRevenues[_campaignId].push(RevenuePayment({
            paymentId: revenuePaymentCounter,
            campaignId: _campaignId,
            payer: msg.sender,
            amount: msg.value,
            source: _source,
            timestamp: block.timestamp,
            isDistributed: false
        }));
        
        campaign.totalRevenue += msg.value;
        
        emit RevenueReceived(
            revenuePaymentCounter,
            _campaignId,
            msg.sender,
            msg.value,
            _source,
            block.timestamp
        );
        
        // Automatically distribute revenue
        distributeRevenue(_campaignId, revenuePaymentCounter - 1);
    }
    
    function distributeRevenue(uint256 _campaignId, uint256 _revenueIndex) internal {
        Campaign storage campaign = campaigns[_campaignId];
        RevenuePayment storage payment = campaignRevenues[_campaignId][_revenueIndex];
        
        require(!payment.isDistributed, "Revenue already distributed");
        
        uint256 creatorAmount = (payment.amount * campaign.creatorShare) / 10000;
        uint256 backersAmount = payment.amount - creatorAmount;
        
        // Pay creator
        payable(campaign.creator).transfer(creatorAmount);
        
        // Distribute to backers proportionally
        Backer[] storage backers = campaignBackers[_campaignId];
        for (uint256 i = 0; i < backers.length; i++) {
            uint256 backerShare = (backersAmount * backers[i].amount) / campaign.totalFunded;
            backers[i].claimedRevenue += backerShare;
            payable(backers[i].backerAddress).transfer(backerShare);
            
            emit BackerPayout(
                _campaignId,
                backers[i].backerAddress,
                backerShare,
                block.timestamp
            );
        }
        
        payment.isDistributed = true;
        campaign.totalDistributed += payment.amount;
        
        emit RevenueDistributed(
            _campaignId,
            payment.paymentId,
            creatorAmount,
            backersAmount,
            block.timestamp
        );
    }
    
    function refundCampaign(uint256 _campaignId) public {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.isActive, "Campaign not active");
        require(!campaign.isFunded, "Campaign already funded");
        require(block.timestamp >= campaign.deadline, "Campaign still ongoing");
        
        uint256 contribution = backerContributions[_campaignId][msg.sender];
        require(contribution > 0, "No contribution to refund");
        
        backerContributions[_campaignId][msg.sender] = 0;
        payable(msg.sender).transfer(contribution);
    }
    
    function getCampaign(uint256 _campaignId) public view returns (
        uint256 campaignId,
        address creator,
        string memory title,
        string memory description,
        string memory projectType,
        uint256 fundingGoal,
        uint256 totalFunded,
        uint256 creatorShare,
        uint256 backersShare,
        uint256 deadline,
        bool isActive,
        bool isFunded,
        uint256 totalRevenue,
        uint256 totalDistributed
    ) {
        Campaign memory campaign = campaigns[_campaignId];
        return (
            campaign.campaignId,
            campaign.creator,
            campaign.title,
            campaign.description,
            campaign.projectType,
            campaign.fundingGoal,
            campaign.totalFunded,
            campaign.creatorShare,
            campaign.backersShare,
            campaign.deadline,
            campaign.isActive,
            campaign.isFunded,
            campaign.totalRevenue,
            campaign.totalDistributed
        );
    }
    
    function getCampaignBackers(uint256 _campaignId) public view returns (Backer[] memory) {
        return campaignBackers[_campaignId];
    }
    
    function getCampaignRevenues(uint256 _campaignId) public view returns (RevenuePayment[] memory) {
        return campaignRevenues[_campaignId];
    }
    
    function getCreatorCampaigns(address _creator) public view returns (uint256[] memory) {
        return creatorCampaigns[_creator];
    }
    
    function getBackerCampaigns(address _backer) public view returns (uint256[] memory) {
        return backerCampaigns[_backer];
    }
    
    function getBackerContribution(uint256 _campaignId, address _backer) public view returns (uint256) {
        return backerContributions[_campaignId][_backer];
    }
}