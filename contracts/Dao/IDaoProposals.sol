// SPDX-License-Identifier: CC0-1.0

pragma solidity ^0.8.0;

/**
 * @author B00ste
 * @title IDaoProposals
 * @custom:version 1.i
 */
interface IDaoProposals {

  /**
   * @notice This event is emited every time a proposal is created.
   *
   * @param proposalSignature The signature of the proposal that was created.
   */
  event ProposalCreated(bytes10 proposalSignature);

  /**
   * @notice This event is emited every time a proposal's votes are registered.
   *
   * @param proposalSignature The signature of the proposal that had its voted registered.
   */
  event VotesRegistered(bytes10 proposalSignature);

  /**
   * @notice This event is emited every time a proposal is executed.
   *
   * @param proposalSignature The signature of the proposal that was executed.
   */
  event ProposalExecuted(bytes10 proposalSignature);

  /**
   * @notice This event is emited every time a proposal is tried to be executed.
   *
   * @param proposalSignature The signature of the proposal that cannot be executed.
   */
  event ProposalCannotBeExecuted(bytes10 proposalSignature);

  /**
   * @notice Create a proposal.
   *
   * @param _title Title of the proposal. Used to create the proposal signature.
   * @param _metadataLink Link to the metadata JSON file.
   * @param _votingDelay Period before voting can start. Must be >= with the minimum voting delay set in dao settings.
   * @param _votingPeriod Period one could register votes for the proposal. Must be >= with the minimum voting period set in dao settings.
   * @param _executionDelay Period after which one could execute the proposal. Must be >= with the minimum execution delay set in dao settings.
   * @param _payloads An array of payloads which will be executed if the proposal is successful.
   * @param _choices Number of choices allowed for the proposal. Choice name and description must be stored inside `_metadataLink`.
   * @param _choicesPerVote Maximum number of choices allowed for each voter.
   * 
   * Requirements:
   * - `_choicesPerVote` miust be smaller or equal to `_choices`.
   * - `_votingDelay` must be bigger or equal to the minimum value set in the dao's settings.
   * - `_votingPeriod` must be bigger or equal to the minimum value set in the dao's settings.
   * - `_executionDelay` must be bigger or equal to the minimum value set in the dao's settings.
   */
  function createProposal(
    string calldata _title,
    string calldata _metadataLink,
    bytes32 _votingDelay,
    bytes32 _votingPeriod,
    bytes32 _executionDelay,
    bytes[] calldata _payloads,
    bytes32 _choices,
    bytes32 _choicesPerVote
  ) external;

  /**
   * @notice Get the hash needed to be signed by the proposal voters.
   * 
   * @param _signer The address of the voter.
   * @param _proposalSignature The unique identifier of a proposal.
   * @param _choicesBitArray The choices of the voter.
   * 
   * Requirements:
   * - `msg.sender` must have VOTE permission.
   * - `_signer` must be the same as the address that will sign the message.
   */
  function getProposalHash(
    address _signer,
    bytes10 _proposalSignature,
    bytes32 _choicesBitArray
  ) external view returns(bytes32 _hash);

  /**
   * @notice Register the participants with its choices and signed vote.
   * 
   * @param _proposalSignature The unique identifier of a proposal.
   * @param _signatures An array of signatures, generated by `getProposalHash(...)`.
   * @param _signers An array of addresses that signed the `_signatures`.
   * @param _choicesBitArray An array of BitArrays representing the choices of `_signers`.
   * 
   * Requirements:
   * - `msg.sender` must have REGISTER_VOTES permission.
   * - `_signatures.length` must be equal to `_signers.length` and to `_choicesBitArray.length`.
   * - Voting delay period must be over.
   * - Voting period must not be over.
   */
  function registerVotes(
    bytes10 _proposalSignature,
    bytes[] memory _signatures,
    address[] memory _signers,
    bytes32[] memory _choicesBitArray
  ) external;

  /**
   * @notice Execute the proposal by signature.
   * 
   * @param proposalSignature The unique identifier of a proposal
   * 
   * Requirements:
   * - `msg.sender` must have EXECUTE permission.
   * - Votes must be registered before executing the proposal.
   * - Voting delay, voting period and execute delay phases must be over.
   */
  function executeProposal(
    bytes10 proposalSignature
  ) external returns(uint256[] memory);

}