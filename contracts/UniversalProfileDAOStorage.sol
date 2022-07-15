// SPDX-License-Identifier: CC0-1.0

pragma solidity ^0.8.0;

import "@erc725/smart-contracts/contracts/interfaces/IERC725Y.sol";
import "@lukso/lsp-smart-contracts/contracts/LSP0ERC725Account/LSP0ERC725Account.sol";

/**
 * @author B00ste
 * @title UniversalProfileDAOStorage
 * @custom:version 0.3
 */
contract UniversalProfileDAOStorage {

  /**
   * @notice Instance of the DAO key manager.
   */
  LSP0ERC725Account private DAO;

  constructor(LSP0ERC725Account _DAO) {
    DAO = _DAO;
  }

  /**
   * @notice Permissions.
   * VOTE    = 0x0000000000000000000000000000000000000000000000000000000000000001; // 0001
   * PROPOSE = 0x0000000000000000000000000000000000000000000000000000000000000002; // 0010
   * EXECUTE = 0x0000000000000000000000000000000000000000000000000000000000000004; // 0100
   */
  bytes32[3] private permissions = [
    bytes32(0x0000000000000000000000000000000000000000000000000000000000000001),
    0x0000000000000000000000000000000000000000000000000000000000000002,
    0x0000000000000000000000000000000000000000000000000000000000000004
  ];

  /**
   * @notice The key for the length of the array of aaddresses that have permissions in the DAO.
   */
  bytes32 private daoAddressesArrayKey = bytes32(keccak256("DAOPermissionsAddresses[]"));

  /**
   * @notice The key for the length of the array of DAO proposals.
   */
  bytes32 private daoProposalsArrayKey = bytes32(keccak256("ProposalsArray[]"));

  // --- INTERNAL METHODS

  /**
   * @notice Split a bytes32 in half into two bytes16 values.
   */
  function _bytes32ToTwoHalfs(bytes32 source) internal pure returns(bytes16[2] memory y) {
    y = [bytes16(0), 0];
    assembly {
        mstore(y, source)
        mstore(add(y, 16), source)
    }
  }

  // --- GETTERS & SETTERS

  function getDaoProposalsArrayKeyByPhase(uint8 phaseNr) internal pure returns(bytes32 key) {
    bytes2 phase;
    if (phaseNr == 1) {
      phase = bytes2(keccak256("Phase1"));
    }
    else if(phaseNr == 2) {
      phase = bytes2(keccak256("Phase2"));
    }
    else if(phaseNr == 3) {
      phase = bytes2(keccak256("Phase3"));
    }
    key = bytes32(bytes.concat(
      phase,
      bytes8(keccak256("Proposals")),
      bytes20(keccak256("ProposalsArray[]"))
    ));
  }

  function _getPermissionsByIndex(uint8 index) internal view returns(bytes32 permission) {
    permission = permissions[index];
  }

  /**
   * @notice Get the length of the array of the addresses that have permissions in the DAO.
   */
  function _getDaoAddressesArrayLength() internal view returns(uint256 length) {
    length = uint256(bytes32(DAO.getData(daoAddressesArrayKey)));
  }

  /**
   * @notice Set the length of the array of the addresses that have permissions in the DAO.
   *
   * @param length the length of the array of addresses that are participants to the DAO.
   */
  function _setDaoAddressesArrayLength(uint256 length) internal {
    bytes memory newLength = bytes.concat(bytes32(length));
    DAO.setData(daoProposalsArrayKey, newLength);
  }

  /**
   * @notice Get an address of a DAO perticipant by index.
   *
   * @param index The index of the an address.
   */
  function _getDaoAddressByIndex(uint256 index) internal view returns(bytes memory daoAddress) {
    bytes16[2] memory daoAddressesArrayKeyHalfs = _bytes32ToTwoHalfs(daoAddressesArrayKey);
    bytes32 daoAddressKey = bytes32(bytes.concat(
      daoAddressesArrayKeyHalfs[0], bytes16(uint128(index))
    ));
    daoAddress = DAO.getData(daoAddressKey);
  }

  /**
   * @notice Set an address of a DAO perticipant at an index.
   *
   * @param index The index of an address.
   * @param _daoAddress The address of a DAO participant.
   */
  function _setDaoAddressByIndex(uint256 index, address _daoAddress) internal {
    bytes16[2] memory daoAddressesArrayKeyHalfs = _bytes32ToTwoHalfs(daoAddressesArrayKey);
    bytes32 daoAddressKey = bytes32(bytes.concat(
      daoAddressesArrayKeyHalfs[0], bytes16(uint128(index))
    ));
    bytes memory daoAddress = bytes.concat(bytes20(_daoAddress));
    DAO.setData(daoAddressKey, daoAddress);
  }

  /**
   * @notice Get addresses DAO permmissions BitArray.
   *
   * @param daoAddress The address of a DAO participant.
   */
  function _getAddressDaoPermission(address daoAddress) internal view returns(bytes memory addressPermssions) {
    bytes32 addressPermssionsKey = bytes32(bytes.concat(
      bytes6(keccak256("DAOPermissionsAddresses")),
      bytes4(keccak256("DAOPermissions")),
      bytes2(0),
      bytes20(daoAddress)
    ));
    addressPermssions = DAO.getData(addressPermssionsKey);
  }

  /**
   * @notice Set addresses DAO permmissions BitArray by index.
   *
   * @param daoAddress The address of a DAO participant.
   * @param index The index of the permissions array.
   * Index 0 is the VOTE permission.
   * Index 1 is the PROPOSE permission.
   * Index 2 is the EXECUTE permission.
   */
  function _setAddressDaoPermission(address daoAddress, uint8 index, bool permissionAdded) internal {
    bytes32 addressPermssionsKey = bytes32(bytes.concat(
      bytes6(keccak256("DAOPermissionsAddresses")),
      bytes4(keccak256("DAOPermissions")),
      bytes2(0),
      bytes20(daoAddress)
    ));
    bytes memory addressPermssions;
    if (permissionAdded) {
      addressPermssions = bytes.concat(
        bytes32(uint256(bytes32(DAO.getData(addressPermssionsKey))) + uint256(permissions[index]))
      );
    }
    else {
      addressPermssions = bytes.concat(
        bytes32(uint256(bytes32(DAO.getData(addressPermssionsKey))) - uint256(permissions[index]))
      );
    }
    DAO.setData(addressPermssionsKey, addressPermssions);
  }

  /**
   * @notice Get the proposals array lenngth.
   */
  function _getProposalsArrayLength(uint8 phaseNr) internal view returns(uint256 length) {
    length = uint256(bytes32(DAO.getData(getDaoProposalsArrayKeyByPhase(phaseNr))));
  }

  /**
   * @notice Set the proposals array lenngth.
   */
  function _setProposalsArrayLength(uint256 length, uint8 phaseNr) internal {
    bytes memory newLength = bytes.concat(bytes32(length));
    DAO.setData(getDaoProposalsArrayKeyByPhase(phaseNr), newLength);
  }

  /**
   * @notice Get Proposal by index.
   */
  function _getProposalByIndex(uint256 index, uint8 phaseNr) internal view returns(bytes memory proposalSignature) {
    bytes16[2] memory daoProposalsArrayKeyHalfs = _bytes32ToTwoHalfs(getDaoProposalsArrayKeyByPhase(phaseNr));
    bytes32 proposalKey = bytes32(bytes.concat(
      daoProposalsArrayKeyHalfs[0], bytes16(uint128(index))
    ));
    proposalSignature = DAO.getData(proposalKey);
  }

  /**
   * @notice Set Proposal by index.
   */
  function _setProposalByIndex(uint256 index, bytes32 _proposalSignature, uint8 phaseNr) internal {
    bytes16[2] memory daoProposalsArrayKeyHalfs = _bytes32ToTwoHalfs(getDaoProposalsArrayKeyByPhase(phaseNr));
    bytes32 proposalKey = bytes32(bytes.concat(
      daoProposalsArrayKeyHalfs[0], bytes16(uint128(index))
    ));
    bytes memory proposalSignature = bytes.concat(_proposalSignature);
    DAO.setData(proposalKey, proposalSignature);
  }

  /**
   * @notice Remove Proposal by index.
   */
  function _removeProposal(bytes32 proposalSignature, uint8 phaseNr) internal returns(bool, bytes32) {
    uint256 length = _getProposalsArrayLength(phaseNr);
    for (uint i = 0; i < length; i++) {
      bytes32 currentProposalSignature = bytes23(_getProposalByIndex(i, phaseNr));
      bytes32 nextProposalSignature = bytes32(_getProposalByIndex((i + 1), phaseNr));
      if (currentProposalSignature == proposalSignature) {
        _setProposalByIndex(i, nextProposalSignature, phaseNr);
        _setProposalByIndex((i + 1), currentProposalSignature, phaseNr);
      }
    }
    _setProposalByIndex(length, bytes32(0), phaseNr);
    _setProposalsArrayLength((length + 1), phaseNr);
    return (true, proposalSignature);
  }

  /**
   * @notice Get DAO proposal data.
   */
  function _getProposalData(bytes32 proposalSignature) internal view returns(
      string memory title,
      string memory description,
      uint256 creationTimestamp,
      uint256 votingTimestamp,
      uint256 endTimestamp,
      uint256 againstVotes,
      uint256 proVotes,
      uint256 abstainVotes
  ) {
    (
      title,
      description,
      creationTimestamp,
      votingTimestamp,
      endTimestamp,
      againstVotes,
      proVotes,
      abstainVotes
    ) = abi.decode(DAO.getData(proposalSignature), (string, string, uint256, uint256, uint256, uint256, uint256, uint256));
  }

  /**
   * @notice Set DAO proposal data.
   */
  function _setProposalData(bytes32 proposalSignature, bytes memory proposalData) internal {
    DAO.setData(
      proposalSignature,
      proposalData  
    );
  }

  /**
   * @notice Delegate vote to an address.
   */
  function _setDelegatee(address delegator, address delegatee) internal {
    bytes32 voteDelegateeKey = bytes32(bytes.concat(
      bytes6(keccak256("SingleDelegatee")),
      bytes4(keccak256("Delegatee")),
      bytes2(0),
      bytes20(delegator)
    ));
    bytes memory voteDelegatee = bytes.concat(bytes20(delegatee));
    DAO.setData(voteDelegateeKey, voteDelegatee);
  }

  /**
   * @notice Get delegatee of an Universal Profile
   */
  function _getDelegatee(address delegator) internal view returns(address delegatee) {
    bytes32 voteDelegateeKey = bytes32(bytes.concat(
      bytes6(keccak256("SingleDelegatee")),
      bytes4(keccak256("Delegatee")),
      bytes2(0),
      bytes20(delegator)
    ));
    delegatee = address(bytes20(DAO.getData(voteDelegateeKey)));
  }

}