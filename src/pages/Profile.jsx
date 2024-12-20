import { useSelector } from "react-redux";
import { Button } from "../components";

const Profile = () => {
  const { user } = useSelector((store) => store.auth);
  // const accounts = user.profile.linkedAccounts;
  const games = ["pubg", "Coc", "coc", "coc", "coc"];
  return (
    <>
      <div className="w-100 col wrap h-100 bg6 bs ">
        <div className="row p-3 w-max-320">
          <img
            src="/profile-pic.png"
            alt="Profile Picture"
            className="profilePic bs"
          />
          <div className="col ml-3 sb">
            <h6>
              hii,
              {/* {user.username} */}
            </h6>
            <Button size="medium" className="p-2 txt-small ">
              + Add Social Media
            </Button>
          </div>
        </div>
        <div className="col bg6 bs p-3 res-320">
          <div className="row sb">
            <div>
              <h6> Career Statistics</h6>
              <small className="txt-muted txt-small">
                Player's game specific statistics
              </small>
            </div>
            <label className="txt-small">
              Last Update: <span className="ml-1">N/A</span>
            </label>
          </div>
          <div className="row gap bs overflow-scroll-320">
            {games.map(() => (
              <label className="borderB-hover p-2">
                <img
                  src="/pubg_title.png"
                  alt="pubg_icon"
                  className="icon-size-small"
                />
              </label>
            ))}
          </div>
          <div></div>
        </div>
      </div>
    </>
  );
};

export default Profile;
