import "../../../styles/WalletMenu.css";
import { TbCoinRupeeFilled } from "react-icons/tb";
import { RiCopperCoinLine } from "react-icons/ri";
import { CiWallet } from "react-icons/ci";
import { useSelector } from "react-redux";

const HeaderWalletMenu = () => {
  const { wallet } = useSelector((store) => store.payment);

  return (
    <>
      <div className="wallet-container">
        <div className="wallet-info">
          <span>
            <TbCoinRupeeFilled size={16} />
            {wallet.realMoney}
          </span>
          <span>
            <RiCopperCoinLine size={16} />
            {wallet.platformMoney}
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
