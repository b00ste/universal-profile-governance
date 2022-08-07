import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Deployment testing & Individual contracts method testing", function () {
  async function deployContracts() {

    const [owner, account1, account2, account3, account4] = await ethers.getSigners();

    const UniversalReceiverDelegateUP = await ethers.getContractFactory("UniversalReceiverDelegateUP");
    const universalReceiverDelegateUP = await UniversalReceiverDelegateUP.deploy();

    const UniversalReceiverDelegateVault = await ethers.getContractFactory("UniversalReceiverDelegateVault");
    const universalReceiverDelegateVault = await UniversalReceiverDelegateVault.deploy();

    const UniversalProfile = await ethers.getContractFactory("UniversalProfile");
    const universalProfile = await UniversalProfile.deploy(owner.address, universalReceiverDelegateUP.address);

    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(owner.address, universalReceiverDelegateVault.address);

    const KeyManager = await ethers.getContractFactory("KeyManager");
    const keyManager = await KeyManager.deploy(universalProfile.address);

    const DaoPermissions = await ethers.getContractFactory("DaoPermissions");
    const daoPermissions = await DaoPermissions.deploy(universalProfile.address, keyManager.address);

    const DaoDelegates = await ethers.getContractFactory("DaoDelegates");
    const daoDelegates = await DaoDelegates.deploy(universalProfile.address, keyManager.address);

    const DaoProposals = await ethers.getContractFactory("DaoProposals");
    const daoProposals = await DaoProposals.deploy(universalProfile.address, keyManager.address);

    // Initialize the dao with new members.
    await universalProfile.connect(owner).setDaoData(
      ethers.utils.hexlify(ethers.utils.toUtf8Bytes("https://somelink.com/")),
      ethers.utils.hexZeroPad(ethers.utils.hexValue(50), 1),
      ethers.utils.hexZeroPad(ethers.utils.hexValue(50), 1),
      ethers.utils.hexZeroPad(ethers.utils.hexValue(60), 32),
      ethers.utils.hexZeroPad(ethers.utils.hexValue(60), 32),
      [
        owner.address,
        account1.address,
        account2.address
      ],
      [
        "0x000000000000000000000000000000000000000000000000000000000000007f",
        "0x000000000000000000000000000000000000000000000000000000000000007f",
        "0x000000000000000000000000000000000000000000000000000000000000000f"
      ]
    );
  
    // Using initializing methods of the universal profile.
    await universalProfile.giveOwnerPermissionToChangeOwner();
    await universalProfile.setControllerPermissionsForDao(
      daoPermissions.address,
      daoDelegates.address,
      daoProposals.address
    );

    // Giving the ownership of the Universal Profile to the Key Manager.
    await universalProfile.transferOwnership(keyManager.address);
    let ABI = ["function claimOwnership()"];
    let iface = new ethers.utils.Interface(ABI);
    await keyManager.execute(iface.encodeFunctionData("claimOwnership"));

    return { universalReceiverDelegateUP, universalProfile, vault, keyManager, daoPermissions, daoDelegates, daoProposals, owner, account1, account2, account3, account4 };
  }

  describe("Universal profile deployment", () => {

    it("Should set universal profile permissions correctly on deployment", async () => {
      const { universalReceiverDelegateUP, universalProfile } = await loadFixture(deployContracts);

      const keys = [
        "0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbdf6277f3cc0730c45b828b6db8b47",
        "0xeafec4d89fa9619884b60000abe425d64acd861a49b8ddf5c0b6962110481f38"
      ];
      const values = [
        universalReceiverDelegateUP.address.toLowerCase(),
        "0xabe425d6"
      ];

      const get_data = await universalProfile["getData(bytes32[])"](keys);
      
      expect(get_data).to.deep.equal(values);
    });

    it("Should set dao permissions correctly", async () => {
      const { universalProfile, owner, account1, account2 } = await loadFixture(deployContracts);

      const keys = [
        // metadata of the dao
        "0x529fc5ec0943a0370fe51d4dec0787294933572592c61b103d9e170cb15e8e79",
        "0xbc776f168e7b9c60bb2a7180950facd372cd90c841732d963c31a93ff9f8c127",
        "0xf89f507ecd9cb7646ce1514ec6ab90d695dac9314c3771f451fd90148a3335a9",
        "0x799787138cc40d7a47af8e69bdea98db14e1ead8227cef96814fa51751e25c76",
        "0xd3cf4cd71858ea36c3f5ce43955db04cbe9e1f42a2c7795c25c1d430c9bb280a",
        // array length and array elements
        "0xf7f9c7410dd493d79ebdaee15bbc77fd163bd488f54107d1be6ed34b1e099004",
        "0xf7f9c7410dd493d79ebdaee15bbc77fd" + "00000000000000000000000000000000",
        "0xf7f9c7410dd493d79ebdaee15bbc77fd" + "00000000000000000000000000000001",
        "0xf7f9c7410dd493d79ebdaee15bbc77fd" + "00000000000000000000000000000002",
        // mapping of the addresses
        "0xf7f9c7410dd493d79ebd0000" + owner.address.substring(2),
        "0xf7f9c7410dd493d79ebd0000" + account1.address.substring(2),
        "0xf7f9c7410dd493d79ebd0000" + account2.address.substring(2),
        // permissions of the addresses
        "0x4b80742de2bfb3cc0e490000" + owner.address.substring(2),
        "0x4b80742de2bfb3cc0e490000" + account1.address.substring(2),
        "0x4b80742de2bfb3cc0e490000" + account2.address.substring(2)
      ];
      const values = [
        // metadata of the dao
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes("https://somelink.com/")),
        ethers.utils.hexZeroPad(ethers.utils.hexValue(50), 1),
        ethers.utils.hexZeroPad(ethers.utils.hexValue(50), 1),
        ethers.utils.hexZeroPad(ethers.utils.hexValue(60), 32),
        ethers.utils.hexZeroPad(ethers.utils.hexValue(60), 32),
        // array length and array elements
        "0x0000000000000000000000000000000000000000000000000000000000000003",
        owner.address.toLowerCase(),
        account1.address.toLowerCase(),
        account2.address.toLowerCase(),
        // mapping of the addresses
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        // permissions of the addresses
        "0x000000000000000000000000000000000000000000000000000000000000007f",
        "0x000000000000000000000000000000000000000000000000000000000000007f",
        "0x000000000000000000000000000000000000000000000000000000000000000f"
      ];

      const get_data = await universalProfile["getData(bytes32[])"](keys);
      
      expect(get_data).to.deep.equal(values);
    });

    it("Should update the owner permissions, owner should have change owner permission.",async () => {
      const { universalProfile, owner } = await loadFixture(deployContracts);

      const keys = [
        "0xdf30dba06db6a30e65354d9a64c609861f089545ca58c6b4dbe31a5f338cb0e3",
        "0xdf30dba06db6a30e65354d9a64c60986" + "00000000000000000000000000000000",
        "0x4b80742de2bf82acb3630000" + owner.address.substring(2)
      ];
      const values = [
        "0x0000000000000000000000000000000000000000000000000000000000000004",
        owner.address.toLowerCase(),
        "0x0000000000000000000000000000000000000000000000000000000000000001"
      ];
  
      const get_data = await universalProfile["getData(bytes32[])"](keys);
      
      expect(get_data).to.deep.equal(values);
    });

    it("Should update the dao controller permissions",async () => {
      const { universalProfile, daoPermissions, daoDelegates, daoProposals } = await loadFixture(deployContracts);

      const keys = [
        "0xdf30dba06db6a30e65354d9a64c609861f089545ca58c6b4dbe31a5f338cb0e3",
        "0xdf30dba06db6a30e65354d9a64c60986" + "00000000000000000000000000000001",
        "0xdf30dba06db6a30e65354d9a64c60986" + "00000000000000000000000000000002",
        "0xdf30dba06db6a30e65354d9a64c60986" + "00000000000000000000000000000003",
        "0x4b80742de2bf82acb3630000" + daoPermissions.address.substring(2),
        "0x4b80742de2bf82acb3630000" + daoDelegates.address.substring(2),
        "0x4b80742de2bf82acb3630000" + daoProposals.address.substring(2)
      ];
      const values = [
        "0x0000000000000000000000000000000000000000000000000000000000000004",
        daoPermissions.address.toLowerCase(),
        daoDelegates.address.toLowerCase(),
        daoProposals.address.toLowerCase(),
        "0x0000000000000000000000000000000000000000000000000000000000007fbf",
        "0x0000000000000000000000000000000000000000000000000000000000007fbf",
        "0x0000000000000000000000000000000000000000000000000000000000007fbf"
      ];

      const get_data = await universalProfile["getData(bytes32[])"](keys);
      
      expect(get_data).to.deep.equal(values);
    });

    it("Should transfer ownership from EOA to key manager", async () => {
      const { universalProfile, keyManager } = await loadFixture(deployContracts);

      expect(await universalProfile.owner()).to.equal(keyManager.address);
    });
  });

  describe("Dao permission methods", () => {

    it("Should be able to add permissions", async () => {
      const { universalProfile, daoPermissions, owner, account3 } = await loadFixture(deployContracts);

      await daoPermissions.connect(owner).addPermissions(
        account3.address, 
        "0x000000000000000000000000000000000000000000000000000000000000000e"
      );

      const keys = [
        "0x4b80742de2bfb3cc0e490000" + account3.address.substring(2),
        "0xf7f9c7410dd493d79ebdaee15bbc77fd163bd488f54107d1be6ed34b1e099004",
        "0xf7f9c7410dd493d79ebdaee15bbc77fd00000000000000000000000000000003",
        "0xf7f9c7410dd493d79ebd0000" + account3.address.substring(2)
      ];
      const values = [
        "0x000000000000000000000000000000000000000000000000000000000000000e",
        "0x0000000000000000000000000000000000000000000000000000000000000004",
        account3.address.toLowerCase(),
        "0x0000000000000000000000000000000000000000000000000000000000000003"
      ];

      const actualData = await universalProfile["getData(bytes32[])"](keys);

      expect(actualData).to.deep.equal(values);
    });

    it("Should not be able to add permissions", async () => {
      const { daoPermissions, account2, account3 } = await loadFixture(deployContracts);

      const add_permission = daoPermissions.connect(account3).addPermissions(
        account2.address, 
        "0x0000000000000000000000000000000000000000000000000000000000000010"
      );

      let ABI = ["error NotAuthorised(address from, string permission)"];
      let errorInterface = new ethers.utils.Interface(ABI);
      const errorContract = new ethers.Contract("LSP6Errors", errorInterface, ethers.provider);

      expect(add_permission).to.revertedWithCustomError(
        errorContract,
        "NotAuthorised"
      );
    });

    it("Should be able to remove permissions", async () => {
      const { universalProfile, daoPermissions, owner, account1, account2 } = await loadFixture(deployContracts);

      // remove all permissions
      await daoPermissions.connect(owner).removePermissions(
        account1.address, 
        "0x000000000000000000000000000000000000000000000000000000000000007f" // 0111 1111
      );

      // remove multiple permissions
      await daoPermissions.connect(owner).removePermissions(
        account2.address, 
        "0x0000000000000000000000000000000000000000000000000000000000000003" // 0000 0011
      );

      const keys = [
        // modified users permissions
        "0x4b80742de2bfb3cc0e490000" + account1.address.substring(2),
        "0x4b80742de2bfb3cc0e490000" + account2.address.substring(2),
        // dao user array length
        "0xf7f9c7410dd493d79ebdaee15bbc77fd163bd488f54107d1be6ed34b1e099004",
        // dao user indexes
        "0xf7f9c7410dd493d79ebdaee15bbc77fd00000000000000000000000000000001",
        "0xf7f9c7410dd493d79ebdaee15bbc77fd00000000000000000000000000000002",
        // dao users mappings
        "0xf7f9c7410dd493d79ebd0000" + account1.address.substring(2),
        "0xf7f9c7410dd493d79ebd0000" + account2.address.substring(2)
      ];
      const values = [
        // modified users permissions
        "0x",
        "0x000000000000000000000000000000000000000000000000000000000000000c",
        // dao user array length
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        // dao user indexes
        account2.address.toLowerCase(),
        "0x",
        // dao users mappings
        "0x",
        "0x0000000000000000000000000000000000000000000000000000000000000001"
      ];

      expect(await universalProfile["getData(bytes32[])"](keys))
      .to.deep.equal(values);
    });

    it("Should not be able to remove permissions", async () => {
      const { daoPermissions, account2, account3 } = await loadFixture(deployContracts);

      const remove_permission = daoPermissions.connect(account3).removePermissions(
        account2.address, 
        "0x000000000000000000000000000000000000000000000000000000000000000f"
      );

      let ABI = ["error NotAuthorised(address from, string permission)"];
      let errorInterface = new ethers.utils.Interface(ABI);
      const errorContract = new ethers.Contract("LSP6Errors", errorInterface, ethers.provider);
      expect(remove_permission).to.revertedWithCustomError(
        errorContract,
        "NotAuthorised"
      );
    });
  });

  describe("Dao claiming methods", () => {
    it("Should be able to claim permission from an authorized address", async () => {
      const { universalProfile, daoPermissions, owner, account3 } = await loadFixture(deployContracts);

      const ownerHash = await daoPermissions.getNewPermissionHash(
        owner.address,
        account3.address,
        "0x0000000000000000000000000000000000000000000000000000000000000001"
      );

      const ownerSig = await owner.signMessage(ethers.utils.arrayify(ownerHash));

      await daoPermissions.connect(account3).claimPermission(
        owner.address,
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        ownerSig
      );

      const key = "0x4b80742de2bfb3cc0e490000" + account3.address.substring(2);
      const value = "0x0000000000000000000000000000000000000000000000000000000000000001"

      expect(await universalProfile["getData(bytes32)"](key)).to.equal(value);
    });

    it("Should not be able to claim twice from an authorized address", async () => {
      const { daoPermissions, owner, account3 } = await loadFixture(deployContracts);

      const ownerHash = await daoPermissions.getNewPermissionHash(
        owner.address,
        account3.address,
        "0x0000000000000000000000000000000000000000000000000000000000000001"
      );

      const ownerSig = await owner.signMessage(ethers.utils.arrayify(ownerHash));

      await daoPermissions.connect(account3).claimPermission(
        owner.address,
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        ownerSig
      );

      const secondClaim =  daoPermissions.connect(account3).claimPermission(
        owner.address,
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        ownerSig
      );

      let ABI = ["error NotAuthorised(address from, string permission)"];
      let errorInterface = new ethers.utils.Interface(ABI);
      const errorContract = new ethers.Contract("LSP6Errors", errorInterface, ethers.provider);
      
      expect(secondClaim).to.revertedWithCustomError(
        errorContract,
        "NotAuthorised"
      );
    });

    it("Should not be able to claim from an unauthorized address", async () => {
      const { daoPermissions, account3, account4 } = await loadFixture(deployContracts);

      const acc3Hash = await daoPermissions.getNewPermissionHash(
        account3.address,
        account4.address,
        "0x0000000000000000000000000000000000000000000000000000000000000001"
      );

      const ownerSig = await account3.signMessage(ethers.utils.arrayify(acc3Hash));

      const claimigTrx = daoPermissions.connect(account4).claimPermission(
        account3.address,
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        ownerSig
      );

      let ABI = ["error NotAuthorised(address from, string permission)"];
      let errorInterface = new ethers.utils.Interface(ABI);
      const errorContract = new ethers.Contract("LSP6Errors", errorInterface, ethers.provider);
      
      expect(claimigTrx).to.revertedWithCustomError(
        errorContract,
        "NotAuthorised"
      );
    });
  });

})