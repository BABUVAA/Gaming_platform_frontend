import { Form } from "react-router-dom";
import { formData } from "../utils/utility";
import useNavigateHook from "../hooks/useNavigateHook";
import { Button, Input } from "../components";
import { useDispatch } from "react-redux";
import { register } from "../store/authSlice";

const SignUp = () => {
  const { goToDashboard, goToLogin } = useNavigateHook();
  const dispatch = useDispatch();
  const handleSubmit = async (event) => {
    event.preventDefault(); // prevent default form submit behavior
    const signUpData = formData(event); //get the values from the form

    //signup
    dispatch(register(signUpData))
      .unwrap()
      .then(() => {
        // Handle success
        alert("user registered successfully");
        goToDashboard();
      })
      .catch((err) => {
        // Handle failure
        console.error("Signup failed:", err);
      });
  };

  return (
    <>
      <div className="col yc xc p-l gap">
        <Form
          onSubmit={handleSubmit}
          method="POST"
          className="col gap p-4 m-b-s bs bg6  w-min-250 w-max-350"
        >
          <h4 className="tc h4">E - GAMING</h4>
          <label>Username</label>
          <label className="error"></label>
          <Input type="text" placeholder="Username..." name="username" />
          <label>
            Email Addrress<span>(You must verify your email Address)</span>
          </label>
          <Input
            type="email"
            name="email"
            placeholder="Your Email Address..."
          />
          <label>Password</label>
          <Input type="password" placeholder="Password" name="password" />

          <label className="signup-label">Date of Birth </label>
          <Input type="date" placeholder="DOB" name="dob" />
          <Button type="submit" className="as-c">
            Sign Up
          </Button>
        </Form>
        <small>
          Already have an account?
          <button
            onClick={goToLogin}
            className="style-none"
            popovertarget="login"
          >
            <small className="txt-solid">Log in</small>
          </button>
        </small>
      </div>
    </>
  );
};

export default SignUp;
