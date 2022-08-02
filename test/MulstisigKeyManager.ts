import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ClaimOwnership__factory } from "../typechain-types";

describe("Lock", function () {
  async function deployRawMultisigKeyManager() {

    const [owner, account1, account2] = await ethers.getSigners();

    const UNIVERSAL_PROFILE = await ethers.getContractFactory("LSP0ERC725Account");
    const universalProfile = await UNIVERSAL_PROFILE.deploy(owner.address);

    const KEY_MANAGER = await ethers.getContractFactory("LSP6KeyManager");
    const keyManager = await KEY_MANAGER.deploy(owner.address);

    const MULTISIG_KEY_MANAGER = await ethers.getContractFactory("MultisigKeyManager");
    const multisig = await MULTISIG_KEY_MANAGER.deploy(universalProfile.address, keyManager.address);

    return { universalProfile, keyManager, multisig, owner, account1, account2 };
  }
  async function deployMultisigKeyManagerWithPermissionsSet() {

    const [owner, account1, account2] = await ethers.getSigners();

    const UNIVERSAL_PROFILE = await ethers.getContractFactory("LSP0ERC725Account");
    const universalProfile = await UNIVERSAL_PROFILE.deploy(owner.address);

    const KEY_MANAGER = await ethers.getContractFactory("LSP6KeyManager");
    const keyManager = await KEY_MANAGER.deploy(universalProfile.address);

    const MULTISIG_KEY_MANAGER = await ethers.getContractFactory("MultisigKeyManager");
    const multisig = await MULTISIG_KEY_MANAGER.deploy(universalProfile.address, keyManager.address);

    const keys = [
      "0xdf30dba06db6a30e65354d9a64c609861f089545ca58c6b4dbe31a5f338cb0e3",
      "0xdf30dba06db6a30e65354d9a64c60986" + "00000000000000000000000000000000",
      "0xdf30dba06db6a30e65354d9a64c60986" + "00000000000000000000000000000001",
      "0x4b80742de2bf82acb3630000" + multisig.address.toString().substring(2),
      "0x4b80742de2bf82acb3630000" + owner.address.toString().substring(2),
      "0x47499aa724781173ffff2a8a82c6223b88e1a838d32bb91a9ff9c9c0b8c8759b"
    ];
    const values = [
      "0x0000000000000000000000000000000000000000000000000000000000000004",
      multisig.address.toLowerCase(),
      owner.address.toLowerCase(),
      "0x0000000000000000000000000000000000000000000000000000000000007fbf",
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      ethers.utils.hexValue(50)
    ];

    const set_data = await universalProfile["setData(bytes32[],bytes[])"](keys, values);

    return { universalProfile, keyManager, multisig, owner, account1, account2 };
  }
  async function deployMultisigKeyManagerWithMultisigPermissionsSet() {

    const [owner, account1, account2] = await ethers.getSigners();

    const UNIVERSAL_PROFILE = await ethers.getContractFactory("LSP0ERC725Account");
    const universalProfile = await UNIVERSAL_PROFILE.deploy(owner.address);

    const KEY_MANAGER = await ethers.getContractFactory("LSP6KeyManager");
    const keyManager = await KEY_MANAGER.deploy(universalProfile.address);

    const MULTISIG_KEY_MANAGER = await ethers.getContractFactory("MultisigKeyManager");
    const multisig = await MULTISIG_KEY_MANAGER.deploy(universalProfile.address, keyManager.address);

    const keys = [
      "0xdf30dba06db6a30e65354d9a64c609861f089545ca58c6b4dbe31a5f338cb0e3",
      "0xdf30dba06db6a30e65354d9a64c60986" + "00000000000000000000000000000000",
      "0xdf30dba06db6a30e65354d9a64c60986" + "00000000000000000000000000000001",
      "0x4b80742de2bf82acb3630000" + multisig.address.substring(2),
      "0x4b80742de2bf82acb3630000" + owner.address.substring(2),
      "0x47499aa724781173ffff2a8a82c6223b88e1a838d32bb91a9ff9c9c0b8c8759b",

      "0x54aef89da199194b126d28036f71291726191dbff7160f9d0986952b17eaedb4",
      "0x54aef89da199194b126d28036f712917" + "00000000000000000000000000000000",
      "0x54aef89da199194b126d28036f712917" + "00000000000000000000000000000001",
      "0x54aef89da199194b126d28036f712917" + "00000000000000000000000000000002",
      "0x4164647265734d756c740000" + owner.address.substring(2),
      "0x4164647265734d756c740000" + account1.address.substring(2),
      "0x4164647265734d756c740000" + account2.address.substring(2)
    ];
    const values = [
      "0x0000000000000000000000000000000000000000000000000000000000000004",
      multisig.address.toLowerCase(),
      owner.address.toLowerCase(),
      "0x0000000000000000000000000000000000000000000000000000000000007fbf",
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      ethers.utils.hexValue(50),

      "0x0000000000000000000000000000000000000000000000000000000000000003",
      owner.address.toLowerCase(),
      account1.address.toLowerCase(),
      account2.address.toLowerCase(),
      "0x000000000000000000000000000000000000000000000000000000000000000f",
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000000000000000000000000000001"
    ];

    await universalProfile["setData(bytes32[],bytes[])"](keys, values);

    return { universalProfile, keyManager, multisig, owner, account1, account2 };
  }
  async function deployMultisigKeyManagerWithDataSetAndOwnershipTransfered() {

    const [owner, account1, account2] = await ethers.getSigners();

    const UNIVERSAL_PROFILE = await ethers.getContractFactory("LSP0ERC725Account");
    const universalProfile = await UNIVERSAL_PROFILE.deploy(owner.address);

    const KEY_MANAGER = await ethers.getContractFactory("LSP6KeyManager");
    const keyManager = await KEY_MANAGER.deploy(universalProfile.address);

    const MULTISIG_KEY_MANAGER = await ethers.getContractFactory("MultisigKeyManager");
    const multisig = await MULTISIG_KEY_MANAGER.deploy(universalProfile.address, keyManager.address);

    const keys = [
      "0xdf30dba06db6a30e65354d9a64c609861f089545ca58c6b4dbe31a5f338cb0e3",
      "0xdf30dba06db6a30e65354d9a64c60986" + "00000000000000000000000000000000",
      "0xdf30dba06db6a30e65354d9a64c60986" + "00000000000000000000000000000001",
      "0x4b80742de2bf82acb3630000" + multisig.address.substring(2),
      "0x4b80742de2bf82acb3630000" + owner.address.substring(2),
      "0x47499aa724781173ffff2a8a82c6223b88e1a838d32bb91a9ff9c9c0b8c8759b",

      "0x54aef89da199194b126d28036f71291726191dbff7160f9d0986952b17eaedb4",
      "0x54aef89da199194b126d28036f712917" + "00000000000000000000000000000000",
      "0x54aef89da199194b126d28036f712917" + "00000000000000000000000000000001",
      "0x54aef89da199194b126d28036f712917" + "00000000000000000000000000000002",
      "0x4164647265734d756c740000" + owner.address.substring(2),
      "0x4164647265734d756c740000" + account1.address.substring(2),
      "0x4164647265734d756c740000" + account2.address.substring(2)
    ];
    const values = [
      "0x0000000000000000000000000000000000000000000000000000000000000004",
      multisig.address.toLowerCase(),
      owner.address.toLowerCase(),
      "0x0000000000000000000000000000000000000000000000000000000000007fbf",
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      ethers.utils.hexValue(50),

      "0x0000000000000000000000000000000000000000000000000000000000000003",
      owner.address.toLowerCase(),
      account1.address.toLowerCase(),
      account2.address.toLowerCase(),
      "0x000000000000000000000000000000000000000000000000000000000000000f",
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000000000000000000000000000001"
    ];

    // Set the necesary data.
    await universalProfile["setData(bytes32[],bytes[])"](keys, values);

    // Transfer Ownership from Universal Profile to Key Manager.
    await universalProfile.transferOwnership(keyManager.address);

    // Claim Ownersip of the Universal Profile from the Key Manager
    let ABI = ["function claimOwnership()"];
    let iface = new ethers.utils.Interface(ABI);
    await keyManager.execute(iface.encodeFunctionData("claimOwnership"));

    return { universalProfile, keyManager, multisig, owner, account1, account2 };
  }

  describe("Deployment", function () {
    it("Should set permissions correctly", async () => {
      const { universalProfile, multisig, owner } = await loadFixture(deployRawMultisigKeyManager);
      
      const keys = [
        "0xdf30dba06db6a30e65354d9a64c609861f089545ca58c6b4dbe31a5f338cb0e3",
        "0xdf30dba06db6a30e65354d9a64c60986" + "00000000000000000000000000000000",
        "0xdf30dba06db6a30e65354d9a64c60986" + "00000000000000000000000000000001",
        "0x4b80742de2bf82acb3630000" + multisig.address.substring(2),
        "0x4b80742de2bf82acb3630000" + owner.address.substring(2),
        "0x47499aa724781173ffff2a8a82c6223b88e1a838d32bb91a9ff9c9c0b8c8759b"
      ];
      const values = [
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        multisig.address.toLowerCase(),
        owner.address.toLowerCase(),
        "0x0000000000000000000000000000000000000000000000000000000000007fbf",
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        ethers.utils.hexValue(50)
      ];

      await universalProfile["setData(bytes32[],bytes[])"](keys, values);
      const get_data = await universalProfile["getData(bytes32[])"](keys);
      
      expect(get_data).to.deep.equal(values);
    });

    it("Should update the members with necessary permissions",async () => {
      const { universalProfile, multisig, owner, account1, account2 } = await loadFixture(deployRawMultisigKeyManager);

      const keys = [
        "0xdf30dba06db6a30e65354d9a64c609861f089545ca58c6b4dbe31a5f338cb0e3",
        "0xdf30dba06db6a30e65354d9a64c60986" + "00000000000000000000000000000000",
        "0xdf30dba06db6a30e65354d9a64c60986" + "00000000000000000000000000000001",
        "0x4b80742de2bf82acb3630000" + multisig.address.substring(2),
        "0x4b80742de2bf82acb3630000" + owner.address.substring(2),
        "0x47499aa724781173ffff2a8a82c6223b88e1a838d32bb91a9ff9c9c0b8c8759b",
  
        "0x54aef89da199194b126d28036f71291726191dbff7160f9d0986952b17eaedb4",
        "0x54aef89da199194b126d28036f712917" + "00000000000000000000000000000000",
        "0x54aef89da199194b126d28036f712917" + "00000000000000000000000000000001",
        "0x54aef89da199194b126d28036f712917" + "00000000000000000000000000000002",
        "0x4164647265734d756c740000" + owner.address.substring(2),
        "0x4164647265734d756c740000" + account1.address.substring(2),
        "0x4164647265734d756c740000" + account2.address.substring(2)
      ];
      const values = [
        "0x0000000000000000000000000000000000000000000000000000000000000004",
        multisig.address.toLowerCase(),
        owner.address.toLowerCase(),
        "0x0000000000000000000000000000000000000000000000000000000000007fbf",
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        ethers.utils.hexValue(50),
  
        "0x0000000000000000000000000000000000000000000000000000000000000003",
        owner.address.toLowerCase(),
        account1.address.toLowerCase(),
        account2.address.toLowerCase(),
        "0x000000000000000000000000000000000000000000000000000000000000000f",
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000000000000000000000000000001"
      ];
  
      await universalProfile["setData(bytes32[],bytes[])"](keys, values);
      const get_data = await universalProfile["getData(bytes32[])"](keys);
      
      expect(get_data).to.deep.equal(values);
    });

    it("Should transfer ownership from EOA to key manager", async () => {
      const { universalProfile, keyManager } = await loadFixture(deployMultisigKeyManagerWithMultisigPermissionsSet);

      await universalProfile.transferOwnership(keyManager.address);

      let ABI = ["function claimOwnership()"];
      let iface = new ethers.utils.Interface(ABI);
      await keyManager.execute(iface.encodeFunctionData("claimOwnership"));

      expect(await universalProfile.owner()).to.equal(keyManager.address);
    });

    it("Should be able to add permissions", async () => {
      const { universalProfile, multisig, owner, account1 } = await loadFixture(deployMultisigKeyManagerWithDataSetAndOwnershipTransfered);

      await multisig.connect(owner).addPermissions(
        account1.address, 
        "0x000000000000000000000000000000000000000000000000000000000000000e"
      );

      expect(await universalProfile["getData(bytes32)"]("0x4164647265734d756c740000" + account1.address.substring(2)))
      .to.equal("0x000000000000000000000000000000000000000000000000000000000000000f");
    });

    it("Should not be able to add permissions", async () => {
      const { multisig, account1, account2 } = await loadFixture(deployMultisigKeyManagerWithDataSetAndOwnershipTransfered);

      const add_permission = multisig.connect(account1).addPermissions(
        account2.address, 
        "0x000000000000000000000000000000000000000000000000000000000000000e"
      );

      let ABI = ["error NotAuthorised(address from, string permission)"];
      let errorInterface = new ethers.utils.Interface(ABI);
      const errorContract = new ethers.Contract("LSP6Errors", errorInterface, ethers.provider);
      expect(add_permission).to.revertedWithCustomError(
        errorContract,
        "NotAuthorised"
      );
    });

    it("Should not be able to remove permissions", async () => {
      const { multisig, owner, account1 } = await loadFixture(deployMultisigKeyManagerWithDataSetAndOwnershipTransfered);

      const add_permission = multisig.connect(account1).removePermissions(
        owner.address, 
        "0x000000000000000000000000000000000000000000000000000000000000000e"
      );

      let ABI = ["error NotAuthorised(address from, string permission)"];
      let errorInterface = new ethers.utils.Interface(ABI);
      const errorContract = new ethers.Contract("LSP6Errors", errorInterface, ethers.provider);
      expect(add_permission).to.revertedWithCustomError(
        errorContract,
        "NotAuthorised"
      );
    });

    it("Should be able to propose something for execution", async () => {
      const { universalProfile, keyManager, multisig, owner, account1, account2 } = await loadFixture(deployMultisigKeyManagerWithDataSetAndOwnershipTransfered);

      let ABI = ["function setData(bytes32 dataKey, bytes memory dataValue)"];
      let ERC725Yinterface = new ethers.utils.Interface(ABI);
      const targets = [universalProfile.address];
      const datas = [
        ERC725Yinterface.encodeFunctionData(
          "setData",
          [
            "0x4164647265734d756c740000" + account1.address.substring(2),
            "0x000000000000000000000000000000000000000000000000000000000000000f"
          ]
        )
      ];

      const propose = await multisig.connect(owner).proposeExecution(targets, datas);
      const proposeReturnValue = (await propose.wait(1)).logs[3].data.substring(0, 22);
      
      const keys = [
        proposeReturnValue + "0000c6c66d5a29ded4b70a2bc4d1637290a99598996b",
        proposeReturnValue + "0000a127ec6f6a314082d85a8df20cec2eb66abc0e15"
      ];
      const values = [
        ethers.utils.defaultAbiCoder.encode(["address[]"], [targets]),
        ethers.utils.defaultAbiCoder.encode(["bytes[]"], [datas])
      ];

      expect((await universalProfile["getData(bytes32[])"](keys))).to.be.deep.equal(values);
    });

    
    
  });
})