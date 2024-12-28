const Footer = () => {
  return (
    <footer className="p-5 bg-gray-900 text-gray-300 py-10">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
        {/* Branding Section */}
        <div className="space-y-4">
          <h5 className="text-yellow-400 text-lg font-bold">E-gaming</h5>
          <p className="text-sm">
            Play the games you love. <br />
            Compete in Tournaments. <br />
            Win real money & prizes.
          </p>
          <span className="text-xs block mt-4 text-gray-500">
            © E-gaming 2024. All Rights Reserved.
          </span>
        </div>

        {/* Contact Section */}
        <div>
          <h6 className="text-yellow-400 text-sm font-bold mb-4">Contact</h6>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:text-yellow-400">
                Influencers
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-400">
                Communities
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-400">
                Developers
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-400">
                Brands
              </a>
            </li>
          </ul>
        </div>

        {/* Platform Section */}
        <div>
          <h6 className="text-yellow-400 text-sm font-bold mb-4">Platform</h6>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:text-yellow-400">
                Clash of Clans
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-400">
                BGMI
              </a>
            </li>
          </ul>
        </div>

        {/* Company Section */}
        <div>
          <h6 className="text-yellow-400 text-sm font-bold mb-4">Company</h6>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:text-yellow-400">
                News
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-400">
                LinkedIn
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-400">
                Instagram
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-400">
                Discord
              </a>
            </li>
          </ul>
        </div>

        {/* Legal Section */}
        <div>
          <h6 className="text-yellow-400 text-sm font-bold mb-4">Legal</h6>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:text-yellow-400">
                Terms of Use
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-400">
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
