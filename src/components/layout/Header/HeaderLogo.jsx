import { FaEtsy, FaMinus, FaG, FaA, FaM, FaI, FaN } from "react-icons/fa6";
import useNavigateHook from "../../../hooks/useNavigateHook";

const HeaderLogo = () => {
  const { goToHome } = useNavigateHook();
  const logoIcons = [FaEtsy, FaMinus, FaG, FaA, FaM, FaI, FaN, FaG];

  return (
    <div
      onClick={goToHome}
      className="flex items-center space-x-1 cursor-pointer p-3 "
    >
      {logoIcons.map((Icon, index) => (
        <Icon key={index} size={16} />
      ))}
    </div>
  );
};

export default HeaderLogo;
