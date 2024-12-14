import "../../../styles/WalletMenu.css";
import { TbCoinRupeeFilled } from "react-icons/tb";
import { RiCopperCoinLine } from "react-icons/ri";
import { CiWallet } from "react-icons/ci";

const HeaderWalletMenu = () => {
  return (
    <>
      <div className="wallet-container">
        <div className="wallet-info">
          <span>
            <TbCoinRupeeFilled size={16} />
            50000
          </span>
          <span>
            <RiCopperCoinLine size={16} />
            10000
          </span>
        </div>
        <div className="wallet">
          <CiWallet size={20} className="wallet-icon" />
        </div>
      </div>
    </>
  );
};

export default HeaderWalletMenu;
