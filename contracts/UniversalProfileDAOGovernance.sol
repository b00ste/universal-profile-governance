// SPDX-License-Identifier: CC0-1.0

pragma solidity ^0.8.0;

import "@lukso/lsp-smart-contracts/contracts/LSP0ERC725Account/LSP0ERC725Account.sol";
import "@openzeppelin/contracts/utils/structs/DoubleEndedQueue.sol";
import "./UniversalProfileDAOStorage.sol";

/**
 * @author B00ste
 * @title UniversalProfileDAOGovernance
 * @custom:version 0.3
 */

contract UniversalProfileDAOGovernance is UniversalProfileDAOStorage {
   
  /**
   * @notice Instance of the DAO Universal Profile.
   */
  LSP0ERC725Account private DAO;

  /**
   * @notice Map data structure for fast access to the data of a proposal.
   */
  mapping(bytes32 => Proposal) private proposalData;

  /**
   * @notice Percentage of pro votes needed for a proposal to pass.
   */
  uint8 private quorum;

  /**
   * @notice Participation rate needed to be reached for a proposal to be valid.
   */
  uint8 private participationRate;

  /**
   * @notice Time requiered to pass before ending the queueing period is possible.
   */
  uint256 private votingDelay;

  /**
   * @notice Time requiered to pass before ending the voting period is possible.
   */
  uint256 private votingPeriod;

  /**
   * @notice A struct containing all the info about a Proposal.
   */
  struct Proposal {
    string title;
    string description;
    address[] targets;
    bytes[] datas;
    /**
     * @notice Timestamps for each phase of a proposal.
     */
    uint256 creationTimestamp;
    uint256 votingTimestamp;
    uint256 endTimestamp;
    /**
     * @notice BitArray used for saving the current phase.
     * Phase 1 = 0x01  // 0001
     * Phase 2 = 0x02  // 0010
     * Phase 3 = 0x04  // 0100
     */
    uint8 phase;
    /**
     * @notice Array for storing the 3 types of votes.
     * Index 0 are the against votes. 
     * Index 1 are the pro votes. 
     * Index 2 are the abstain votes. 
     */
    uint256[3] votes;

  }

  /**
   * @notice Initializing the Governance smart contract. 
   */
  constructor(
    uint8 _quorum,
    uint8 _participationRate,
    uint256 _votingDelay,
    uint256 _votingPeriod,
    LSP0ERC725Account _DAO
  )
    UniversalProfileDAOStorage(_DAO)
  {
    require(_quorum >= 0 && _quorum <= 100);
    require(_participationRate >= 0 && _participationRate <= 100);
    quorum = _quorum;
    participationRate = _participationRate;
    votingDelay = _votingDelay;
    votingPeriod = _votingPeriod;
    DAO = _DAO;
  }

  // --- MODIFIERS

  /**
   * @notice Verify the phase that the proposal is in right now.
   */
  modifier checkPhase(bytes32 proposalSignature, uint8 _phase) {
    require(
      proposalData[proposalSignature].phase == _phase,
      "The selected phase not reached yet."
    );
    _;
  }

  /**
   * @notice Verifies if an Universal Profile has VOTE permission.
   */
  modifier hasVotePermission(address universalProfileAddress) {
    bytes memory addressPermissions = _getAddressDaoPermission(universalProfileAddress);
    require(
      (uint256(bytes32(addressPermissions)) & (1 << 0) == 1),
      "This address doesn't have VOTE permission."
    );
    _;
  }

  /**
   * @notice Verifies if an Universal Profile has PROPOSE permission.
   */
  modifier hasProposePermission(address universalProfileAddress) {
    bytes memory addressPermissions = _getAddressDaoPermission(universalProfileAddress);
    require(
      (uint256(bytes32(addressPermissions)) & (1 << 1) == 2),
      "This address doesn't have PROPOSE permission."
    );
    _;
  }

  /**
   * @notice Verifys if total votes are enough for the proposal to pass. 
   */
  modifier checkVotes(bytes32 proposalSignature) {
    uint256[3] memory votes = proposalData[proposalSignature].votes;
    require(
      votes[1]/(votes[1] + votes[0]) > quorum/(votes[1] + votes[0]),
      "Note enough pro votes for the proposal to pass."
    );
    require(
      (votes[1] + votes[0])/(votes[1] + votes[0] + votes[2]) > participationRate/(votes[1] + votes[0] + votes[2]),
      "Participation rate is too low for the proposal to pass."
    );
    _;
  }

  /**
   * @notice Verifying if the voting delay has passed. 
   */
  modifier votingDelayPassed(bytes32 proposalSignature) {
    require(
      votingDelay + proposalData[proposalSignature].creationTimestamp < block.timestamp,
      "The voting delay is not yeat over."
    );
    _;
  }

  /**
   * @notice Verifying if the voting period has passed. 
   */
  modifier votingPeriodPassed(bytes32 proposalSignature) {
    require(
      votingPeriod + proposalData[proposalSignature].votingTimestamp < block.timestamp,
      "The voting delay is not yeat over."
    );
    _;
  }

  /**
   * @notice Verifying if the voting period is still on.
   */
  modifier votingPeriodIsOn(bytes32 proposalSignature) {
    require(
      proposalData[proposalSignature].votingTimestamp + votingPeriod > block.timestamp,
      "Voting period is already over."
    );
    _;
  }

  // --- INTERNAL METHODS

  /**
   * @notice Saves a ended proposal to the UniversalProfile.
   */
  function saveProposal(bytes32 proposalSignature, uint8 phaseNr) private {

    uint256 proposalsArrayLength = _getProposalsArrayLength(phaseNr);
    bytes memory proposalDataBytes = abi.encode(
        proposalData[proposalSignature].title,
        proposalData[proposalSignature].description,
        proposalData[proposalSignature].creationTimestamp,
        proposalData[proposalSignature].votingTimestamp,
        proposalData[proposalSignature].endTimestamp,
        proposalData[proposalSignature].votes[0],
        proposalData[proposalSignature].votes[1],
        proposalData[proposalSignature].votes[2]
    );

    _setProposalByIndex(proposalsArrayLength, proposalSignature, phaseNr);
    _setProposalsArrayLength(proposalsArrayLength + 1, phaseNr);
    _setProposalData(proposalSignature, proposalDataBytes);
    
  }

  // --- GENERAL METHODS

  /**
   * @notice Create a proposal.
   * The proposal signature is encoded to a bytes32 variable using
   * abi.encode(_title, _description, _targets, _datas).
   *
   * @param _title Title of the proposal.
   * @param _description Description of the proposal.
   * @param _targets The addresses of the smart contracts that might have calldata executed.
   * @param _datas The calldata that will be executed if the proposall passes.
   */
  function createProposal(
    string memory _title,
    string memory _description,
    address[] memory _targets,
    bytes[] memory _datas
  )
    external
    hasProposePermission(msg.sender)
    returns(bytes32 proposalSignature)
  {
    require(_targets.length == _datas.length, "Provided targets and datas have different lengths.");

    proposalSignature = bytes32(keccak256(
      abi.encode(
        _title,
        _description,
        block.timestamp
    )));

    proposalData[proposalSignature].title = _title;
    proposalData[proposalSignature].description = _description;
    proposalData[proposalSignature].targets = _targets;
    proposalData[proposalSignature].datas = _datas;
    proposalData[proposalSignature].phase = 1;
    proposalData[proposalSignature].creationTimestamp = block.timestamp;

    saveProposal(proposalSignature, 1);
  }

  /**
   * @notice Move the proposal to the voting phase.
   *
   * @param proposalSignature The abi.encode bytes32 signature of a proposal.
   */
  function putProposalToVote(
    bytes32 proposalSignature
  ) 
    external
    checkPhase(proposalSignature, (1 << 0))
    votingDelayPassed(proposalSignature)
  {
    proposalData[proposalSignature].phase = 2;
    proposalData[proposalSignature].votingTimestamp = block.timestamp;
    saveProposal(proposalSignature, 2);
    _removeProposal(proposalSignature, 1);
  }

  /**
   * @notice End proposal and execute the calldata.
   * Encode the proposal info, timestamps and results and save them to the Universal Profile of the DAO.
   *
   * @param proposalSignature The abi.encode bytes32 signature of a proposal.
   */
  function endProposal(
    bytes32 proposalSignature
  ) 
    external
    checkPhase(proposalSignature, (1 << 1))
    checkVotes(proposalSignature)
    votingPeriodPassed(proposalSignature)
  {
    proposalData[proposalSignature].phase = 3;
    proposalData[proposalSignature].endTimestamp = block.timestamp;
    for (uint i = 0; i < proposalData[proposalSignature].targets.length; i++) {
      DAO.execute(
        0,
        proposalData[proposalSignature].targets[i],
        0,
        proposalData[proposalSignature].datas[i]
      );
    }

    saveProposal(proposalSignature, 3);
    _removeProposal(proposalSignature, 2);
    delete proposalData[proposalSignature];
  }

  /**
   * @notice Vote on a proposal.
   *
   * @param proposalSignature The abi.encode bytes32 signature of a proposal.
   * @param voteIndex a number 0 <= `voteIndex` <= 2.
   * Index 0 are the against votes. 
   * Index 1 are the pro votes. 
   * Index 2 are the abstain votes. 
   */
  function vote(
    bytes32 proposalSignature,
    uint8 voteIndex
  )
    external
    checkPhase(proposalSignature, (1 << 1))
    hasVotePermission(msg.sender)
    votingPeriodIsOn(proposalSignature)
  {
    proposalData[proposalSignature].votes[voteIndex] ++;
  }

}