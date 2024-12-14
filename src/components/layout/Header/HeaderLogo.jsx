import { FaEtsy } from "react-icons/fa";
import { FaMinus, FaG, FaA, FaM, FaI, FaN } from "react-icons/fa6";
import useNavigateHook from "../../../hooks/useNavigateHook";

const HeaderLogo = () => {
  const { goToHome } = useNavigateHook();
  return (
    <>
      <div onClick={goToHome} className="row align-center p-3">
        <FaEtsy size={16} />
        <FaMinus size={10} />
        <FaG size={16} />
        <FaA size={16} />
        <FaM size={16} />
        <FaI size={16} />
        <FaN size={16} />
        <FaG size={16} />
      </div>
    </>
  );
};

export default HeaderLogo;
